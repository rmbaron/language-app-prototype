// Shared NP detection — used by Subject and Object detectors.
//
// Both units classify noun-phrase token slices using identical logic:
//   bare_pronominal | proper_noun | np_basic | coordinated
// The differences live in each unit's category map (subject favors
// subject-case pronouns, object favors object-case) and proper-noun filter,
// not in the NP classification itself. So this module exports the pure
// NP machinery; callers pass their own category and proper-noun functions.
//
// When the operations layer eventually lands, coordination (and partitive,
// post-modifier) move out of matchNPShape's return values into separate
// signals detected at NP boundaries. For now coordination stays as a
// returned shape id, matching the catalog's cross_family holding pen.
//
// ── Public API ────────────────────────────────────────────────────────────
//   isNoun(category)               — category-string predicate
//   looksLikeProperNounByForm(tok) — capitalization check; callers add
//                                    their own "is this a function word?"
//                                    filter on top
//   matchNPShape(tokens, getCategory, looksLikeProperNoun)
//                                  — classify an NP slice
//   findNPBoundary(tokens, startIdx, getCategory, looksLikeProperNoun)
//                                  — find where an NP ends in a stream

export const isNoun = (category) =>
  category === 'noun' || (category && category.startsWith('noun'))

// Pure form check — first letter capitalized, rest is a word. Callers
// combine this with their own function-word check for the full filter.
export function looksLikeProperNounByForm(rawToken) {
  if (!rawToken) return false
  const cleaned = rawToken.replace(/[^\w'-]/g, '')
  if (!cleaned) return false
  if (cleaned[0] !== cleaned[0].toUpperCase()) return false
  if (cleaned[0] === cleaned[0].toLowerCase()) return false  // non-letter
  return true
}

// Match an NP-bounded slice to a shape id.
// Returns: 'bare_pronominal' | 'proper_noun' | 'np_basic' | 'coordinated' | null
export function matchNPShape(npTokens, getCategory, looksLikeProperNoun) {
  if (!npTokens || npTokens.length === 0) return null
  const cats = npTokens.map(getCategory)

  // Coordinated: contains a coordinator in the middle.
  const coordIdx = cats.findIndex(c => c === 'coordinator')
  if (coordIdx > 0 && coordIdx < cats.length - 1) return 'coordinated'

  if (npTokens.length === 1) {
    const c = cats[0]
    if (c === 'pronoun_object' || c === 'pronoun') return 'bare_pronominal'
    if (looksLikeProperNoun(npTokens[0])) return 'proper_noun'
    if (isNoun(c)) return 'np_basic'
    return null
  }

  // np_basic — single shape covering all NP variants:
  //   [determiner|quantifier]? [adjective(s)]? [noun]
  const first = cats[0]
  const last  = cats[cats.length - 1]
  if (isNoun(last)) {
    const opener = first === 'determiner' || first === 'quantifier'
    const middleStart = opener ? 1 : 0
    const middle = cats.slice(middleStart, -1)
    const middleAllAdj = middle.length === 0 || middle.every(c => c === 'adjective')
    if (middleAllAdj && (opener || middle.length > 0)) {
      return 'np_basic'
    }
  }

  return null
}

// Find where an NP ends in a token stream starting at startIdx.
// Returns endIdx (exclusive) or null when no NP starts there.
//
// Greedy v1: handles pronoun, proper noun, bare noun, det/quant + adj* + noun,
// adj+ noun, and NP coord NP (consumed greedily as one NP).
export function findNPBoundary(tokens, startIdx, getCategory, looksLikeProperNoun) {
  if (startIdx >= tokens.length) return null
  const cat0 = getCategory(tokens[startIdx])

  let endIdx = null

  // Pronoun: single-token NP.
  if (cat0 === 'pronoun_object' || cat0 === 'pronoun') {
    endIdx = startIdx + 1
  }
  // Determiner / quantifier-led: take opener, then adj*, then noun.
  else if (cat0 === 'determiner' || cat0 === 'quantifier') {
    let i = startIdx + 1
    while (i < tokens.length && getCategory(tokens[i]) === 'adjective') i++
    if (i < tokens.length && isNoun(getCategory(tokens[i]))) endIdx = i + 1
  }
  // Adjective-led bare noun: adj+ noun.
  else if (cat0 === 'adjective') {
    let i = startIdx + 1
    while (i < tokens.length && getCategory(tokens[i]) === 'adjective') i++
    if (i < tokens.length && isNoun(getCategory(tokens[i]))) endIdx = i + 1
  }
  // Bare noun directly.
  else if (isNoun(cat0)) {
    endIdx = startIdx + 1
  }
  // Capitalized non-function token: proper noun.
  else if (looksLikeProperNoun(tokens[startIdx])) {
    endIdx = startIdx + 1
  }

  if (endIdx == null) return null

  // Coordination extension: NP coord NP → consume both as one NP.
  if (endIdx < tokens.length && getCategory(tokens[endIdx]) === 'coordinator') {
    const nextEnd = findNPBoundary(tokens, endIdx + 1, getCategory, looksLikeProperNoun)
    if (nextEnd != null) return nextEnd
  }

  return endIdx
}
