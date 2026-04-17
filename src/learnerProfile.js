// Learner Profile — user-level, not per-word.
// Builds a holistic picture of who the learner is.
// Two top-level sections, each with two sub-sections:
//
// observed   — derived automatically from system activity, no user input needed
//   behavioral  — how the user practices (habits, patterns, lane preferences)
//   performance — how well the user does (success rates, progression speed)
//
// expressed  — gathered through deliberate interaction with the user
//   stable      — facts that rarely change (native language, learning goal)
//   preferences — evolving context (interests, topics, what they find hard)
//
// Other systems read from this profile to make decisions.
// Nothing should reach into userStore or contentStore to derive
// learner-level context — ask the profile instead.

import { LANES } from './lanes'

const STORAGE_KEY = 'lapp-profile'

function defaults() {
  return {
    observed: {

      // How the user practices — updated automatically from usage
      behavioral: {
        totalSessions: 0,
        lastActiveDate: null,
        lanePreferences: Object.fromEntries(LANES.map(l => [l.id, 0])), // attempt counts per lane
        averageSessionLength: null, // future
      },

      // How well the user does — updated automatically from results
      performance: {
        successRates: Object.fromEntries(LANES.map(l => [l.id, null])), // null until enough data
        progressionSpeed: null,   // future — how fast words move through pools
        currentDepthLevel: 1,     // derived holistically, used by all lane components
      },

    },

    expressed: {

      // Stable facts — gathered at onboarding or through direct questions
      // Rarely changes once set
      stable: {
        nativeLanguage: null,
        learningGoal: null,       // e.g. "trip", "work", "fluency"
        learningGoalNote: null,   // optional free-text: why they're learning, in their own words
        targetLanguage: 'en',
        selfReportedLevel: null,  // beginner / elementary / intermediate / upper_intermediate
      },

      // Evolving preferences — gathered through practice interactions
      // Updates as the app learns more about the user
      preferences: {
        topics: [],               // e.g. ["food", "travel", "sports"]
        knownDifficulties: [],    // e.g. ["pronunciation", "verb conjugation"]
        responseStyle: null,      // future — how they like to be addressed
        personalizationLevel: null, // 'general' | 'blended' | 'personal'
      },

    },
  }
}

export function loadProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : defaults()
  } catch {
    return defaults()
  }
}

export function resetProfile() {
  localStorage.removeItem(STORAGE_KEY)
}

function save(profile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
}

// ── Observed: behavioral ──────────────────────────────────────

export function recordSession() {
  const profile = loadProfile()
  profile.observed.behavioral.totalSessions += 1
  profile.observed.behavioral.lastActiveDate = new Date().toISOString()
  save(profile)
}

export function recordLaneAttempt(laneId) {
  const profile = loadProfile()
  profile.observed.behavioral.lanePreferences[laneId] =
    (profile.observed.behavioral.lanePreferences[laneId] ?? 0) + 1
  save(profile)
}

// ── Observed: performance ─────────────────────────────────────

export function updateDepthLevel(level) {
  const profile = loadProfile()
  profile.observed.performance.currentDepthLevel = level
  save(profile)
}

export function getDepthLevel() {
  const profile = loadProfile()
  return profile.observed.performance.currentDepthLevel ?? 1
}

// ── Expressed: stable ─────────────────────────────────────────

export function getActiveLanguage() {
  const profile = loadProfile()
  return profile.expressed.stable.targetLanguage ?? 'en'
}

export function setActiveLanguage(langId) {
  const profile = loadProfile()
  profile.expressed.stable.targetLanguage = langId
  save(profile)
}

export function setStable(fields) {
  const profile = loadProfile()
  Object.assign(profile.expressed.stable, fields)
  save(profile)
}

// ── Expressed: preferences ────────────────────────────────────

export function addTopic(topic) {
  const profile = loadProfile()
  if (!profile.expressed.preferences.topics.includes(topic)) {
    profile.expressed.preferences.topics.push(topic)
    save(profile)
  }
}

export function addDifficulty(difficulty) {
  const profile = loadProfile()
  if (!profile.expressed.preferences.knownDifficulties.includes(difficulty)) {
    profile.expressed.preferences.knownDifficulties.push(difficulty)
    save(profile)
  }
}

export function setPreference(key, value) {
  const profile = loadProfile()
  profile.expressed.preferences[key] = value
  save(profile)
}
