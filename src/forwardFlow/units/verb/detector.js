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
import { getCategory } from '../../categoryLookup'
import { ALL_AUX_AND_NEG } from './auxChain'
import { BE_LED_AMBIGUOUS } from './auxConfigurations.en.js'

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

// Live hypothesis tracking for V — what configurations / frames are still in
// play. V's multi-hypothesis is dominant (be-aux Prog/Pass, frame ambiguity,
// aux chain forming without lexical verb). Returns:
//   [] when nothing notable
//   [{ kind: 'config' | 'frame', shape, state, hint }]
//
// State values:
//   'matched'    — committed (used for frame currently picked, when known)
//   'ambiguous'  — multiple hypotheses share the prefix; resolved by next form
//   'forming'    — still pending more tokens
//
// Picked frame is optional; if provided (e.g. from useParsedSentence's frame
// picker), the matching frame is marked 'matched' and the rest 'ambiguous'.
export function liveVerbHypotheses(matchedVerb, auxChain, auxConfiguration, pickedFrameSlots = null) {
  const out = []

  // Be-aux Prog/Pass ambiguity — be aux without disambiguating next form yet.
  if (auxConfiguration === BE_LED_AMBIGUOUS) {
    out.push({ kind: 'config', shape: 'progressive_led', state: 'ambiguous', hint: 'be + -ing form → progressive' })
    out.push({ kind: 'config', shape: 'passive_led',     state: 'ambiguous', hint: 'be + past participle → passive' })
  }

  // Aux chain present but no lexical verb yet — surface what the chain expects.
  if (!matchedVerb && auxChain && auxChain.length > 0) {
    const lastSlot = auxChain[auxChain.length - 1]?.slot
    const projects = lastSlot?.projects
    out.push({
      kind: 'config', shape: 'lexical_verb_pending', state: 'forming',
      hint: projects ? `chain expects next: ${projects}` : 'aux chain present, waiting for lexical verb',
    })
  }

  // Frame ambiguity — verb declares more than one frame.
  if (matchedVerb?.frames && matchedVerb.frames.length > 1) {
    for (const frame of matchedVerb.frames) {
      const slots = frame.slots?.join('') ?? '?'
      const state = pickedFrameSlots && slots === pickedFrameSlots ? 'matched' : 'ambiguous'
      out.push({ kind: 'frame', shape: slots, state, hint: `${matchedVerb.baseForm}: ${slots}` })
    }
  }

  return out
}

// When no token in the input matches a verb, name the categorical reason.
// Lives next to matchVerb so failure cases stay in sync with detection.
// Returns a short string or null when at least one token matched.
export function diagnoseVerbFailure(tokens) {
  if (!tokens || tokens.length === 0) return null
  const attempts = tokens.map(tok => ({
    token: tok,
    cat: getCategory(tok),
    hit: matchVerb(tok),
    isAux: ALL_AUX_AND_NEG.has(tok.toLowerCase().replace(/[^\w']/g, '')),
  }))
  if (attempts.some(a => a.hit)) return null

  // Aux chain present but no lexical verb followed.
  const auxOnly = attempts.filter(a => a.isAux)
  if (auxOnly.length === attempts.length) {
    return `aux chain only — no lexical verb yet (${auxOnly.map(a => `"${a.token}"`).join(' ')})`
  }
  if (auxOnly.length > 0 && auxOnly.length < attempts.length) {
    const tail = attempts.slice(auxOnly.length).filter(a => !a.hit && !a.isAux)
    if (tail.length > 0) {
      return `aux chain found but the following token isn't a known verb: ${tail.map(a => `"${a.token}"`).join(', ')} — needs frames/baseForm in wordRegistry`
    }
  }

  // Verb-categorized tokens that aren't in the verb-frames catalog.
  const verbCategoryMisses = attempts.filter(a => !a.hit && a.cat && (a.cat === 'verb' || a.cat.startsWith('verb')))
  if (verbCategoryMisses.length > 0) {
    return `categorized as verb but missing from frames catalog: ${verbCategoryMisses.map(a => `"${a.token}"`).join(', ')} — needs entry in frames.en.js`
  }

  // Unknown tokens — probably the lexical verb hasn't been seeded.
  const unknowns = attempts.filter(a => !a.hit && a.cat == null)
  if (unknowns.length > 0) {
    return `unknown token${unknowns.length === 1 ? '' : 's'}: ${unknowns.map(a => `"${a.token}"`).join(', ')} — likely an unseeded verb`
  }

  // All tokens categorized but none are verbs.
  const cats = [...new Set(attempts.map(a => a.cat).filter(Boolean))]
  return `no verb-shaped token in the input — categories present: [${cats.join(', ')}]`
}
