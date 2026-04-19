// Function Goal definitions for English.
//
// Function goals are learner communicative capability milestones — what the
// learner can actually *do* with language at a given level.
//
// This is a separate layer from grammar slots (structural) and semantic subtypes
// (what a word is). Function goals answer a third question: why does this word
// matter for this learner's communicative development?
//
// Architecture mirrors wordAttributes.js:
//
//   FUNCTION_GOAL_SCHEMA — the contract. Defines what dimensions goals have,
//                          what taxonomy values are valid, and which goal types
//                          are active/enforced at each level. The AI reads this
//                          to know how to classify goals it discovers.
//
//   FUNCTION_GOALS       — designer-authored goal definitions. A1 has stubs;
//                          A2–C2 are empty until those levels are designed.
//
//   addFunctionGoal()    — AI hook. Designer defines goal types and seeds examples;
//                          AI discovers additional goals that fit established types.
//
// Two-layer taxonomy (parallel to semanticSubtype):
//
//   goalType    — what category of function goal is this?
//                 (communicative / transactional / descriptive / social)
//   origin      — does this goal follow from language structure (intrinsic),
//                 or is it an editorial designer choice (sculpted)?
//
//   intrinsic goals: follow from what language can do at this level.
//     "Ask a basic question" is A1-intrinsic — every A1 grammar set implies it.
//   sculpted goals: designer decides what communicative territory to cover.
//     "Talk About Family" is a choice — the designer placed it at this level.
//
// Relationship to words:
//   Words get a `functionGoals` attribute (array of goal IDs) filled by the AI.
//   The AI cross-references word meaning against goal definitions and
//   semanticSignals to discover membership.
//   carrierWords are the designer-seeded explicit members; AI expands from there.
//
// Adding a new level:
//   1. Add to `goalType.levelActivation` — which goal types get coverage
//      enforcement at this level
//   2. Author FUNCTION_GOALS entries for the new level (or leave empty to start)
//   3. When AI is wired, AI fills `functionGoals` on word attributes by reading
//      goal definitions for the active level

// ── Schema ────────────────────────────────────────────────────

export const FUNCTION_GOAL_SCHEMA = {
  goalType: {
    description: 'What category of communicative function this goal represents. The AI reads this taxonomy to classify goals it discovers. The designer updates levelActivation when designing a new level.',
    appliesTo: 'all',

    // Valid goal-type labels. The AI reads this to know what categories exist
    // when classifying newly discovered goals.
    taxonomy: [
      'communicative',   // saying/expressing things — needs, opinions, facts
      'transactional',   // getting things done — buying, navigating, asking for help
      'descriptive',     // characterising people, objects, situations
      'social',          // interaction rituals — greetings, introductions, responses
    ],

    // Which goal types get coverage enforcement at each level.
    // Updated when designing a new level — not when adding goals.
    // At A1, all four types are relevant but coverage is very thin.
    levelActivation: {
      A1: ['communicative', 'transactional', 'descriptive', 'social'],
      // A2: [...] — fill in when designing A2
    },
  },

  origin: {
    description: 'Whether this goal follows from language structure (intrinsic) or is an editorial designer choice about what communicative territory to cover (sculpted). Mirrors the inherent/sculpted distinction in wordCurriculum.js.',
    values: ['intrinsic', 'sculpted'],
  },
}

// ── Goal definitions ──────────────────────────────────────────
//
// A1: broad goals seeded manually. The AI will discover additional goals
// that fit these types once wired.
// A2–C2: empty until those levels are designed.

