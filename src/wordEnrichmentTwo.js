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
import { setLayerTwo, hasLayerTwo, hasRealLayerTwo, clearLayerTwo } from './wordLayerTwo'
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

// Force re-enrichment: clears existing Layer 2 for all seed words that have Layer 1,
// then re-enriches them. Use this when the Layer 2 prompt changes and existing
// data needs to be refreshed (e.g. after adding alternateAtoms field).
export async function forceReEnrichAllL2(lang = 'en') {
  const words = WORD_SEED.filter(w => w.language === lang && hasLayerOne(w.id, lang))
  console.log(`[enrichment-l2] force re-enriching ${words.length} words...`)

  for (const word of words) {
    try {
      clearLayerTwo(word.id, lang)
      const layer1 = getLayerOne(word.id, lang)
      if (!layer1) continue
      const result = await enrichOneWordL2(word.id, word.baseForm, lang, layer1)
      if (result) {
        setLayerTwo(word.id, lang, { ...result, source: 'api' })
        console.log(`[enrichment-l2] re-enriched "${word.baseForm}"`)
      }
    } catch (err) {
      console.warn(`[enrichment-l2] failed for "${word.baseForm}":`, err.message)
    }
  }

  // Rebuild the atom index from scratch after full re-enrichment.
  // Collect all enriched word positions from L2 and pass them in.
  const { getLayerTwo } = await import('./wordLayerTwo')
  const enrichedWords = words
    .map(w => {
      const l2 = getLayerTwo(w.id, lang)
      return l2?.grammaticalAtom && l2?.cefrLevel
        ? { id: w.id, atomId: l2.grammaticalAtom, cefrLevel: l2.cefrLevel }
        : null
    })
    .filter(Boolean)
  rebuildAtomIndex(lang, enrichedWords)
  console.log('[enrichment-l2] force re-enrich complete. Atom index rebuilt.')
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
