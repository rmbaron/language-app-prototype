// Sentence Structures — English
//
// The third layer of the sentence structure system.
// Built from slot roles, which are filled by grammar atoms.
//
//   grammar atoms → slot roles → sentence structures
//
// Each structure is a permission set, not a rigid template.
// The AI reads these as constraints on what is grammatically valid
// and generates natural sentences within them. Optional slots are
// opportunities, not requirements — the AI uses them when they
// make the sentence more natural.
//
// Structure fields:
//   id             — machine identifier
//   label          — human-readable name
//   subLevel       — earliest sub-level at which this structure unlocks
//   example        — one natural sentence for AI context
//   slots          — ordered slot definitions:
//                      role     — slot role id (from slotRoles.en.js)
//                      accepts  — grammar atom ids eligible to fill this slot
//                      optional — if true, AI may omit this slot
//   requiredBlocks — atom ids that must be present in the word bank
//                    for this structure to be eligible. This is the
//                    unlock gate — not a list of specific words.
//
// Word count:
//   MIN_WORDS applies to all structures at this level.
//   Per-lane max words will be configured separately when the
//   World Sphere practice lane system is built.
//
// Router: sentenceStructures.js

export const MIN_WORDS = 3

// Sub-level ordering — used for unlock eligibility checks
export const SUB_LEVEL_ORDER = [
  'A1.1', 'A1.2', 'A1.3', 'A1.4', 'A1.5',
  'A2.1', 'A2.2',
  'B1.1', 'B1.2',
  'B2.1', 'B2.2',
  'C1.1', 'C1.2',
  'C2',
]

