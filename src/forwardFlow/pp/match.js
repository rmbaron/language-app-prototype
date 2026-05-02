// Shared PP detection — used by Complement and (later) Adverbial.
//
// PP = preposition + NP. Reuses np/match.js's findNPBoundary internally so
// PP detection stays compositional, not enumerated.
//
// Callers pass their own getCategory and looksLikeProperNoun (the NP
// detector's parameters), keeping this module pure.

import { findNPBoundary } from '../np/match'
import { PREPOSITIONS } from '../wordCategories.en.js'

// Re-export for callers that want the closed-class set directly.
export { PREPOSITIONS }

function isPreposition(token, getCategory) {
  const t = (token ?? '').toLowerCase().replace(/[^\w'-]/g, '')
  if (!t) return false
  if (getCategory(token) === 'preposition') return true
  return PREPOSITIONS.has(t)
}

// Find where a PP ends in a token stream starting at startIdx.
// Returns endIdx (exclusive) or null when no PP starts there.
//
// v1 grammar:
//   [preposition] [NP]
export function findPPBoundary(tokens, startIdx, getCategory, looksLikeProperNoun) {
  if (startIdx >= tokens.length) return null
  if (!isPreposition(tokens[startIdx], getCategory)) return null

  const npStart = startIdx + 1
  const npEnd = findNPBoundary(tokens, npStart, getCategory, looksLikeProperNoun)
  if (npEnd == null) return null

  return npEnd
}

// Classify a PP-bounded slice. Returns 'pp_basic' or null.
export function matchPPShape(ppTokens, getCategory, looksLikeProperNoun) {
  if (!ppTokens || ppTokens.length < 2) return null
  if (!isPreposition(ppTokens[0], getCategory)) return null

  // Verify the rest is a valid NP.
  const npEnd = findNPBoundary(ppTokens.slice(1), 0, getCategory, looksLikeProperNoun)
  if (npEnd === ppTokens.length - 1) return 'pp_basic'

  return null
}
