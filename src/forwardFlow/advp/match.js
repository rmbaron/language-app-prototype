// Shared AdvP detection — used by Adverbial (and potentially Complement
// for "He arrived first" / similar adverb-as-complement edges).
//
// AdvP v1 grammar:
//   [degree?] [adverb]
// Coverage: "quickly", "very quickly", "yesterday", "here", "often".
// Coordinated AdvPs ("quickly and carefully") are a forward-flow boundary
// signal handled at a higher layer, not in this detector.
//
// Time-NPs that function as adverbs ("yesterday", "today") are categorized
// as 'adverb' in wordCategories.en.js — same code path as manner adverbs.
// This honors the structures-first principle: one adverb structure, many
// semantic uses.

import { DEGREE_MODIFIERS } from '../wordCategories.en.js'

const isAdverb = (c) => c === 'adverb'

// Find where an AdvP ends in a token stream starting at startIdx.
// Returns endIdx (exclusive) or null when no AdvP starts there.
export function findAdvPBoundary(tokens, startIdx, getCategory) {
  if (startIdx >= tokens.length) return null

  const t0Clean = (tokens[startIdx] ?? '').toLowerCase().replace(/[^\w'-]/g, '')
  let i = startIdx

  // Optional degree modifier: very, quite, extremely, etc.
  if (DEGREE_MODIFIERS.has(t0Clean)) {
    i++
  }

  // Required head adverb.
  if (i >= tokens.length) return null
  if (!isAdverb(getCategory(tokens[i]))) return null

  return i + 1
}

// Classify an AdvP-bounded slice. Returns 'advp_basic' or null.
export function matchAdvPShape(advpTokens, getCategory) {
  if (!advpTokens || advpTokens.length === 0) return null

  // Single token: must be an adverb.
  if (advpTokens.length === 1) {
    if (isAdverb(getCategory(advpTokens[0]))) return 'advp_basic'
    return null
  }

  // Two tokens: degree + adverb.
  if (advpTokens.length === 2) {
    const t0 = (advpTokens[0] ?? '').toLowerCase().replace(/[^\w'-]/g, '')
    if (DEGREE_MODIFIERS.has(t0) && isAdverb(getCategory(advpTokens[1]))) {
      return 'advp_basic'
    }
    return null
  }

  return null
}
