// Meta Circuit
//
// Canonical source of truth for "where is this learner in the progression?"
// Everything that needs to know position — Gates, Pipeline, content pools — reads from here.
//
// Two modes:
//   Real    — derived from profile + grammar state (default)
//   Simulated — override stored in localStorage for testing; Gates and Pipeline see this

import { getLearnerGrammarState } from './learnerGrammarState'
import { getCefrLevel, getActiveLanguage } from './learnerProfile'

const OVERRIDE_KEY = 'lapp-meta-circuit-override'

// ── Override storage ──────────────────────────────────────────

export function getMetaCircuitOverride() {
  try { return JSON.parse(localStorage.getItem(OVERRIDE_KEY)) ?? null } catch { return null }
}

export function setMetaCircuitOverride(override) {
  localStorage.setItem(OVERRIDE_KEY, JSON.stringify(override))
}

export function clearMetaCircuitOverride() {
  localStorage.removeItem(OVERRIDE_KEY)
}

// ── Evaluator ─────────────────────────────────────────────────

// Returns the current position signal.
// {
//   level:        string | null   — CEFR level ('A1' etc.)
//   cluster:      number          — current grammar cluster
//   activeAtoms:  string[]        — all unlocked atoms
//   pioneerGaps:  { atomId, wordId }[]  — atoms with a pioneer, not yet unlocked
//   atomWords:    { [atomId]: string[] }
//   isSimulated:  bool
//   real:         { level, cluster, activeAtoms }  — always the real position
// }
export function evaluateMetaCircuit(lang) {
  const resolvedLang = lang ?? getActiveLanguage() ?? 'en'
  const grammarState = getLearnerGrammarState(resolvedLang)
  const realLevel    = getCefrLevel()

  const real = {
    level:       realLevel,
    cluster:     grammarState.currentCluster,
    activeAtoms: grammarState.activeAtoms,
  }

  const override = getMetaCircuitOverride()
  if (!override) {
    return {
      ...grammarState,
      level:       realLevel,
      cluster:     grammarState.currentCluster,
      isSimulated: false,
      real,
    }
  }

  return {
    ...grammarState,
    level:       override.level       ?? realLevel,
    cluster:     override.cluster     ?? grammarState.currentCluster,
    activeAtoms: override.activeAtoms ?? grammarState.activeAtoms,
    isSimulated: true,
    real,
  }
}
