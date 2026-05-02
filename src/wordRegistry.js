// Word Registry — the resolved word record layer.
//
// This is the ONLY place the rest of the app reads word objects from.
// Components never import from wordLayerOne or wordLayerTwo directly.
//
// getResolvedWord(wordId, lang) composes the pipeline layers in priority order:
//   L2 (grammaticalAtom, forms, cefrLevel, ...) wins when available
//   L1 (grammaticalCategory, meaning) fills gaps
//   null for fields not yet enriched or designed
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

// ── Resolved word record ──────────────────────────────────────────────────────

// Returns a fully composed word record for one word.
// Every field is a value or null — never undefined.
export function getResolvedWord(wordId, lang = 'en') {
  const seed = getAllEnrichedSeedWords(lang).find(w => w.id === wordId)
  if (!seed) return null

  const l1 = getLayerOne(wordId, lang)
  const l2 = getLayerTwo(wordId, lang)

  // forms: from L2 enrichment (rich: type + tenses). null until L2 is enriched.
  const forms = l2?.forms?.length > 0 ? l2.forms : null

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

    // L2 — noun-specific
    countability:       l2?.countability       ?? null,
    properNoun:         l2?.properNoun         ?? null,
    concreteness:       l2?.concreteness       ?? null,
    animate:            l2?.animate            ?? null,

    // L2 — verb-specific
    transitivity:       l2?.transitivity       ?? null,
    verbAspectClass:    l2?.verbAspectClass    ?? null,
    commonCollocations: l2?.commonCollocations ?? null,
    // Argument structure: per-verb compact frame assignments.
    // Shape: [{ id: 'transitive', example: '...', notes: '...' }, ...]
    // Frame template metadata (label, slots, slotNotes) lives in
    // forwardFlow/units/verb/frames.en.js; the reader composes them.
    // Pre-API verbs fall back to verbFramesBootstrap.en.js for now.
    frames:             l2?.frames             ?? null,

    // L2 — adjective / adverb / numeral specifics
    adjectivePosition:  l2?.adjectivePosition  ?? null,
    adverbType:         l2?.adverbType         ?? null,
    numeralType:        l2?.numeralType        ?? null,

    // L2 — pronoun (and applicable noun) features
    person:             l2?.person             ?? null,
    number:             l2?.number             ?? null,
    gender:             l2?.gender             ?? null,

    // L2 — universal
    colloquial:         l2?.colloquial         ?? false,
    lemmaFamily:        l2?.lemmaFamily        ?? null,
    derivedForms:       l2?.derivedForms       ?? null,

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
