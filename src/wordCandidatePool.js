// Word Candidate Pool — assembles eligible word candidates for recommendation.
//
// Answers: "what words are eligible to be recommended right now?"
// Does NOT decide what the user sees — that is wordRecommender.js.
//
// Two source layers, both feeding into the same pool:
//   Static layer  — scores words using CEFR slot signals (free, always available)
//   AI layer      — refines or adds candidates using a live AI call (costs gas, optional)
//
// Payment model flexibility:
//   free tier  → static layer only
//   paid tier  → static layer + AI refinement
//
// Eligibility rules (applied before scoring):
//   - Word must not already be in the learner's Word Bank
//   - Word must not be a form of a word whose base isn't in the bank yet
//     (e.g. don't recommend "ran" before "run" is established)

import words from './wordData'
import { getLayerTwo, getLiveSeedWords } from './wordLayerTwo'
import { getWordBank } from './userStore'
import { getGrammarNodes, getOpenEndedLimit } from './grammarProgression'
import { getUnlockedNodeIds } from './grammarStore'
import { getCefrLevel, getActiveLanguage } from './learnerProfile'
import { getSlotCoverage, getCurrentSubLevel, getCumulativeSlots, getLevels } from './cefrLevels'
import { getWordAttributes } from './wordAttributes'
import { getCurriculumBoosts } from './wordCurriculum'

// ── Eligibility ───────────────────────────────────────────────

function hasUnmetDependency(word, existingWordIds) {
  for (const bankWord of words) {
    if (existingWordIds.includes(bankWord.id)) continue
    const isMeForm = (bankWord.forms ?? []).some(f => f.form === word.baseForm)
    if (isMeForm) return true
  }
  return false
}

// ── Static scoring layer ──────────────────────────────────────
//
// Scores candidates using grammar tree and CEFR slot signals.
// Meta score dimensions (frequencyTier, functionalWeight, etc.) removed —
// the slot system is now the primary signal.

// ── Grammar proximity boost ───────────────────────────────────
//
// Computes per-word and per-category score boosts by examining which
// grammar function nodes are on the frontier (requires met, not yet unlocked).
// Returns a context object consumed by scoreWord.
//
// Three signals:
//   FRONTIER_BOOST    — carrier of a node the learner is ready to unlock next
//   OPEN_ENDED_BOOST  — word in a category an unlocked open-ended node still wants more of
//   Stage relevance   — frontier nodes more than 1 stage ahead get STAGE_FAR_FACTOR applied
//   Function poverty  — if words-per-function > POVERTY_RATIO, singular carriers get POVERTY_BONUS

const FRONTIER_BOOST   = 3.0
const OPEN_ENDED_BOOST = 1.5
const STAGE_FAR_FACTOR = 0.3   // fraction applied to nodes more than 1 stage ahead
const POVERTY_BONUS    = 2.0   // extra boost for singular carriers when function-poor
const POVERTY_RATIO    = 5     // words-per-function above this = function-poor

// ── CEFR level boosts ─────────────────────────────────────────
//
// Two questions, in order:
//   1. Is this word at the learner's level?  (cefrLevel check)
//   2. Does it fill a missing slot?          (slot coverage check)
//
// LEVEL_MATCH_BOOST   — word's cefrLevel matches the learner's current level
// SLOT_MISSING_BOOST  — word fills a slot that has zero coverage in the bank
// SLOT_DEPTH_BOOST    — word deepens an open-ended slot already covered
// ABOVE_LEVEL_PENALTY — word is above the learner's level (fraction applied)

const SLOT_MISSING_BOOST = 4.0
const SLOT_DEPTH_BOOST   = 1.5
const STEERING_BOOST     = 2.5   // applied when learner has steered toward a category or interest
                                  // kept below SLOT_MISSING_BOOST (4.0) so critical missing slots
                                  // still outrank user steering rather than being drowned out

