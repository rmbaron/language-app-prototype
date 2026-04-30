// Grammar Breaker — Pattern Registry (aggregator)
//
// Bottom-up micro-pattern library used by the grammar circuit breaker.
// The validator's job is not to match a sentence to a template — it scans
// the token stream, detects every micro-pattern that fires, and asks the
// licenser whether each fired pattern is allowed under the learner's
// active atom set.
//
// Patterns are split across files in src/grammarPatterns/ for readability.
// This file imports them all, validates each record, and exports the live
// registry. To add a pattern: pick the right file under grammarPatterns/
// and append to its array.
//
// Pattern shape:
//   {
//     id:          string             unique
//     group:       string             curatorial cluster (legacy field)
//     description: string             human-readable
//     type:        'morphology'|'bigram'|'trigram'|'boundary'
//     coupling:    string             which Level-3 micro-structure it implements
//     detector:    (tokens) => match[] each match: { span: [i,j], info? }
//     license:     {
//       requiresAtoms?:   string[]     all listed atoms must be in activeAtoms
//       alwaysForbidden?: boolean      never allowed (above-A1 morphology, etc.)
//     }
//     detectsAtoms?: string[]          atoms the detector inspects internally
//                                      (used by the dev-panel Flow tab on
//                                      forbidden patterns that have no
//                                      requiresAtoms)
//   }
//
// Detectors return raw match structs with token-index spans. They never
// decide licensing — the licenser handles that, so toggles can disable a
// fired pattern without changing detection logic.

import { COUPLINGS_BY_ID } from './grammarBreakerCouplings'

import clausePatterns       from './grammarPatterns/clausePatterns'
import nounPhrasePatterns   from './grammarPatterns/nounPhrasePatterns'
import verbChainPatterns    from './grammarPatterns/verbChainPatterns'
import adverbialPatterns    from './grammarPatterns/adverbialPatterns'
import connectorPatterns    from './grammarPatterns/connectorPatterns'
import pronominalPatterns   from './grammarPatterns/pronominalPatterns'
import morphologyPatterns   from './grammarPatterns/morphologyPatterns'

// ── Pattern types (taxonomy) ────────────────────────────────────────────────
// The categories patterns are sorted into by their `type` field. This taxonomy
// was chosen to match four distinct *kinds of evidence* a sentence can carry:
// what one word IS (morphology), what two words PAIR (bigram), what a SHORT
// CHUNK forms (trigram), and where a feature SITS (boundary). The taxonomy is
// not load-bearing — patterns are looked up by id at validation time, and
// `type` is metadata used only for browsing and (eventually) display grouping.
// If a different cut works better, swap the type strings; nothing breaks.
export const PATTERN_TYPES = [
  {
    id: 'morphology',
    label: 'Morphology',
    definition:
      "A pattern that fires on the FORM of a single word — its inflection. The detector inspects one token's surface string or its form-type tag (past, past_participle, present_participle, plural, etc.). Used to flag features like the -ed past, -ing progressive, possessive 's. The pattern is a property of one token; position relative to other tokens does not matter.",
  },
  {
    id: 'bigram',
    label: 'Bigram',
    definition:
      'A pattern over TWO adjacent tokens. Fires when token N carries one atom and token N+1 carries another (e.g. personal_pronoun + lexical_verb → "I eat"). Captures basic clause shapes and direct-modifier relations. Adjacency is required — non-adjacent pairs are not detected by bigram patterns.',
  },
  {
    id: 'trigram',
    label: 'Trigram',
    definition:
      'A pattern over a SHORT SEQUENCE of 2–3 adjacent tokens that together form a single structural chunk. Used for constructions where a multi-token unit fills one role — e.g. a prepositional phrase: preposition + (determiner) + noun, "in school" or "in the park". The detector handles variable length when an interior token is optional.',
  },
  {
    id: 'boundary',
    label: 'Boundary',
    definition:
      'A pattern that depends on WHERE a token sits in the sentence — first non-punctuation token, or last. Used for constructs whose meaning is positional (sentence-initial auxiliary signals a yes/no question; sentence-final preposition is wrong at A1; sentence ending in ? marks an interrogative).',
  },
]

