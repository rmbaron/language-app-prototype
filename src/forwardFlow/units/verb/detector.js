// Forward Flow — Verb unit detector.
//
// Single entry point: matchVerb(token) → null | { frame, surface, base, type }
//
//   frame   — the argument-structure record from frames.en.js
//   surface — the lowercased, punctuation-stripped token as typed
//   base    — the canonical baseForm the surface resolved to
//   type    — formsMap form-type tag (base, third_person_present, past,
//             past_participle, present_participle, …) or array when ambiguous
//
// Matching is a two-step lookup:
//   1. Direct baseForm equality against the catalog (no morphology cost).
//   2. formsMap surface→base resolution (covers irregulars seeded from
//      IRREGULAR_TYPES + L2-enriched regulars from the word registry).
//
// Anything verb-internal — agreement comparison, chain projection,
// TAM-combination labeling — should live in this folder, not in the
// cross-unit pipeline. See macro-layer-sketch.md.

import { getArgumentStructures } from './framesIndex'
import { resolveSystemFormWithType } from '../../../formsMap'

const VERB_STRUCTURES = getArgumentStructures('en')

export function matchVerb(token, lang = 'en') {
  if (!token) return null
  const surface = token.toLowerCase().replace(/[^\w]/g, '')
  if (!surface) return null

  const direct = VERB_STRUCTURES.find(v => v.baseForm === surface)
  if (direct) return { frame: direct, surface, base: surface, type: 'base' }

  const resolved = resolveSystemFormWithType(surface, lang)
  if (!resolved) return null
  const frame = VERB_STRUCTURES.find(v => v.baseForm === resolved.base)
  if (!frame) return null
  return { frame, surface, base: resolved.base, type: resolved.type }
}
