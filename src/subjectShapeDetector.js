// Subject Shape Detector
//
// Given the candidate Subject text from a typed sentence, classify which
// shape it matches from the SUBJECT_SHAPES catalog.
//
// Strategy:
//   1. Tokenize the subject text on whitespace.
//   2. For each token, look up its grammatical category. Function words
//      (pronouns, determiners, quantifiers, coordinators) are resolved
//      via a small hardcoded map — these are closed-class and don't change.
//      Content words (nouns, adjectives, verbs) are resolved via the word
//      registry (which reads from seed + L1 enrichment).
//   3. Match the resulting category sequence against shape patterns.
//
// Returns: a shape id from SUBJECT_SHAPES, or null if no shape matched.

import { getAllWords } from './wordRegistry'

// Closed-class function words — hardcoded so the detector works even before
// these have been L1-enriched. The language never adds new pronouns or
// determiners, so this list is stable.
const HARDCODED_CATEGORY = {
  // Pronouns (subject + object, since people sometimes type either at first)
  i: 'pronoun', you: 'pronoun', he: 'pronoun', she: 'pronoun', we: 'pronoun', they: 'pronoun', it: 'pronoun',
  me: 'pronoun_object', him: 'pronoun_object', her: 'pronoun_object', us: 'pronoun_object', them: 'pronoun_object',

  // Determiners (articles, demonstratives, possessives)
  a: 'determiner', an: 'determiner', the: 'determiner',
  this: 'determiner', that: 'determiner', these: 'determiner', those: 'determiner',
  my: 'determiner', your: 'determiner', his: 'determiner', our: 'determiner', their: 'determiner',
  // "her" is ambiguous (object pronoun OR possessive determiner) — resolved by context, default pronoun_object

  // Quantifiers
  some: 'quantifier', every: 'quantifier', each: 'quantifier', all: 'quantifier',
  no: 'quantifier', any: 'quantifier', many: 'quantifier', few: 'quantifier',
  several: 'quantifier', most: 'quantifier', both: 'quantifier',

  // Coordinators
  and: 'coordinator', or: 'coordinator', nor: 'coordinator',

  // Common nouns — hardcoded so the detector works for testing without
  // needing every word to be L1-enriched first. The wordRegistry remains
  // the canonical source once enrichment runs; this is a fallback.
  dog: 'noun', dogs: 'noun', cat: 'noun', cats: 'noun',
  food: 'noun', water: 'noun', tea: 'noun', coffee: 'noun', juice: 'noun',
  milk: 'noun', bread: 'noun', rice: 'noun', apple: 'noun', apples: 'noun',
  egg: 'noun', eggs: 'noun', book: 'noun', books: 'noun',
  car: 'noun', cars: 'noun', bike: 'noun', phone: 'noun',
  house: 'noun', houses: 'noun', room: 'noun', school: 'noun',
  work: 'noun', music: 'noun', name: 'noun', help: 'noun',
  ticket: 'noun', tickets: 'noun', bag: 'noun', money: 'noun',
  family: 'noun', friend: 'noun', friends: 'noun',
  man: 'noun', woman: 'noun', men: 'noun', women: 'noun',
  boy: 'noun', boys: 'noun', girl: 'noun', girls: 'noun',
  child: 'noun', children: 'noun', baby: 'noun', babies: 'noun',
  mother: 'noun', father: 'noun', person: 'noun', people: 'noun',
  fish: 'noun', bird: 'noun', birds: 'noun',
  home: 'noun', city: 'noun', street: 'noun', country: 'noun',
  morning: 'noun', night: 'noun',

  // Common adjectives — same fallback rationale.
  good: 'adjective', bad: 'adjective', big: 'adjective', small: 'adjective',
  happy: 'adjective', sad: 'adjective', hot: 'adjective', cold: 'adjective',
  new: 'adjective', old: 'adjective', long: 'adjective', short: 'adjective',
  young: 'adjective', warm: 'adjective', easy: 'adjective',
  fast: 'adjective', slow: 'adjective', angry: 'adjective', tired: 'adjective',
  hungry: 'adjective', sick: 'adjective', busy: 'adjective',
  right: 'adjective', wrong: 'adjective', nice: 'adjective', beautiful: 'adjective',
  red: 'adjective', blue: 'adjective', green: 'adjective', yellow: 'adjective',
  black: 'adjective', white: 'adjective', gray: 'adjective', brown: 'adjective',
  orange: 'adjective', pink: 'adjective', purple: 'adjective',
}

// Build a lookup of seeded/enriched words → category.
// Memoized at module load so subsequent calls are cheap.
let registryByForm = null
function buildRegistry() {
  if (registryByForm) return registryByForm
  registryByForm = new Map()
  try {
    const all = getAllWords('en')
    for (const w of all) {
      if (!w?.baseForm) continue
      registryByForm.set(w.baseForm.toLowerCase(), w)
    }
  } catch {
    // Registry not available — detector falls back to hardcoded only
  }
  return registryByForm
}

