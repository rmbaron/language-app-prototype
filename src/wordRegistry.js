// Word Registry — the resting pool for all word objects the system knows about.
//
// Words enter this pool in two ways:
//   1. wordData.en.js — legacy static words, always present
//   2. Seed + Layer 1 enrichment — new words, present once enriched
//
// Any component that needs to resolve a word object by ID, search across words,
// or pass a word list to a calculation function should import from here —
// not directly from wordData.
//
// Two separate concerns are intentionally NOT served by this registry:
//   - The recommender (wordCandidatePool, DiscoverWords) uses getLiveSeedWords
//     directly because it gates on contentReady — only words with practice
//     content should be surfaced to learners.
//   - wordLayerOne.prePopulateFromWordData reads wordData directly because
//     it is a migration/seeding tool, not a consumer of word objects.

import wordDataWords from './wordData'
import { getAllEnrichedSeedWords } from './wordLayerTwo'

// Returns all word objects for a given language — wordData words plus any
// seed words that have been enriched to at least Layer 1.
// This is the resting pool: words that have passed through the pipeline
// and are ready to be used by the app.
export function getAllWords(lang = 'en') {
  const base    = wordDataWords.filter(w => w.language === lang)
  const baseIds = new Set(base.map(w => w.id))
  return [...base, ...getAllEnrichedSeedWords(lang, baseIds)]
}

// Convenience: resolve word objects for a set of word bank IDs.
// Returns only words found in the registry — silently drops unknown IDs.
export function getBankedWords(bankIds, lang = 'en') {
  const all   = getAllWords(lang)
  const idSet = new Set(bankIds)
  return all.filter(w => idSet.has(w.id))
}
