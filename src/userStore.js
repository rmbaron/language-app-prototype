// User-level store — all data here belongs to a specific user.
// In production this would be per-user in a database.
// Currently persisted to localStorage for prototype purposes.
//
// Three tiers of word progression:
//   wordBank   — words the user has added. Master list. Does not imply any practice.
//                The recommender excludes these. The Word Bank view renders from this.
//   wbPools    — subset of wordBank. Word enters after 1 successful attempt per lane.
//                Represents demonstrated familiarity. Used by practice content and
//                distractors — so only words the learner has actually earned appear
//                in other users' practice material.
//   worldPools — subset of wbPools. Word enters after THRESHOLD successful attempts.
//                Used by the World Sphere to generate prompts.

import { LANES } from './lanes'
import { recordLaneAttempt } from './learnerProfile'
import { notifyAttemptRecorded } from './sessionEvents'

const THRESHOLD = 3
const STORAGE_KEY = 'lapp-user-v2'

export const ACTIVE_LIMIT = 100   // max words in Active status — adjust freely

function emptyLanes() {
  return Object.fromEntries(LANES.map(l => [l.id, []]))
}

function defaults() {
  return {
    wordBank: [],        // all words the user has added, regardless of practice
    wbPools: emptyLanes(),
    worldPools: emptyLanes(),
    attempts: {},
    wordStatuses: {},    // wordId → 'active' | 'banked' | 'completed'
  }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const state = JSON.parse(raw)
      if (!state.wordBank) state.wordBank = []
      if (!state.wordStatuses) state.wordStatuses = {}
      return state
    }
    return defaults()
  } catch {
    return defaults()
  }
}