function getWordCategory(token) {
  const t = token.toLowerCase().replace(/[^\w'-]/g, '')
  if (!t) return null
  if (HARDCODED_CATEGORY[t]) return HARDCODED_CATEGORY[t]
  const w = buildRegistry().get(t)
  if (!w) return null
  // The registry's category field might be grammaticalAtom or grammaticalCategory;
  // try both. Atom is more specific (e.g., "noun_person"); category is broader.
  return w.grammaticalAtom ?? w.grammaticalCategory ?? null
}

// Heuristic: is this token an -ing form (potential gerund)?
function looksLikeGerund(token) {
  const t = token.toLowerCase()
  return t.length > 4 && t.endsWith('ing')
}

// Heuristic: is this token a proper noun? (capitalized non-pronoun-non-determiner)
function looksLikeProperNoun(rawToken) {
  if (!rawToken) return false
  const cleaned = rawToken.replace(/[^\w'-]/g, '')
  if (!cleaned) return false
  // Capitalized + not in our hardcoded function-word list
  if (cleaned[0] !== cleaned[0].toUpperCase()) return false
  if (cleaned[0] === cleaned[0].toLowerCase()) return false  // non-letter
  if (HARDCODED_CATEGORY[cleaned.toLowerCase()]) return false
  // If the registry has it as a known noun, prefer that classification
  const reg = buildRegistry().get(cleaned.toLowerCase())
  if (reg && reg.grammaticalCategory && reg.grammaticalCategory !== 'noun_person') {
    // If registry already classifies it as a non-name, trust that
    return false
  }
  return true
}

// Returns: shape id (string) or null
export function detectSubjectShape(subjectText) {
  if (!subjectText || !subjectText.trim()) return null
  const rawTokens = subjectText.trim().split(/\s+/).filter(Boolean)
  if (rawTokens.length === 0) return null

  const categories = rawTokens.map(getWordCategory)

  // ── Single-token shapes ────────────────────────────────────────────────
  if (rawTokens.length === 1) {
    const c = categories[0]
    if (c === 'pronoun' || c === 'pronoun_object') return 'pronoun'
    if (looksLikeProperNoun(rawTokens[0])) return 'proper_noun'
    if (c === 'noun' || (c && c.startsWith('noun'))) return 'bare_noun'
    if (looksLikeGerund(rawTokens[0])) return 'gerund'
    return null
  }

  // ── Multi-token shapes ─────────────────────────────────────────────────

  // Coordinated: contains a coordinator somewhere in the middle
  const coordIdx = categories.findIndex(c => c === 'coordinator')
  if (coordIdx > 0 && coordIdx < categories.length - 1) {
    return 'coordinated'
  }

  // Helper: is the category-string a noun-ish category?
  const isNoun = (c) => c === 'noun' || (c && c.startsWith('noun'))

  // Quantifier-led: starts with quantifier, ends with noun, middle (if any)
  // are adjectives. So "some people", "some happy dogs", "all small fish".
  if (categories[0] === 'quantifier') {
    if (categories.length === 1) return null  // bare "some" — incomplete
    const last = categories[categories.length - 1]
    const middle = categories.slice(1, -1)
    const middleAreAdj = middle.length === 0 || middle.every(c => c === 'adjective')
    if (isNoun(last) && middleAreAdj) {
      return 'quantifier_led'
    }
  }

  // Determiner-led: starts with determiner
  if (categories[0] === 'determiner') {
    if (categories.length === 2 && isNoun(categories[1])) {
      return 'det_noun'
    }
    const last = categories[categories.length - 1]
    const middle = categories.slice(1, -1)
    const middleAreAdj = middle.length > 0 && middle.every(c => c === 'adjective')
    if (isNoun(last) && middleAreAdj) {
      return 'det_adj_noun'
    }
  }

  // Bare noun (no opener): adjective(s) followed by a noun.
  // The single-token noun case ("Water", "Dogs") is handled in the
  // single-token branch above. This handles "Cold water", "Tired children".
  if (categories.length >= 2) {
    const last = categories[categories.length - 1]
    const allButLast = categories.slice(0, -1)
    const allButLastAreAdj = allButLast.length > 0 && allButLast.every(c => c === 'adjective')
    if (isNoun(last) && allButLastAreAdj) {
      return 'bare_noun'
    }
  }

  return null
}

// A/An agreement check.
// Returns null (no issue), or a warning string explaining the mismatch.
// Simple letter-based check: "a" before consonant letter, "an" before vowel
// letter. This catches the easy 95% of cases; the trickier sound-based cases
// ("an hour", "a university") would need pronunciation data and are deferred.
const VOWEL_LETTERS = new Set(['a', 'e', 'i', 'o', 'u'])

export function checkArticleAgreement(subjectText) {
  if (!subjectText || !subjectText.trim()) return null
  const tokens = subjectText.trim().split(/\s+/).filter(Boolean)
  if (tokens.length < 2) return null
  const t0 = tokens[0].toLowerCase().replace(/[^\w]/g, '')
  if (t0 !== 'a' && t0 !== 'an') return null
  const t1 = tokens[1].toLowerCase().replace(/[^\w]/g, '')
  if (!t1) return null
  const startsWithVowel = VOWEL_LETTERS.has(t1[0])
  if (t0 === 'a' && startsWithVowel) {
    return `"a ${tokens[1]}" — try "an ${tokens[1]}" (next word starts with a vowel letter)`
  }
  if (t0 === 'an' && !startsWithVowel) {
    return `"an ${tokens[1]}" — try "a ${tokens[1]}" (next word starts with a consonant letter)`
  }
  return null
}

// Heuristic: is the noun in a candidate Subject plural?
// Returns 'singular' | 'plural' | 'unknown'.
// Rough rule: ends in -s and length > 3 → plural; ends in -es/-ies → plural.
// Doesn't catch irregulars (men, children, fish) yet — would need L2 forms.
export function detectNounNumber(subjectText) {
  if (!subjectText || !subjectText.trim()) return 'unknown'
  const tokens = subjectText.trim().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return 'unknown'
  // The noun is typically the last content token.
  const last = tokens[tokens.length - 1].toLowerCase().replace(/[^\w'-]/g, '')
  if (!last) return 'unknown'
  if (last.length > 3 && (last.endsWith('s') || last.endsWith('es'))) return 'plural'
  if (last.endsWith('ies')) return 'plural'
  return 'singular'
}
