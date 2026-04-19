// Function Goal system — language router and coverage API.
//
// Public API:
//   getGoals(levelId)          — all goals for a level (designer + AI-discovered)
//   getGoal(goalId)            — single goal by ID
//   getGoalCoverage(levelId, wordBankIds, allWords, activeLang)
//                              — per-goal coverage status for the learner's current bank
//
// Relationship to other systems:
//   - cefrLevels.js  — grammar/structural view of a level (grammar slots)
//   - functionGoals  — communicative capability view (what can the learner do?)
//   - wordAttributes — words carry a `functionGoals` array (AI-filled) that links
//                      them to the goals they serve

import { getFunctionGoalsForLevel, FUNCTION_GOAL_SCHEMA } from './functionGoals.en'
import { getWordAttributes } from './wordAttributes'

export { FUNCTION_GOAL_SCHEMA }

// ── Accessors ─────────────────────────────────────────────────

export function getGoals(levelId) {
  // Currently English only — extend to language router when Hebrew goals are authored
  return getFunctionGoalsForLevel(levelId)
}

export function getGoal(goalId) {
  // Search across all levels — goal IDs are globally unique
  const allLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
  for (const levelId of allLevels) {
    const found = getFunctionGoalsForLevel(levelId).find(g => g.id === goalId)
    if (found) return found
  }
  return null
}

// ── Coverage ──────────────────────────────────────────────────
//
// For each goal at the given level, returns coverage status:
//   covered        — true if at least one carrier word is in the bank
//   carrierCount   — how many carrier words are in the bank
//   totalCarriers  — total carrier words defined for this goal
//   attributeCount — how many bank words declare this goal in their `functionGoals` attribute
//
// Two coverage signals:
//   1. carrierWords match — explicit designer-seeded coverage (fast, no attribute lookup)
//   2. attribute match    — AI-filled word.functionGoals array (richer, requires attributes)
//
// The recommender uses this to identify under-served goals and boost words that serve them.

export function getGoalCoverage(levelId, wordBankIds, allWords, activeLang) {
  const goals = getGoals(levelId)
  const bankSet = new Set(wordBankIds)

  return goals.map(goal => {
    // Carrier word coverage
    const coveredCarriers = goal.carrierWords.filter(id => bankSet.has(id))

    // Attribute coverage — bank words that AI-tagged with this goal
    const attributeMatches = wordBankIds.filter(id => {
      const attrs = getWordAttributes(id)
      return Array.isArray(attrs?.functionGoals) && attrs.functionGoals.includes(goal.id)
    })

    const covered = coveredCarriers.length > 0 || attributeMatches.length > 0

    return {
      ...goal,
      covered,
      carrierCount:   coveredCarriers.length,
      totalCarriers:  goal.carrierWords.length,
      attributeCount: attributeMatches.length,
    }
  })
}