function buildGrammarBoostContext(existingWordIds, allWords, activeLang) {
  const grammarNodes = getGrammarNodes()
  if (!grammarNodes.length) return { wordBoosts: new Map(), categoryBoosts: new Map() }

  // Use grammarStore's shared unlock resolver — no duplicated logic here
  const unlockedIds = getUnlockedNodeIds(existingWordIds, allWords, activeLang)
  const unlocked = new Set(unlockedIds)

  // Current stage: highest stage of any unlocked non-stub node (minimum 1)
  const currentStage = grammarNodes
    .filter(n => unlocked.has(n.id) && n.status !== 'stub' && n.stage)
    .reduce((max, n) => Math.max(max, n.stage), 1)

  // Function poverty: too many words relative to grammar functions unlocked
  const activeUnlockedCount = unlockedIds.filter(id => {
    const node = grammarNodes.find(n => n.id === id)
    return node && node.status !== 'stub'
  }).length
  const functionPoor = activeUnlockedCount > 0 &&
    (existingWordIds.length / activeUnlockedCount) > POVERTY_RATIO

  // Category counts needed for open-ended limit checks
  const bankCategoryCounts = {}
  for (const id of existingWordIds) {
    const w = allWords.find(w => w.id === id && w.language === activeLang)
    if (w) {
      const cat = w.classifications.grammaticalCategory
      bankCategoryCounts[cat] = (bankCategoryCounts[cat] ?? 0) + 1
    }
  }

  const wordBoosts     = new Map()
  const categoryBoosts = new Map()

  for (const node of grammarNodes) {
    if (node.status === 'stub' || !node.carrier) continue
    const requiresMet = node.requires.every(r => unlocked.has(r))

    if (!unlocked.has(node.id) && requiresMet) {
      // Stage relevance: discount nodes more than 1 stage ahead of current
      const nodeStage = node.stage ?? currentStage
      const stageFactor = (nodeStage - currentStage) > 1 ? STAGE_FAR_FACTOR : 1.0

      // Function poverty: extra push for singular carriers when function-poor
      const povertyBonus = (functionPoor && node.carrier.type === 'specific') ? POVERTY_BONUS : 0

      const boost = (FRONTIER_BOOST + povertyBonus) * stageFactor

      if (node.carrier.type === 'specific') {
        for (const wordId of node.carrier.wordIds) {
          if (!existingWordIds.includes(wordId)) {
            wordBoosts.set(wordId, (wordBoosts.get(wordId) ?? 0) + boost)
          }
        }
      } else if (node.carrier.type === 'category') {
        const cat = node.carrier.category
        categoryBoosts.set(cat, (categoryBoosts.get(cat) ?? 0) + boost)
      }
      // formType carriers unlock via existing words — no individual word to boost
    }

    if (unlocked.has(node.id) && node.openEnded && node.carrier.type === 'category') {
      // Open-ended node: keep boosting category words until the learner has OPEN_ENDED_LIMIT
      const cat = node.carrier.category
      const currentCount = bankCategoryCounts[cat] ?? 0
      const limit = getOpenEndedLimit()
      if (currentCount < limit) {
        categoryBoosts.set(cat, (categoryBoosts.get(cat) ?? 0) + OPEN_ENDED_BOOST)
      }
    }
  }

  return { wordBoosts, categoryBoosts }
}

