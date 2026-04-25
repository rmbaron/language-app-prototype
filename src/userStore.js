// User-level store — all data here belongs to a specific user.
// In production this would be per-user in a database.
// Currently persisted to localStorage for prototype purposes.
//
// Word progression tiers:
//
//   [trial]    — word is being attempted in a lane (from the Recommender) but has not
//                yet earned bank entry. Not explicitly tracked yet — will be added when
//                the trial UI is built. For now, words in this state have attempts but
//                no wordBank entry.
//
//   wordBank   — word has earned entry. Entry condition is controlled by BANK_ENTRY_REQUIREMENT.
//                The recommender excludes these. The Word Bank view renders from this.
//                Under 'full_lane' mode: word enters the bank with one lane already complete.
//
//   wbPools    — per-lane pool. Word enters after 1 successful attempt in that lane.
//                Represents demonstrated familiarity — only these words appear as
//                distractors or context in other learners' practice material.
//                Note: under 'full_lane' mode a word enters wbPools (and worldPools)
//                before it enters wordBank. The trial phase runs outside the bank.
//
//   worldPools — per-lane pool. Word enters after THRESHOLD successful attempts in a lane.
//                Used by the World Sphere to generate prompts.
//                Under 'full_lane' mode: graduating a lane also banks the word.

import { LANES } from './lanes'
import { recordLaneAttempt } from './learnerProfile'
import { notifyAttemptRecorded } from './sessionEvents'
import { clearWordAttributeCache } from './wordAttributes'

const THRESHOLD = 3
const STORAGE_KEY = 'lapp-user-v2'

export const ACTIVE_LIMIT = 100   // max words in Active status — adjust freely

// ── Bank entry requirement ────────────────────────────────────
//
// Controls when a word is added to the Word Bank.
//
//   'direct'       — user taps "+ Add" in the Recommender; no practice required.
//                    Dev/prototype shortcut only.
//   'one_success'  — word banks automatically on the first successful lane attempt.
//   'full_lane'    — word banks automatically when a lane is fully graduated
//                    (THRESHOLD successes). Word enters the bank with one lane
//                    already complete — Word Bank UI shows 3 remaining locks.
//
// Changing this constant is the only thing needed to switch modes.
// The trial UI (not yet built) will replace the 'direct' dev shortcut.

export const BANK_ENTRY_REQUIREMENT = 'full_lane'

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

// Internal: mutates state in place without saving. Shared by addToWordBank and recordAttempt.
function _bankWord(state, wordId) {
  if (state.wordBank.includes(wordId)) return
  state.wordBank.push(wordId)
  const activeCount = Object.values(state.wordStatuses).filter(s => s === 'active').length
  state.wordStatuses[wordId] = activeCount < ACTIVE_LIMIT ? 'active' : 'banked'
}

// Direct bank addition — only appropriate for BANK_ENTRY_REQUIREMENT === 'direct'
// and for dev/prototype use while the trial UI is not yet built.
// Under 'one_success' and 'full_lane' modes, banking happens automatically inside
// recordAttempt — this function should not be called from UI buttons.
export function addToWordBank(wordId) {
  const state = loadState()
  _bankWord(state, wordId)
  save(state)
}

export function isInWordBank(wordId) {
  const state = loadState()
  return (state.wordBank ?? []).includes(wordId)
}

export function getWordBank() {
  const state = loadState()
  return state.wordBank ?? []
}

// ── Recommender queue ─────────────────────────────────────────
// Stub — stores words the user wants the recommender to surface.
// Wired properly when the recommender queue architecture is built.

const RECOMMENDER_QUEUE_KEY = 'lapp-recommender-queue'

export function addToRecommenderQueue(wordId) {
  try {
    const raw   = localStorage.getItem(RECOMMENDER_QUEUE_KEY)
    const queue = raw ? JSON.parse(raw) : []
    if (!queue.includes(wordId)) {
      queue.push(wordId)
      localStorage.setItem(RECOMMENDER_QUEUE_KEY, JSON.stringify(queue))
    }
  } catch { /* storage full */ }
}

export function getRecommenderQueue() {
  try {
    const raw = localStorage.getItem(RECOMMENDER_QUEUE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
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

  // Auto-bank based on BANK_ENTRY_REQUIREMENT
  // 'direct'      — banking is handled externally (addToWordBank), not here
  // 'one_success' — bank on the very first attempt in any lane
  // 'full_lane'   — bank when a lane is fully graduated (THRESHOLD successes)
  if (BANK_ENTRY_REQUIREMENT === 'one_success' && count === 1) {
    _bankWord(state, wordId)
  } else if (BANK_ENTRY_REQUIREMENT === 'full_lane' && graduated) {
    _bankWord(state, wordId)
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
  clearWordAttributeCache()
}

export { THRESHOLD }
