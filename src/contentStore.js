// System-level content store — not per user.
// Holds practice material for each word in each lane.
// Generated once, drawn from by any user.
// In production this would live in a shared database.
//
// Content item shape per lane (refined as each lane is built):
//   Reading:   { id, text }
//   Writing:   { id, prompt }
//   Listening: { id, text, audioUrl }
//   Speaking:  { id, prompt }

import words from './wordData'
import { LANES } from './lanes'

const STORAGE_KEY = 'lapp-content'

function buildDefaults() {
  return {
    pronunciations: {},
    ...Object.fromEntries(
      words.map(word => [
        word.id,
        Object.fromEntries(LANES.map(l => [l.id, []]))
      ])
    )
  }
}

function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return buildDefaults()
}

const store = loadStore()

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

function ensureWord(wordId) {
  if (!store[wordId]) {
    store[wordId] = Object.fromEntries(LANES.map(l => [l.id, []]))
  }
}

export function getContent(wordId, laneId) {
  return store[wordId]?.[laneId] ?? []
}

export function hasContent(wordId, laneId) {
  return (store[wordId]?.[laneId]?.length ?? 0) > 0
}

// fields can be { text } for most lanes, or { text, audioUrl } for Listening
export function addContent(wordId, laneId, fields) {
  ensureWord(wordId)
  const item = typeof fields === 'string'
    ? { id: Date.now().toString(), text: fields }
    : { id: Date.now().toString(), ...fields }
  store[wordId][laneId].push(item)
  save()
}

export function updateContent(wordId, laneId, itemId, fields) {
  const items = store[wordId]?.[laneId]
  if (!items) return
  const item = items.find(i => i.id === itemId)
  if (item) {
    if (typeof fields === 'string') {
      item.text = fields
    } else {
      Object.assign(item, fields)
    }
    save()
  }
}

export function removeContent(wordId, laneId, itemId) {
  if (!store[wordId]?.[laneId]) return
  store[wordId][laneId] = store[wordId][laneId].filter(i => i.id !== itemId)
  save()
}

// ── Word-level pronunciation ──────────────────────────────────

export function getPronunciation(wordId) {
  return store.pronunciations?.[wordId] ?? null
}

export function setPronunciation(wordId, url) {
  if (!store.pronunciations) store.pronunciations = {}
  store.pronunciations[wordId] = url.trim()
  save()
}

export function getStore() {
  return store
}
