import { getActiveProfileId } from './profileStore'
import { getActiveLanguage } from './learnerProfile'

const SESSION_KEY = 'lapp-session-id'

export function getSessionId() {
  let id = sessionStorage.getItem(SESSION_KEY)
  if (!id) {
    id = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    sessionStorage.setItem(SESSION_KEY, id)
  }
  return id
}

const LANES = ['writing', 'speaking', 'reading', 'listening']

function key(profileId, lang, wordId) {
  return `lapp-usage-${profileId}-${lang}-${wordId}`
}

function empty() {
  return Object.fromEntries(
    LANES.map(lane => [lane, { count: 0, sessions: 0, lastAt: null }])
  )
}

export function getUsage(wordId) {
  const profileId = getActiveProfileId()
  const lang = getActiveLanguage()
  const raw = localStorage.getItem(key(profileId, lang, wordId))
  return raw ? JSON.parse(raw) : empty()
}

function save(wordId, data) {
  const profileId = getActiveProfileId()
  const lang = getActiveLanguage()
  localStorage.setItem(key(profileId, lang, wordId), JSON.stringify(data))
}

// sessionId should be a stable string for the current session (e.g. from sessionStorage)
export function recordUse(wordId, lane, quality = 1, sessionId = null) {
  const usage = getUsage(wordId)
  const laneData = usage[lane]
  laneData.count += 1
  laneData.lastAt = Date.now()
  // Only count a new session if the sessionId is new for this lane
  const sessionKey = `lapp-sess-${getActiveProfileId()}-${getActiveLanguage()}-${wordId}-${lane}`
  const lastSession = sessionStorage.getItem(sessionKey)
  if (sessionId && lastSession !== sessionId) {
    laneData.sessions += 1
    sessionStorage.setItem(sessionKey, sessionId)
  } else if (!sessionId) {
    laneData.sessions += 1
  }
  save(wordId, usage)
}

export function clearUsage(wordId) {
  const profileId = getActiveProfileId()
  const lang = getActiveLanguage()
  localStorage.removeItem(key(profileId, lang, wordId))
}

// Clears usage for every word in the given list, or pass null to scan all keys
export function clearAllUsage(wordIds = null) {
  const profileId = getActiveProfileId()
  const lang = getActiveLanguage()
  if (wordIds) {
    wordIds.forEach(id => localStorage.removeItem(key(profileId, lang, id)))
    return
  }
  const prefix = `lapp-usage-${profileId}-${lang}-`
  Object.keys(localStorage)
    .filter(k => k.startsWith(prefix))
    .forEach(k => localStorage.removeItem(k))
}
