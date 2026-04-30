// Word practice system — mechanic registry.
//
// Each mechanic has the shape:
//   id:           string
//   availableIf:  (word, bankWords) => boolean
//   build:        (word, bankWords) => exerciseData | null
//   evaluate:     (learnerInput, exerciseData) => boolean
//
// Components that render each mechanic live in WordPractice.jsx (MechanicRenderer).
// Shared display primitives live in WordPracticePrimitives.jsx.
//
// LANE CONFIG (which mechanics belong to which lane) is in wordPracticeConfig.js.
// Entry point for callers: getAvailableMechanics(word, laneId, bankWords) at the bottom.

import { CONSTRUCTOR_TIERS } from './constructorTiers.en'
import { assembleFrame } from './frameAssembler'
import { findWordInIndex } from './atomIndex'
import { ALL_SLOTS_BY_ID } from './sentenceStructure.en'
import { getActiveLanguage } from './learnerProfile'
import { LANE_MECHANICS } from './wordPracticeConfig'

// ─── Helpers ───────────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Returns the first slotId in a tier that can accept the given atom,
// respecting per-tier slot overrides.
function findSlotForAtom(tier, atomId) {
  for (const slotId of tier.slotIds) {
    const baseSlot = ALL_SLOTS_BY_ID[slotId]
    if (!baseSlot) continue
    const accepts = tier.slotOverrides?.[slotId]?.accepts ?? baseSlot.accepts
    if (accepts.includes(atomId)) return slotId
  }
  return null
}

// Renders a frame as a sentence string (slots in tier order, capitalized + period).
function frameToSentence(tier, frame) {
  const words = tier.slotIds.map(id => frame[id]).filter(Boolean)
  const sentence = words.join(' ')
  return sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.'
}

// ─── blank_distractor ──────────────────────────────────────────────────────
//
// Show a frame-assembled sentence with the target word blanked out.
// Learner picks the correct word from 3 choices (correct + 2 same-atom distractors).

const blank_distractor = {
  id: 'blank_distractor',

  availableIf(word, bankWords) {
    const lang = getActiveLanguage()
    const indexed = findWordInIndex(word.id, lang)
    if (!indexed) return false
    const { atomId } = indexed

    // Need at least one tier where the word can fill a slot
    const hasTier = CONSTRUCTOR_TIERS.some(t => findSlotForAtom(t, atomId))
    if (!hasTier) return false

    // Need 2+ other bank words with the same atom for distractors
    const sameAtomCount = bankWords.filter(w => {
      if (w.id === word.id) return false
      const ix = findWordInIndex(w.id, lang)
      return ix?.atomId === atomId
    }).length
    return sameAtomCount >= 2
  },

  build(word, bankWords) {
    const lang = getActiveLanguage()
    const indexed = findWordInIndex(word.id, lang)
    if (!indexed) return null
    const { atomId } = indexed

    const eligibleTiers = CONSTRUCTOR_TIERS.filter(t => findSlotForAtom(t, atomId))
    if (!eligibleTiers.length) return null

    for (const tier of shuffle([...eligibleTiers])) {
      const targetSlotId = findSlotForAtom(tier, atomId)

      // Force target word into its slot; fill the rest from bank
      const modifiedTier = {
        ...tier,
        forceWords: { ...(tier.forceWords ?? {}), [targetSlotId]: [word.baseForm] },
      }
      const frame = assembleFrame(modifiedTier, bankWords, lang)
      if (!frame) continue

      const blanked = frameToSentence(tier, { ...frame, [targetSlotId]: '___' })

      const sameAtom = bankWords.filter(w => {
        if (w.id === word.id) return false
        const ix = findWordInIndex(w.id, lang)
        return ix?.atomId === atomId
      })
      const distractors = shuffle([...sameAtom]).slice(0, 2).map(w => w.baseForm)

      const choices = shuffle([
        { word: word.baseForm, correct: true },
        ...distractors.map(d => ({ word: d, correct: false })),
      ])

      return { blanked, choices, target: word.baseForm }
    }
    return null
  },

  evaluate(input, data) {
    return input === data.target
  },
}

// ─── Stubs ─────────────────────────────────────────────────────────────────
// Mechanics not yet built. availableIf always returns false so they never
// surface to learners. Build them out one at a time — registry shape is stable.

function stub(id) {
  return {
    id,
    availableIf: () => false,
    build: () => null,
    evaluate: () => false,
  }
}

// ─── Registry ──────────────────────────────────────────────────────────────

export const MECHANICS_REGISTRY = {
  blank_distractor,
  correct_or_not:      stub('correct_or_not'),
  slot_identification: stub('slot_identification'),
  form_selection:      stub('form_selection'),
  what_comes_next:     stub('what_comes_next'),
  chip_assembly:       stub('chip_assembly'),
  slot_game:           stub('slot_game'),
  prompted_production: stub('prompted_production'),
  presence_detection:  stub('presence_detection'),
  form_discrimination: stub('form_discrimination'),
}

// ─── Entry point ───────────────────────────────────────────────────────────

// Returns the list of mechanic definitions available for this word + lane.
// Used by WordPractice screen, lane picker, and dev test screen.
export function getAvailableMechanics(word, laneId, bankWords) {
  const ids = LANE_MECHANICS[laneId] ?? []
  return ids
    .map(id => MECHANICS_REGISTRY[id])
    .filter(def => def && def.availableIf(word, bankWords))
}
