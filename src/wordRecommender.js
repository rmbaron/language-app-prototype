// Word Recommender — selects from the candidate pool what to show the user.
//
// Answers: "given what's eligible, what do we actually recommend right now?"
// Does NOT assemble candidates — that is wordCandidatePool.js.
//
// This is the same pattern used throughout the app:
//   pool answers:     "what is eligible?"
//   selector answers: "given what's eligible, what do we show right now?"
//
// Selection logic (current and future):
//   score order     — highest scoring candidates surface first (active)
//   diversity       — avoid surfacing too many words of the same category (future)
//   recency         — avoid repeating a recent suggestion (future)
//   unlock proximity — prioritize words that unlock a module the learner is close to (future)

import { loadState } from './userStore'
import { loadProfile } from './learnerProfile'
import { buildCandidatePool } from './wordCandidatePool'

// ── AI batch size ─────────────────────────────────────────────
//
// When the user lets the AI decide how many words to recommend,
// this function determines the count.
//
// This is SELECTION logic only — it decides how many to surface.
// It does not touch eligibility (wordCandidatePool) or scoring (wordMeta).
// Those systems are completely separate.
//
// Signals below are a starting suggestion — add, remove, or reweight freely.
// None of these are hardcoded requirements; they're inputs to the AI call.
//
// Current candidate signals:
//   profile.observed.performance.successRates
//     — high success on recently acquired words → learner may be ready for more
//   profile.observed.behavioral.totalSessions
//     — newer learners may benefit from smaller, focused batches
//   profile.observed.performance.currentDepthLevel
//     — deeper learners can typically absorb more new words at once
//   profile.expressed.stable.selfReportedLevel
//     — beginner / intermediate / advanced as a broad starting signal
//   recentWbPoolGrowth (future signal)
//     — how fast the learner has been adding and practicing words recently
//
// Constraints:
//   min: 1
//   max: 10 (matching the manual slider ceiling)
//
// Not yet implemented — returns default until wired to the API.

const BATCH_SIZE_DEFAULT = 5
const BATCH_SIZE_MIN = 1
const BATCH_SIZE_MAX = 10

async function getAIBatchSize(profile, state) {
  // TODO: implement AI batch size call
  // Send profile signals to AI and get back a recommended count.
  // The AI should factor in success rates, session count, depth level,
  // and self-reported level to determine an appropriate batch size.
  return BATCH_SIZE_DEFAULT
}

export async function getAIRecommendedCount(profile, state) {
  const raw = await getAIBatchSize(profile, state)
  return Math.min(BATCH_SIZE_MAX, Math.max(BATCH_SIZE_MIN, raw))
}

// ── Selection logic ───────────────────────────────────────────
//
// Takes the full candidate pool and applies selection rules to produce
// the final list shown to the user.
//
// Currently: returns top N by score.
// Future selection rules can filter or reorder before the slice.

function selectFromPool(pool, count) {
  let candidates = [...pool]

  // Future: diversity filter — limit candidates of the same grammatical category
  // candidates = applyDiversityFilter(candidates)

  // Future: recency filter — deprioritize words suggested recently
  // candidates = applyRecencyFilter(candidates, recentSuggestions)

  // Future: unlock proximity boost — raise words that unlock a nearly-reachable module
  // candidates = applyUnlockProximityBoost(candidates, profile)

  return candidates.slice(0, count).map(c => c.word)
}

// ── Public API ────────────────────────────────────────────────

// Returns an ordered array of recommended words.
// count:  how many recommendations to return (default 5)
// useAI:  whether to invoke the AI refinement layer in the candidate pool

export async function getRecommendations(count = 5, useAI = false) {
  const state = loadState()
  const profile = loadProfile()

  const pool = await buildCandidatePool(state, profile, useAI)
  return selectFromPool(pool, count)
}

// Returns the single top recommendation.
export async function getTopRecommendation(useAI = false) {
  const results = await getRecommendations(1, useAI)
  return results[0] ?? null
}
