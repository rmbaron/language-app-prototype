// Word Candidate Pool — assembles eligible word candidates for recommendation.
//
// Answers: "what words are eligible to be recommended right now?"
// Does NOT decide what the user sees — that is wordRecommender.js.
//
// Two source layers, both feeding into the same pool:
//   Static layer  — scores words using wordMeta (free, always available)
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
import { getWordMeta } from './wordMeta'
import { getWordBank } from './userStore'
import { getGrammarNodes, getOpenEndedLimit } from './grammarProgression'

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
// Scores candidates using wordMeta dimensions.
// Runs entirely free — no API calls.
//
// Currently limited by wordMeta only having 5 entries.
// Future: replace with a real frequency dataset (top 3000 words etc.)
//
// Weights are adjustable — set to 0.0 to disable a dimension entirely.

const WEIGHTS = {
  frequencyTier:        1.0,
  functionalWeight:     1.0,
  combinabilityScore:   1.0,
  cognitiveComplexity:  0.8,
  unlockValue:          1.0,
  categoryBalance:      0.6,  // future — off until balance logic is implemented
  goalRelevance:        0.0,  // future — off until goal system is built
  personalRelevance:    0.0,  // future — off until profile preferences are populated
  laneUsefulness:       0.0,  // future — off until lane prediction is built
  stageAppropriateness: 0.0,  // future — off until stage logic is built
}

// ── Grammar proximity boost ───────────────────────────────────
//
// Computes per-word and per-category score boosts by examining which
// grammar function nodes are on the frontier (requires met, not yet unlocked).
// Returns a context object consumed by scoreWord.
//
// Boost values:
//   FRONTIER_BOOST     — carrier of a node the learner is ready to unlock next
//   OPEN_ENDED_BOOST   — word in a category an unlocked open-ended node still wants more of

const FRONTIER_BOOST   = 3.0
const OPEN_ENDED_BOOST = 1.5

function buildGrammarBoostContext(existingWordIds, allWords, activeLang) {
  const grammarNodes = getGrammarNodes()
  if (!grammarNodes.length) return { wordBoosts: new Map(), categoryBoosts: new Map() }

  // Count how many bank words belong to each grammatical category
  const bankCategoryCounts = {}
  for (const id of existingWordIds) {
    const w = allWords.find(w => w.id === id && w.language === activeLang)
    if (w) {
      const cat = w.classifications.grammaticalCategory
      bankCategoryCounts[cat] = (bankCategoryCounts[cat] ?? 0) + 1
    }
  }

  function isNodeUnlocked(node) {
    if (!node.carrier) return false
    if (node.carrier.type === 'specific') {
      return node.carrier.wordIds.every(id => existingWordIds.includes(id))
    }
    if (node.carrier.type === 'category') {
      return (bankCategoryCounts[node.carrier.category] ?? 0) >= node.carrier.min
    }
    return false
  }

  // Resolve which nodes are unlocked, respecting dependency order
  const unlocked = new Set()
  let changed = true
  while (changed) {
    changed = false
    for (const node of grammarNodes) {
      if (unlocked.has(node.id)) continue
      if (node.requires.every(r => unlocked.has(r)) && isNodeUnlocked(node)) {
        unlocked.add(node.id)
        changed = true
      }
    }
  }

  const wordBoosts     = new Map()
  const categoryBoosts = new Map()

  for (const node of grammarNodes) {
    if (node.status === 'stub' || !node.carrier) continue
    const requiresMet = node.requires.every(r => unlocked.has(r))

    if (!unlocked.has(node.id) && requiresMet) {
      // Frontier node — boost its carriers so the recommender surfaces them
      if (node.carrier.type === 'specific') {
        for (const wordId of node.carrier.wordIds) {
          if (!existingWordIds.includes(wordId)) {
            wordBoosts.set(wordId, (wordBoosts.get(wordId) ?? 0) + FRONTIER_BOOST)
          }
        }
      } else if (node.carrier.type === 'category') {
        const cat = node.carrier.category
        categoryBoosts.set(cat, (categoryBoosts.get(cat) ?? 0) + FRONTIER_BOOST)
      }
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

function scoreWord(word, meta, profile, existingWordIds, boostContext) {
  if (existingWordIds.includes(word.id)) return null
  if (hasUnmetDependency(word, existingWordIds)) return null

  let grammarBoost = 0
  if (boostContext) {
    grammarBoost += boostContext.wordBoosts.get(word.id) ?? 0
    grammarBoost += boostContext.categoryBoosts.get(word.classifications.grammaticalCategory) ?? 0
  }

  // Words without meta can still surface if they carry a grammar signal
  if (!meta && grammarBoost === 0) return null

  let score = grammarBoost
  if (meta) {
    score += (meta.frequencyTier ?? 0)       * WEIGHTS.frequencyTier
    score += (meta.functionalWeight ?? 0)    * WEIGHTS.functionalWeight
    score += (meta.combinabilityScore ?? 0)  * WEIGHTS.combinabilityScore
    score += (meta.cognitiveComplexity ?? 0) * WEIGHTS.cognitiveComplexity
    score += (meta.unlockValue ?? 0)         * WEIGHTS.unlockValue
  }

  // Future scoring dimensions — uncomment and implement when ready:
  // score += categoryBalanceBoost(word, profile)   * WEIGHTS.categoryBalance
  // score += goalRelevanceScore(word, profile)     * WEIGHTS.goalRelevance
  // score += personalRelevanceScore(word, profile) * WEIGHTS.personalRelevance

  return { word, score, source: 'static' }
}

function buildStaticCandidates(existingWordIds, profile) {
  const activeLang = profile.expressed.stable.targetLanguage ?? 'en'
  const boostContext = buildGrammarBoostContext(existingWordIds, words, activeLang)
  return words
    .filter(word => word.language === activeLang)
    .map(word => scoreWord(word, getWordMeta(word.id), profile, existingWordIds, boostContext))
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
}

// ── AI refinement layer ───────────────────────────────────────
//
// Sends static candidates + learner context to the AI for refinement.
// May reorder, substitute, or add candidates the static layer missed.
// Returns enriched candidates tagged with source: 'ai'.
//
// Not yet implemented — returns null until wired to the API.

async function getAICandidates(staticCandidates, profile, existingWordIds) {
  // TODO: implement AI refinement call
  // Inputs to send:
  //   staticCandidates — top words from static scoring (as context/starting point)
  //   profile          — learner's goal, stage, preferences, depth level
  //   existingWordIds  — current word bank (so AI doesn't suggest what's already there)
  // Expected output: array of { word, score, source: 'ai' }
  return null
}

// ── Public API ────────────────────────────────────────────────
//
// Returns a scored, eligible candidate pool ready for the recommender to select from.
// useAI: toggles the AI refinement layer (default false until implemented)

export async function buildCandidatePool(state, profile, useAI = false) {
  // Exclude words already in the Word Bank — not just practiced ones
  const existingWordIds = getWordBank()

  const staticCandidates = buildStaticCandidates(existingWordIds, profile)

  if (useAI) {
    const aiCandidates = await getAICandidates(staticCandidates, profile, existingWordIds)
    if (aiCandidates) {
      // Merge AI candidates into pool, avoiding duplicates
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
