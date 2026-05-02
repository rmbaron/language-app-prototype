// Feature Index
//
// The runtime-facing pool of words bucketed by L2 sub-feature × value.
// Sibling to atomIndex.js — same pattern, different axis.
//
//   atomIndex:    { [atomId]:  { [cefrLevel]: wordId[] } }   ← exists
//   featureIndex: { [feature]: { [value]:     wordId[] } }   ← this file
//
// Written by the pipeline after L2 enrichment — the same coating step that
// writes atomIndex also writes featureIndex. Read by the Library schema
// view at runtime.
//
// Nothing at runtime reads L2 directly — this index is what readers use.
// Mirrors atomIndex's "runtime never touches L2" rule.
//
// Storage key: lapp-feature-index-{lang}
// Schema:      { [feature]: { [value]: wordId[] } }
//
// ── Validation policy ─────────────────────────────────────────────────────
// This file does NOT validate values against vocabularies.en.js. Whatever
// value the L2 record carries gets bucketed as-is. Drift (e.g. enrichment
// emits 'manner_adverb' instead of 'manner') shows up in the Library
// schema view by comparing buckets-found against declared legal values.
//
// Rationale: index = raw aggregation; vocabularies = schema; view = diff.
// Validating at write time would silently drop drift instead of surfacing it.
//
// ── Excluded features ─────────────────────────────────────────────────────
// Features marked status:'undeclared' in vocabularies.en.js (currently
// lemmaFamily) are NOT bucketed here — open-ended values aren't useful
// as buckets. The Library view shows them as ⚠ "shape declared, vocabulary
// undeclared" without reading featureIndex.
//
// Boolean values are stored under string keys 'true' / 'false' so JSON
// preserves them across save/load.

import { getBucketableFeatures } from './vocabularies.en'

function storageKey(lang) {
  return `lapp-feature-index-${lang}`
}

function load(lang) {
  try {
    const raw = localStorage.getItem(storageKey(lang))
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function save(lang, index) {
  localStorage.setItem(storageKey(lang), JSON.stringify(index))
}

function bucketKey(value) {
  if (value === true)  return 'true'
  if (value === false) return 'false'
  return String(value)
}

// ── Read ──────────────────────────────────────────────────────────────────────

// Returns word IDs bucketed under (feature, value). Empty array if the
// feature/value combination has no entries.
export function getWordsForFeature(feature, value, lang) {
  const index = load(lang)
  const bucket = index[feature]?.[bucketKey(value)]
  return Array.isArray(bucket) ? bucket : []
}

// Returns the raw index — for the schema view and dev tools.
export function getFeatureIndex(lang) {
  return load(lang)
}

// All (feature, value) positions a word currently occupies. A word can
// appear in multiple features simultaneously.
export function findWordInFeatureIndex(wordId, lang) {
  const index = load(lang)
  const positions = []
  for (const [feature, valueBuckets] of Object.entries(index)) {
    for (const [value, ids] of Object.entries(valueBuckets)) {
      if (ids.includes(wordId)) positions.push({ feature, value })
    }
  }
  return positions
}

// Counts per value for a feature. Convenience for the schema view's row
// rendering. Returns { [value]: count }.
export function getCountsForFeature(feature, lang) {
  const index = load(lang)
  const valueBuckets = index[feature] ?? {}
  const counts = {}
  for (const [value, ids] of Object.entries(valueBuckets)) {
    counts[value] = Array.isArray(ids) ? ids.length : 0
  }
  return counts
}

// ── Write (pipeline only) ─────────────────────────────────────────────────────

// Adds a word to every (feature, value) bucket implied by its L2 features.
// `features` is a flat object: { [feature]: value }. Values that are null
// or undefined are skipped — they don't bucket. Features not in the
// bucketable list are skipped silently.
//
// Safe to call multiple times — each bucket dedupes.
export function addWordToFeatureIndex(wordId, features, lang) {
  if (!features) return
  const index = load(lang)
  const allowed = new Set(getBucketableFeatures())
  for (const [feature, value] of Object.entries(features)) {
    if (value === null || value === undefined) continue
    if (!allowed.has(feature)) continue
    const k = bucketKey(value)
    if (!index[feature]) index[feature] = {}
    if (!index[feature][k]) index[feature][k] = []
    if (!index[feature][k].includes(wordId)) {
      index[feature][k].push(wordId)
    }
  }
  save(lang, index)
}

// Removes a word from the (feature, value) buckets named in `features`.
// Caller passes the OLD features map so the writer knows which buckets
// to clean. Mirrors atomIndex.removeWordFromIndex's caller-knows pattern.
export function removeWordFromFeatureIndex(wordId, features, lang) {
  if (!features) return
  const index = load(lang)
  for (const [feature, value] of Object.entries(features)) {
    if (value === null || value === undefined) continue
    const k = bucketKey(value)
    if (!index[feature]?.[k]) continue
    index[feature][k] = index[feature][k].filter(id => id !== wordId)
    if (index[feature][k].length === 0) delete index[feature][k]
    if (Object.keys(index[feature]).length === 0) delete index[feature]
  }
  save(lang, index)
}

// Moves a word when re-enrichment changes its features. Caller is
// responsible for knowing the old and new feature maps.
export function updateWordInFeatureIndex(wordId, { oldFeatures, newFeatures, lang }) {
  removeWordFromFeatureIndex(wordId, oldFeatures, lang)
  addWordToFeatureIndex(wordId, newFeatures, lang)
}

// Wipes and rebuilds the entire index for a language. Pipeline/dev tool
// only — never called at runtime.
//
// Accepts allEnrichedWords: [{ id, features }] where features is
// { [feature]: value }. Caller (the pipeline) reads L2 and passes data
// in — featureIndex.js stays free of any L2 dependency.
export function rebuildFeatureIndex(lang, allEnrichedWords) {
  const index = {}
  const allowed = new Set(getBucketableFeatures())
  for (const { id, features } of allEnrichedWords) {
    if (!id || !features) continue
    for (const [feature, value] of Object.entries(features)) {
      if (value === null || value === undefined) continue
      if (!allowed.has(feature)) continue
      const k = bucketKey(value)
      if (!index[feature]) index[feature] = {}
      if (!index[feature][k]) index[feature][k] = []
      if (!index[feature][k].includes(id)) {
        index[feature][k].push(id)
      }
    }
  }
  save(lang, index)
  touchRebuiltAt(lang)
}

// Wipes the entire index for a language. Use before rebuildFeatureIndex
// or when vocabularies.en.js changes and a full re-coating is needed.
export function clearFeatureIndex(lang) {
  localStorage.removeItem(storageKey(lang))
  localStorage.removeItem(`${storageKey(lang)}-rebuilt`)
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export function getFeatureIndexRebuiltAt(lang) {
  return localStorage.getItem(`${storageKey(lang)}-rebuilt`) ?? null
}

function touchRebuiltAt(lang) {
  localStorage.setItem(`${storageKey(lang)}-rebuilt`, new Date().toISOString())
}
