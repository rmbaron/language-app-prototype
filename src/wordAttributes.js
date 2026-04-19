// Word attribute store — AI-populated semantic properties per word.
//
// These describe what a word *means and does*, deeper than grammaticalCategory
// (which is a grammatical classification). The AI fills these in when a word
// enters the pre-feeder pool, based on the dimensions the current level needs.
//
// Architecture:
//   ATTRIBUTE_SCHEMA — the contract. Defines what dimensions exist, what values
//                      are valid per grammatical category, and which categories
//                      get balance enforcement at each level.
//                      Slots reference dimensions here; the AI reads them to know
//                      what to fill in.
//
//   ATTRIBUTE_STUBS  — manually filled for the A1 carrier band while the API is
//                      not yet wired. Minimal: only what the slot system needs now.
//
//   getWordAttributes(wordId) — returns a word's attribute object.
//                               Runtime cache (AI-populated) takes priority over stubs.
//                               Returns null if neither exists.
//
//   setWordAttributes(wordId, attrs) — called by the AI fill function.
//
// Adding a new level:
//   1. Add to `semanticSubtype.levelActivation` — which grammatical categories
//      need balance enforcement at this level
//   2. Add to `semanticSubtype.categoryTaxonomies` if new categories appear
//   3. Stub A1-equivalent carrier band words for the new level if needed
//   4. When the API is wired, the AI auto-fills new words entering the pool

// ── Schema ────────────────────────────────────────────────────

export const ATTRIBUTE_SCHEMA = {
  semanticSubtype: {
    description: 'Semantic sub-classification within a grammatical category. Always the same question regardless of category: "what kind of X is this?" The AI fills this in per word; the value is stable across levels. The designer defines which grammatical categories are active for balance enforcement at each level.',
    appliesTo: 'all',

    // Valid values per grammatical category.
    // The AI reads this to know what sub-type labels to use when filling a word.
    // Stable — these don't change per level. Higher levels may add new categories
    // or finer-grained values when the level is designed.
    categoryTaxonomies: {
      noun:      ['person', 'place', 'thing', 'abstract'],
      // A2+: mass, proper, animate, inanimate become relevant for grammar rules
      verb:      ['emotional', 'cognitive', 'physical', 'communicative', 'existential'],
      // A2+: modal becomes relevant as modal verbs unlock
      adjective: ['emotional', 'evaluative', 'physical', 'relational', 'cognitive', 'temporal'],
      // adverb, preposition etc: add when their level is designed
    },

    // Which grammatical categories get composition balance enforcement at each level.
    // Updated when designing a new level — not when adding words.
    // At A1, nouns/verbs/adjectives are all numerous enough to need balance.
    // Future levels add categories as their pools grow large enough to matter.
    levelActivation: {
      A1: ['noun', 'verb', 'adjective'],
      // A2: ['noun', 'verb', 'adjective', 'adverb'],  — example
    },
  },

  register: {
    description: 'Formality level of the word — how formal or informal it is in typical use.',
    appliesTo: ['noun', 'verb', 'adjective', 'adverb'],
    values: ['formal', 'neutral', 'informal', 'slang'],
    levelActivation: {
      // Not enforced at A1 — vocabulary is too limited for register to matter yet
      // B1+: register becomes relevant as learners gain stylistic range
    },
  },

  functionGoals: {
    description: 'Learner capability goals this word contributes to. Array of goal IDs from functionGoals.en.js. The AI fills this by cross-referencing word meaning against goal definitions and semanticSignals. A word may serve multiple goals.',
    appliesTo: 'all',
    // Values are goal IDs — see FUNCTION_GOALS in functionGoals.en.js.
    // The AI reads goal definitions (label, description, semanticSignals) to
    // determine which goals a word supports.
    // Parallel to semanticSubtype: the schema defines the contract; the AI fills
    // word membership; the designer authors goal definitions and goal types.
    levelActivation: {
      // At A1, function goals are defined — AI fills word membership once wired.
      // Coverage enforcement activates alongside goal definitions per level.
      A1: true,
    },
  },
}

// ── Prototype stubs ───────────────────────────────────────────
//
// Minimal manual fill for the A1 carrier band.
// When the AI layer is live, this is the fallback for words not yet processed.
// Keep to carrier band words only.

