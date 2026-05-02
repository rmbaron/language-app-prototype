// Object Shape Detector
//
// Given the post-verb tokens and the matched verb's frame, classify the
// Object filler(s) into shape ids from OBJECT_SHAPES.
//
// Frame dispatch is keyed on slots.join(''), e.g. 'SVO', 'SVOO', 'SVOA'.
// Object owns SVOO (two-NP extraction) but only marks a *boundary* in
// SVOC/SVOA — the remainder is handed to the Complement/Adverbial unit
// untouched.
//
// ── Output schema ────────────────────────────────────────────────────────
//   {
//     frame:     string ('SV' | 'SVO' | 'SVOO' | ...) | null,
//     objects:   [{ shape, role: 'direct'|'indirect', tokens, startIdx, endIdx }],
//     remainder: { tokens, startIdx } | null,
//     expected:  { count, pattern },
//     mismatch:  { kind, ... } | null,
//   }
//
// detectObjectShape(postVerbTokens, frame) → analysis or null

import { matchNPShape, findNPBoundary } from '../../np/match'
import { getCategory, looksLikeProperNoun } from '../../categoryLookup'

// ── Frame extractors ─────────────────────────────────────────────────────
function extractZeroObject(postVerbTokens, frameKey) {
  return {
    frame: frameKey,
    objects: [],
    remainder: postVerbTokens.length > 0
      ? { tokens: postVerbTokens, startIdx: 0 }
      : null,
    expected: { count: 0, pattern: frameKey },
    mismatch: null,
  }
}

function extractOneObject(postVerbTokens, frameKey) {
  const npEnd = findNPBoundary(postVerbTokens, 0, getCategory, looksLikeProperNoun)
  if (npEnd == null) {
    return {
      frame: frameKey,
      objects: [],
      remainder: postVerbTokens.length > 0
        ? { tokens: postVerbTokens, startIdx: 0 }
        : null,
      expected: { count: 1, pattern: frameKey },
      mismatch: { kind: 'no-object-found', detail: 'expected a noun phrase after the verb' },
    }
  }
  const npTokens = postVerbTokens.slice(0, npEnd)
  const shape = matchNPShape(npTokens, getCategory, looksLikeProperNoun)
  const remainderTokens = postVerbTokens.slice(npEnd)
  return {
    frame: frameKey,
    objects: [{ shape, role: 'direct', tokens: npTokens, startIdx: 0, endIdx: npEnd }],
    remainder: remainderTokens.length > 0
      ? { tokens: remainderTokens, startIdx: npEnd }
      : null,
    expected: { count: 1, pattern: frameKey },
    mismatch: shape == null ? { kind: 'np-shape-unknown' } : null,
  }
}

function extractTwoObjects(postVerbTokens, frameKey) {
  const npEnd1 = findNPBoundary(postVerbTokens, 0, getCategory, looksLikeProperNoun)
  if (npEnd1 == null) {
    return {
      frame: frameKey,
      objects: [],
      remainder: postVerbTokens.length > 0
        ? { tokens: postVerbTokens, startIdx: 0 }
        : null,
      expected: { count: 2, pattern: frameKey },
      mismatch: { kind: 'no-object-found' },
    }
  }
  const np1 = postVerbTokens.slice(0, npEnd1)
  const shape1 = matchNPShape(np1, getCategory, looksLikeProperNoun)

  const npEnd2 = findNPBoundary(postVerbTokens, npEnd1, getCategory, looksLikeProperNoun)
  if (npEnd2 == null) {
    return {
      frame: frameKey,
      objects: [{ shape: shape1, role: 'direct', tokens: np1, startIdx: 0, endIdx: npEnd1 }],
      remainder: postVerbTokens.length > npEnd1
        ? { tokens: postVerbTokens.slice(npEnd1), startIdx: npEnd1 }
        : null,
      expected: { count: 2, pattern: frameKey },
      mismatch: { kind: 'second-object-missing', detail: 'ditransitive frame expects two objects' },
    }
  }
  const np2 = postVerbTokens.slice(npEnd1, npEnd2)
  const shape2 = matchNPShape(np2, getCategory, looksLikeProperNoun)
  const remainderTokens = postVerbTokens.slice(npEnd2)
  return {
    frame: frameKey,
    objects: [
      { shape: shape1, role: 'indirect', tokens: np1, startIdx: 0,       endIdx: npEnd1 },
      { shape: shape2, role: 'direct',   tokens: np2, startIdx: npEnd1,  endIdx: npEnd2 },
    ],
    remainder: remainderTokens.length > 0
      ? { tokens: remainderTokens, startIdx: npEnd2 }
      : null,
    expected: { count: 2, pattern: frameKey },
    mismatch: null,
  }
}

const FRAME_EXTRACTORS = {
  SV:   (toks, key) => extractZeroObject(toks, key),
  SVA:  (toks, key) => extractZeroObject(toks, key),
  SVC:  (toks, key) => extractZeroObject(toks, key),
  SVO:  (toks, key) => extractOneObject(toks, key),
  SVOC: (toks, key) => extractOneObject(toks, key),
  SVOA: (toks, key) => extractOneObject(toks, key),
  SVOO: (toks, key) => extractTwoObjects(toks, key),
}

// Public API. `frame` is a frame record from VERB_ARGUMENT_STRUCTURES
// (has `.slots` array). Orchestrator picks which permitted frame to pass;
// the unit just analyzes against it.
export function detectObjectShape(postVerbTokens, frame) {
  if (!frame?.slots) return null
  const tokens = (postVerbTokens ?? []).filter(Boolean)
  const key = frame.slots.join('')
  const extractor = FRAME_EXTRACTORS[key]
  if (!extractor) {
    return {
      frame: key,
      objects: [],
      remainder: tokens.length > 0 ? { tokens, startIdx: 0 } : null,
      expected: { count: 0, pattern: key },
      mismatch: { kind: 'frame-not-supported' },
    }
  }
  return extractor(tokens, key)
}
