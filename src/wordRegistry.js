// Word Registry — the resolved word record layer.
//
// This is the ONLY place the rest of the app reads word objects from.
// Components never import from wordLayerOne, wordLayerTwo, or wordData directly.
//
// getResolvedWord(wordId, lang) composes the pipeline layers in priority order:
//   L2 (grammaticalAtom, forms, cefrLevel, ...) wins when available
//   L1 (grammaticalCategory, meaning) fills gaps
//   wordData fallback for forms if L2 not yet enriched
//   null for fields that haven't been designed or enriched yet
//
// Future layers slot in here:
//   L3 content (contentReady, available lanes)
//   L4 native language support (nativeEquivalents: { he: '...', es: '...' })
//
// Shape is always complete — every field is either a value or null.
// Nothing downstream should guard against undefined.

import { getAllEnrichedSeedWords } from './wordLayerTwo'
import { getLayerOne } from './wordLayerOne'
import { getLayerTwo } from './wordLayerTwo'
import _wordDataAll from './wordData'

// ── Internal: wordData forms fallback ────────────────────────────────────────
// wordData.en.js has static forms for words that predate the pipeline.
// Used only as a fallback when L2 forms aren't available yet.
const _wordDataForms = Object.fromEntries(
  (_wordDataAll ?? []).map(w => [w.id, w.forms?.length > 0 ? w.forms : null])
)

function getWordDataForms(wordId) {
  return _wordDataForms[wordId] ?? null
}

// ── Resolved word record ──────────────────────────────────────────────────────

// Returns a fully composed word record for one word.
// Every field is a value or null — never undefined.
export function getResolvedWord(wordId, lang = 'en') {
  const seed = getAllEnrichedSeedWords(lang).find(w => w.id === wordId)
  if (!seed) return null

  const l1 = getLayerOne(wordId, lang)
  const l2 = getLayerTwo(wordId, lang)

  // forms: L2 wins (rich, with type + tenses). Falls back to wordData static forms.
  // null if neither exists yet.
  const forms = l2?.forms?.length > 0
    ? l2.forms
    : (getWordDataForms(wordId) ?? null)

  return {
    id:       wordId,
    baseForm: seed.baseForm,
    language: seed.language,

    // L1 fields
    meaning:             l1?.meaning              ?? seed.meaning ?? null,
    grammaticalCategory: l1?.grammaticalCategory  ?? seed.classifications?.grammaticalCategory ?? null,

    // L2 fields — null until enriched
    grammaticalAtom:  l2?.grammaticalAtom  ?? null,
    alternateAtoms:   l2?.alternateAtoms   ?? null,
    cefrLevel:        l2?.cefrLevel        ?? null,
    subLevel:         l2?.subLevel         ?? null,
    frequency:        l2?.frequency        ?? null,
    forms:            forms,

    // L3 fields (future — content layer)
    contentReady:     l2?.contentReady     ?? false,

    // L4 fields (future — native language support)
    // nativeEquivalents: null,  — uncomment when L4 is designed
  }
}

// Resolve an array of word IDs. Returns only words that resolve successfully.
export function getResolvedWords(wordIds, lang = 'en') {
  return wordIds
    .map(id => getResolvedWord(id, lang))
    .filter(Boolean)
}

// ── Legacy compatibility ──────────────────────────────────────────────────────
// getAllWords and getBankedWords kept for call sites not yet migrated.
// They now return resolved records instead of raw seed shapes.

export function getAllWords(lang = 'en') {
  const seeds = getAllEnrichedSeedWords(lang)
  return seeds.map(w => getResolvedWord(w.id, lang)).filter(Boolean)
}

export function getWord(wordId, lang = 'en') {
  return getResolvedWord(wordId, lang)
}

export function getBankedWords(bankIds, lang = 'en') {
  return getResolvedWords(bankIds, lang)
}
