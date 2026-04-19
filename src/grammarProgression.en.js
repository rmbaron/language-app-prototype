// grammarProgression.en.js — English grammar function progression tree.
//
// Each node represents a GRAMMAR FUNCTION, not a word.
// Words are carriers that unlock the function. Once a function is unlocked,
// the learner can feel and use it.
//
// Node fields:
//   id               — unique identifier, referenced by requires[] in other nodes
//   name             — the grammar function label ("First person", "Action verb")
//   description      — what this function lets the learner do/feel
//   stage            — difficulty tier (number, 1 = earliest). Adjustable and open-ended —
//                      add more stages above 4 freely. The recommender uses this to avoid
//                      pushing learners toward functions far ahead of where they are.
//   requires         — node IDs that must be unlocked before this one is reachable
//   carrier          — what unlocks this function:
//                        { type: 'specific', wordIds: [...] }
//                          all listed words must be in the word bank
//                        { type: 'category', category, min }
//                          N words of that grammatical category in the bank
//                        { type: 'formType', formType, fromCategory, min }
//                          N bank words of fromCategory that have a form of type formType
//                          (e.g. verb with third_person_present — no new word needed)
//   activatesFormType — when set, the practice system uses this form type when building
//                       slots for this grammar function (e.g. 'third_person_present')
//   openEnded        — if true, recommender freely fills this category up to OPEN_ENDED_LIMIT
//                      before steering toward the next frontier node
//   status: 'stub'   — node is registered (structure correct) but carrier/require
//                      details need refinement. Stubs are skipped by the recommender.
//
// TO EXPAND THE TREE: add nodes below. The recommender, slot system, and milestone
// system pick them up automatically — nothing else needs to change.

export const OPEN_ENDED_LIMIT = 10   // max words recommended at any open-ended level

