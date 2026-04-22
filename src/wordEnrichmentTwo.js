// Word Enrichment — Layer 2 batch processor
//
// Picks up where Layer 1 left off. Words with real Layer 1 data get
// a full deep profile via API.
//
// Flow:
//   1. Find seed words that have Layer 1 but not real (API-sourced) Layer 2
//   2. Enrich them via /__enrich-word-l2, up to batchLimit
//
// Fire-and-forget — never blocks the UI.

import { WORD_SEED } from './wordSeed.en'
import { getLayerOne, hasLayerOne } from './wordLayerOne'
import { setLayerTwo, hasLayerTwo, hasRealLayerTwo } from './wordLayerTwo'

const BATCH_LIMIT = 5

// ── Layer 2 API enrichment ────────────────────────────────────

async function enrichOneWordL2(wordId, baseForm, lang, layer1) {
  const res = await fetch('/__enrich-word-l2', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wordId, baseForm, lang, layer1 }),
  })
  if (!res.ok) return null
  return await res.json()
}

// ── Batch processor ───────────────────────────────────────────

function getMissingLayerTwo(seedWords, lang) {
  return seedWords.filter(w =>
    w.language === lang &&
    hasLayerOne(w.id, lang) &&
    !hasRealLayerTwo(w.id, lang)
  )
}

export async function enrichWordL2(wordId, lang = 'en') {
  const word = WORD_SEED.find(w => w.id === wordId && w.language === lang)
  if (!word) return
  const layer1 = getLayerOne(word.id, lang)
  if (!layer1) return
  const result = await enrichOneWordL2(word.id, word.baseForm, lang, layer1)
  if (result) setLayerTwo(word.id, lang, { ...result, source: 'api' })
}

export async function runLayerTwoBatch(lang = 'en', batchLimit = BATCH_LIMIT) {
  const missing = getMissingLayerTwo(WORD_SEED, lang)
  if (missing.length === 0) return

  console.log(`[enrichment-l2] ${missing.length} words need Layer 2. Enriching up to ${batchLimit}.`)

  const batch = missing.slice(0, batchLimit)
  for (const word of batch) {
    try {
      const layer1 = getLayerOne(word.id, lang)
      if (!layer1) continue
      const result = await enrichOneWordL2(word.id, word.baseForm, lang, layer1)
      if (result) {
        setLayerTwo(word.id, lang, { ...result, source: 'api' })
        console.log(`[enrichment-l2] enriched "${word.baseForm}"`)
      }
    } catch (err) {
      console.warn(`[enrichment-l2] failed for "${word.baseForm}":`, err.message)
    }
  }
}

// ── Manual trigger ────────────────────────────────────────────

if (typeof window !== 'undefined') {
  window.__enrichL2Batch = () => runLayerTwoBatch('en')
  window.__enrichWordL2 = async (wordId) => {
    await enrichWordL2(wordId, 'en')
    const { getLayerTwo } = await import('./wordLayerTwo')
    console.log(`[l2] "${wordId}":`, getLayerTwo(wordId, 'en'))
  }
}
