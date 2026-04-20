// Content Store — system-level practice content, not per-user.
//
// Two-layer architecture:
//
//   Layer 1 — Content Index
//     Lightweight manifest: wordId → { laneId: itemCount }
//     Answers existence checks without loading content.
//     hasContent() and getContentSummary() read only this layer —
//     never touch content data.
//
//     ── Firestore swap point ──────────────────────────────────
//     Replace loadIndex() / saveIndex() with:
//       loadIndex()  → db.collection('content-index').doc(wordId).get()
//                      (or a single metadata document per word)
//       saveIndex()  → db.collection('content-index').doc(wordId).set(...)
//     hasContent() becomes one cheap Firestore read.
//     This is the gate that prevents expensive AI/TTS generation calls.
//
//   Layer 2 — Content Data
//     Actual content items, loaded per-word on demand.
//     getContent() reads this layer only when content is actually needed
//     for practice — never speculatively.
//
//     ── Firestore swap point ──────────────────────────────────
//     Replace loadWordData(wordId) / saveWordData(wordId, data) with:
//       loadWordData → db.collection('content').doc(wordId).get()
//       saveWordData → db.collection('content').doc(wordId).set(data)
//     Audio/media file references point to Cloud Storage URLs stored here.
//
// Public API is identical to the old single-layer store — no callers change.
//
// Generation pattern (problem 2 — see contentTemplates.js):
//   Content is generated from templates per lane per category, not word-by-word.
//   The AI reads a template, generates instances for matching words, deposits here.
//   Designers edit templates; they never manage individual word content.

import { markContentReady } from './wordLayerTwo'

// ── Layer 1: Index ────────────────────────────────────────────

const INDEX_KEY = 'lapp-content-index'
let _indexCache = null

function loadIndex() {
  if (_indexCache !== null) return _indexCache
  try {
    _indexCache = JSON.parse(localStorage.getItem(INDEX_KEY) ?? '{}')
  } catch { _indexCache = {} }
  return _indexCache
}

function saveIndex() {
  localStorage.setItem(INDEX_KEY, JSON.stringify(_indexCache))
}

function indexSet(wordId, laneId, count) {
  const idx = loadIndex()
  if (!idx[wordId]) idx[wordId] = {}
  if (count === 0) {
    delete idx[wordId][laneId]
    if (Object.keys(idx[wordId]).length === 0) delete idx[wordId]
  } else {
    idx[wordId][laneId] = count
  }
  saveIndex()
}

// ── Layer 2: Data ─────────────────────────────────────────────
//
// One localStorage key per word: lapp-content-word-{wordId}
// getContent('want', 'reading') reads only lapp-content-word-want.
// No other word's data is touched.
//
// ── Firestore swap point ──────────────────────────────────────
// Replace loadWordData(wordId) / saveWordData(wordId, data) with:
//   loadWordData → db.collection('content').doc(wordId).get()
//   saveWordData → db.collection('content').doc(wordId).set(data)
// The per-word key maps directly onto one Firestore document per word.

const DATA_KEY_PREFIX = 'lapp-content-word-'

function loadWordData(wordId) {
  try {
    const raw = localStorage.getItem(DATA_KEY_PREFIX + wordId)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function saveWordData(wordId, wordData) {
  const key = DATA_KEY_PREFIX + wordId
  if (wordData && Object.keys(wordData).length > 0) {
    localStorage.setItem(key, JSON.stringify(wordData))
  } else {
    localStorage.removeItem(key)
  }
}

// ── Migration ─────────────────────────────────────────────────
// One-time migration from old single-key store to two-layer store.
// Safe to run repeatedly — skips if index already populated.

const OLD_KEY = 'lapp-content'

function migrateIfNeeded() {
  const idx = loadIndex()
  if (Object.keys(idx).length > 0) return // already migrated
  try {
    const raw = localStorage.getItem(OLD_KEY)
    if (!raw) return
    const old = JSON.parse(raw)
    for (const [wordId, lanes] of Object.entries(old)) {
      if (wordId === 'pronunciations') continue
      const wordData = {}
      for (const [laneId, items] of Object.entries(lanes ?? {})) {
        if (!Array.isArray(items) || items.length === 0) continue
        wordData[laneId] = items
        indexSet(wordId, laneId, items.length)
      }
      if (Object.keys(wordData).length > 0) {
        saveWordData(wordId, wordData)
      }
    }
    if (old.pronunciations) {
      localStorage.setItem(PRON_KEY, JSON.stringify(old.pronunciations))
    }
  } catch {}
}

// ── Public API ────────────────────────────────────────────────

// Existence check — reads index only. Never loads content data.
// This is the gate: call this before any AI/TTS generation.
export function hasContent(wordId, laneId) {
  return (loadIndex()[wordId]?.[laneId] ?? 0) > 0
}

// Returns { laneId: itemCount } for a word — index only, no content load.
// Useful for displaying coverage indicators without fetching content.
export function getContentSummary(wordId) {
  return loadIndex()[wordId] ?? {}
}

// Returns content items for a word+lane. Loads only that word's data.
export function getContent(wordId, laneId) {
  return loadWordData(wordId)[laneId] ?? []
}

// fields: string (becomes { text }) or object with lane-appropriate shape:
//   Reading/Speaking:  { text } or { prompt }
//   Listening:         { text, audioUrl }
export function addContent(wordId, laneId, fields) {
  const wordData = loadWordData(wordId)
  if (!wordData[laneId]) wordData[laneId] = []
  const item = typeof fields === 'string'
    ? { id: Date.now().toString(), text: fields }
    : { id: Date.now().toString(), ...fields }
  const isFirstContent = Object.values(wordData).every(lane => lane.length === 0)
  wordData[laneId].push(item)
  saveWordData(wordId, wordData)
  indexSet(wordId, laneId, wordData[laneId].length)
  if (isFirstContent) markContentReady(wordId)
}

export function updateContent(wordId, laneId, itemId, fields) {
  const wordData = loadWordData(wordId)
  const items = wordData[laneId]
  if (!items) return
  const item = items.find(i => i.id === itemId)
  if (!item) return
  if (typeof fields === 'string') {
    item.text = fields
  } else {
    Object.assign(item, fields)
  }
  saveWordData(wordId, wordData)
}

export function removeContent(wordId, laneId, itemId) {
  const wordData = loadWordData(wordId)
  const items = wordData[laneId]
  if (!items) return
  wordData[laneId] = items.filter(i => i.id !== itemId)
  saveWordData(wordId, wordData)
  indexSet(wordId, laneId, wordData[laneId].length)
}

// ── Pronunciation ─────────────────────────────────────────────

const PRON_KEY = 'lapp-pronunciations'

function loadPronunciations() {
  try { return JSON.parse(localStorage.getItem(PRON_KEY) ?? '{}') }
  catch { return {} }
}

export function getPronunciation(wordId) {
  return loadPronunciations()[wordId] ?? null
}

export function setPronunciation(wordId, url) {
  const prons = loadPronunciations()
  prons[wordId] = url.trim()
  localStorage.setItem(PRON_KEY, JSON.stringify(prons))
}

// ── Dev utilities ─────────────────────────────────────────────

// Returns the full index — which words have content and in which lanes.
// Use this for content management views instead of loading all content data.
export function getContentIndex() {
  return loadIndex()
}

migrateIfNeeded()