const ATTRIBUTE_STUBS = {
  // noun — semanticSubtype + functionGoals
  friend:      { semanticSubtype: 'person',   functionGoals: ['name_and_identify'] },
  person:      { semanticSubtype: 'person',   functionGoals: ['name_and_identify'] },
  man:         { semanticSubtype: 'person',   functionGoals: ['name_and_identify'] },
  woman:       { semanticSubtype: 'person',   functionGoals: ['name_and_identify'] },
  house:       { semanticSubtype: 'place',    functionGoals: ['name_and_identify', 'navigate_and_locate'] },
  food:        { semanticSubtype: 'thing',    functionGoals: ['name_and_identify', 'express_basic_needs'] },
  water:       { semanticSubtype: 'thing',    functionGoals: ['name_and_identify', 'express_basic_needs'] },
  day:         { semanticSubtype: 'abstract', functionGoals: [] },
  time:        { semanticSubtype: 'abstract', functionGoals: [] },

  // verb — semanticSubtype + functionGoals
  want:        { semanticSubtype: 'emotional',     functionGoals: ['express_basic_needs'] },
  need:        { semanticSubtype: 'emotional',     functionGoals: ['express_basic_needs'] },
  love:        { semanticSubtype: 'emotional',     functionGoals: ['express_basic_needs'] },
  like:        { semanticSubtype: 'emotional',     functionGoals: ['express_basic_needs'] },
  feel:        { semanticSubtype: 'emotional',     functionGoals: ['express_basic_needs'] },
  know:        { semanticSubtype: 'cognitive',     functionGoals: [] },
  think:       { semanticSubtype: 'cognitive',     functionGoals: [] },
  understand:  { semanticSubtype: 'cognitive',     functionGoals: [] },
  remember:    { semanticSubtype: 'cognitive',     functionGoals: [] },
  be:          { semanticSubtype: 'existential',   functionGoals: ['express_basic_needs', 'describe_simple_qualities'] },
  have:        { semanticSubtype: 'existential',   functionGoals: ['express_basic_needs'] },
  say:         { semanticSubtype: 'communicative', functionGoals: [] },
  ask:         { semanticSubtype: 'communicative', functionGoals: ['ask_basic_questions'] },
  tell:        { semanticSubtype: 'communicative', functionGoals: [] },
  go:          { semanticSubtype: 'physical',      functionGoals: ['navigate_and_locate'] },
  come:        { semanticSubtype: 'physical',      functionGoals: ['navigate_and_locate'] },
  see:         { semanticSubtype: 'physical',      functionGoals: [] },
  get:         { semanticSubtype: 'physical',      functionGoals: [] },
  give:        { semanticSubtype: 'physical',      functionGoals: [] },
  take:        { semanticSubtype: 'physical',      functionGoals: [] },
  eat:         { semanticSubtype: 'physical',      functionGoals: ['express_basic_needs'] },
  drink:       { semanticSubtype: 'physical',      functionGoals: ['express_basic_needs'] },
  run:         { semanticSubtype: 'physical',      functionGoals: [] },
  walk:        { semanticSubtype: 'physical',      functionGoals: ['navigate_and_locate'] },

  // adjective — semanticSubtype + functionGoals
  good:        { semanticSubtype: 'evaluative', functionGoals: ['describe_simple_qualities'] },
  bad:         { semanticSubtype: 'evaluative', functionGoals: ['describe_simple_qualities'] },
  right:       { semanticSubtype: 'evaluative', functionGoals: ['describe_simple_qualities'] },
  happy:       { semanticSubtype: 'emotional',  functionGoals: ['describe_simple_qualities'] },
  sad:         { semanticSubtype: 'emotional',  functionGoals: ['describe_simple_qualities'] },
  big:         { semanticSubtype: 'physical',   functionGoals: ['describe_simple_qualities'] },
  small:       { semanticSubtype: 'physical',   functionGoals: ['describe_simple_qualities'] },
  hot:         { semanticSubtype: 'physical',   functionGoals: ['describe_simple_qualities'] },
  cold:        { semanticSubtype: 'physical',   functionGoals: ['describe_simple_qualities'] },
  fast:        { semanticSubtype: 'physical',   functionGoals: ['describe_simple_qualities'] },
  slow:        { semanticSubtype: 'physical',   functionGoals: ['describe_simple_qualities'] },
  old:         { semanticSubtype: 'temporal',   functionGoals: ['describe_simple_qualities'] },
  new:         { semanticSubtype: 'temporal',   functionGoals: ['describe_simple_qualities'] },
}

// ── Runtime cache ─────────────────────────────────────────────

const CACHE_KEY = 'lapp-word-attributes'

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function saveCache(cache) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
}

// ── Public API ────────────────────────────────────────────────

// Returns the attribute object for a word, or null if not yet filled.
// Priority: runtime cache (AI output) → stubs → null.
export function getWordAttributes(wordId) {
  const cache = loadCache()
  if (cache[wordId]) return cache[wordId]
  if (ATTRIBUTE_STUBS[wordId]) return ATTRIBUTE_STUBS[wordId]
  return null
}

// Called by the AI fill function when a word enters the pre-feeder pool.
// Merges with any existing cached attributes (AI may fill one dimension at a time).
export function setWordAttributes(wordId, attrs) {
  const cache = loadCache()
  cache[wordId] = { ...(cache[wordId] ?? {}), ...attrs }
  saveCache(cache)
}

export function hasWordAttributes(wordId) {
  return getWordAttributes(wordId) !== null
}

// Dev: clears the runtime cache. Stubs remain.
export function clearWordAttributeCache() {
  localStorage.removeItem(CACHE_KEY)
}
