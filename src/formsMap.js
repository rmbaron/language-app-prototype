// Forms Map — bidirectional surface/base lookup for all system-vocabulary words.
//
// Built from the word registry (the single source of truth for enriched words).
// Cached after first build — call markFormsMapStale() after any enrichment run
// that adds new words or updates forms data.
//
// Single-language cache: stores one lang at a time. Multi-language support
// would require a Map<lang, cache> — deferred until needed.
//
// Three directions (all keys normalized to lowercase):
//   surfaceToBase: 'ate' → 'eat'
//   baseToForms:   'eat' → ['eat', 'eats', 'ate', 'eaten', 'eating']
//   surfaceToType: 'ate' → 'past' (or array when a surface fills multiple roles)
//
// Form types align with L2 enrichment output (see vite-plugins/wordEnricher.js):
//   base, third_person_present, present, first_person_present,
//   past, past_participle, present_participle, plural, comparative, superlative,
//   object, possessive, reflexive, contracted_negative, ...

import { getAllWords } from './wordRegistry'
import {
  IRREGULAR_TYPES,
  regularVerbFormsTyped,
  regularNounFormsTyped,
} from './morphology.en'

// All base words in the IRREGULAR table — treated as system-known
// even if not yet enriched or in anyone's word bank.
const IRREGULAR_BASES = Object.keys(IRREGULAR_TYPES)

// Categories that get verb-rule typed expansion when no L2 forms data is present.
const VERB_CATEGORIES = new Set(['verb'])
const NOUN_CATEGORIES = new Set(['noun'])

let _cache = null   // { lang, surfaceToBase, baseToForms, surfaceToType }
let _stale = false

// Adds a (surface → base) and (surface → type) entry. First-writer-wins on collision
// for surfaceToBase; types accumulate (different bases can share a surface).
function addEntry(surfaceToBase, surfaceToType, surface, base, type) {
  const lower = surface.toLowerCase()
  if (!surfaceToBase.has(lower)) surfaceToBase.set(lower, base)

  // surfaceToType: if a value already exists, merge (array union); otherwise set.
  if (type == null) return
  const existing = surfaceToType.get(lower)
  if (existing === undefined) {
    surfaceToType.set(lower, type)
    return
  }
  // Merge into a flat unique array.
  const merged = new Set(Array.isArray(existing) ? existing : [existing])
  if (Array.isArray(type)) for (const t of type) merged.add(t)
  else                      merged.add(type)
  const mergedArr = [...merged]
  surfaceToType.set(lower, mergedArr.length === 1 ? mergedArr[0] : mergedArr)
}

// Rebuilds if stale or not yet built for this lang. Returns cached otherwise.
export function buildFormsMap(lang = 'en') {
  if (_cache && _cache.lang === lang && !_stale) return _cache

  const words = getAllWords(lang)
  const surfaceToBase = new Map()
  const baseToForms   = new Map()
  const surfaceToType = new Map()

  // Seed from IRREGULAR_TYPES — system-known regardless of enrichment state
  for (const [base, surfaceMap] of Object.entries(IRREGULAR_TYPES)) {
    addEntry(surfaceToBase, surfaceToType, base, base, 'base')
    const forms = new Set([base])
    for (const [surface, type] of Object.entries(surfaceMap)) {
      addEntry(surfaceToBase, surfaceToType, surface, base, type)
      forms.add(surface.toLowerCase())
    }
    baseToForms.set(base, [...forms])
  }

  for (const word of words) {
    if (!word.baseForm) continue
    const base = word.baseForm.toLowerCase()

    // Skip — IRREGULAR_TYPES has already covered it with canonical typing.
    if (IRREGULAR_TYPES[base]) {
      // Still ensure the registry word's forms are in the legacy expansion.
      if (Array.isArray(word.forms)) {
        const existing = baseToForms.get(base) ?? []
        const set = new Set(existing)
        for (const f of word.forms) {
          if (f?.form) {
            const surface = f.form.toLowerCase()
            set.add(surface)
            // Also register the type if the registry has one we don't know about.
            if (f.type) addEntry(surfaceToBase, surfaceToType, surface, base, f.type)
          }
        }
        baseToForms.set(base, [...set])
      }
      continue
    }

    addEntry(surfaceToBase, surfaceToType, base, base, 'base')
    const formSet = new Set([base])

    // L2-enriched: forms array carries explicit type tags. Use directly.
    if (Array.isArray(word.forms) && word.forms.length > 0) {
      for (const f of word.forms) {
        if (!f?.form) continue
        const surface = f.form.toLowerCase()
        addEntry(surfaceToBase, surfaceToType, surface, base, f.type ?? null)
        formSet.add(surface)
      }
      baseToForms.set(base, [...formSet])
      continue
    }

    // Not L2-enriched: fall back to typed regular generation by category.
    // Only verbs and nouns get rule-based form expansion. Pronouns, prepositions,
    // adverbs, etc. either have inflected forms in the L2 forms array (above) or
    // they are invariant — we don't fabricate inflections for them.
    const cat = word.grammaticalCategory
    if (VERB_CATEGORIES.has(cat)) {
      for (const { form, type } of regularVerbFormsTyped(base)) {
        addEntry(surfaceToBase, surfaceToType, form, base, type)
        formSet.add(form.toLowerCase())
      }
    } else if (NOUN_CATEGORIES.has(cat)) {
      for (const { form, type } of regularNounFormsTyped(base)) {
        addEntry(surfaceToBase, surfaceToType, form, base, type)
        formSet.add(form.toLowerCase())
      }
    }
    // else: register the base only — already in formSet.

    baseToForms.set(base, [...formSet])
  }

  _cache = { lang, surfaceToBase, baseToForms, surfaceToType }
  _stale = false
  return _cache
}

// Mark the cache stale — next call to buildFormsMap will rebuild.
// Call this after any enrichment run that adds or updates word forms.
export function markFormsMapStale() {
  _stale = true
}

// Resolve a surface form to its base word ID.
// Returns null if the surface form is not in the system vocabulary.
export function resolveSystemForm(surface, lang = 'en') {
  const { surfaceToBase } = buildFormsMap(lang)
  return surfaceToBase.get(surface.toLowerCase()) ?? null
}

// Resolve a surface form to its base + form type.
// Returns { base, type } or null. `type` may be a string or an array (when a
// surface fills multiple roles, e.g. 'had' → ['past','past_participle']).
export function resolveSystemFormWithType(surface, lang = 'en') {
  const cache = buildFormsMap(lang)
  const lower = surface.toLowerCase()
  const base = cache.surfaceToBase.get(lower)
  if (!base) return null
  return { base, type: cache.surfaceToType.get(lower) ?? null }
}

// Returns all known surface forms for a base word ID.
// Returns empty array if the word is not in the system vocabulary.
export function getFormsForWord(wordId, lang = 'en') {
  const { baseToForms } = buildFormsMap(lang)
  return baseToForms.get(wordId.toLowerCase()) ?? []
}

// Returns true if the surface form is recognized as any word in the system vocabulary.
export function hasSystemWord(surface, lang = 'en') {
  const { surfaceToBase } = buildFormsMap(lang)
  return surfaceToBase.has(surface.toLowerCase())
}
