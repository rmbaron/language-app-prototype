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
import { addWordToIndex, findWordInIndex, updateWordInIndex, rebuildAtomIndex } from './atomIndex'

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
  if (result) {
    const existing = findWordInIndex(word.id, lang)
    setLayerTwo(word.id, lang, { ...result, source: 'api' })
    if (result.grammaticalAtom && result.cefrLevel) {
      if (existing && (existing.atomId !== result.grammaticalAtom || existing.cefrLevel !== result.cefrLevel)) {
        updateWordInIndex(word.id, { oldAtom: existing.atomId, oldLevel: existing.cefrLevel, newAtom: result.grammaticalAtom, newLevel: result.cefrLevel, lang })
      } else {
        addWordToIndex(word.id, result.grammaticalAtom, result.cefrLevel, lang)
      }
    }
  }
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
        const existing = findWordInIndex(word.id, lang)
        setLayerTwo(word.id, lang, { ...result, source: 'api' })
        if (result.grammaticalAtom && result.cefrLevel) {
          if (existing && (existing.atomId !== result.grammaticalAtom || existing.cefrLevel !== result.cefrLevel)) {
            updateWordInIndex(word.id, { oldAtom: existing.atomId, oldLevel: existing.cefrLevel, newAtom: result.grammaticalAtom, newLevel: result.cefrLevel, lang })
          } else {
            addWordToIndex(word.id, result.grammaticalAtom, result.cefrLevel, lang)
          }
        }
        console.log(`[enrichment-l2] enriched "${word.baseForm}"`)
      }
    } catch (err) {
      console.warn(`[enrichment-l2] failed for "${word.baseForm}":`, err.message)
    }
  }
}

// Force re-enrichment: re-enriches words that have Layer 1, up to batchLimit.
// Processes alphabetically so repeated runs walk through the list predictably.
// Safe replacement: writes new data on success, never clears existing data first.
// onProgress({ done, total, current, enriched, failed }) fires after each word.
export async function forceReEnrichAllL2(lang = 'en', batchLimit = BATCH_LIMIT, onProgress = null) {
  const { getLayerTwo } = await import('./wordLayerTwo')

  const all = WORD_SEED
    .filter(w => w.language === lang && hasLayerOne(w.id, lang))
    .sort((a, b) => a.baseForm.localeCompare(b.baseForm))

  const batch   = all.slice(0, batchLimit)
  const total   = batch.length
  const enriched = []
  const failed   = []

  console.log(`[enrichment-l2] force re-enriching ${total} / ${all.length} words (alphabetical)...`)

  for (let i = 0; i < batch.length; i++) {
    const word = batch[i]
    onProgress?.({ done: i, total, current: word.baseForm, enriched: [...enriched], failed: [...failed] })
    try {
      const layer1 = getLayerOne(word.id, lang)
      if (!layer1) { failed.push(word.baseForm); continue }
      const result = await enrichOneWordL2(word.id, word.baseForm, lang, layer1)
      if (result) {
        // Write new data before touching existing — safe replacement
        setLayerTwo(word.id, lang, { ...result, source: 'api' })
        const existing = findWordInIndex(word.id, lang)
        if (result.grammaticalAtom && result.cefrLevel) {
          if (existing && (existing.atomId !== result.grammaticalAtom || existing.cefrLevel !== result.cefrLevel)) {
            updateWordInIndex(word.id, { oldAtom: existing.atomId, oldLevel: existing.cefrLevel, newAtom: result.grammaticalAtom, newLevel: result.cefrLevel, lang })
          } else {
            addWordToIndex(word.id, result.grammaticalAtom, result.cefrLevel, lang)
          }
        }
        enriched.push(word.baseForm)
        console.log(`[enrichment-l2] re-enriched "${word.baseForm}"`)
      } else {
        failed.push(word.baseForm)
      }
    } catch (err) {
      failed.push(word.baseForm)
      console.warn(`[enrichment-l2] failed for "${word.baseForm}":`, err.message)
    }
  }

  onProgress?.({ done: total, total, current: null, enriched: [...enriched], failed: [...failed] })

  // Rebuild atom index from all currently-enriched words
  const enrichedWords = all
    .map(w => {
      const l2 = getLayerTwo(w.id, lang)
      return l2?.grammaticalAtom && l2?.cefrLevel
        ? { id: w.id, atomId: l2.grammaticalAtom, cefrLevel: l2.cefrLevel }
        : null
    })
    .filter(Boolean)
  rebuildAtomIndex(lang, enrichedWords)

  const remaining = all.length - batch.length
  console.log(`[enrichment-l2] done. ${enriched.length} enriched, ${failed.length} failed${remaining > 0 ? `, ${remaining} remaining` : ''}.`)
  return { enriched, failed, remaining }
}

// ── Manual trigger ────────────────────────────────────────────

if (typeof window !== 'undefined') {
  window.__enrichL2Batch      = () => runLayerTwoBatch('en')
  window.__forceReEnrichAllL2 = () => forceReEnrichAllL2('en')
  window.__enrichWordL2 = async (wordId) => {
    await enrichWordL2(wordId, 'en')
    const { getLayerTwo } = await import('./wordLayerTwo')
    console.log(`[l2] "${wordId}":`, getLayerTwo(wordId, 'en'))
  }
}