export const STRUCTURES = [

  // ── A1.1 — Earliest sentence engine ──────────────────────────
  // Small, concrete. The first usable sentence world.

  {
    id: 'SV',
    label: 'Subject + Verb',
    subLevel: 'A1.1',
    example: 'I go now.',
    slots: [
      { role: 'subject', accepts: ['personal_pronoun'], optional: false },
      { role: 'verb',    accepts: ['lexical_verb'],     optional: false },
    ],
    requiredBlocks: ['personal_pronoun', 'lexical_verb'],
  },

  {
    id: 'SVO',
    label: 'Subject + Verb + Object',
    subLevel: 'A1.1',
    example: 'I want food.',
    slots: [
      { role: 'subject', accepts: ['personal_pronoun'],  optional: false },
      { role: 'verb',    accepts: ['lexical_verb'],      optional: false },
      { role: 'object',  accepts: ['noun'],              optional: false },
    ],
    requiredBlocks: ['personal_pronoun', 'lexical_verb', 'noun'],
  },

  {
    id: 'S_BE_ADJ',
    label: 'Subject + Be + Adjective',
    subLevel: 'A1.1',
    example: 'It is big.',
    slots: [
      { role: 'subject',              accepts: ['personal_pronoun', 'noun'], optional: false },
      { role: 'copula',               accepts: ['copula'],                   optional: false },
      { role: 'complement_adjective', accepts: ['adjective'],                optional: false },
    ],
    requiredBlocks: ['copula', 'adjective'],
  },

  {
    id: 'S_BE_NOUN',
    label: 'Subject + Be + Noun',
    subLevel: 'A1.1',
    example: 'She is a teacher.',
    slots: [
      { role: 'subject',              accepts: ['personal_pronoun', 'noun'], optional: false },
      { role: 'copula',               accepts: ['copula'],                   optional: false },
      { role: 'determiner_optional',  accepts: ['determiner_article'],       optional: true  },
      { role: 'complement_noun',      accepts: ['noun'],                     optional: false },
    ],
    requiredBlocks: ['copula', 'noun'],
  },

  // ── A1.2 — Early control and specification ────────────────────
  // Less like isolated frames, more like controllable language.

  {
    id: 'S_BE_LOC',
    label: 'Subject + Be + Location',
    subLevel: 'A1.2',
    example: 'I am at home.',
    slots: [
      { role: 'subject',               accepts: ['personal_pronoun', 'noun'], optional: false },
      { role: 'copula',                accepts: ['copula'],                   optional: false },
      { role: 'preposition',           accepts: ['preposition'],              optional: false },
      { role: 'object_of_preposition', accepts: ['noun'],                     optional: false },
    ],
    requiredBlocks: ['copula', 'preposition', 'noun'],
  },

  {
    id: 'S_NEG_V',
    label: 'Simple negative clause',
    subLevel: 'A1.2',
    example: 'I do not want food.',
    slots: [
      { role: 'subject',         accepts: ['personal_pronoun'], optional: false },
      { role: 'auxiliary',       accepts: ['auxiliary'],        optional: false },
      { role: 'negation',        accepts: ['negation_marker'],  optional: false },
      { role: 'verb',            accepts: ['lexical_verb'],     optional: false },
      { role: 'object_optional', accepts: ['noun'],             optional: true  },
    ],
    requiredBlocks: ['personal_pronoun', 'auxiliary', 'negation_marker', 'lexical_verb'],
  },

  {
    id: 'WH_BE',
    label: 'Wh-question with be',
    subLevel: 'A1.2',
    example: 'Where is the food?',
    slots: [
      { role: 'interrogative', accepts: ['interrogative'],             optional: false },
      { role: 'copula',        accepts: ['copula'],                    optional: false },
      { role: 'subject',       accepts: ['personal_pronoun', 'noun'],  optional: false },
    ],
    requiredBlocks: ['interrogative', 'copula'],
  },

  {
    id: 'YN_Q',
    label: 'Yes/No question',
    subLevel: 'A1.2',
    example: 'Do you like tea?',
    slots: [
      { role: 'auxiliary',       accepts: ['auxiliary'],        optional: false },
      { role: 'subject',         accepts: ['personal_pronoun'], optional: false },
      { role: 'verb',            accepts: ['lexical_verb'],     optional: false },
      { role: 'object_optional', accepts: ['noun'],             optional: true  },
    ],
    requiredBlocks: ['auxiliary', 'personal_pronoun', 'lexical_verb'],
  },

  // ── A1.3 — Late A1 expansion ──────────────────────────────────
  // Still beginner language but with sentence widening.

  {
    id: 'SV_OO',
    label: 'Coordinated objects',
    subLevel: 'A1.3',
    example: 'I want food and water.',
    slots: [
      { role: 'subject',  accepts: ['personal_pronoun'], optional: false },
      { role: 'verb',     accepts: ['lexical_verb'],     optional: false },
      { role: 'object_1', accepts: ['noun'],             optional: false },
      { role: 'linker',   accepts: ['conjunction'],      optional: false },
      { role: 'object_2', accepts: ['noun'],             optional: false },
    ],
    requiredBlocks: ['personal_pronoun', 'lexical_verb', 'noun', 'conjunction'],
  },

  {
    id: 'S_BE_AADJ',
    label: 'Coordinated adjectives',
    subLevel: 'A1.3',
    example: 'It is big and red.',
    slots: [
      { role: 'subject',     accepts: ['personal_pronoun', 'noun'], optional: false },
      { role: 'copula',      accepts: ['copula'],                   optional: false },
      { role: 'adjective_1', accepts: ['adjective'],                optional: false },
      { role: 'linker',      accepts: ['conjunction'],              optional: false },
      { role: 'adjective_2', accepts: ['adjective'],                optional: false },
    ],
    requiredBlocks: ['copula', 'adjective', 'conjunction'],
  },

  {
    id: 'SV_ADV',
    label: 'Verb + adverb',
    subLevel: 'A1.3',
    example: 'I go now.',
    slots: [
      { role: 'subject',   accepts: ['personal_pronoun'], optional: false },
      { role: 'verb',      accepts: ['lexical_verb'],     optional: false },
      { role: 'adverbial', accepts: ['adverb'],           optional: false },
    ],
    requiredBlocks: ['personal_pronoun', 'lexical_verb', 'adverb'],
  },

  {
    id: 'S_BE_ADV',
    label: 'Be + adverb',
    subLevel: 'A1.3',
    example: 'I am here.',
    slots: [
      { role: 'subject',           accepts: ['personal_pronoun', 'noun'], optional: false },
      { role: 'copula',            accepts: ['copula'],                   optional: false },
      { role: 'complement_adverb', accepts: ['adverb'],                   optional: false },
    ],
    requiredBlocks: ['copula', 'adverb'],
  },

]
