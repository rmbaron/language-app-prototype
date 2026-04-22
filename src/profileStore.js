// Profile Store — saves and restores named learner states.
//
// A profile is a snapshot of the per-learner localStorage keys.
// Loading a profile writes those keys back and reloads the page,
// so the whole app wakes up as that learner — no special modes needed.
//
// Global keys (L1/L2 enrichment, pronunciation cache, etc.) are NOT
// snapshotted — they belong to the words, not the learner.

const PROFILES_KEY  = 'lapp-profiles'
const ACTIVE_ID_KEY = 'lapp-active-profile-id'
const DEFAULT_ID    = '__default__'

// Keys that belong to the learner, not the words
const LEARNER_STATIC_KEYS = [
  'lapp-user-v2',
  'lapp-profile',
  'lapp-content-index',
]

const CONTENT_WORD_PREFIX = 'lapp-content-word-'

function contentWordKeys() {
  return Object.keys(localStorage).filter(k => k.startsWith(CONTENT_WORD_PREFIX))
}

function captureSnapshot() {
  const snapshot = {}
  for (const key of [...LEARNER_STATIC_KEYS, ...contentWordKeys()]) {
    const val = localStorage.getItem(key)
    if (val !== null) snapshot[key] = val
  }
  return snapshot
}

function restoreSnapshot(snapshot) {
  // Remove all current learner keys
  for (const key of [...LEARNER_STATIC_KEYS, ...contentWordKeys()]) {
    localStorage.removeItem(key)
  }
  // Write snapshot
  for (const [key, val] of Object.entries(snapshot)) {
    localStorage.setItem(key, val)
  }
}

function loadAll() {
  try { return JSON.parse(localStorage.getItem(PROFILES_KEY) ?? '{}') }
  catch { return {} }
}

function saveAll(profiles) {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles))
}

function wordCountFromSnapshot(snapshot) {
  try {
    const state = JSON.parse(snapshot['lapp-user-v2'] ?? '{}')
    return state.wordBank?.length ?? 0
  } catch { return 0 }
}

// ── Public API ────────────────────────────────────────────────

export function getActiveProfileId() {
  return localStorage.getItem(ACTIVE_ID_KEY) ?? null
}

export function getActiveProfileName() {
  const id = getActiveProfileId()
  if (!id) return null
  return loadAll()[id]?.name ?? null
}

export function getActiveProfileCefrLevel() {
  const id = getActiveProfileId()
  if (!id) return null
  return loadAll()[id]?.cefrLevel ?? null
}

export function listProfiles() {
  const all = loadAll()
  return Object.entries(all)
    .filter(([id]) => id !== DEFAULT_ID)
    .map(([id, p]) => ({
      id,
      name:      p.name,
      cefrLevel: p.cefrLevel,
      savedAt:   p.savedAt,
      wordCount: p.wordCount,
    }))
    .sort((a, b) => b.savedAt - a.savedAt)
}

export function createProfile(name, cefrLevel) {
  const all = loadAll()

  // Preserve dev default before first profile is created
  if (!getActiveProfileId() && !all[DEFAULT_ID]) {
    all[DEFAULT_ID] = { name: 'Dev default', snapshot: captureSnapshot(), savedAt: Date.now() }
  }

  const blankSnapshot = {
    'lapp-user-v2': JSON.stringify({
      wordBank: [], wbPools: {}, worldPools: {}, attempts: {}, wordStatuses: {},
    }),
  }

  const id = `profile_${Date.now()}`
  all[id] = { name, cefrLevel, snapshot: blankSnapshot, savedAt: Date.now(), wordCount: 0 }
  saveAll(all)
  return id
}

export function saveAsProfile(name, cefrLevel) {
  const all      = loadAll()
  const snapshot = captureSnapshot()

  if (!getActiveProfileId() && !all[DEFAULT_ID]) {
    all[DEFAULT_ID] = { name: 'Dev default', snapshot, savedAt: Date.now() }
  }

  const id = `profile_${Date.now()}`
  all[id] = { name, cefrLevel, snapshot, savedAt: Date.now(), wordCount: wordCountFromSnapshot(snapshot) }
  saveAll(all)
  return id
}

export function activateProfile(id) {
  const all = loadAll()
  if (!all[id]) return

  // Save dev default before switching away for the first time
  if (!getActiveProfileId() && !all[DEFAULT_ID]) {
    all[DEFAULT_ID] = { name: 'Dev default', snapshot: captureSnapshot(), savedAt: Date.now() }
    saveAll(all)
  }

  restoreSnapshot(all[id].snapshot)
  localStorage.setItem(ACTIVE_ID_KEY, id)
  window.location.reload()
}

export function deactivate() {
  const all = loadAll()
  if (all[DEFAULT_ID]) restoreSnapshot(all[DEFAULT_ID].snapshot)
  localStorage.removeItem(ACTIVE_ID_KEY)
  window.location.reload()
}

export function saveActiveProfileSnapshot() {
  const id = getActiveProfileId()
  if (!id) return
  const all = loadAll()
  if (!all[id]) return
  const snapshot = captureSnapshot()
  all[id].snapshot  = snapshot
  all[id].wordCount = wordCountFromSnapshot(snapshot)
  all[id].savedAt   = Date.now()
  saveAll(all)
}

export function deleteProfile(id) {
  const all = loadAll()
  delete all[id]
  saveAll(all)
}
