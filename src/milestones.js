// Milestone System — defines what a learner is working toward and how close they are.
//
// Two milestone types share the same structure:
//
//   count-based   — triggered when wordBank.length reaches a threshold.
//                   Good for general progress framing and goal-flavored descriptions.
//
//   capability    — triggered when the user has all required words for a specific
//                   functional scenario (World Sphere module unlock, etc.).
//                   More specific and tangible — "learn these 5 words and you can..."
//                   Not yet active — requiredWords stubs will be filled when
//                   World Sphere modules are defined.
//
// Condition functions receive the full userStore state and return true/false.
// This keeps the milestone system decoupled — it doesn't import userStore directly,
// it just receives state as a parameter.
//
// Adding a new milestone: add an entry to MILESTONES. Nothing else needs to change.
// The proximity and display logic reads from this list automatically.

export const MILESTONE_TYPES = {
  COUNT:      'count',
  CAPABILITY: 'capability',
  GRAMMAR:    'grammar',   // triggered when a grammar node is graduated in grammarStore
}

const MILESTONES = [
  {
    id: 'first_word',
    label: 'First word',
    description: 'Your vocabulary journey begins.',
    type: MILESTONE_TYPES.COUNT,
    target: 1,
    condition: state => state.wordBank.length >= 1,
  },
  {
    id: 'five_words',
    label: 'Five words',
    description: 'Enough to introduce yourself and express a basic need.',
    type: MILESTONE_TYPES.COUNT,
    target: 5,
    condition: state => state.wordBank.length >= 5,
  },
  {
    id: 'ten_words',
    label: 'Ten words',
    description: 'You can ask for things, describe them, and say where you are.',
    type: MILESTONE_TYPES.COUNT,
    target: 10,
    condition: state => state.wordBank.length >= 10,
  },
  {
    id: 'twenty_five_words',
    label: 'Twenty-five words',
    description: 'Enough to get through a simple conversation about familiar topics.',
    type: MILESTONE_TYPES.COUNT,
    target: 25,
    condition: state => state.wordBank.length >= 25,
  },
  {
    id: 'fifty_words',
    label: 'Fifty words',
    description: 'You can describe your day, ask questions, and handle basic situations.',
    type: MILESTONE_TYPES.COUNT,
    target: 50,
    condition: state => state.wordBank.length >= 50,
  },
  {
    id: 'one_hundred_words',
    label: 'One hundred words',
    description: 'Most basic social and practical situations are within reach.',
    type: MILESTONE_TYPES.COUNT,
    target: 100,
    condition: state => state.wordBank.length >= 100,
  },
  {
    id: 'two_fifty_words',
    label: '250 words',
    description: 'A solid functional base. You can express most everyday thoughts.',
    type: MILESTONE_TYPES.COUNT,
    target: 250,
    condition: state => state.wordBank.length >= 250,
  },
  {
    id: 'five_hundred_words',
    label: '500 words',
    description: 'Conversational in familiar contexts. Gaps are shrinking fast.',
    type: MILESTONE_TYPES.COUNT,
    target: 500,
    condition: state => state.wordBank.length >= 500,
  },
  {
    id: 'one_thousand_words',
    label: '1,000 words',
    description: 'You understand most of what you hear and read in everyday situations.',
    type: MILESTONE_TYPES.COUNT,
    target: 1000,
    condition: state => state.wordBank.length >= 1000,
  },
  {
    id: 'two_thousand_words',
    label: '2,000 words',
    description: 'Fluency is no longer theoretical. It\'s a matter of time.',
    type: MILESTONE_TYPES.COUNT,
    target: 2000,
    condition: state => state.wordBank.length >= 2000,
  },

  // ── Grammar capability milestones ────────────────────────────
  // Triggered when the learner graduates a grammar function node via slot practice.
  // condition receives (state, grammarState) — state is userStore, grammarState is grammarStore.
  // grammarNode ties this milestone to a node in grammarProgression.en.js.
  // Adding a new grammar node to the tree + a matching entry here is all that's needed.
  {
    id: 'grammar_pointing',
    label: 'This and that',
    description: 'You can point at the world. Near and far — things have reference.',
    type: MILESTONE_TYPES.GRAMMAR,
    grammarNode: 'pointing',
    condition: (state, grammarState) => (grammarState.graduatedNodes ?? []).includes('pointing'),
  },
  {
    id: 'grammar_state_being',
    label: 'I am / you are',
    description: 'You can link subjects to states, qualities, and identities.',
    type: MILESTONE_TYPES.GRAMMAR,
    grammarNode: 'state_being',
    condition: (state, grammarState) => (grammarState.graduatedNodes ?? []).includes('state_being'),
  },
  {
    id: 'grammar_action_verb',
    label: 'First action',
    description: 'You can express someone doing something. The foundation of every sentence.',
    type: MILESTONE_TYPES.GRAMMAR,
    grammarNode: 'action_verb',
    condition: (state, grammarState) => (grammarState.graduatedNodes ?? []).includes('action_verb'),
  },
  {
    id: 'grammar_second_person',
    label: 'You and me',
    description: 'You can speak directly to another person and talk about them.',
    type: MILESTONE_TYPES.GRAMMAR,
    grammarNode: 'second_person',
    condition: (state, grammarState) => (grammarState.graduatedNodes ?? []).includes('second_person'),
  },
  {
    id: 'grammar_basic_adjective',
    label: 'Describing words',
    description: 'You can give qualities to things and people.',
    type: MILESTONE_TYPES.GRAMMAR,
    grammarNode: 'basic_adjective',
    condition: (state, grammarState) => (grammarState.graduatedNodes ?? []).includes('basic_adjective'),
  },
  {
    id: 'grammar_negation',
    label: 'Negation',
    description: 'You can say what is not so. I don\'t want. I don\'t know.',
    type: MILESTONE_TYPES.GRAMMAR,
    grammarNode: 'negation',
    condition: (state, grammarState) => (grammarState.graduatedNodes ?? []).includes('negation'),
  },
  {
    id: 'grammar_question_function',
    label: 'First questions',
    description: 'You can ask. What and where open every conversation.',
    type: MILESTONE_TYPES.GRAMMAR,
    grammarNode: 'question_function',
    condition: (state, grammarState) => (grammarState.graduatedNodes ?? []).includes('question_function'),
  },
  {
    id: 'grammar_possession',
    label: 'Mine and yours',
    description: 'You can assign ownership. My house, your friend.',
    type: MILESTONE_TYPES.GRAMMAR,
    grammarNode: 'possession',
    condition: (state, grammarState) => (grammarState.graduatedNodes ?? []).includes('possession'),
  },
  {
    id: 'grammar_third_person_conjugation',
    label: 'He and she do things',
    description: 'Verbs change form with he, she, and it. The full subject range is open.',
    type: MILESTONE_TYPES.GRAMMAR,
    grammarNode: 'third_person_conjugation',
    condition: (state, grammarState) => (grammarState.graduatedNodes ?? []).includes('third_person_conjugation'),
  },

  // ── World Sphere capability milestones (stubs) ────────────────
  // These will be filled in when World Sphere modules are defined.
  // Each requires specific words to be in the user's wordBank.
  //
  // {
  //   id: 'cafe_module',
  //   label: 'Café scenario',
  //   description: 'Order a coffee, ask for the bill, make small talk.',
  //   type: MILESTONE_TYPES.CAPABILITY,
  //   requiredWords: ['want', 'please', 'good', ...],
  //   condition: state => ['want', 'please', 'good'].every(w => state.wordBank.includes(w)),
  // },
]

