// Practice Cache — World Sphere sentence content buckets
//
// Stores AI-generated sentences locally so the app can serve them without
// an API call once a bucket has enough coverage.
//
// Bucket identity:  language / structure_id / lane
//   — 12 structures × 1 lane (reading) = 12 buckets for early A1
//   — sub-level is omitted (implied by structure_id)
//   — word bank is omitted (it's a retrieval filter, not a bucket dimension)
//
// Each stored sentence carries:
//   text          — the sentence string
//   contentWords  — which of the user's bank words appear in the sentence
//                   (computed at storage time — used to filter at retrieval)
//   wordCount     — sentence length
//
// Retrieval: filter pool by word bank intersection, serve randomly from matches.
// If matches < CACHE_MIN_MATCHES, the caller should generate live instead.
// After live generation, background-fill thin buckets so future requests are cached.

const KEY_PREFIX       = 'lapp-pc'
export const CACHE_MIN_MATCHES = 3    // serve from cache only if this many matches exist
export const CACHE_TARGET      = 15   // stop background-filling once bucket reaches this

// ── Internal helpers ──────────────────────────────────────────

function bucketKey(lang, structureId, lane) {
  return `${KEY_PREFIX}-${lang}-${structureId}-${lane}`
}

function loadPool(key) {
  try   { return JSON.parse(localStorage.getItem(key) ?? '[]') }
  catch { return [] }
}

function savePool(key, pool) {
  try   { localStorage.setItem(key, JSON.stringify(pool)) }
  catch { /* storage full or unavailable — silently skip */ }
}

// ── Public API ────────────────────────────────────────────────

// Returns all matching sentences across multiple structure buckets,
// filtered to those whose contentWords are all in the user's word bank.
// Used to decide whether to serve from cache or go live.
export function getMatchesAcrossStructures(lang, structureIds, lane, userWordBankWords) {
  const bankSet = new Set(userWordBankWords)
  const all     = []
  for (const structureId of structureIds) {
    const pool    = loadPool(bucketKey(lang, structureId, lane))
    const matches = pool.filter(s => s.contentWords.every(w => bankSet.has(w)))
    all.push(...matches.map(s => ({ ...s, structureId })))
  }
  return all
}

// Adds a generated sentence to its bucket's pool.
// Deduplicates by text so repeated generation doesn't bloat the pool.
export function addToCache(lang, structureId, lane, sentence) {
  const key  = bucketKey(lang, structureId, lane)
  const pool = loadPool(key)
  if (!pool.find(s => s.text === sentence.text)) {
    pool.push(sentence)
    savePool(key, pool)
  }
}

// Returns true if a bucket is below the fill target.
// Used by the background-fill logic to know whether to bother generating.
export function needsFill(lang, structureId, lane) {
  return loadPool(bucketKey(lang, structureId, lane)).length < CACHE_TARGET
}

// Returns display data for one bucket — used by the cache inspector UI.
//   total    — sentences stored regardless of word bank
//   matched  — sentences whose contentWords are all in the user's bank
//   sentences — full pool, for expanding and reading individual sentences
export function getPoolStats(lang, structureId, lane, userWordBankWords) {
  const pool    = loadPool(bucketKey(lang, structureId, lane))
  const bankSet = new Set(userWordBankWords)
  const matched = pool.filter(s => s.contentWords.every(w => bankSet.has(w)))
  return { total: pool.length, matched: matched.length, sentences: pool }
}
