// Word Reference — the system's vocabulary universe.
//
// This is NOT the learning content (wordData.js) or recommendation scoring
// (wordMeta.js). It is a large, flat list of words the app knows exist.
//
// Purpose:
//   At advanced tiers (see vocabTiers.js), the permission gate for whether
//   a word can appear as context in a prompt becomes a simple lookup:
//     1. Is the word in the user's lane pool? (practiced in that lane)
//     2. Is the word in this reference list?
//   Both true → green flagged. No API call needed.
//
// What lives here:
//   A word ID and its frequencyTier score (1–5). That's all the gate needs.
//   Richer metadata (recommendation scoring) stays in wordMeta.js.
//   Learning content (meanings, forms, audio) stays in wordData.js.
//
// Scale:
//   Designed to hold 5,000–10,000 entries. At that size, per-word data
//   must stay minimal — just what the gate needs to do its job.
//
// How to populate:
//   Source a frequency dataset (e.g. top 5k English words by corpus frequency).
//   Map each word to a frequencyTier score:
//     5 — top ~200 words  (the, a, is, go, want, you...)
//     4 — top ~1000 words
//     3 — top ~3000 words
//     2 — top ~6000 words
//     1 — beyond top 6000
//   Paste the resulting object below. The gate functions don't need to change.
//
// Lane eligibility:
//   The four lanes are NOT tracked here — they live in the user's wbPools
//   and worldPools in userStore.js. The reference just confirms the word
//   exists in the universe. Lane eligibility = word in reference + word in
//   user's lane pool.

const wordReference = {
  // ── Seed entries (words currently in wordData / wordMeta) ──
  // These will be subsumed by the full dataset when it arrives.
  // FrequencyTier scores here should match wordMeta.js.
  want:    { frequencyTier: 5 },
  need:    { frequencyTier: 5 },
  good:    { frequencyTier: 5 },
  house:   { frequencyTier: 4 },
  you:     { frequencyTier: 5 },
  go:      { frequencyTier: 5 },
  come:    { frequencyTier: 5 },
  see:     { frequencyTier: 5 },
  know:    { frequencyTier: 5 },
  think:   { frequencyTier: 5 },
  day:     { frequencyTier: 5 },
  friend:  { frequencyTier: 4 },
  food:    { frequencyTier: 4 },
  happy:   { frequencyTier: 4 },
  please:  { frequencyTier: 4 },
  sorry:   { frequencyTier: 4 },
  help:    { frequencyTier: 4 },
  time:    { frequencyTier: 5 },
  big:     { frequencyTier: 4 },
  now:     { frequencyTier: 5 },

  // ── Full dataset goes here ──
  // Paste 5k–10k entries in the same format: wordId: { frequencyTier: N }
}

// ── Public API ────────────────────────────────────────────────

// Returns true if the word exists in the reference universe.
export function isInReference(wordId) {
  return wordId in wordReference
}

// Returns the reference entry for a word, or null if not found.
export function getReferenceEntry(wordId) {
  return wordReference[wordId] ?? null
}

// Returns the frequency tier for a word, or null if not in reference.
export function getReferenceTier(wordId) {
  return wordReference[wordId]?.frequencyTier ?? null
}

// Returns the total number of words in the reference universe.
export function getReferenceSize() {
  return Object.keys(wordReference).length
}
