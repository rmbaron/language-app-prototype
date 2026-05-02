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

import { matchNPShape } from '../../np/match'
import { getCategory, looksLikeProperNoun } from '../../categoryLookup'

// getWordCategory kept as the local alias — existing call sites use it.
const getWordCategory = getCategory

// Heuristic: is this token an -ing form (potential gerund)?
// Subject-specific (the only unit that detects gerund forms today).
function looksLikeGerund(token) {
  const t = token.toLowerCase()
  return t.length > 4 && t.endsWith('ing')
}

// Returns: shape id (string) or null
export function detectSubjectShape(subjectText) {
  if (!subjectText || !subjectText.trim()) return null
  const rawTokens = subjectText.trim().split(/\s+/).filter(Boolean)
  if (rawTokens.length === 0) return null

  // Subject-only single-token pre-checks: standalone demonstratives and
  // gerund (-ing) forms. These run BEFORE the shared NP classifier because:
  //   • this/that/these/those carry 'determiner' in HARDCODED_CATEGORY
  //     (more often determiners) but are pronominal when standalone
  //   • capitalized -ing form ("Swimming") would be misclassified as a
  //     proper noun by the form-based check
  if (rawTokens.length === 1) {
    const t0 = rawTokens[0].toLowerCase().replace(/[^\w]/g, '')
    if (t0 === 'this' || t0 === 'that' || t0 === 'these' || t0 === 'those') return 'bare_pronominal'
    if (looksLikeGerund(rawTokens[0])) return 'gerund_phrase'
  }

  // Shared NP classifier — handles bare_pronominal, proper_noun, np_basic,
  // coordinated. Same logic Object's detector uses.
  const npShape = matchNPShape(rawTokens, getWordCategory, looksLikeProperNoun)
  if (npShape) return npShape

  // Subject-only fallback: infinitive ("To err is human"). Validating that
  // the word after "to" is actually a verb is future work.
  if (rawTokens.length >= 2) {
    const t0 = rawTokens[0].toLowerCase().replace(/[^\w]/g, '')
    if (t0 === 'to') {
      const t1 = rawTokens[1].toLowerCase().replace(/[^\w'-]/g, '')
      if (t1.length > 0 && /^[a-z]+$/.test(t1)) {
        return 'infinitive_phrase'
      }
    }
  }

  // np_with_postmodifier, partitive, for_to_infinitive, clausal_subject —
  // catalog-only in v1. Detection branches land alongside the operations
  // layer + clausal-subject infrastructure.

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

// ── Subject-Verb linking ────────────────────────────────────────────────────
//
// Once a Subject is identified, its features (person, number) determine
// what verb form should follow. This is the central hand-off from the
// Subject layer to the Verb layer in the forward-momentum pipeline.
//
// Returns: { person: '1st'|'2nd'|'3rd', number: 'singular'|'plural'|'unknown' }
// or null when the subject text/shape can't yield features.

const PRONOUN_FEATURES = {
  i:    { person: '1st', number: 'singular' },
  you:  { person: '2nd', number: 'unknown'  }, // syncretic — same form for sg & pl
  he:   { person: '3rd', number: 'singular' },
  she:  { person: '3rd', number: 'singular' },
  it:   { person: '3rd', number: 'singular' },
  we:   { person: '1st', number: 'plural'   },
  they: { person: '3rd', number: 'plural'   },
}

// Quantifiers that imply singular vs. plural agreement, when they're the head.
// "every child", "each student" → 3rd singular
// "some people", "all dogs", "many fish" → 3rd plural (usually paired with plural noun)
const QUANTIFIER_HEAD_NUMBER = {
  every: 'singular',
  each:  'singular',
  no:    'singular', // "no one is here" — usually singular by convention
  some:  'plural',
  all:   'plural',
  many:  'plural',
  few:   'plural',
  several: 'plural',
  most:  'plural',
  any:   'unknown', // depends on the noun ("any dog" sg / "any dogs" pl)
}

export function computeSubjectFeatures(subjectText, shape) {
  if (!subjectText || !shape) return null
  const normalized = subjectText.trim().toLowerCase()
  const tokens = normalized.split(/\s+/).filter(Boolean).map(t => t.replace(/[^\w'-]/g, ''))

  switch (shape) {
    case 'bare_pronominal': {
      const lookup = PRONOUN_FEATURES[tokens[0]]
      if (lookup) return lookup
      // Demonstrative pronominals: this/that → singular, these/those → plural.
      if (tokens[0] === 'this' || tokens[0] === 'that')   return { person: '3rd', number: 'singular' }
      if (tokens[0] === 'these' || tokens[0] === 'those') return { person: '3rd', number: 'plural'   }
      return { person: '3rd', number: 'unknown' }
    }
    case 'proper_noun':
    case 'gerund_phrase':
    case 'infinitive_phrase':
    case 'for_to_infinitive':
    case 'clausal_subject':
      return { person: '3rd', number: 'singular' }
    case 'coordinated': {
      // "and" → plural; "or" → nearer-conjunct (placeholder: singular).
      const hasAnd = tokens.includes('and')
      return { person: '3rd', number: hasAnd ? 'plural' : 'singular' }
    }
    case 'np_basic': {
      // Quantifier-led NP carries agreement nuance: "every child" singular,
      // "all dogs" plural. Plural noun overrides the quantifier default.
      const first = tokens[0]
      const qNum = QUANTIFIER_HEAD_NUMBER[first]
      const nounNum = detectNounNumber(subjectText)
      if (qNum) {
        const number = nounNum === 'plural' ? 'plural' : qNum
        return { person: '3rd', number }
      }
      return { person: '3rd', number: nounNum }
    }
    case 'np_with_postmodifier':
    case 'partitive':
      // Catalog-only shapes; agreement falls back to the head/post-of NP.
      return { person: '3rd', number: detectNounNumber(subjectText) }
    default:
      return null
  }
}

// Given subject features, what verb-agreement pattern is expected?
// This describes what the Verb slot should look like when filled.
export function expectedVerbAgreement(features) {
  if (!features) return null
  const { person, number } = features

  // 3rd person singular present is the only English verb form that takes -s.
  // Every other person/number combination uses the base form.
  if (person === '3rd' && number === 'singular') {
    return {
      label:    '3rd person singular',
      pattern:  '-s ending (present)',
      examples: ['runs', 'eats', 'is', 'has', 'does', 'goes'],
      hint:     'present-tense verb takes -s; for be/have/do use is/has/does.',
    }
  }
  if (person === '1st' && number === 'singular') {
    return {
      label:    '1st person singular',
      pattern:  'base form (present)',
      examples: ['run', 'eat', 'am', 'have', 'do'],
      hint:     'present-tense verb is base form; for be/have/do use am/have/do.',
    }
  }
  // 2nd singular, 2nd plural, 1st plural, 3rd plural all share the base form.
  return {
    label:    `${person} person ${number}`,
    pattern:  'base form (present)',
    examples: ['run', 'eat', 'are', 'have', 'do'],
    hint:     'present-tense verb is base form; for be/have/do use are/have/do.',
  }
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