// ── Public API ────────────────────────────────────────────────
//
// All functions accept (state, grammarState = {}) where:
//   state        — userStore state (wordBank, pools, etc.)
//   grammarState — grammarStore state (graduatedNodes, etc.) — optional, defaults to empty
//
// Passing grammarState is required for grammar milestones to evaluate correctly.
// Count and capability milestones ignore grammarState entirely.

// Returns all milestones with their current completion status.
export function getMilestoneStatus(state, grammarState = {}) {
  return MILESTONES.map(m => ({
    ...m,
    achieved: m.condition(state, grammarState),
  }))
}

// Returns the next unachieved milestone and how close the user is.
// For count milestones: wordsToGo = target - wordBank.length
// For capability milestones: wordsToGo = number of required words not yet in bank
// For grammar milestones: wordsToGo = 0 (binary — graduated or not)
export function getNextMilestone(state, grammarState = {}) {
  const next = MILESTONES.find(m => !m.condition(state, grammarState))
  if (!next) return null

  let wordsToGo
  if (next.type === MILESTONE_TYPES.COUNT) {
    wordsToGo = next.target - state.wordBank.length
  } else if (next.type === MILESTONE_TYPES.GRAMMAR) {
    wordsToGo = 0
  } else {
    wordsToGo = (next.requiredWords ?? []).filter(w => !state.wordBank.includes(w)).length
  }

  return { ...next, wordsToGo }
}

// Returns the most recently achieved milestone, or null if none.
export function getLatestAchieved(state, grammarState = {}) {
  const achieved = MILESTONES.filter(m => m.condition(state, grammarState))
  return achieved.length > 0 ? achieved[achieved.length - 1] : null
}

// Returns the N most recently achieved milestones.
export function getRecentAchievements(state, grammarState = {}, count = 3) {
  return MILESTONES.filter(m => m.condition(state, grammarState)).slice(-count).reverse()
}

// Returns the next N unachieved milestones *after* the immediate next one.
// These are "on the horizon" — visible when the user opts in, but not pushed.
export function getUpcomingMilestones(state, grammarState = {}, count = 3) {
  const unachieved = MILESTONES.filter(m => !m.condition(state, grammarState))
  return unachieved.slice(1, 1 + count)
}
