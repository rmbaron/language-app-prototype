// Word Enrichment — Layer 1 batch processor
//
// Checks the seed for words missing Layer 1 entries and enriches them
// via API. Designed to run quietly in the background at app start.
//
// The actual API call is isolated in enrichOneWord() — everything else
// is infrastructure. When the API key is ready, only that function changes.
//
// Flow:
//   1. getMissingLayerOne()       — finds seed words still without Layer 1
//   2. runLayerOneBatch()         — enriches them via API, up to batchLimit

import { WORD_SEED } from './wordSeed.en'
import { getLayerOne, setLayerOne, getMissingLayerOne } from './wordLayerOne'

// How many words to enrich per batch run.
// Keeps API costs predictable during testing.
const BATCH_LIMIT = 10

// ── Layer 1 API enrichment ────────────────────────────────────
//
// Calls /__enrich-word (Vite dev endpoint, proxies to Claude).
// Returns { grammaticalCategory, meaning, semanticSubtype } or throws.
//
// STUB: endpoint not yet built. Returns null until API key is wired up.
// Replace the stub body with the real fetch when ready.

async function enrichOneWord(wordId, baseForm, lang) {
  const res = await fetch('/__enrich-word', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wordId, baseForm, lang }),
  })
  if (!res.ok) return null
  return await res.json()
}

// ── Batch processor ───────────────────────────────────────────
//
// Runs at app start. Finds seed words missing Layer 1 and enriches up to batchLimit.
// Fire-and-forget — never blocks the UI.

export async function enrichWord(wordId, lang = 'en') {
  const word = WORD_SEED.find(w => w.id === wordId && w.language === lang)
  if (!word) return
  const result = await enrichOneWord(word.id, word.baseForm, lang)
  if (result) setLayerOne(word.id, lang, { ...result, source: 'api' })
}

export async function runLayerOneBatch(lang = 'en', batchLimit = BATCH_LIMIT) {
  // Step 1: find seed words missing Layer 1
  const missing = getMissingLayerOne(WORD_SEED, lang)
  if (missing.length === 0) return

  console.log(`[enrichment] ${missing.length} words missing Layer 1. Enriching up to ${batchLimit}.`)

  // Step 2: enrich up to batchLimit words
  const batch = missing.slice(0, batchLimit)
  for (const word of batch) {
    try {
      const result = await enrichOneWord(word.id, word.baseForm, lang)
      if (result) {
        setLayerOne(word.id, lang, { ...result, source: 'api' })
        console.log(`[enrichment] enriched "${word.baseForm}"`)
      }
    } catch (err) {
      console.warn(`[enrichment] failed for "${word.baseForm}":`, err.message)
    }
  }
}

// ── Manual trigger ────────────────────────────────────────────
//
// For dev use: call this from the console or DevPanel to force a batch run.
// window.__enrichBatch = () => runLayerOneBatch('en')

if (typeof window !== 'undefined') {
  window.__enrichBatch = () => runLayerOneBatch('en')
  window.__enrichWord = async (wordId) => {
    const word = WORD_SEED.find(w => w.id === wordId)
    if (!word) { console.warn(`[enrichment] "${wordId}" not in seed`); return }
    const result = await enrichOneWord(word.id, word.baseForm, word.language)
    if (result) { setLayerOne(word.id, word.language, { ...result, source: 'api' }); console.log(`[enrichment] done:`, result) }
    else console.warn(`[enrichment] no result for "${wordId}"`)
  }
}
