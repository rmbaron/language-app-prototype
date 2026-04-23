// Sentence Structure — English
//
// Defines the slot-based grammar of English sentences.
// Each slot has a fixed positional identity in the sentence.
// Slots are frames — words from the learner's bank fill them at runtime.
//
// Slot label keys are resolved through uiStrings, not stored here.

// ─── Slot shape ────────────────────────────────────────────────────────────
//
// {
//   id:       string        — unique identifier, used as uiStrings key
//   optional: boolean       — false = always present in this phrase
//   accepts:  string[]      — grammatical atom categories that can fill this slot
//   requires: string[]      — slot ids that must also be present when this slot is active
// }

// ─── Subject (Noun Phrase) ─────────────────────────────────────────────────
//
// The left side of the sentence. Expands inward from the noun.
// Determiner and adjective are optional; the noun itself is required.

export const SUBJECT_PHRASE = {
  slots: [
    {
      id:          'determiner',
      role:        'Appears at the start of the subject noun phrase, directly before any adjective and the noun. e.g. "the", "a", "my", "this".',
      optional:    true,
      accepts:     ['determiner', 'possessive_determiner', 'demonstrative'],
      requires:    ['subject_noun'],
    },
    {
      id:          'subject_adjective',
      role:        'Appears directly before the subject noun, after any determiner. e.g. "a SAD girl", "the TIRED teacher". Never after the verb.',
      optional:    true,
      accepts:     ['adjective'],
      requires:    ['subject_noun'],
    },
    {
      id:          'subject_noun',
      role:        'The subject of the sentence — who or what is doing the action.',
      optional:    false,
      accepts:     ['noun', 'personal_pronoun'],
      requires:    [],
    },
  ],
}

// ─── Predicate (Verb Phrase) ───────────────────────────────────────────────
//
// The right side of the sentence. The verb slot is always required.
// Everything else is optional, but some slots pull co-requirements.
//
// Order is fixed:
//   modal → perfect → progressive → negation → verb → object/complement → adverbial
//
// The verb slot accepts both lexical verbs and copulas.
// When a copula fills the verb slot, the right side reconfigures:
//   object disappears, complement appears instead.
// This is handled via PREDICATE_COPULA_VARIANT below.

export const PREDICATE_PHRASE = {
  slots: [
    {
      id:       'modal',
      role:     'Appears before the main verb, expressing ability, possibility, or intention. e.g. "I CAN eat", "she WILL go".',
      optional: true,
      accepts:  ['modal_auxiliary'],
      requires: ['verb'],
    },
    {
      id:       'perfect',
      role:     'Appears before the main verb to form the perfect aspect. Always "have/has". e.g. "I HAVE eaten", "she HAS gone".',
      optional: true,
      accepts:  ['perfect_auxiliary'],
      requires: ['verb'],
    },
    {
      id:       'progressive',
      role:     'Appears before the main verb to form the progressive aspect. Always "am/is/are". e.g. "I AM eating", "she IS running".',
      optional: true,
      accepts:  ['progressive_auxiliary'],
      requires: ['verb'],
    },
    {
      id:        'negation',
      role:      'Appears after the first auxiliary (or after do-support if no auxiliary). e.g. "I do NOT eat", "she cannot NOT go".',
      optional:  true,
      accepts:   ['negation_marker'],
      requires:  [],
      doSupport: true,
    },
    {
      id:       'verb',
      role:     'The main verb of the sentence — the action or state.',
      optional: false,
      accepts:  ['lexical_verb', 'copula'],
      requires: [],
    },
    {
      id:       'object',
      role:     'Appears directly after the verb — the thing receiving the action. e.g. "I eat FOOD", "she likes HIM".',
      optional: true,
      accepts:  ['noun', 'object_pronoun'],
      requires: [],
    },
    {
      id:       'adverbial',
      role:     'Appears at the end of the sentence, adding time or place. e.g. "I eat HERE", "she works NOW".',
      optional: true,
      accepts:  ['adverb', 'preposition'],
      requires: [],
    },
  ],

  copulaVariant: {
    remove: ['object'],
    insert: [
      {
        id:       'complement',
        role:     'Appears after the copula "be" — describes or identifies the subject. e.g. "I am HAPPY", "she is A TEACHER".',
        optional: false,
        accepts:  ['adjective', 'noun'],
        requires: [],
      },
    ],
  },
}

// ─── Full sentence ─────────────────────────────────────────────────────────

export const SENTENCE_STRUCTURE = {
  subject:   SUBJECT_PHRASE,
  predicate: PREDICATE_PHRASE,
}

// ─── Slot lookup by ID ─────────────────────────────────────────────────────
// Includes all subject phrase slots, predicate phrase slots, and copula complement.

export const ALL_SLOTS_BY_ID = Object.fromEntries(
  [
    ...SUBJECT_PHRASE.slots,
    ...PREDICATE_PHRASE.slots,
    ...PREDICATE_PHRASE.copulaVariant.insert,
  ].map(s => [s.id, s])
)
