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
        targetLanguage: 'en',     // the language the user is learning
        interfaceLanguage: null,  // the language the app UI appears in
                                  // defaults to nativeLanguage → 'en' if not set
                                  // set this explicitly when the user wants a different UI language
        supportLanguage: null,    // the language used for definitions, translations, learner explanations
                                  // defaults to nativeLanguage → 'en' if not set
                                  // needed from day one: definitions must be in a language the learner knows
        learningGoal: null,       // e.g. "trip", "work", "fluency"
        learningGoalNote: null,   // optional free-text: why they're learning, in their own words
        selfReportedLevel: null,  // beginner / elementary / intermediate / upper_intermediate
        cefrLevel: null,          // CEFR level ID: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
                                  // Set at onboarding and updated as the learner progresses.
                                  // Not shown directly to the user — used internally by all systems.
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

// The language the app UI appears in.
// Falls back through: interfaceLanguage → nativeLanguage → 'en'
export function getInterfaceLanguage() {
  const profile = loadProfile()
  return profile.expressed.stable.interfaceLanguage
    ?? profile.expressed.stable.nativeLanguage
    ?? 'en'
}

// The language used for word definitions, translations, and learner explanations.
// Falls back through: supportLanguage → nativeLanguage → 'en'
// Needed from day one — a learner cannot be expected to read definitions
// in the language they are still learning.
export function getSupportLanguage() {
  const profile = loadProfile()
  return profile.expressed.stable.supportLanguage
    ?? profile.expressed.stable.nativeLanguage
    ?? 'en'
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

// ── CEFR level ───────────────────────────────────────────────
//
// Maps the four onboarding self-report options to starting CEFR levels.
// These are conservative starting points — the system may adjust upward
// as it observes actual performance.
const SELF_REPORT_TO_CEFR = {
  beginner:           'A1',
  elementary:         'A2',
  intermediate:       'B1',
  upper_intermediate: 'B2',
}

// Returns the active CEFR level ID, or null if not yet set.
export function getCefrLevel() {
  const profile = loadProfile()
  return profile.expressed.stable.cefrLevel ?? null
}

// Set CEFR level directly (e.g. from dev tools or future progression logic).
export function setCefrLevel(levelId) {
  const profile = loadProfile()
  profile.expressed.stable.cefrLevel = levelId
  save(profile)
}

// Derive and store a CEFR level from a selfReportedLevel string.
// Called during onboarding when selfReportedLevel is set.
export function applyCefrFromSelfReport(selfReportedLevel) {
  const mapped = SELF_REPORT_TO_CEFR[selfReportedLevel]
  if (mapped) setCefrLevel(mapped)
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
