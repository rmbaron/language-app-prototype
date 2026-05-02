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
import {
  addWordToFeatureIndex,
  findWordInFeatureIndex,
  removeWordFromFeatureIndex,
  rebuildFeatureIndex,
} from './featureIndex'
import { getBucketableFeatures } from './vocabularies.en'
import {
  addDerivedFormsToFamily,
  rebuildDerivedFormsIndex,
} from './derivedFormsIndex'
import { markFormsMapStale } from './formsMap'

// Compute a wordId from a baseForm — matches seedWordAdder's id rule.
function idFromBaseForm(baseForm) {
  return String(baseForm ?? '').trim().toLowerCase().replace(/\s+/g, '_')
}

// Auto-seeder: for each derived form on the L2 record, POST to
// /__add-seed-word if the form isn't already in WORD_SEED. The endpoint
// dedupes server-side; we still skip already-known IDs to avoid a noisy
// round-trip per existing word.
//
// Fire-and-forget — failures log but don't block the rest of enrichment.
async function autoSeedDerivedForms(derivedForms, lang) {
  if (!Array.isArray(derivedForms) || derivedForms.length === 0) return
  const known = new Set(WORD_SEED.filter(w => w.language === lang).map(w => w.id))
  for (const { form } of derivedForms) {
    if (!form) continue
    const id = idFromBaseForm(form)
    if (known.has(id)) continue
    try {
      const res = await fetch('/__add-seed-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseForm: form, language: lang }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.ok) {
          console.log(`[auto-seed] added "${form}" (id: ${data.id}) from derivedForms`)
        } else if (data.error && !/already exists/i.test(data.error)) {
          console.warn(`[auto-seed] could not add "${form}":`, data.error)
        }
      }
    } catch (err) {
      console.warn(`[auto-seed] failed for "${form}":`, err.message)
    }
  }
}

// Convert an L2 record into the flat { feature: value } map featureIndex buckets.
// Compound L2 fields are flattened: properNoun → { properNoun, properNounType, takesArticle }.
function extractFeatures(l2Record) {
  if (!l2Record) return {}
  const features = {}
  for (const feat of getBucketableFeatures()) {
    if (feat === 'properNoun') {
      features.properNoun = l2Record.properNoun != null
    } else if (feat === 'properNounType') {
      features.properNounType = l2Record.properNoun?.type ?? null
    } else if (feat === 'takesArticle') {
      features.takesArticle = l2Record.properNoun?.takesArticle ?? null
    } else {
      features[feat] = l2Record[feat] ?? null
    }
  }
  return features
}

// Reads the word's current featureIndex positions, removes them, adds the new ones.
// Equivalent to atomIndex's findWordInIndex → updateWordInIndex flow, packaged.
function coatFeatureIndex(wordId, newL2, lang) {
  const oldPositions = findWordInFeatureIndex(wordId, lang)
  const oldFeatures = {}
  for (const { feature, value } of oldPositions) oldFeatures[feature] = value
  if (Object.keys(oldFeatures).length > 0) {
    removeWordFromFeatureIndex(wordId, oldFeatures, lang)
  }
  addWordToFeatureIndex(wordId, extractFeatures(newL2), lang)
}

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
    markFormsMapStale()
    if (result.grammaticalAtom && result.cefrLevel) {
      if (existing && (existing.atomId !== result.grammaticalAtom || existing.cefrLevel !== result.cefrLevel)) {
        updateWordInIndex(word.id, { oldAtom: existing.atomId, oldLevel: existing.cefrLevel, newAtom: result.grammaticalAtom, newLevel: result.cefrLevel, lang })
      } else {
        addWordToIndex(word.id, result.grammaticalAtom, result.cefrLevel, lang)
      }
    }
    coatFeatureIndex(word.id, result, lang)
    addDerivedFormsToFamily(result.lemmaFamily, result.derivedForms, lang)
    autoSeedDerivedForms(result.derivedForms, lang)
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
        markFormsMapStale()
        if (result.grammaticalAtom && result.cefrLevel) {
          if (existing && (existing.atomId !== result.grammaticalAtom || existing.cefrLevel !== result.cefrLevel)) {
            updateWordInIndex(word.id, { oldAtom: existing.atomId, oldLevel: existing.cefrLevel, newAtom: result.grammaticalAtom, newLevel: result.cefrLevel, lang })
          } else {
            addWordToIndex(word.id, result.grammaticalAtom, result.cefrLevel, lang)
          }
        }
        coatFeatureIndex(word.id, result, lang)
        addDerivedFormsToFamily(result.lemmaFamily, result.derivedForms, lang)
        autoSeedDerivedForms(result.derivedForms, lang)
        console.log(`[enrichment-l2] enriched "${word.baseForm}"`)
      }
    } catch (err) {
      console.warn(`[enrichment-l2] failed for "${word.baseForm}":`, err.message)
    }
  }
}

