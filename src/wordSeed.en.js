// Word Seed — English (loader)
//
// The base layer of the word knowledge system. The actual seed data lives in
// wordSeed.en.json — that file is the source of truth and is the file the
// AddWord pipeline plugin mutates. This module is a thin loader that:
//
//   1. Reads the JSON file at module load
//   2. Validates each entry has the required shape (id, baseForm, language)
//   3. Deduplicates by id (first-writer wins, matching the legacy behavior)
//   4. Exports WORD_SEED unchanged, so all existing consumers keep working
//
// Failure mode: if the JSON is malformed or missing, this module logs a clear
// error and exports an empty array. Downstream consumers continue to function;
// the app surfaces an empty word list rather than white-screening.
//
// Plain word entries only — no metadata, no linguistic judgments.
// Metadata is filled in by Layer 1 enrichment (wordLayerOne.js).
//
// To add a word: use the AddWord pipeline UI, or hand-edit wordSeed.en.json.
// Never write JS source for word entries.

import seedJson from './wordSeed.en.json'

function isValidEntry(w) {
  return w
    && typeof w.id === 'string' && w.id.length > 0
    && typeof w.baseForm === 'string' && w.baseForm.length > 0
    && typeof w.language === 'string' && w.language.length > 0
}

function loadSeed() {
  if (!Array.isArray(seedJson)) {
    console.error('[wordSeed] wordSeed.en.json is not an array; using empty seed')
    return []
  }

  const seen = new Set()
  const out = []
  let skipped = 0

  for (const entry of seedJson) {
    if (!isValidEntry(entry)) {
      console.warn('[wordSeed] skipping invalid entry:', entry)
      skipped++
      continue
    }
    if (seen.has(entry.id)) {
      // Silent dedup — matches the legacy behavior of the old in-file filter
      continue
    }
    seen.add(entry.id)
    out.push(entry)
  }

  if (skipped > 0) {
    console.warn(`[wordSeed] skipped ${skipped} invalid entries; loaded ${out.length} words`)
  }
  return out
}

export const WORD_SEED = loadSeed()
