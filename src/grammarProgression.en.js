// grammarProgression.en.js — English grammar function progression tree.
//
// Each node represents a GRAMMAR FUNCTION, not a word.
// Words are carriers that unlock the function. Once a function is unlocked,
// the learner can feel and use it. Open-ended functions allow free exploration
// up to OPEN_ENDED_LIMIT words at that level before moving on.
//
// Node fields:
//   id          — unique identifier, referenced by requires[] in other nodes
//   name        — the grammar function ("First person", "Action verb")
//   description — what this function lets the learner do/feel
//   requires    — node IDs that must be unlocked before this one is reachable
//   carrier     — what unlocks this function:
//                   { type: 'specific', wordIds: [...] }  — all listed words must be graduated
//                   { type: 'category', category, min }   — N words of that grammatical category
//   openEnded   — if true, recommender freely fills this level up to OPEN_ENDED_LIMIT
//                 before steering toward the next frontier node
//
// TO EXPAND THE TREE: add nodes below. The recommender and slot system
// pick them up automatically — nothing else needs to change.
//
// STUB NODES are marked with status: 'stub'. They are registered in the tree
// (so the structure is correct) but their carrier/require details need refinement.

export const OPEN_ENDED_LIMIT = 10   // max words recommended at any open-ended level

export const GRAMMAR_NODES = [

  // ── Root ──────────────────────────────────────────────────────
  {
    id: 'first_person',
    name: 'First person',
    description: 'The speaker as the actor. The starting point of almost every sentence.',
    requires: [],
    carrier: { type: 'specific', wordIds: ['i'] },
    openEnded: false,
  },

  // ── Verb level ────────────────────────────────────────────────
  {
    id: 'action_verb',
    name: 'Action verb',
    description: 'Something happening. Unlocks the simplest complete sentence: I [verb].',
    requires: ['first_person'],
    carrier: { type: 'category', category: 'verb', min: 1 },
    openEnded: true,   // freely explore up to OPEN_ENDED_LIMIT verbs at this level
  },

  // ── Pronoun expansion ─────────────────────────────────────────
  {
    id: 'second_person',
    name: 'Second person',
    description: 'The person being spoken to. Unlocks: I [verb] you, you [verb].',
    requires: ['action_verb'],
    carrier: { type: 'specific', wordIds: ['you'] },
    openEnded: false,
  },

  {
    id: 'third_person_neutral',
    name: 'Third person neutral',
    description: 'Things and ideas. Unlocks: I [verb] it, you [verb] it.',
    requires: ['second_person'],
    carrier: { type: 'specific', wordIds: ['it'] },
    openEnded: false,
  },

  {
    id: 'third_person_gendered',
    name: 'Third person gendered',
    description: 'Other people. Unlocks: he [verb], she [verb].',
    requires: ['third_person_neutral'],
    carrier: { type: 'specific', wordIds: ['he', 'she'] },
    openEnded: false,
  },

  // ── Describing ────────────────────────────────────────────────
  {
    id: 'basic_adjective',
    name: 'Describing words',
    description: 'Qualities and colors. Unlocks: I feel [adjective], you look [adjective].',
    requires: ['action_verb'],
    carrier: { type: 'category', category: 'adjective', min: 1 },
    openEnded: true,   // freely explore adjectives once the function is felt
  },

  // ── Stub: object pronouns (gendered) ─────────────────────────
  // Requires him/her BUT also requires verb conjugation (wants, sees)
  // and potentially function words. Detail to be filled in later.
  {
    id: 'object_pronouns_gendered',
    name: 'Him and her',
    description: 'Gendered object pronouns. Requires conjugation knowledge first.',
    requires: ['third_person_gendered'],
    carrier: { type: 'specific', wordIds: ['him', 'her'] },
    openEnded: false,
    status: 'stub',  // conjugation + function word prerequisites not yet modeled
  },

  // ── Stub: verb conjugation ────────────────────────────────────
  // "wants", "sees", "goes" — third person present conjugation.
  // Required before third-person sentences are grammatically correct.
  // Detail to be filled in once conjugation system is designed.
  {
    id: 'third_person_conjugation',
    name: 'Third person conjugation',
    description: 'He wants, she sees. Verbs change form with he/she/it.',
    requires: ['third_person_gendered', 'action_verb'],
    carrier: null,   // TBD — likely tied to verb forms, not a separate word
    openEnded: false,
    status: 'stub',
  },

  // ── Stub: function words / prepositions ───────────────────────
  // "to", "from", "in", "at" — unlock directional and locational constructions.
  // Required before direction/location sentences make grammatical sense.
  {
    id: 'basic_prepositions',
    name: 'Basic prepositions',
    description: 'To, from, in, at. Unlocks directions and locations.',
    requires: ['action_verb'],
    carrier: { type: 'category', category: 'preposition', min: 2 },
    openEnded: true,
    status: 'stub',
  },

]