const CAMPAIGN_KEY = 'lapp-re-enrich-campaign'

export function getReEnrichCampaign() {
  try { return JSON.parse(localStorage.getItem(CAMPAIGN_KEY)) ?? null } catch { return null }
}

export function setReEnrichCampaign(since, note = '') {
  localStorage.setItem(CAMPAIGN_KEY, JSON.stringify({ since, note }))
}

export function clearReEnrichCampaign() {
  localStorage.removeItem(CAMPAIGN_KEY)
}

// Force re-enrichment: re-enriches words that have Layer 1 and were enriched before `since`.
// Words with no enrichedAt are always included. Eligible set shrinks naturally with each run.
// Safe replacement: writes new data on success, never clears existing data first.
// onProgress({ done, total, current, enriched, failed }) fires after each word.
export async function forceReEnrichAllL2(lang = 'en', batchLimit = BATCH_LIMIT, onProgress = null, since = null, note = '') {
  const { getLayerTwo } = await import('./wordLayerTwo')

  const eligible = WORD_SEED
    .filter(w => {
      if (w.language !== lang || !hasLayerOne(w.id, lang)) return false
      if (since == null) return true
      const l2 = getLayerTwo(w.id, lang)
      return !l2?.enrichedAt || l2.enrichedAt < since
    })
    .sort((a, b) => a.baseForm.localeCompare(b.baseForm))

  const batch   = eligible.slice(0, batchLimit)
  const total   = batch.length
  const enriched = []
  const failed   = []

  console.log(`[enrichment-l2] force re-enriching ${total} / ${eligible.length} eligible words...`)

  for (let i = 0; i < batch.length; i++) {
    const word = batch[i]
    onProgress?.({ done: i, total, current: word.baseForm, enriched: [...enriched], failed: [...failed] })
    try {
      const layer1 = getLayerOne(word.id, lang)
      if (!layer1) { failed.push(word.baseForm); continue }
      const result = await enrichOneWordL2(word.id, word.baseForm, lang, layer1)
      if (result) {
        // Write new data before touching existing — safe replacement
        setLayerTwo(word.id, lang, { ...result, source: 'api', ...(note ? { enrichmentNote: note } : {}) })
        markFormsMapStale()
        const existing = findWordInIndex(word.id, lang)
        if (result.grammaticalAtom && result.cefrLevel) {
          if (existing && (existing.atomId !== result.grammaticalAtom || existing.cefrLevel !== result.cefrLevel)) {
            updateWordInIndex(word.id, { oldAtom: existing.atomId, oldLevel: existing.cefrLevel, newAtom: result.grammaticalAtom, newLevel: result.cefrLevel, lang })
          } else {
            addWordToIndex(word.id, result.grammaticalAtom, result.cefrLevel, lang)
          }
        }
        coatFeatureIndex(word.id, result, lang)
        addDerivedFormsToFamily(result.lemmaFamily, result.derivedForms, lang)
        autoSeedDerivedForms(result.derivedForms, lang)
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

  // Rebuild atom index + feature index from all currently-enriched words
  const allWithL1 = WORD_SEED.filter(w => w.language === lang && hasLayerOne(w.id, lang))
  const allL2 = allWithL1
    .map(w => ({ id: w.id, l2: getLayerTwo(w.id, lang) }))
    .filter(e => e.l2)
  const enrichedWords = allL2
    .filter(e => e.l2.grammaticalAtom && e.l2.cefrLevel)
    .map(e => ({ id: e.id, atomId: e.l2.grammaticalAtom, cefrLevel: e.l2.cefrLevel }))
  rebuildAtomIndex(lang, enrichedWords)
  rebuildFeatureIndex(lang, allL2.map(e => ({ id: e.id, features: extractFeatures(e.l2) })))
  rebuildDerivedFormsIndex(lang, allL2.map(e => ({
    familyRoot:   e.l2.lemmaFamily,
    derivedForms: e.l2.derivedForms,
  })))

  const remaining = eligible.length - batch.length
  console.log(`[enrichment-l2] done. ${enriched.length} enriched, ${failed.length} failed${remaining > 0 ? `, ${remaining} still eligible` : ''}.`)
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
