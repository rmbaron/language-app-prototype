// Word Layer 2 — deep word profile cache
//
// Stores the fuller picture of what the system knows about a word:
//   grammaticalAtom     — atom ID from grammarAtoms system
//                         (e.g. 'be' → 'copula', 'want' → 'lexical_verb')
//   cefrLevel           — earliest CEFR level where this word is useful ('A1')
//   subLevel            — earliest sub-level ('A1.1', 'A1.2', etc.)
//   structuresEnabled   — sentence structure IDs this word helps unlock
//   semanticSubtype     — finer semantic grouping (person, place, thing, action...)
//   frequency           — how common at this level: 'core' | 'high' | 'medium' | 'low'
//   contentReady        — true when Layer 3 content exists in at least one lane
//   source              — 'mock' | 'api'
//
// Language-universal: the same for all learners of a given target language.
// Layer 4 (native language support) handles L1-specific data separately.
//
// Cache key: lapp-l2-{lang}-{wordId}
// Shared across users. Filled once, never re-fetched unless source is 'mock'.

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

// Returns true only if Layer 2 exists AND was API-enriched (not mock).
// Used to decide whether to re-enrich when the API key becomes available.
export function hasRealLayerTwo(wordId, lang = 'en') {
  const data = getLayerTwo(wordId, lang)
  return data !== null && data.source === 'api'
}

// ── Layer 2 → Layer 3 connector ───────────────────────────────

// Returns seed words that are fully live (contentReady: true) and not already
// in wordData, shaped to the word object format the recommender and search expect.
// Importing wordData here would be circular — callers pass the wordData ID set.
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
  if (!data || data.contentReady) return   // already flagged or no Layer 2 yet
  setLayerTwo(wordId, lang, { ...data, contentReady: true })
}

// ── Mock pre-population ───────────────────────────────────────
//
// Covers one word per atom type so the Layer 2 storage and downstream
// systems can be built and tested before the API key is wired up.
// All entries are flagged source: 'mock' — real API data overwrites them.

const MOCK_LAYER_TWO = {
  // copula
  be: {
    grammaticalAtom:   'copula',
    cefrLevel:         'A1',
    subLevel:          'A1.1',
    structuresEnabled: ['S_BE_ADJ', 'S_BE_NOUN', 'S_BE_LOC', 'WH_BE', 'YN_Q', 'S_BE_AADJ', 'S_BE_ADV'],
    semanticSubtype:   'state',
    frequency:         'core',
    contentReady:      false,
    source:            'mock',
  },
  // lexical_verb
  want: {
    grammaticalAtom:   'lexical_verb',
    cefrLevel:         'A1',
    subLevel:          'A1.1',
    structuresEnabled: ['SV', 'SVO', 'S_NEG_V', 'YN_Q', 'SV_OO', 'SV_ADV'],
    semanticSubtype:   'action',
    frequency:         'core',
    contentReady:      false,
    source:            'mock',
  },
  // noun
  food: {
    grammaticalAtom:   'noun',
    cefrLevel:         'A1',
    subLevel:          'A1.1',
    structuresEnabled: ['SVO', 'S_BE_NOUN', 'S_BE_LOC', 'SV_OO'],
    semanticSubtype:   'thing',
    frequency:         'core',
    contentReady:      false,
    source:            'mock',
  },
  // adjective
  good: {
    grammaticalAtom:   'adjective',
    cefrLevel:         'A1',
    subLevel:          'A1.1',
    structuresEnabled: ['S_BE_ADJ', 'S_BE_AADJ'],
    semanticSubtype:   'quality',
    frequency:         'core',
    contentReady:      false,
    source:            'mock',
  },
  // preposition
  in: {
    grammaticalAtom:   'preposition',
    cefrLevel:         'A1',
    subLevel:          'A1.2',
    structuresEnabled: ['S_BE_LOC'],
    semanticSubtype:   'location',
    frequency:         'core',
    contentReady:      false,
    source:            'mock',
  },
  // conjunction
  and: {
    grammaticalAtom:   'conjunction',
    cefrLevel:         'A1',
    subLevel:          'A1.3',
    structuresEnabled: ['SV_OO', 'S_BE_AADJ'],
    semanticSubtype:   'connector',
    frequency:         'core',
    contentReady:      false,
    source:            'mock',
  },
  // interrogative
  what: {
    grammaticalAtom:   'interrogative',
    cefrLevel:         'A1',
    subLevel:          'A1.2',
    structuresEnabled: ['WH_BE'],
    semanticSubtype:   'question',
    frequency:         'core',
    contentReady:      false,
    source:            'mock',
  },
  // adverb
  here: {
    grammaticalAtom:   'adverb',
    cefrLevel:         'A1',
    subLevel:          'A1.1',
    structuresEnabled: ['SV_ADV', 'S_BE_ADV'],
    semanticSubtype:   'location',
    frequency:         'high',
    contentReady:      false,
    source:            'mock',
  },
}

// Loads mock data into localStorage for words that don't yet have Layer 2.
// Called at app start — no-op for words already cached.
export function prePopulateMockLayerTwo(lang = 'en') {
  for (const [wordId, data] of Object.entries(MOCK_LAYER_TWO)) {
    if (!hasLayerTwo(wordId, lang)) {
      setLayerTwo(wordId, lang, data)
    }
  }
}
