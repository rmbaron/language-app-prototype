// Atom Index
//
// The stable, global, language-scoped directory of words organized by atom class and level.
// Written by the pipeline after L2 enrichment — the "coating" step.
// Read by the recommender, constructor, and content systems at runtime.
//
// This is the runtime-facing atom layer. Nothing at runtime reads L2 directly —
// this index is what they read instead.
//
// Storage key: lapp-atom-index-{lang}
// Schema: { [atomId]: { [cefrLevel]: wordId[] } }
//
// Queries are cumulative: getWordsForAtom('noun', 'en', 'A2') returns
// all A1 + A2 nouns combined. Level ordering comes from cefrLevels.js.
//
// Structure-unlock atoms (progressive_auxiliary, perfect_auxiliary) are NOT
// indexed here — they are derived at runtime via STRUCTURE_UNLOCKS in
// learnerGrammarState.js. Queries for those atoms return [] gracefully.
//
// Write functions are pipeline/dev-tool only. Runtime systems only read.

import { getLevels } from './cefrLevels'

function storageKey(lang) {
  return `lapp-atom-index-${lang}`
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

// Returns all level IDs up to and including the given level, in order.
function levelsUpTo(levelId) {
  const all = getLevels().map(l => l.id)
  const idx = all.indexOf(levelId)
  return idx === -1 ? [levelId] : all.slice(0, idx + 1)
}

// ── Read ──────────────────────────────────────────────────────────────────────

// Returns all word IDs for the given atom, cumulative up to and including levelId.
export function getWordsForAtom(atomId, lang, levelId) {
  const index = load(lang)
  const buckets = index[atomId]
  if (!buckets) return []
  return levelsUpTo(levelId).flatMap(l => buckets[l] ?? [])
}

// Returns the raw index object — for pipeline visibility and dev tools only.
export function getAtomIndex(lang) {
  return load(lang)
}

// Returns the current atom + level position of a word in the index, or null if not found.
// Used by the pipeline before updateWordInIndex to locate the old position.
export function findWordInIndex(wordId, lang) {
  const index = load(lang)
  for (const [atomId, levels] of Object.entries(index)) {
    for (const [cefrLevel, ids] of Object.entries(levels)) {
      if (ids.includes(wordId)) return { atomId, cefrLevel }
    }
  }
  return null
}

// ── Write (pipeline only) ─────────────────────────────────────────────────────

// Adds a word to the index after the pipeline coating step.
// Deduplicates within each bucket — safe to call multiple times.
export function addWordToIndex(wordId, atomId, cefrLevel, lang) {
  const index = load(lang)
  if (!index[atomId]) index[atomId] = {}
  if (!index[atomId][cefrLevel]) index[atomId][cefrLevel] = []
  if (!index[atomId][cefrLevel].includes(wordId)) {
    index[atomId][cefrLevel].push(wordId)
  }
  save(lang, index)
}

// Removes a word from a specific atom + level bucket.
export function removeWordFromIndex(wordId, atomId, cefrLevel, lang) {
  const index = load(lang)
  if (!index[atomId]?.[cefrLevel]) return
  index[atomId][cefrLevel] = index[atomId][cefrLevel].filter(id => id !== wordId)
  save(lang, index)
}

// Moves a word when re-enrichment changes its atom or level.
// Caller is responsible for knowing the old and new positions.
export function updateWordInIndex(wordId, { oldAtom, oldLevel, newAtom, newLevel, lang }) {
  removeWordFromIndex(wordId, oldAtom, oldLevel, lang)
  addWordToIndex(wordId, newAtom, newLevel, lang)
}

// Wipes and rebuilds the entire index for a language.
// Pipeline/dev tool only — never called at runtime.
//
// Accepts allEnrichedWords: [{ id, atomId, cefrLevel }]
// The caller (pipeline) reads L2 and passes data in — atomIndex.js stays
// free of any L2 dependency even during a full rebuild.
export function rebuildAtomIndex(lang, allEnrichedWords) {
  const index = {}
  for (const { id, atomId, cefrLevel } of allEnrichedWords) {
    if (!atomId || !cefrLevel) continue
    if (!index[atomId]) index[atomId] = {}
    if (!index[atomId][cefrLevel]) index[atomId][cefrLevel] = []
    if (!index[atomId][cefrLevel].includes(id)) {
      index[atomId][cefrLevel].push(id)
    }
  }
  save(lang, index)
  touchRebuiltAt(lang)
}

// Wipes the entire index for a language — use before rebuildAtomIndex
// or when atom definitions change and a full re-coating is needed.
export function clearAtomIndex(lang) {
  localStorage.removeItem(storageKey(lang))
  localStorage.removeItem(`${storageKey(lang)}-rebuilt`)
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export function getAtomIndexRebuiltAt(lang) {
  return localStorage.getItem(`${storageKey(lang)}-rebuilt`) ?? null
}

function touchRebuiltAt(lang) {
  localStorage.setItem(`${storageKey(lang)}-rebuilt`, new Date().toISOString())
}
