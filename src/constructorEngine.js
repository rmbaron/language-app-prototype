// Constructor Engine
//
// Takes the learner's unlocked grammar concepts and returns the active
// slot configuration for the sentence Constructor.
//
// Pure logic — no JSX, no UI concerns. The Constructor component reads
// from this; how slots are rendered is entirely separate.

import { PREDICATE_PHRASE, ALL_SLOTS_BY_ID } from './sentenceStructure.en.js'
import { getLearnerGrammarState } from './learnerGrammarState'
import { findWordInIndex } from './atomIndex'

// Returns the active slot configuration given the learner's current unlocks.
// Pass overrideUnlocks to compute slots for a specific virtual unlock set (e.g. per-tier testing).
// Output: { subject: slot, predicate: slot[] }
export function getActiveSlots(overrideUnlocks) {
  const unlocks = overrideUnlocks ?? getLearnerGrammarState().activeAtoms

  // First pass: which slots does the learner's unlocks activate?
  const activated = new Set(
    PREDICATE_PHRASE.slots
      .filter(slot => isSlotActive(slot, unlocks))
      .map(slot => slot.id)
  )

  // Second pass: pull in any required co-slots that aren't already active.
  // A slot's requires list must be satisfied if that slot is active.
  for (const slot of PREDICATE_PHRASE.slots) {
    if (activated.has(slot.id)) {
      for (const requiredId of slot.requires) {
        activated.add(requiredId)
      }
    }
  }

  const predicateSlots = PREDICATE_PHRASE.slots.filter(s => activated.has(s.id))

  return {
    subject:   ALL_SLOTS_BY_ID['subject_noun'],
    predicate: predicateSlots,
  }
}

// A slot is active if the learner has unlocked at least one of the
// grammar categories that slot accepts.
function isSlotActive(slot, unlocks) {
  if (!slot.optional) return true
  return slot.accepts.some(category => unlocks.includes(category))
}

// Do-support: if negation is active and no auxiliary slot is filled,
// English requires 'do/does' to carry the negation.
// Returns the correct form based on the subject, or null if not needed.
//
// subjectWord: the word currently filling the subject slot (e.g. 'i', 'she', 'they')
// filledSlots: object of { slotId: wordId } representing what the learner has placed
export function getDoSupport(subjectWord, filledSlots) {
  const negationActive = 'negation' in filledSlots
  if (!negationActive) return null

  const auxiliarySlots = ['modal', 'perfect', 'progressive']
  const hasAuxiliary = auxiliarySlots.some(id => id in filledSlots)
  if (hasAuxiliary) return null

  const thirdPersonSingular = ['she', 'he', 'it']
  return thirdPersonSingular.includes(subjectWord?.toLowerCase()) ? 'does' : 'do'
}

// Returns words from the bank that are eligible to fill a given slot.
// useAlternateAtoms: false at A1 (many nouns/adjectives technically verb in English
// but A1 learners won't use them that way). Enable at T8+ when be/have need to
// fill auxiliary slots via their alternateAtoms. Long-term fix: add a `level` field
// to each alternateAtom entry in Layer 2 so filtering is data-driven, not a flag.
export function getEligibleWords(slot, bankWords, lang = 'en') {
  return bankWords.filter(word => {
    const indexed = findWordInIndex(word.id, lang)
    if (!indexed) return false
    return slot.accepts.includes(indexed.atomId)
  })
}

// Returns true if the word filling the verb slot is a copula.
export function filledWithCopula(verbWordId, lang = 'en') {
  if (!verbWordId) return false
  return findWordInIndex(verbWordId, lang)?.atomId === 'copula'
}

// Returns true if the sentence is valid enough to generate.
// All required slots must be filled; all co-requirements of filled slots must also be filled.
export function validateSentence(visibleSlots, filledSlots) {
  for (const slot of visibleSlots) {
    if (!slot.optional && !filledSlots[slot.id]) return false
    if (filledSlots[slot.id]) {
      for (const reqId of slot.requires) {
        if (!filledSlots[reqId]) return false
      }
    }
  }
  return true
}

// Reconfigures the predicate slots when a copula fills the verb slot.
// Removes 'object', inserts 'complement' in its place.
export function applyCopulaVariant(predicateSlots) {
  const { remove, insert } = PREDICATE_PHRASE.copulaVariant
  const filtered = predicateSlots.filter(s => !remove.includes(s.id))
  const verbIndex = filtered.findIndex(s => s.id === 'verb')
  filtered.splice(verbIndex + 1, 0, ...insert)
  return filtered
}
