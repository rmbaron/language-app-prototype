// Classifications — defines how words are grouped and filtered in the Word Bank.
//
// Three layers, all adjustable here. Nothing in WordBank needs to change
// when you add themes, rename groups, or shift thresholds.
//
// ── Layer 1: Grammatical (always shown) ──────────────────────
// Maps a display label to the grammaticalCategory values it covers.
// Pronouns display under Noun — the distinction isn't meaningful to users.

export const GRAMMATICAL_GROUPS = [
  { label: 'Verb',      categories: ['verb'] },
  { label: 'Noun',      categories: ['noun', 'pronoun'] },
  { label: 'Adjective', categories: ['adjective'] },
  { label: 'Adverb',    categories: ['adverb'] },
]

// ── Layer 2: Thematic (unlocks above threshold) ───────────────
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
  // Add more as the word pool grows
]

// ── Layer 3: Custom (user-created) ────────────────────────────
// Stored per-user in learnerProfile, not defined here.
// Words are assigned manually or via AI classification call.

// ── Word → Theme map ─────────────────────────────────────────
// Lives here, not in wordData. This is the only place to edit when
// reclassifying a word or batch-tagging new words. An AI classifier
// would write to this map, not to individual word entries.
//
// Words absent from this map return { theme: null, subTheme: null }
// and will only appear under grammatical filters (never thematic ones).

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

// ── Thresholds ────────────────────────────────────────────────
// Controls when each thematic tier becomes visible.
// Adjust freely — nothing else needs to change.

export const BROAD_THEME_THRESHOLD    = 15   // show broad themes above this word count
export const GRANULAR_THEME_THRESHOLD = 75   // show granular themes above this word count

// ── Helpers ───────────────────────────────────────────────────

// Returns the display group label for a word's grammaticalCategory.
export function getGrammaticalGroup(grammaticalCategory) {
  return GRAMMATICAL_GROUPS.find(g => g.categories.includes(grammaticalCategory))?.label
    ?? grammaticalCategory
}

// Returns which thematic tier should be shown for a given word bank size.
// 'none'     — only grammatical layer
// 'broad'    — grammatical + broad themes
// 'granular' — grammatical + granular themes
export function getThematicTier(wordBankSize) {
  if (wordBankSize >= GRANULAR_THEME_THRESHOLD) return 'granular'
  if (wordBankSize >= BROAD_THEME_THRESHOLD)    return 'broad'
  return 'none'
}