export const FUNCTION_GOALS = [
  // ── A1 ──────────────────────────────────────────────────────

  {
    id: 'name_and_identify',
    levelId: 'A1',
    label: 'Name and Identify Things',
    goalType: 'communicative',
    origin: 'intrinsic',
    description: 'Can point to and name people, objects, and places in immediate context.',
    // Semantic signals: what kinds of words serve this goal.
    // AI uses these to discover additional carrier words beyond the seeded list.
    semanticSignals: [
      { grammaticalCategory: 'noun', semanticSubtype: 'thing' },
      { grammaticalCategory: 'noun', semanticSubtype: 'person' },
      { grammaticalCategory: 'noun', semanticSubtype: 'place' },
    ],
    // Explicitly seeded carrier words. AI expands from here.
    carrierWords: ['this', 'that', 'what', 'food', 'water', 'house', 'person', 'man', 'woman'],
  },

  {
    id: 'express_basic_needs',
    levelId: 'A1',
    label: 'Express Basic Needs and Wants',
    goalType: 'communicative',
    origin: 'intrinsic',
    description: 'Can communicate simple wants, needs, and states.',
    semanticSignals: [
      { grammaticalCategory: 'verb', semanticSubtype: 'emotional' },
      { grammaticalCategory: 'verb', semanticSubtype: 'existential' },
    ],
    carrierWords: ['want', 'need', 'have', 'like', 'be'],
  },

  {
    id: 'describe_simple_qualities',
    levelId: 'A1',
    label: 'Describe Simple Qualities',
    goalType: 'descriptive',
    origin: 'intrinsic',
    description: 'Can describe people and things using basic adjectives.',
    semanticSignals: [
      { grammaticalCategory: 'adjective', semanticSubtype: 'physical' },
      { grammaticalCategory: 'adjective', semanticSubtype: 'evaluative' },
      { grammaticalCategory: 'adjective', semanticSubtype: 'emotional' },
    ],
    carrierWords: ['good', 'bad', 'big', 'small', 'hot', 'cold', 'happy'],
  },

  {
    id: 'ask_basic_questions',
    levelId: 'A1',
    label: 'Ask and Answer Basic Questions',
    goalType: 'social',
    origin: 'intrinsic',
    description: 'Can ask simple who/what/where questions and understand responses.',
    semanticSignals: [],
    carrierWords: ['what', 'where', 'who', 'how', 'yes', 'no'],
  },

  {
    id: 'navigate_and_locate',
    levelId: 'A1',
    label: 'Navigate and Locate',
    goalType: 'transactional',
    origin: 'sculpted',
    description: 'Can ask where things are and describe basic locations.',
    semanticSignals: [
      { grammaticalCategory: 'adjective', semanticSubtype: 'relational' },
      { grammaticalCategory: 'noun', semanticSubtype: 'place' },
    ],
    carrierWords: ['here', 'there', 'in', 'on', 'at', 'where', 'house'],
  },

  // ── A2–C2: fill in when designing those levels ───────────────
]

// ── Runtime cache ─────────────────────────────────────────────
//
// AI-discovered goals are cached alongside the seeded definitions.
// The AI calls addFunctionGoal() when it identifies a goal that fits
// an established type but wasn't seeded by the designer.

const GOAL_CACHE_KEY = 'function_goals_cache'

function loadGoalCache() {
  try { return JSON.parse(localStorage.getItem(GOAL_CACHE_KEY) ?? '{}') }
  catch { return {} }
}

// Hook for AI to call when it discovers a function goal.
// goalId: string, definition: object matching the goal shape above, reason: string
export function addFunctionGoal(goalId, definition, reason) {
  try {
    const cache = loadGoalCache()
    cache[goalId] = { ...definition, _reason: reason, _source: 'ai' }
    localStorage.setItem(GOAL_CACHE_KEY, JSON.stringify(cache))
  } catch {}
}

// Returns all goals for a level, merging designer-authored + AI-discovered.
export function getFunctionGoalsForLevel(levelId) {
  const cache = loadGoalCache()
  const cached = Object.values(cache).filter(g => g.levelId === levelId)
  return [
    ...FUNCTION_GOALS.filter(g => g.levelId === levelId),
    ...cached,
  ]
}
