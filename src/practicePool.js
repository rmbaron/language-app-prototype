// Practice Pool — World Sphere sentence structure eligibility
//
// Computes which sentence structures are currently available to a learner,
// based on what atom types are represented in their word bank and what
// sub-level they are at.
//
// This is pure deterministic logic — no AI involved.
// The AI receives the pool output as a permission set for sentence generation.
//
// Follows the pool/selector pattern used elsewhere in the app:
//   practicePool  → "what structures are the learner eligible to practice?"
//   (selector TBD) → "given eligible structures, what do we show?"
//
// Public API:
//   getUnlockedAtoms(wordBankIds, currentSubLevel, lang)
//     → string[] of atom type ids available to this learner
//
//   getPracticePool(wordBankIds, currentSubLevel, lang)
//     → structure objects from sentenceStructures the learner can use

import allWords from './wordData'
import { getStructures, getUnlockedStructures, SUB_LEVEL_ORDER } from './sentenceStructures'
import { getAtom } from './grammarAtoms'

// ── Category → atom mapping ───────────────────────────────────
//
// Most grammatical categories map directly to one atom type.
// Verbs are the main exception — handled below with word-level overrides.
// 'interjection' produces no atom (hello, oh, etc. don't unlock structures).
// 'modal' maps to auxiliary — modals (can, will) enable the same
//   question/negative structures as do/does at A1.

const CATEGORY_TO_ATOM = {
  noun:         'noun',
  adjective:    'adjective',
  verb:         'lexical_verb',
  adverb:       'adverb',
  preposition:  'preposition',
  pronoun:      'personal_pronoun',
  modal:        'auxiliary',
  conjunction:  'conjunction',
  determiner:   'determiner_article',
  interrogative: 'interrogative',
  demonstrative: 'demonstrative',
  // interjection → null (no atom)
}

// ── Word-level atom overrides ─────────────────────────────────
//
// Words whose atom type doesn't follow from grammaticalCategory alone.
// 'be' is classified as 'verb' in wordData but is a copula, not a lexical verb.
// Keep this list short — most words derive correctly from their category.

const WORD_ATOM_OVERRIDES = {
  be: 'copula',
}

// ── Sub-level structural atoms ────────────────────────────────
//
// Some atom types aren't independently banked as vocabulary — they are
// grammatical infrastructure that arrives with the sub-level progression.
// negation_marker (not, n't) and auxiliary (do/does) fall here.
// Once the learner reaches the listed sub-level, these atoms are assumed present.

const SUB_LEVEL_ATOM_GRANTS = {
  'A1.2': ['auxiliary', 'negation_marker'],
}

// ── Core functions ────────────────────────────────────────────

function deriveAtom(word) {
  if (WORD_ATOM_OVERRIDES[word.id]) return WORD_ATOM_OVERRIDES[word.id]
  const cat = word.classifications?.grammaticalCategory
  return CATEGORY_TO_ATOM[cat] ?? null
}

export function getUnlockedAtoms(wordBankIds, currentSubLevel, lang = 'en') {
  const atoms = new Set()

  // Atoms from the word bank
  for (const id of wordBankIds) {
    const word = allWords.find(w => w.id === id && w.language === lang)
    if (!word) continue
    const atom = deriveAtom(word)
    if (atom) atoms.add(atom)
  }

  // Atoms granted by sub-level progression
  const currentIndex = SUB_LEVEL_ORDER.indexOf(currentSubLevel)
  if (currentIndex >= 0) {
    for (const [level, grants] of Object.entries(SUB_LEVEL_ATOM_GRANTS)) {
      if (SUB_LEVEL_ORDER.indexOf(level) <= currentIndex) {
        grants.forEach(a => atoms.add(a))
      }
    }
  }

  return [...atoms]
}

export function getPracticePool(wordBankIds, currentSubLevel, lang = 'en') {
  const unlockedAtoms = getUnlockedAtoms(wordBankIds, currentSubLevel, lang)
  return getUnlockedStructures(unlockedAtoms, currentSubLevel, lang)
}

// ── Level-gated atoms ─────────────────────────────────────────
//
// Flattens SUB_LEVEL_ATOM_GRANTS into a map: atomId → grantedAtLevel.
// These atoms are never in a word bank — they arrive with level progression.

function buildLevelGatedMap() {
  const map = {}
  for (const [level, atoms] of Object.entries(SUB_LEVEL_ATOM_GRANTS)) {
    for (const atomId of atoms) {
      map[atomId] = level
    }
  }
  return map
}

const LEVEL_GATED = buildLevelGatedMap()

// ── Full pool — all structures, annotated with eligibility ────
//
// Returns every defined structure for the language, each annotated with:
//   eligible      — boolean: can be used for generation right now
//   missingAtoms  — array of missing atom descriptors (empty if eligible):
//     { atomId, label, examples, levelGated, grantedAtLevel }
//
// Use this for UI display so learners can see what they need to unlock a
// structure, rather than just having structures silently disappear.

export function getFullPracticePool(wordBankIds, currentSubLevel, lang = 'en') {
  const unlockedAtomSet = new Set(getUnlockedAtoms(wordBankIds, currentSubLevel, lang))

  return getStructures(lang).map(structure => {
    const missingAtoms = structure.requiredBlocks
      .filter(atomId => !unlockedAtomSet.has(atomId))
      .map(atomId => {
        const atom = getAtom(atomId, lang)
        const grantedAtLevel = LEVEL_GATED[atomId] ?? null
        return {
          atomId,
          label:          atom?.label    ?? atomId,
          examples:       atom?.examples ?? [],
          levelGated:     grantedAtLevel !== null,
          grantedAtLevel,
        }
      })

    return {
      ...structure,
      eligible:    missingAtoms.length === 0,
      missingAtoms,
    }
  })
}
