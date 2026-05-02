// Shared category lookup — single source of truth for "what category is
// this token?" across all unit detectors (S, V, O, C, A).
//
// Resolution order:
//   1. Function words (wordCategories.en.js) — closed-class, permanent
//   2. Demo content words (demoContentWords.en.js) — transitional fallback
//   3. Word registry — L1/L2-enriched per-word data
//
// Replaces the per-unit HARDCODED_CATEGORY maps + buildRegistry helpers
// that used to live in each detector. Detectors now import from here.

import { WORD_CATEGORIES } from './wordCategories.en.js'
import { DEMO_CONTENT_WORDS } from './demoContentWords.en.js'
import { getAllWords } from '../wordRegistry'

let registryByForm = null
function buildRegistry() {
  if (registryByForm) return registryByForm
  registryByForm = new Map()
  try {
    for (const w of getAllWords('en')) {
      if (!w?.baseForm) continue
      registryByForm.set(w.baseForm.toLowerCase(), w)
    }
  } catch {
    // Registry not available — lookups fall through to maps only.
  }
  return registryByForm
}

function cleanToken(token) {
  return (token ?? '').toLowerCase().replace(/[^\w'-]/g, '')
}

// Returns a grammatical-category string or null. Combines the three
// resolution sources in priority order.
export function getCategory(token) {
  const t = cleanToken(token)
  if (!t) return null
  if (WORD_CATEGORIES[t])    return WORD_CATEGORIES[t]
  if (DEMO_CONTENT_WORDS[t]) return DEMO_CONTENT_WORDS[t]
  const w = buildRegistry().get(t)
  if (!w) return null
  return w.grammaticalAtom ?? w.grammaticalCategory ?? null
}

// Pure form check — first letter is an uppercase letter, rest is wordlike.
// Doesn't ask whether the token is a function word or a known noun.
export function looksLikeProperNounByForm(rawToken) {
  if (!rawToken) return false
  const cleaned = rawToken.replace(/[^\w'-]/g, '')
  if (!cleaned) return false
  if (cleaned[0] !== cleaned[0].toUpperCase()) return false
  if (cleaned[0] === cleaned[0].toLowerCase()) return false
  return true
}

// Full proper-noun filter — form check + function-word exclusion + a
// registry check that trusts known non-name nouns over the heuristic.
// E.g., "Music" at sentence start is form-like but the registry says
// it's a noun (not a name), so we trust the registry.
export function looksLikeProperNoun(rawToken) {
  if (!looksLikeProperNounByForm(rawToken)) return false
  const lower = rawToken.replace(/[^\w'-]/g, '').toLowerCase()
  // Function word? Not a name.
  if (WORD_CATEGORIES[lower]) return false
  // Demo content word that's a non-name noun? Not a name.
  if (DEMO_CONTENT_WORDS[lower]) return false
  // Registry says this is a known non-name noun? Trust it.
  const reg = buildRegistry().get(lower)
  if (reg && reg.grammaticalCategory && reg.grammaticalCategory !== 'noun_person') {
    return false
  }
  return true
}
