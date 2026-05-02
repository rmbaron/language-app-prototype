// Word Categories — English (function words)
//
// Single source of truth for the closed-class function words of English:
// pronouns, determiners, quantifiers, coordinators, prepositions, degree
// modifiers, frequency/manner/place/time adverbs.
//
// Function words are the small, finite sets of grammatical-glue words.
// They're "closed-class" because the language doesn't add new ones — "in"
// is and will always be a preposition. Content words (nouns, lexical verbs,
// most adjectives, most adverbs) are open-class and unbounded; those live
// in the word registry (L1/L2 enrichment) or the transitional demo content
// words file (demoContentWords.en.js), not here.
//
// All unit detectors (Subject, Object, Complement, Adverbial) consume from
// this file. Per-unit detector files no longer carry their own copies.
//
// ── Derived sets ──────────────────────────────────────────────────────────
// Sets keyed by category are exported alongside the WORD_CATEGORIES map for
// callers that want fast membership checks (e.g., the AdjP detector wants
// to ask "is this a degree modifier?" without scanning the whole map).

export const WORD_CATEGORIES = {
  // ── Pronouns ───────────────────────────────────────────────────────────
  // Subject case (default 'pronoun' label — case-mismatch detection lives
  // at the atom layer, not at the shape/structure layer).
  i:    'pronoun',
  you:  'pronoun',
  he:   'pronoun',
  she:  'pronoun',
  we:   'pronoun',
  they: 'pronoun',
  it:   'pronoun',
  // Object case
  me:   'pronoun_object',
  him:  'pronoun_object',
  her:  'pronoun_object',
  us:   'pronoun_object',
  them: 'pronoun_object',

  // ── Determiners ────────────────────────────────────────────────────────
  // Articles
  a: 'determiner', an: 'determiner', the: 'determiner',
  // Demonstratives (also serve as bare pronominals when standalone — that
  // promotion happens in subject/detector.js's single-token branch)
  this: 'determiner', that: 'determiner', these: 'determiner', those: 'determiner',
  // Possessive determiners. Note: "her" is ambiguous (object pronoun OR
  // possessive determiner); the map default is pronoun_object — context
  // resolves at the unit level.
  my: 'determiner', your: 'determiner', his: 'determiner', our: 'determiner', their: 'determiner',

  // ── Quantifiers ────────────────────────────────────────────────────────
  some: 'quantifier', every: 'quantifier', each: 'quantifier', all: 'quantifier',
  no: 'quantifier', any: 'quantifier', many: 'quantifier', few: 'quantifier',
  several: 'quantifier', most: 'quantifier', both: 'quantifier',

  // ── Coordinators ───────────────────────────────────────────────────────
  and: 'coordinator', or: 'coordinator', nor: 'coordinator', but: 'coordinator',

  // ── Prepositions ───────────────────────────────────────────────────────
  in: 'preposition', on: 'preposition', at: 'preposition',
  with: 'preposition', for: 'preposition', of: 'preposition', to: 'preposition',
  from: 'preposition', by: 'preposition', about: 'preposition',
  into: 'preposition', onto: 'preposition', under: 'preposition', over: 'preposition',
  through: 'preposition', between: 'preposition', against: 'preposition',
  during: 'preposition', since: 'preposition', after: 'preposition',
  before: 'preposition', until: 'preposition', across: 'preposition',
  toward: 'preposition', towards: 'preposition', around: 'preposition',
  near: 'preposition', beside: 'preposition', beyond: 'preposition',
  behind: 'preposition', above: 'preposition', below: 'preposition',
  inside: 'preposition', outside: 'preposition', without: 'preposition',
  within: 'preposition', along: 'preposition', among: 'preposition', amid: 'preposition',

  // ── Degree modifiers ───────────────────────────────────────────────────
  // Sit before adjectives ("very happy") and adverbs ("very quickly").
  very: 'degree', quite: 'degree', extremely: 'degree', rather: 'degree',
  so: 'degree', too: 'degree', fairly: 'degree', really: 'degree',
  pretty: 'degree', somewhat: 'degree', totally: 'degree',
  completely: 'degree', absolutely: 'degree',

  // ── Adverbs (closed-class, semantically-grouped) ───────────────────────
  // Time
  yesterday: 'adverb', today: 'adverb', tomorrow: 'adverb', tonight: 'adverb',
  now: 'adverb', then: 'adverb', soon: 'adverb', recently: 'adverb',
  early: 'adverb', late: 'adverb',
  // Place
  here: 'adverb', there: 'adverb', everywhere: 'adverb', nowhere: 'adverb',
  // Frequency
  often: 'adverb', always: 'adverb', sometimes: 'adverb', never: 'adverb',
  usually: 'adverb', rarely: 'adverb', seldom: 'adverb',
  // Manner / general (a small set; most manner adverbs are -ly forms which
  // L2 enrichment will surface)
  quickly: 'adverb', slowly: 'adverb', carefully: 'adverb',
  well: 'adverb', badly: 'adverb',
}

// ── Derived membership sets ───────────────────────────────────────────────
// Computed once at module load. Useful for cheap membership checks.
function setForCategory(cat) {
  return new Set(Object.entries(WORD_CATEGORIES).filter(([, c]) => c === cat).map(([w]) => w))
}

export const PRONOUNS_SUBJECT = setForCategory('pronoun')
export const PRONOUNS_OBJECT  = setForCategory('pronoun_object')
export const DETERMINERS      = setForCategory('determiner')
export const QUANTIFIERS      = setForCategory('quantifier')
export const COORDINATORS     = setForCategory('coordinator')
export const PREPOSITIONS     = setForCategory('preposition')
export const DEGREE_MODIFIERS = setForCategory('degree')
export const ADVERBS          = setForCategory('adverb')

// Convenience lookup — preserves the original-token form (returns null
// for content words, callers fall through to their own lookups).
export function lookupCategory(token) {
  if (!token) return null
  const t = token.toLowerCase().replace(/[^\w'-]/g, '')
  return WORD_CATEGORIES[t] ?? null
}