export const GRAMMAR_NODES = [

  // ── Stage 1 — Reference / pointing ───────────────────────────
  // The learner can name themselves, name the other person, point at things.
  // No complete sentences yet — this is pure referential grounding.

  {
    id: 'first_person',
    name: 'First person',
    description: 'The speaker as the actor. The starting point of almost every sentence.',
    stage: 1,
    requires: [],
    carrier: { type: 'specific', wordIds: ['i'] },
    openEnded: false,
  },

  {
    id: 'second_person',
    name: 'Second person',
    description: 'The person being spoken to. Unlocks: you [verb], I [verb] you.',
    stage: 1,
    requires: ['first_person'],
    carrier: { type: 'specific', wordIds: ['you'] },
    openEnded: false,
  },

  {
    id: 'third_person_neutral',
    name: 'Third person neutral',
    description: 'Things and ideas. Unlocks: I [verb] it, you [verb] it.',
    stage: 1,
    requires: ['second_person'],
    carrier: { type: 'specific', wordIds: ['it'] },
    openEnded: false,
  },

  {
    id: 'pointing',
    name: 'Pointing',
    description: 'This and that. The learner can point at things close and far.',
    stage: 1,
    requires: ['first_person'],
    carrier: { type: 'specific', wordIds: ['this', 'that'] },
    openEnded: false,
  },

  {
    id: 'basic_noun',
    name: 'Naming things',
    description: 'Nouns — people, places, and objects. The world gets names.',
    stage: 1,
    requires: ['first_person'],
    carrier: { type: 'category', category: 'noun', min: 1 },
    openEnded: true,
  },

  // ── Stage 2 — Basic sentence engine ──────────────────────────
  // Complete sentences become possible: I [verb], I am [adjective].
  // The learner can express actions, states, and descriptions.

  {
    id: 'action_verb',
    name: 'Action verb',
    description: 'Something happening. Unlocks the simplest complete sentence: I [verb].',
    stage: 2,
    requires: ['first_person'],
    carrier: { type: 'category', category: 'verb', min: 1 },
    openEnded: true,
  },

  {
    id: 'state_being',
    name: 'State / being',
    description: 'I am, you are, she is. Links subjects to states, qualities, and identities.',
    stage: 2,
    requires: ['first_person'],
    carrier: { type: 'specific', wordIds: ['be'] },
    openEnded: false,
  },

  {
    id: 'third_person_gendered',
    name: 'Third person gendered',
    description: 'Other people. Unlocks: he [verb], she [verb].',
    stage: 2,
    requires: ['third_person_neutral'],
    carrier: { type: 'specific', wordIds: ['he', 'she'] },
    openEnded: false,
  },

  {
    id: 'basic_adjective',
    name: 'Describing words',
    description: 'Qualities and colors. Unlocks: I feel [adjective], you look [adjective].',
    stage: 2,
    requires: ['action_verb'],
    carrier: { type: 'category', category: 'adjective', min: 1 },
    openEnded: true,
  },

  // ── Stage 3 — Control meaning ─────────────────────────────────
  // The learner gains power over meaning: negate, ask, locate, possess.
  // Language becomes two-directional.

  {
    id: 'negation',
    name: 'Negation',
    description: 'Say what is not so. Unlocks: I don\'t want, I don\'t know.',
    stage: 3,
    requires: ['action_verb'],
    carrier: { type: 'specific', wordIds: ['not'] },
    openEnded: false,
  },

  {
    id: 'question_function',
    name: 'Asking questions',
    description: 'What and where. Turns the sentence into a question.',
    stage: 3,
    requires: ['action_verb', 'second_person'],
    carrier: { type: 'specific', wordIds: ['what', 'where'] },
    openEnded: false,
  },

  {
    id: 'possession',
    name: 'Possession',
    description: 'My and your. Assigns ownership — my friend, your house.',
    stage: 3,
    requires: ['second_person'],
    carrier: { type: 'formType', formType: 'possessive', fromCategory: 'pronoun', min: 2 },
    activatesFormType: 'possessive',
    openEnded: false,
  },

  // ── Stage 3 stubs ─────────────────────────────────────────────
  {
    id: 'basic_prepositions',
    name: 'Basic prepositions',
    description: 'To, from, in, at. Unlocks directions and locations.',
    stage: 3,
    requires: ['action_verb'],
    carrier: { type: 'category', category: 'preposition', min: 2 },
    openEnded: true,
    status: 'stub',
  },

  {
    id: 'object_pronouns_gendered',
    name: 'Him and her',
    description: 'Gendered object pronouns. Requires conjugation knowledge first.',
    stage: 3,
    requires: ['third_person_gendered'],
    carrier: { type: 'specific', wordIds: ['him', 'her'] },
    openEnded: false,
    status: 'stub',
  },

  // ── Stage 4 — Expand and combine ─────────────────────────────
  // Verb forms diversify, sentences can be joined, time can be referenced.
  // Vocabulary within already-unlocked functions expands freely.

  {
    id: 'third_person_conjugation',
    name: 'Third person conjugation',
    description: 'He wants, she sees. Verbs change form with he/she/it.',
    stage: 4,
    requires: ['third_person_gendered', 'action_verb'],
    carrier: { type: 'formType', formType: 'third_person_present', fromCategory: 'verb', min: 1 },
    activatesFormType: 'third_person_present',
    openEnded: false,
  },

  // ── Stage 4 stubs ─────────────────────────────────────────────
  {
    id: 'time_anchoring',
    name: 'Time anchoring',
    description: 'Now, today, tomorrow. Grounds speech in time.',
    stage: 4,
    requires: ['action_verb'],
    carrier: { type: 'category', category: 'adverb', min: 2 },
    openEnded: true,
    status: 'stub',
  },

  {
    id: 'conjunction',
    name: 'Joining ideas',
    description: 'And, but. Lets the learner string sentences and contrasts together.',
    stage: 4,
    requires: ['action_verb', 'negation'],
    carrier: { type: 'specific', wordIds: ['and', 'but'] },
    openEnded: false,
    status: 'stub',
  },

]
