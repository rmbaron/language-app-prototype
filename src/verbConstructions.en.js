// Verb construction definitions — declarative table consumed by the matcher
// in tokenizeFull (src/circuitCheck.js). Adding a new verb construction means
// adding one entry here; no new branches, no per-construction code path.
//
// Shape entries can be:
//   atomId           — token at this position has this atom
//   atomId:formType  — token has this atom AND its form type matches
//
// Recognized formType values come from the forms map (see src/formsMap.js):
//   base, present_participle, past_participle, third_person_present, etc.
//
// Constructions are evaluated longest-first; the first match wins. Order
// entries from longest shape to shortest. Within the same length, list more
// specific shapes (more constraining) before less specific ones if they
// could collide on first-atom match.
//
// Atom-membership for closed-class function atoms (perfect_auxiliary,
// progressive_auxiliary) that don't have wordIds in the user's bank falls
// back to STRUCTURE_AUX_FORMS below — same pattern as the structure-unlock
// derivations in src/learnerGrammarState.js.

import { resolveToBase } from './morphology.en.js'
import { resolveSystemFormWithType } from './formsMap.js'

export const VERB_CONSTRUCTIONS = [
  // ── 4-token ────────────────────────────────────────────────────────────
  // "will have been drinking"
  { id:        'future_perfect_continuous',
    atomClass: 'modal_construction',
    shape:     ['modal_auxiliary', 'perfect_auxiliary', 'copula', 'lexical_verb:present_participle'] },

  // ── 3-token ────────────────────────────────────────────────────────────
  // "will be drinking"
  { id:        'future_continuous',
    atomClass: 'modal_construction',
    shape:     ['modal_auxiliary', 'copula', 'lexical_verb:present_participle'] },

  // "will have drunk"
  { id:        'future_perfect',
    atomClass: 'modal_construction',
    shape:     ['modal_auxiliary', 'perfect_auxiliary', 'lexical_verb'] },

  // "have been drinking"
  { id:        'perfect_continuous',
    atomClass: 'perfect_construction',
    shape:     ['perfect_auxiliary', 'copula', 'lexical_verb:present_participle'] },

  // ── 2-token ────────────────────────────────────────────────────────────
  // "will drink"
  { id:        'modal',
    atomClass: 'modal_construction',
    shape:     ['modal_auxiliary', 'lexical_verb'] },

  // "have drunk"
  { id:        'perfect',
    atomClass: 'perfect_construction',
    shape:     ['perfect_auxiliary', 'lexical_verb'] },

  // "is drinking"
  { id:        'progressive',
    atomClass: 'progressive_construction',
    shape:     ['copula', 'lexical_verb:present_participle'] },
]

// Atoms whose words don't appear in atomWords (because the atom is purely a
// secondary/alternate function) get their trigger forms from this table.
// Mirrors STRUCTURE_UNLOCKS in learnerGrammarState.js but for surface forms
// rather than atom-set derivation.
export const STRUCTURE_AUX_FORMS = {
  perfect_auxiliary: ['have', 'has', 'had'],
}

// ── Matcher ─────────────────────────────────────────────────────────────────

// Does `surface` (or its base) count as `atomId` given the user's atomWords?
function wordMatchesAtom(surface, atomId, atomWords) {
  const lower = surface.toLowerCase()
  const base  = resolveToBase(lower)
  const list  = atomWords[atomId] ?? []
  if (list.includes(lower) || list.includes(base)) return true
  const fallback = STRUCTURE_AUX_FORMS[atomId]
  if (fallback && (fallback.includes(lower) || fallback.includes(base))) return true
  return false
}

// Does `surface` have form type `formType`? Consults the forms map first;
// falls back to the -ing heuristic for present_participle when the surface
// is not in the system vocabulary.
function wordHasFormType(surface, formType, lang) {
  const lower    = surface.toLowerCase()
  const resolved = resolveSystemFormWithType(lower, lang)
  if (resolved) {
    const types = Array.isArray(resolved.type) ? resolved.type : [resolved.type]
    if (types.includes(formType)) return true
    // base sometimes registers without an explicit type — accept if the
    // surface equals the resolved base and we're checking 'base'.
    if (formType === 'base' && resolved.base === lower) return true
    return false
  }
  // Fallback heuristics — surface not in formsMap.
  const base = resolveToBase(lower)
  if (formType === 'present_participle') return lower.endsWith('ing') && lower !== base
  if (formType === 'past_participle')    return lower !== base && (lower.endsWith('ed') || lower.endsWith('en'))
  if (formType === 'base')               return lower === base
  return false
}

function shapeMatches(rawTokens, startIdx, shape, atomWords, lang) {
  if (startIdx + shape.length > rawTokens.length) return false
  for (let k = 0; k < shape.length; k++) {
    const surface = rawTokens[startIdx + k]
    if (!/^[a-zA-Z'']/.test(surface)) return false  // punctuation kills the chain
    const colon   = shape[k].indexOf(':')
    const atomId   = colon === -1 ? shape[k] : shape[k].slice(0, colon)
    const formType = colon === -1 ? null     : shape[k].slice(colon + 1)
    if (!wordMatchesAtom(surface, atomId, atomWords)) return false
    if (formType && !wordHasFormType(surface, formType, lang)) return false
  }
  return true
}

// Try to match a verb construction starting at rawTokens[startIdx].
// Returns the matched construction (with .id, .atomClass, .shape) or null.
// Caller is responsible for consuming `shape.length` tokens on a hit.
export function matchVerbConstruction(rawTokens, startIdx, atomWords, lang = 'en') {
  for (const c of VERB_CONSTRUCTIONS) {
    if (shapeMatches(rawTokens, startIdx, c.shape, atomWords, lang)) return c
  }
  return null
}
