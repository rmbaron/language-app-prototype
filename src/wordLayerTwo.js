// Word Layer 2 — deep word profile cache
//
// Stores the fuller picture of what the system knows about a word:
//   grammaticalAtom     — atom ID from grammarAtoms system — primary classification
//                         (e.g. 'be' → 'copula', 'want' → 'lexical_verb')
//   alternateAtoms      — array of { atom, when } for secondary grammatical functions
//                         (e.g. 'be' → [{ atom: 'auxiliary', when: 'used as progressive auxiliary' }])
//                         empty array if the word has only one grammatical function
//   cefrLevel           — earliest CEFR level where this word is useful ('A1')
//   subLevel            — earliest sub-level ('A1.1', 'A1.2', etc.)
//   frequency           — how common at this level: 'core' | 'high' | 'medium' | 'low'
//   forms               — inflected forms including contractions
//   contentReady        — true when Layer 3 content exists in at least one lane
//   source              — 'api'
//
// structuresEnabled is NOT stored here — it is derived at runtime from the
// word's grammaticalAtom against sentenceStructures.en.js requiredBlocks.
//
// Language-universal: the same for all learners of a given target language.
// Layer 4 (native language support) handles L1-specific data separately.
//
// Cache key: lapp-l2-{lang}-{wordId}
// Shared across users. Filled once via API, never re-fetched.

import { WORD_SEED } from './wordSeed.en'
import { getLayerOne } from './wordLayerOne'

const KEY_PREFIX = 'lapp-l2'

function storageKey(lang, wordId) {
  return `${KEY_PREFIX}-${lang}-${wordId}`
}

// ── Read / write ──────────────────────────────────────────────

export function getLayerTwo(wordId, lang = 'en') {
  try   { return JSON.parse(localStorage.getItem(storageKey(lang, wordId)) ?? 'null') }
  catch { return null }
}

export function setLayerTwo(wordId, lang = 'en', data) {
  try {
    localStorage.setItem(storageKey(lang, wordId), JSON.stringify({
      ...data,
      enrichedAt: Date.now(),
    }))
  } catch { /* storage full — silently skip */ }
}

export function hasLayerTwo(wordId, lang = 'en') {
  return localStorage.getItem(storageKey(lang, wordId)) !== null
}

export function clearLayerTwo(wordId, lang = 'en') {
  localStorage.removeItem(storageKey(lang, wordId))
}

// Returns true only if Layer 2 exists, was API-enriched, and has forms data.
// Words missing forms will re-show the L2 enrich button in Pipeline automatically.
export function hasRealLayerTwo(wordId, lang = 'en') {
  const data = getLayerTwo(wordId, lang)
  return data !== null && data.source === 'api' && Array.isArray(data.forms)
}

// ── Layer 2 → Layer 3 connector ───────────────────────────────

// Returns seed words that are fully live (contentReady: true) and not already
// in wordData, shaped to the word object format the recommender and search expect.
// Importing wordData here would be circular — callers pass the wordData ID set.
// All seed words with at least L1 data — used by ContentManager to show every
// enriched word regardless of contentReady status.
export function getAllEnrichedSeedWords(lang = 'en', wordDataIds = new Set()) {
  return WORD_SEED
    .filter(w => w.language === lang && !wordDataIds.has(w.id))
    .flatMap(w => {
      const l1 = getLayerOne(w.id, lang)
      if (!l1) return []
      return [{ id: w.id, baseForm: w.baseForm, language: w.language,
                meaning: l1.meaning, forms: [],
                classifications: { grammaticalCategory: l1.grammaticalCategory } }]
    })
}

export function getLiveSeedWords(lang = 'en', wordDataIds = new Set()) {
  return WORD_SEED
    .filter(w => w.language === lang && !wordDataIds.has(w.id))
    .flatMap(w => {
      const l1 = getLayerOne(w.id, lang)
      const l2 = getLayerTwo(w.id, lang)
      if (!l1 || !l2?.contentReady) return []
      return [{ id: w.id, baseForm: w.baseForm, language: w.language,
                meaning: l1.meaning, forms: [],
                classifications: { grammaticalCategory: l1.grammaticalCategory } }]
    })
}

// Gate: returns true if this word has Layer 2 and is permitted to have
// Layer 3 content built for it. Nothing in Layer 3 should be attempted
// without this check passing first.
export function isReadyForContent(wordId, lang = 'en') {
  return hasLayerTwo(wordId, lang)
}

// Flip: called by contentStore when a word receives its first piece of
// content in any lane. Updates the contentReady flag in Layer 2 so the
// recommender knows this word is fully live.
export function markContentReady(wordId, lang = 'en') {
  const data = getLayerTwo(wordId, lang)
  if (!data || data.contentReady) return
  setLayerTwo(wordId, lang, { ...data, contentReady: true })
}

export function resetContentReady(wordId, lang = 'en') {
  const data = getLayerTwo(wordId, lang)
  if (!data) return
  setLayerTwo(wordId, lang, { ...data, contentReady: false })
}