// Builds per-word and per-category boost signals from CEFR slot coverage.
// Returns { wordBoosts, categoryBoosts, levelId } consumed by scoreWord.
function buildSlotBoostContext(existingWordIds, allWords, activeLang) {
  // Default to A1 if no level is set — keeps the pool populated during dev
  // testing and for users who haven't completed onboarding.
  const levelId = getCefrLevel() ?? 'A1'

  // Gate by sub-level: only boost slots active at the learner's current position
  const currentSub    = getCurrentSubLevel(levelId, existingWordIds, allWords, activeLang)
  const activeSlotIds = new Set(getCumulativeSlots(levelId, currentSub))

  const allSlotCoverage = getSlotCoverage(levelId, existingWordIds, allWords, activeLang)
  const slotCoverage    = allSlotCoverage.filter(s => activeSlotIds.has(s.id))

  const wordBoosts     = new Map()
  const categoryBoosts = new Map()

  for (const slot of slotCoverage) {
    if (slot.coverageCheck?.type === 'structural') continue

    if (!slot.covered) {
      // Slot is completely missing — boost whatever fills it
      if (slot.coverageCheck?.type === 'specificWords') {
        for (const id of slot.coverageCheck.wordIds) {
          if (!existingWordIds.includes(id)) {
            wordBoosts.set(id, (wordBoosts.get(id) ?? 0) + SLOT_MISSING_BOOST)
          }
        }
      } else if (slot.coverageCheck?.type === 'category') {
        const cat = slot.coverageCheck.grammaticalCategory
        categoryBoosts.set(cat, (categoryBoosts.get(cat) ?? 0) + SLOT_MISSING_BOOST)
      } else if (slot.coverageCheck?.type === 'attribute') {
        // Boost all words in the full word list whose attributes match this slot
        const { key, value } = slot.coverageCheck
        for (const w of allWords) {
          if (w.language === activeLang && !existingWordIds.includes(w.id)) {
            if (getWordAttributes(w.id)?.[key] === value) {
              wordBoosts.set(w.id, (wordBoosts.get(w.id) ?? 0) + SLOT_MISSING_BOOST)
            }
          }
        }
      }
    } else if (slot.openEnded) {
      // Slot covered but open-ended — keep deepening
      if (slot.coverageCheck?.type === 'category') {
        const cat = slot.coverageCheck.grammaticalCategory
        categoryBoosts.set(cat, (categoryBoosts.get(cat) ?? 0) + SLOT_DEPTH_BOOST)
      } else if (slot.coverageCheck?.type === 'attribute') {
        const { key, value } = slot.coverageCheck
        for (const w of allWords) {
          if (w.language === activeLang && !existingWordIds.includes(w.id)) {
            if (getWordAttributes(w.id)?.[key] === value) {
              wordBoosts.set(w.id, (wordBoosts.get(w.id) ?? 0) + SLOT_DEPTH_BOOST)
            }
          }
        }
      }
    }
  }

  return { wordBoosts, categoryBoosts, levelId }
}

function scoreWord(word, profile, existingWordIds, boostContext, slotContext, curriculumContext, steeringParams = {}) {
  if (existingWordIds.includes(word.id)) return null
  if (hasUnmetDependency(word, existingWordIds)) return null

  // ── Slot coverage boost ──────────────────────────────────────
  let slotBoost = 0
  if (slotContext) {
    slotBoost += slotContext.wordBoosts.get(word.id) ?? 0
    slotBoost += slotContext.categoryBoosts.get(word.classifications.grammaticalCategory) ?? 0
  }

  // ── Grammar tree boost (secondary signal — legacy) ───────────
  let grammarBoost = 0
  if (boostContext) {
    grammarBoost += boostContext.wordBoosts.get(word.id) ?? 0
    grammarBoost += boostContext.categoryBoosts.get(word.classifications.grammaticalCategory) ?? 0
  }

  // Words with no slot or grammar signal are normally excluded —
  // except words explicitly cleared by the pipeline (contentReady: true),
  // which are eligible by definition.
  const isLive = getLayerTwo(word.id)?.contentReady === true
  if (slotBoost === 0 && grammarBoost === 0 && !isLive) return null

  // ── Curriculum boost (paradigm completion + consolidation momentum) ──
  let curriculumBoost = 0
  if (curriculumContext) {
    curriculumBoost += curriculumContext.wordBoosts.get(word.id) ?? 0
    curriculumBoost += curriculumContext.categoryBoosts.get(word.classifications.grammaticalCategory) ?? 0
  }

  // ── Steering boost ───────────────────────────────────────────
  // Applied on top of existing signals — steers pool composition without
  // overriding the slot/grammar gate. Interest steering is handled by the
  // AI layer (getAICandidates); grammar steering is applied here in the static layer.
  let steeringBoost = 0
  if (steeringParams.grammarCategory &&
      word.classifications.grammaticalCategory === steeringParams.grammarCategory) {
    steeringBoost += STEERING_BOOST
  }

  return { word, score: slotBoost + grammarBoost + curriculumBoost + steeringBoost, source: 'static' }
}

