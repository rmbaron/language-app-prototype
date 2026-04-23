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

import { getAllWords } from './wordRegistry'
import { getLayerTwo } from './wordLayerTwo'
import { getWordBank } from './userStore'
import { getCefrLevel, getActiveLanguage } from './learnerProfile'
import { getSlotCoverage, getCurrentSubLevel, getCumulativeSlots, getLevels } from './cefrLevels'
import { getWordAttributes } from './wordAttributes'
import { getCurriculumBoosts } from './wordCurriculum'
import { getAtomPioneer } from './atomPioneers'

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

function scoreWord(word, profile, existingWordIds, slotContext, curriculumContext, steeringParams = {}, coveredAtoms = new Set()) {
  if (existingWordIds.includes(word.id)) return null

  // ── Atom pioneer gate ─────────────────────────────────────────
  // If this atom class has never appeared in the word bank, only the
  // designated pioneer for that atom may be surfaced by the recommender.
  const wordAtom = getLayerTwo(word.id)?.grammaticalAtom
  if (wordAtom && !coveredAtoms.has(wordAtom)) {
    const pioneer = getAtomPioneer(wordAtom, profile.expressed?.stable?.targetLanguage ?? 'en')
    if (pioneer !== null && word.id !== pioneer) return null
    // pioneer === null means undesignated — block everything in this atom class
    if (pioneer === null) return null
  }

  // ── Slot coverage boost ──────────────────────────────────────
  let slotBoost = 0
  if (slotContext) {
    slotBoost += slotContext.wordBoosts.get(word.id) ?? 0
    slotBoost += slotContext.categoryBoosts.get(word.classifications.grammaticalCategory) ?? 0
  }

  // Words with no slot signal are normally excluded —
  // except words explicitly cleared by the pipeline (contentReady: true).
  const isLive = getLayerTwo(word.id)?.contentReady === true
  if (slotBoost === 0 && !isLive) return null

  // ── Curriculum boost (paradigm completion + consolidation momentum) ──
  let curriculumBoost = 0
  if (curriculumContext) {
    curriculumBoost += curriculumContext.wordBoosts.get(word.id) ?? 0
    curriculumBoost += curriculumContext.categoryBoosts.get(word.classifications.grammaticalCategory) ?? 0
  }

  // ── Steering boost ───────────────────────────────────────────
  let steeringBoost = 0
  if (steeringParams.grammarCategory &&
      word.classifications.grammaticalCategory === steeringParams.grammarCategory) {
    steeringBoost += STEERING_BOOST
  }

  return { word, score: slotBoost + curriculumBoost + steeringBoost, source: 'static' }
}

function buildStaticCandidates(existingWordIds, profile, steeringParams = {}) {
  const activeLang        = profile.expressed.stable.targetLanguage ?? 'en'
  const allWords          = getAllWords(activeLang)
  const slotContext       = buildSlotBoostContext(existingWordIds, allWords, activeLang)
  const curriculumContext = getCurriculumBoosts(existingWordIds, allWords, activeLang)

  const coveredAtoms = new Set()
  for (const id of existingWordIds) {
    const atom = getLayerTwo(id)?.grammaticalAtom
    if (atom) coveredAtoms.add(atom)
  }

  const candidates = allWords
    .filter(word => word.language === activeLang)
    .map(word => scoreWord(word, profile, existingWordIds, slotContext, curriculumContext, steeringParams, coveredAtoms))
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)

  if (candidates.length > 0) return candidates

  // Fallback: slot signals exhausted. Try next CEFR level, then baseline.
  const allLevels  = getLevels()
  const currentIdx = allLevels.findIndex(l => l.id === (getCefrLevel() ?? 'A1'))
  const nextLevel  = allLevels[currentIdx + 1]

  if (nextLevel) {
    const nextSlotContext = buildSlotBoostContext(existingWordIds, allWords, activeLang)
    const nextCandidates  = allWords
      .filter(word => word.language === activeLang)
      .map(word => scoreWord(word, profile, existingWordIds, nextSlotContext, curriculumContext, steeringParams))
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
    if (nextCandidates.length > 0) return nextCandidates
  }

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