export const PATTERN_TYPES_BY_ID = Object.fromEntries(PATTERN_TYPES.map(t => [t.id, t]))

// ── Aggregate the raw pattern list ──────────────────────────────────────────
const _RAW_PATTERNS = [
  ...clausePatterns,
  ...nounPhrasePatterns,
  ...verbChainPatterns,
  ...adverbialPatterns,
  ...connectorPatterns,
  ...pronominalPatterns,
  ...morphologyPatterns,
]

// ── Validation ──────────────────────────────────────────────────────────────
//
// Every pattern record is validated at module load. Invalid records are
// excluded from the live PATTERNS export and surfaced via INVALID_PATTERNS
// so the dev panel can show them.
//
// Required fields:
//   id        — non-empty string, unique across all patterns
//   group     — non-empty string
//   type      — must match a PATTERN_TYPES id
//   coupling  — must match a COUPLINGS id
//   detector  — must be a function
//   license   — must be an object with at least one rule:
//               { alwaysForbidden: true } OR { requiresAtoms: [non-empty array] }
// Optional:
//   description    — string used by the dev panel
//   detectsAtoms   — string[] used by the Flow tab for forbidden patterns

const VALID_TYPE_IDS = new Set(PATTERN_TYPES.map(t => t.id))

function validatePatternRecord(p, seenIds) {
  const errors = []
  if (!p || typeof p !== 'object') return ['record is not an object']
  if (typeof p.id !== 'string' || !p.id) errors.push('missing or empty id')
  else if (seenIds.has(p.id))            errors.push(`duplicate id "${p.id}"`)
  if (typeof p.group !== 'string' || !p.group) errors.push('missing or empty group')
  if (typeof p.type !== 'string' || !p.type)   errors.push('missing or empty type')
  else if (!VALID_TYPE_IDS.has(p.type))        errors.push(`type "${p.type}" not in PATTERN_TYPES`)
  if (typeof p.coupling !== 'string' || !p.coupling) errors.push('missing or empty coupling')
  else if (!COUPLINGS_BY_ID[p.coupling])             errors.push(`coupling "${p.coupling}" not in COUPLINGS`)
  if (typeof p.detector !== 'function')        errors.push('detector must be a function')
  if (!p.license || typeof p.license !== 'object') {
    errors.push('license must be an object')
  } else {
    const hasForbidden = p.license.alwaysForbidden === true
    const hasRequires  = Array.isArray(p.license.requiresAtoms) && p.license.requiresAtoms.length > 0
    if (!hasForbidden && !hasRequires) {
      errors.push('license must have alwaysForbidden=true or non-empty requiresAtoms')
    }
  }
  return errors
}

// Run the validation pass once at module load.
const _validated = []
const _invalid   = []
const _seenIds   = new Set()
for (const p of _RAW_PATTERNS) {
  const errors = validatePatternRecord(p, _seenIds)
  if (errors.length === 0) {
    _validated.push(p)
    _seenIds.add(p.id)
  } else {
    const label = (p && typeof p === 'object' && p.id) ? p.id : '<unknown>'
    console.error(`[grammarBreakerPatterns] skipping "${label}": ${errors.join('; ')}`)
    _invalid.push({ id: (p && typeof p === 'object' ? p.id : null) ?? null, errors, raw: p })
  }
}

// Live exports — consumers see only validated patterns.
export const PATTERNS         = _validated
export const INVALID_PATTERNS = _invalid

// ── Pattern lookup ──────────────────────────────────────────────────────────

export const PATTERNS_BY_ID = Object.fromEntries(PATTERNS.map(p => [p.id, p]))

// Returns the unique set of group IDs in pattern declaration order.
export function getAllGroups() {
  const seen = []
  const set = new Set()
  for (const p of PATTERNS) {
    if (!set.has(p.group)) { set.add(p.group); seen.push(p.group) }
  }
  return seen
}
