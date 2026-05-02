// Complement Shape Detector
//
// Frame-driven dispatch (SVC → Cs, SVOC → Co). The detector takes:
//   • the verb's frame (slots array — e.g., ['S','V','C'])
//   • the post-verb tokens
//   • for SVOC: the position where the Object ended (so C starts after it)
// and runs the accepted structure detectors against the C-region tokens,
// returning the first match.
//
// No per-unit shape catalog. The structure set lives once in
// src/forwardFlow/structures.en.js; this unit declares acceptance via
// COMPLEMENT_ACCEPTS and dispatches to shared structure detectors.
//
// ── Output schema ────────────────────────────────────────────────────────
//   {
//     frame:     string ('SVC' | 'SVOC') | null,
//     role:      'Cs' | 'Co' | null,
//     structure: string id from COMPLEMENT_ACCEPTS or null,
//     tokens:    array of tokens that matched (or null),
//     mismatch:  { kind, detail } | null,
//   }

import { matchNPShape } from '../../np/match'
import { matchAdjPShape, findAdjPBoundary } from '../../adjp/match'
import { matchPPShape, findPPBoundary } from '../../pp/match'
import { getCategory, looksLikeProperNoun } from '../../categoryLookup'
import { COMPLEMENT_ACCEPTS, COMPLEMENT_ROLE_BY_FRAME } from './acceptance.en.js'

// ── Structure detection dispatch ─────────────────────────────────────────
// Tries each accepted structure in priority order. AdjP is checked before
// NP because "happy" alone is an AdjP, not an NP. PP is checked first
// because the leading preposition is unambiguous.
function detectStructure(tokens) {
  if (!tokens || tokens.length === 0) return null

  // PP — leading preposition is the cheap signal.
  const ppEnd = findPPBoundary(tokens, 0, getCategory, looksLikeProperNoun)
  if (ppEnd === tokens.length) {
    return { structure: 'pp_basic', tokens }
  }

  // AdjP — leading degree modifier or solo adjective.
  const adjpEnd = findAdjPBoundary(tokens, 0, getCategory)
  if (adjpEnd === tokens.length) {
    return { structure: 'adjp_basic', tokens }
  }

  // NP — bare_pronominal, proper_noun, np_basic via shared NP classifier.
  const npShape = matchNPShape(tokens, getCategory, looksLikeProperNoun)
  if (npShape && COMPLEMENT_ACCEPTS.includes(npShape)) {
    return { structure: npShape, tokens }
  }

  // Future structures (gerund_phrase, infinitive_phrase, clausal) are
  // catalog-only in v1; detectors land later.

  return null
}

// Public API. `frame` is a frame record from VERB_ARGUMENT_STRUCTURES.
// `tokens` is the C-region token slice (caller has already stripped Subject,
// Verb, and Object as appropriate).
export function detectComplementShape(tokens, frame) {
  if (!frame?.slots) return null
  const cleaned = (tokens ?? []).filter(Boolean)
  const key = frame.slots.join('')
  const role = COMPLEMENT_ROLE_BY_FRAME[key]

  // Frames that don't license a Complement (SV, SVO, SVA, SVOO, SVOA).
  if (!role) return null

  if (cleaned.length === 0) {
    return {
      frame: key, role,
      structure: null, tokens: null,
      mismatch: { kind: 'no-complement-found', detail: `${key} expects a ${role}` },
    }
  }

  const match = detectStructure(cleaned)
  if (!match) {
    return {
      frame: key, role,
      structure: null, tokens: cleaned,
      mismatch: { kind: 'structure-unknown', detail: `couldn't classify "${cleaned.join(' ')}" as an accepted structure` },
    }
  }

  return {
    frame: key, role,
    structure: match.structure,
    tokens: match.tokens,
    mismatch: null,
  }
}
