// Adverbial Shape Detector
//
// A is the first slot that exists OUTSIDE the verb's frame for many
// sentences. The detector tries to classify the A-region tokens regardless
// of whether the frame declared an A slot:
//
//   • If the frame is SVA or SVOA → matched A is the ARGUMENT.
//   • If the frame is anything else and tokens remain → matched A is an
//     ADJUNCT (free-attaching, not in the frame).
//
// No per-unit shape catalog. Accepted structures live in the shared
// structures.en.js registry; this unit declares acceptance via
// ADVERBIAL_ACCEPTS and dispatches to shared structure detectors (PP,
// AdvP, NP) for v1.
//
// ── Output schema ────────────────────────────────────────────────────────
//   {
//     frame:     string ('SVA' | 'SVOA' | 'SV' | 'SVO' | ...) | null,
//     role:      'argument' | 'adjunct' | null,
//     structure: string id from ADVERBIAL_ACCEPTS or null,
//     tokens:    array of tokens that matched (or null),
//     mismatch:  { kind, detail } | null,
//   }

import { matchNPShape } from '../../np/match'
import { matchPPShape, findPPBoundary } from '../../pp/match'
import { matchAdvPShape, findAdvPBoundary } from '../../advp/match'
import { getCategory, looksLikeProperNoun } from '../../categoryLookup'
import { ADVERBIAL_ACCEPTS, ADVERBIAL_ARGUMENT_FRAMES } from './acceptance.en.js'

// ── Structure detection dispatch ─────────────────────────────────────────
// Tries each accepted structure in priority order. PP first (leading
// preposition is unambiguous), then AdvP (single adverb signal), then NP
// (catch-all for time-NPs like "every day" / "next Monday").
function detectStructure(tokens) {
  if (!tokens || tokens.length === 0) return null

  // PP — leading preposition is the cheap signal.
  const ppEnd = findPPBoundary(tokens, 0, getCategory, looksLikeProperNoun)
  if (ppEnd === tokens.length) {
    return { structure: 'pp_basic', tokens }
  }

  // AdvP — leading degree or solo adverb.
  const advpEnd = findAdvPBoundary(tokens, 0, getCategory)
  if (advpEnd === tokens.length) {
    return { structure: 'advp_basic', tokens }
  }

  // NP — time NPs ("every day", "next Monday") and similar.
  const npShape = matchNPShape(tokens, getCategory, looksLikeProperNoun)
  if (npShape && ADVERBIAL_ACCEPTS.includes(npShape)) {
    return { structure: npShape, tokens }
  }

  return null
}

// Public API. Caller provides:
//   • the A-region tokens (already stripped of S, V, O, C)
//   • the verb's frame record (so we can label argument vs adjunct)
export function detectAdverbialShape(tokens, frame) {
  const cleaned = (tokens ?? []).filter(Boolean)
  if (cleaned.length === 0) {
    // No A-region. If the frame REQUIRED an adverbial (SVA/SVOA), surface
    // a mismatch; otherwise return null (no A present, none expected).
    if (frame?.slots) {
      const key = frame.slots.join('')
      if (ADVERBIAL_ARGUMENT_FRAMES.has(key)) {
        return {
          frame: key, role: 'argument',
          structure: null, tokens: null,
          mismatch: { kind: 'no-adverbial-found', detail: `${key} expects an obligatory adverbial` },
        }
      }
    }
    return null
  }

  const frameKey = frame?.slots?.join('') ?? null
  const isArgument = frameKey ? ADVERBIAL_ARGUMENT_FRAMES.has(frameKey) : false
  const role = isArgument ? 'argument' : 'adjunct'

  const match = detectStructure(cleaned)
  if (!match) {
    return {
      frame: frameKey, role,
      structure: null, tokens: cleaned,
      mismatch: { kind: 'structure-unknown', detail: `couldn't classify "${cleaned.join(' ')}" as an accepted adverbial structure` },
    }
  }

  return {
    frame: frameKey, role,
    structure: match.structure,
    tokens: match.tokens,
    mismatch: null,
  }
}