function buildStaticCandidates(existingWordIds, profile, steeringParams = {}) {
  const activeLang        = profile.expressed.stable.targetLanguage ?? 'en'
  const allWords          = [...words, ...getLiveSeedWords(activeLang, new Set(words.map(w => w.id)))]
  const boostContext      = buildGrammarBoostContext(existingWordIds, allWords, activeLang)
  const slotContext       = buildSlotBoostContext(existingWordIds, allWords, activeLang)
  const curriculumContext = getCurriculumBoosts(existingWordIds, allWords, activeLang)

  const candidates = allWords
    .filter(word => word.language === activeLang)
    .map(word => scoreWord(word, profile, existingWordIds, boostContext, slotContext, curriculumContext, steeringParams))
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)

  if (candidates.length > 0) return candidates

  // Fallback: all slot/grammar signals are exhausted (e.g. learner has completed
  // the current level). Try the next CEFR level's slot signals first; if that
  // also yields nothing, surface all eligible words at a baseline score so the
  // recommender is never silently empty.
  const allLevels  = getLevels()
  const currentIdx = allLevels.findIndex(l => l.id === (getCefrLevel() ?? 'A1'))
  const nextLevel  = allLevels[currentIdx + 1]

  if (nextLevel) {
    const nextSlotContext = buildSlotBoostContext(existingWordIds, allWords, activeLang)
    const nextCandidates  = allWords
      .filter(word => word.language === activeLang)
      .map(word => scoreWord(word, profile, existingWordIds, boostContext, nextSlotContext, curriculumContext, steeringParams))
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
    if (nextCandidates.length > 0) return nextCandidates
  }

  // Last resort: all eligible words at a baseline score.
  return allWords
    .filter(word => word.language === activeLang && !existingWordIds.includes(word.id))
    .map(word => ({ word, score: 0.1, source: 'static' }))
}

// ── AI refinement layer ───────────────────────────────────────
//
// Sends static candidates + learner context to the AI for refinement.
// May reorder, substitute, or add candidates the static layer missed.
// Returns enriched candidates tagged with source: 'ai'.
//
// Not yet implemented — returns null until wired to the API.

async function getAICandidates(staticCandidates, profile, existingWordIds, steeringParams = {}) {
  // TODO: implement AI refinement call
  // Inputs to send:
  //   staticCandidates        — top words from static scoring (as context/starting point)
  //   profile                 — learner's goal, stage, preferences, depth level
  //   existingWordIds         — current word bank (so AI doesn't suggest what's already there)
  //   steeringParams.interestTopic   — user-defined interest domain (e.g. 'food', 'music')
  //   steeringParams.grammarCategory — grammatical category the user wants more of
  // Expected output: array of { word, score, source: 'ai' }
  return null
}

// ── Public API ────────────────────────────────────────────────
//
// Returns a scored, eligible candidate pool ready for the recommender to select from.
// useAI: toggles the AI refinement layer (default false until implemented)

export async function buildCandidatePool(state, profile, useAI = false, steeringParams = {}) {
  // Exclude words already in the Word Bank — not just practiced ones
  const existingWordIds = getWordBank()

  const staticCandidates = buildStaticCandidates(existingWordIds, profile, steeringParams)

  if (useAI) {
    const aiCandidates = await getAICandidates(staticCandidates, profile, existingWordIds, steeringParams)
    if (aiCandidates) {
      const aiIds = new Set(aiCandidates.map(c => c.word.id))
      const merged = [
        ...aiCandidates,
        ...staticCandidates.filter(c => !aiIds.has(c.word.id)),
      ]
      return merged
    }
  }

  return staticCandidates
}
