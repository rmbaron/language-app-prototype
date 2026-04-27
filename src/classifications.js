// Classifications — defines how words are grouped and filtered in the Word Bank.
//
// This is a DESIGN layer. Atoms are the system's internal truth; this file
// defines how that truth is presented to users. Adjust groupings here freely —
// nothing in the pipeline or atom system needs to change.
//
// ── Layer 1: Grammatical (always shown) ──────────────────────────────────────
// Each group maps atom IDs (primary) and grammaticalCategory strings (L1 fallback).
// The fallback ensures words with only L1 data still filter correctly while
// L2 enrichment is pending.
//
// To add a new user-facing group: add an entry here. Done.
// To move an atom to a different group: edit its `atoms` array. Done.

export const GRAMMATICAL_GROUPS = [
  {
    label:      'Verb',
    atoms:      ['lexical_verb', 'copula', 'auxiliary', 'modal_auxiliary', 'perfect_auxiliary', 'progressive_auxiliary'],
    categories: ['verb'],
  },
  {
    label:      'Noun',
    atoms:      ['noun', 'numeral', 'demonstrative'],
    categories: ['noun'],
  },
  {
    label:      'Pronoun',
    atoms:      ['personal_pronoun', 'object_pronoun', 'possessive_determiner'],
    categories: ['pronoun'],
  },
  {
    label:      'Adjective',
    atoms:      ['adjective'],
    categories: ['adjective'],
  },
  {
    label:      'Adverb',
    atoms:      ['adverb'],
    categories: ['adverb'],
  },
  // determiner, preposition, conjunction, interrogative, negation_marker, interjection
  // are not grouped for user display yet. Words with these atoms appear under "all"
  // but have no filter button. Add a group here when the design calls for it.
]

// ── Layer 2: Thematic (unlocks above threshold) ───────────────────────────────
//
// Two tiers of specificity — broad and granular.
// Broad:    People, Places, Food, Time...
// Granular: Clothing, Transportation, Relationships...
//
// Words carry a `theme` (broad) and optional `subTheme` (granular) field.
// Add new entries here freely — words pick them up automatically.

export const BROAD_THEMES = [
  'Concepts',
  'Feelings',
  'Food',
  'Mind',
  'Movement',
  'Needs',
  'People',
  'Places',
  'Qualities',
  'Social',
  'Things',
  'Time',
]

export const GRANULAR_THEMES = [
  { label: 'Clothing',       parent: 'Things'    },
  { label: 'Colors',         parent: 'Qualities' },
  { label: 'Food & Drink',   parent: 'Food'      },
  { label: 'Home',           parent: 'Places'    },
  { label: 'Nature',         parent: 'Places'    },
  { label: 'Relationships',  parent: 'People'    },
  { label: 'Transportation', parent: 'Movement'  },
  { label: 'Weather',        parent: 'Concepts'  },
  { label: 'Work',           parent: 'Social'    },
]

// ── Layer 3: Custom (user-created) ────────────────────────────────────────────
// Stored per-user in learnerProfile, not defined here.

// ── Word → Theme map ──────────────────────────────────────────────────────────
// Lives here, not in wordData. AI classifiers write to this map.
// Words absent from this map return { theme: null, subTheme: null }.

export const WORD_CLASSIFICATIONS = {
  want:   { theme: 'Needs',     subTheme: null },
  need:   { theme: 'Needs',     subTheme: null },
  good:   { theme: 'Qualities', subTheme: null },
  house:  { theme: 'Places',    subTheme: 'Home' },
  you:    { theme: 'People',    subTheme: null },
  go:     { theme: 'Movement',  subTheme: null },
  come:   { theme: 'Movement',  subTheme: null },
  see:    { theme: 'Mind',      subTheme: null },
  know:   { theme: 'Mind',      subTheme: null },
  think:  { theme: 'Mind',      subTheme: null },
  day:    { theme: 'Time',      subTheme: null },
  friend: { theme: 'People',    subTheme: 'Relationships' },
  food:   { theme: 'Food',      subTheme: 'Food & Drink' },
  happy:  { theme: 'Feelings',  subTheme: null },
  please: { theme: 'Social',    subTheme: null },
  sorry:  { theme: 'Social',    subTheme: null },
  help:   { theme: 'Social',    subTheme: null },
  time:   { theme: 'Time',      subTheme: null },
  big:    { theme: 'Qualities', subTheme: null },
  now:    { theme: 'Time',      subTheme: null },
}

export function getWordTheme(wordId) {
  return WORD_CLASSIFICATIONS[wordId] ?? { theme: null, subTheme: null }
}

// ── Thresholds ────────────────────────────────────────────────────────────────
export const BROAD_THEME_THRESHOLD    = 15
export const GRANULAR_THEME_THRESHOLD = 75

// ── Helpers ───────────────────────────────────────────────────────────────────

// Returns the display group label for a word, preferring grammaticalAtom over
// grammaticalCategory. Used by WordBank filter and WordCard.
export function getGrammaticalGroup(word) {
  for (const g of GRAMMATICAL_GROUPS) {
    if (word.grammaticalAtom && g.atoms.includes(word.grammaticalAtom)) return g.label
  }
  for (const g of GRAMMATICAL_GROUPS) {
    if (word.grammaticalCategory && g.categories.includes(word.grammaticalCategory)) return g.label
  }
  return null
}

// Returns which thematic tier should be shown for a given word bank size.
export function getThematicTier(wordBankSize) {
  if (wordBankSize >= GRANULAR_THEME_THRESHOLD) return 'granular'
  if (wordBankSize >= BROAD_THEME_THRESHOLD)    return 'broad'
  return 'none'
}

// Filter predicate for WordBank. Accepts a resolved word record.
export function matchesFilter(word, filter) {
  if (filter === 'all') return true

  // Grammatical group filter
  const group = GRAMMATICAL_GROUPS.find(g => g.label === filter)
  if (group) {
    if (word.grammaticalAtom && group.atoms.includes(word.grammaticalAtom)) return true
    if (word.grammaticalCategory && group.categories.includes(word.grammaticalCategory)) return true
    return false
  }

  // Thematic filter
  const { theme, subTheme } = getWordTheme(word.id)
  const granular = GRANULAR_THEMES.find(g => g.label === filter)
  if (granular) return subTheme === filter
  return theme === filter
}
