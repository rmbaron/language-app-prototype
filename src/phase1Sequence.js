// Phase 1 sequence router.
// Returns the authored word sequence for the active target language.
// Add new language files here as the app expands.

import { PHASE1_SEQUENCE as EN_SEQUENCE } from './phase1Sequence.en.js'

const SEQUENCES = {
  en: EN_SEQUENCE,
}

// Returns the full Phase 1 sequence for a target language.
export function getPhase1Sequence(activeLang) {
  return SEQUENCES[activeLang] ?? []
}

// Returns a single sequence entry by word ID, or null if not in Phase 1.
export function getPhase1Entry(activeLang, wordId) {
  return getPhase1Sequence(activeLang).find(e => e.wordId === wordId) ?? null
}

// Returns the ordered list of word IDs in Phase 1 for a language.
export function getPhase1WordIds(activeLang) {
  return getPhase1Sequence(activeLang).map(e => e.wordId)
}

// Returns true if a word is part of the Phase 1 designed sequence.
export function isPhase1Word(activeLang, wordId) {
  return getPhase1Sequence(activeLang).some(e => e.wordId === wordId)
}