function save(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

// ── Word Bank membership ──────────────────────────────────────

// Add a word to the user's Word Bank (user-driven intake).
// Does not imply any practice — just that the word has been added.
export function addToWordBank(wordId) {
  const state = loadState()
  if (!state.wordBank.includes(wordId)) {
    state.wordBank.push(wordId)
    const activeCount = Object.values(state.wordStatuses).filter(s => s === 'active').length
    state.wordStatuses[wordId] = activeCount < ACTIVE_LIMIT ? 'active' : 'banked'
    save(state)
  }
}

export function isInWordBank(wordId) {
  const state = loadState()
  return (state.wordBank ?? []).includes(wordId)
}

export function getWordBank() {
  const state = loadState()
  return state.wordBank ?? []
}

// ── Attempts ──────────────────────────────────────────────────

export function recordAttempt(wordId, lane) {
  const state = loadState()
  if (!state.attempts[wordId]) {
    state.attempts[wordId] = Object.fromEntries(LANES.map(l => [l.id, 0]))
  }

  state.attempts[wordId][lane] += 1
  const count = state.attempts[wordId][lane]

  let activeCapped = false

  // Enter Word Bank internal pool on first successful attempt
  if (count === 1 && !state.wbPools[lane].includes(wordId)) {
    state.wbPools[lane].push(wordId)

    // Auto-promote to active on first practice in any lane
    if ((state.wordStatuses[wordId] ?? 'banked') === 'banked') {
      const activeCount = Object.values(state.wordStatuses).filter(s => s === 'active').length
      if (activeCount < ACTIVE_LIMIT) {
        state.wordStatuses[wordId] = 'active'
      } else {
        activeCapped = true
      }
    }
  }

  // Graduate to World Sphere pool at threshold
  const alreadyInWorld = state.worldPools[lane].includes(wordId)
  let graduated = false
  if (count >= THRESHOLD && !alreadyInWorld) {
    state.worldPools[lane].push(wordId)
    graduated = true
  }

  save(state)
  recordLaneAttempt(lane)
  const result = { count, threshold: THRESHOLD, graduated, alreadyGraduated: alreadyInWorld, activeCapped }
  notifyAttemptRecorded(wordId, lane, result, state)
  return result
}

export function markKnown(wordId, lane) {
  const state = loadState()
  if (!state.wbPools[lane].includes(wordId)) {
    state.wbPools[lane].push(wordId)
  }
  if (!state.worldPools[lane].includes(wordId)) {
    state.worldPools[lane].push(wordId)
  }
  save(state)
}

// Returns all words the user has practiced at least once in any lane.
// This is the "known for content" definition — one successful attempt
// in any lane is the threshold for a word being usable as context in prompts.
// A flat union across all wbPools lanes.
export function getPracticedWords() {
  const state = loadState()
  const union = new Set()
  LANES.forEach(({ id }) => {
    (state.wbPools[id] ?? []).forEach(w => union.add(w))
  })
  return [...union]
}

// Returns all word IDs graduated to World Sphere in any lane (union across all lanes).
// Used by the slot practice system to know what words are available.
export function getGraduatedWordIds(state) {
  const union = new Set()
  LANES.forEach(({ id }) => {
    (state.worldPools[id] ?? []).forEach(wordId => union.add(wordId))
  })
  return [...union]
}

// Returns words currently in the Word Bank active pool for a lane
// (in progress — entered but not yet graduated to World Sphere)
export function getWbActiveWords(lane, state) {
  const wb = state.wbPools[lane] ?? []
  const world = state.worldPools[lane] ?? []
  return wb.filter(id => !world.includes(id))
}

// Remove a word from the Word Bank entirely.
// Clears all pools and attempts for the word so it becomes recommendable again.
export function removeFromWordBank(wordId) {
  const state = loadState()
  state.wordBank = state.wordBank.filter(id => id !== wordId)
  LANES.forEach(({ id }) => {
    state.wbPools[id] = (state.wbPools[id] ?? []).filter(w => w !== wordId)
    state.worldPools[id] = (state.worldPools[id] ?? []).filter(w => w !== wordId)
  })
  delete state.attempts[wordId]
  delete state.wordStatuses[wordId]
  save(state)
}

// ── Word status ───────────────────────────────────────────────
// 'active'    — being actively practiced (capped at ACTIVE_LIMIT)
// 'banked'    — in the bank but not actively worked on
// 'completed' — met the completion criteria (criteria TBD, manually settable for now)

export function getWordStatus(wordId) {
  const state = loadState()
  return state.wordStatuses[wordId] ?? 'banked'
}

export function setWordStatus(wordId, status) {
  const state = loadState()
  if (status === 'active') {
    const activeCount = Object.values(state.wordStatuses).filter(s => s === 'active').length
    const alreadyActive = state.wordStatuses[wordId] === 'active'
    if (!alreadyActive && activeCount >= ACTIVE_LIMIT) return { capped: true }
  }
  state.wordStatuses[wordId] = status
  save(state)
  return { capped: false }
}

export function getActiveCount() {
  const state = loadState()
  return Object.values(state.wordStatuses).filter(s => s === 'active').length
}

export function getWordStatuses() {
  const state = loadState()
  return state.wordStatuses
}

// ── Dev / reset utilities ─────────────────────────────────────

// Remove a single word from all pools and clear its attempt counts.
// Does not remove it from wordBank — the word stays added, just unpracticed.
export function resetWord(wordId) {
  const state = loadState()
  LANES.forEach(({ id }) => {
    state.wbPools[id] = (state.wbPools[id] ?? []).filter(w => w !== wordId)
    state.worldPools[id] = (state.worldPools[id] ?? []).filter(w => w !== wordId)
  })
  delete state.attempts[wordId]
  save(state)
}

// Wipe all user progress — pools, attempts. Keeps wordBank intact.
export function resetAllProgress() {
  const state = loadState()
  state.wbPools = emptyLanes()
  state.worldPools = emptyLanes()
  state.attempts = {}
  save(state)
}

// Full wipe including wordBank — back to a completely fresh state.
export function resetAll() {
  localStorage.removeItem(STORAGE_KEY)
}

export { THRESHOLD }
