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

  // ── Capability milestones (stubs) ─────────────────────────────
  // These will be filled in when World Sphere modules are defined.
  // Each requires specific words to be in the user's wordBank.
  // requiredWords lists word IDs from wordData / wordReference.
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

// Returns all milestones with their current completion status.
export function getMilestoneStatus(state) {
  return MILESTONES.map(m => ({
    ...m,
    achieved: m.condition(state),
  }))
}

// Returns the next unachieved milestone and how close the user is.
// For count milestones: wordsToGo = target - wordBank.length
// For capability milestones: wordsToGo = number of required words not yet in bank
export function getNextMilestone(state) {
  const next = MILESTONES.find(m => !m.condition(state))
  if (!next) return null

  let wordsToGo
  if (next.type === MILESTONE_TYPES.COUNT) {
    wordsToGo = next.target - state.wordBank.length
  } else {
    wordsToGo = (next.requiredWords ?? []).filter(w => !state.wordBank.includes(w)).length
  }

  return { ...next, wordsToGo }
}

// Returns the most recently achieved milestone, or null if none.
export function getLatestAchieved(state) {
  const achieved = MILESTONES.filter(m => m.condition(state))
  return achieved.length > 0 ? achieved[achieved.length - 1] : null
}

// Returns the N most recently achieved milestones.
export function getRecentAchievements(state, count = 3) {
  return MILESTONES.filter(m => m.condition(state)).slice(-count).reverse()
}

// Returns the next N unachieved milestones *after* the immediate next one.
// These are "on the horizon" — visible when the user opts in, but not pushed.
export function getUpcomingMilestones(state, count = 3) {
  const unachieved = MILESTONES.filter(m => !m.condition(state))
  return unachieved.slice(1, 1 + count)
}
