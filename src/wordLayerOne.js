// Word Layer 1 — basic enrichment cache
//
// Stores the minimum the system needs to know about a word:
//   grammaticalCategory  — what kind of word it is
//   meaning              — short definition in the interface language
//   semanticSubtype      — finer semantic grouping (person, place, thing, etc.)
//   enrichedAt           — timestamp, for debugging / cache inspection
//
// Storage: localStorage, keyed per word per language.
// Shared across users in the same browser for now.
// Swap to Firestore later without changing the interface above this file.
//
const KEY_PREFIX = 'lapp-l1'

function storageKey(lang, wordId) {
  return `${KEY_PREFIX}-${lang}-${wordId}`
}

// ── Read / write ──────────────────────────────────────────────

export function getLayerOne(wordId, lang = 'en') {
  try   { return JSON.parse(localStorage.getItem(storageKey(lang, wordId)) ?? 'null') }
  catch { return null }
}

export function setLayerOne(wordId, lang = 'en', data) {
  try {
    localStorage.setItem(storageKey(lang, wordId), JSON.stringify({
      ...data,
      enrichedAt: Date.now(),
    }))
  } catch { /* storage full — silently skip */ }
}

export function hasLayerOne(wordId, lang = 'en') {
  return localStorage.getItem(storageKey(lang, wordId)) !== null
}

// ── Batch helpers ─────────────────────────────────────────────

// Returns seed words that don't yet have a Layer 1 entry.
// These are the words the batch processor should enrich next.
export function getMissingLayerOne(seedWords, lang = 'en') {
  return seedWords.filter(w => {
    if (w.language !== lang) return false
    const data = getLayerOne(w.id, lang)
    return !data || data.source !== 'api'
  })
}

