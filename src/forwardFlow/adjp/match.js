// Shared AdjP detection — used by Complement (and later Adverbial when
// AdjP-as-adjunct lands).
//
// AdjP v1 is intentionally minimal:
//   [degree?] [adjective]
// Coverage: "happy", "very happy", "extremely tired", "quite happy".
// PP complement ("happy with the result") and coordinated AdjPs
// ("happy and tired") are structural extensions handled elsewhere — the
// operations layer or a forward-flow boundary signal (next-token "and").
//
// Callers pass their own getCategory function so the detector stays pure.
// Degree modifiers are a closed class — sourced from wordCategories.en.js.

import { DEGREE_MODIFIERS } from '../wordCategories.en.js'
export { DEGREE_MODIFIERS }

const isAdjective = (c) => c === 'adjective'

// Find where an AdjP ends in a token stream starting at startIdx.
// Returns endIdx (exclusive) or null when no AdjP starts there.
//
// v1 grammar:
//   [degree]? [adjective]
// Where [degree] is one token from DEGREE_MODIFIERS.
export function findAdjPBoundary(tokens, startIdx, getCategory) {
  if (startIdx >= tokens.length) return null

  const t0Clean = (tokens[startIdx] ?? '').toLowerCase().replace(/[^\w'-]/g, '')
  let i = startIdx

  // Optional degree modifier: very, quite, extremely, etc.
  if (DEGREE_MODIFIERS.has(t0Clean)) {
    i++
  }

  // Required head adjective.
  if (i >= tokens.length) return null
  if (!isAdjective(getCategory(tokens[i]))) return null

  return i + 1
}

// Classify an AdjP-bounded slice. Returns 'adjp_basic' or null.
// Pure structural classifier — caller passes the slice it wants checked.
export function matchAdjPShape(adjpTokens, getCategory) {
  if (!adjpTokens || adjpTokens.length === 0) return null

  // Single token: must be an adjective.
  if (adjpTokens.length === 1) {
    if (isAdjective(getCategory(adjpTokens[0]))) return 'adjp_basic'
    return null
  }

  // Two tokens: degree + adjective.
  if (adjpTokens.length === 2) {
    const t0 = (adjpTokens[0] ?? '').toLowerCase().replace(/[^\w'-]/g, '')
    if (DEGREE_MODIFIERS.has(t0) && isAdjective(getCategory(adjpTokens[1]))) {
      return 'adjp_basic'
    }
    return null
  }

  // Longer slices not handled by v1 (would need PP-complement / coordination logic).
  return null
}
