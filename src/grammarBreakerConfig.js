// Grammar Breaker Config
//
// Per-pattern, per-group, and master toggles for the grammar circuit breaker.
// Every pattern is on by default. Disabling skips the pattern in the validator
// — failures it would have caused stop firing.
//
// Used to iterate the pattern library without losing a day testing every rule
// when only one needs work. Bake this in from day one.
//
// Storage: lapp-grammar-breaker-config
// Shape:   { masterEnabled: bool, patterns: { [id]: bool }, groups: { [id]: bool } }
// Missing entries default to enabled.

const STORAGE_KEY = 'lapp-grammar-breaker-config'

const DEFAULT = { masterEnabled: true, patterns: {}, groups: {} }

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT }
    const parsed = JSON.parse(raw)
    return {
      masterEnabled: parsed.masterEnabled ?? true,
      patterns:      parsed.patterns      ?? {},
      groups:        parsed.groups        ?? {},
    }
  } catch {
    return { ...DEFAULT }
  }
}

function save(config) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)) }
  catch { /* storage full — ignore */ }
}

export function getBreakerConfig() {
  return load()
}

// True if this pattern should fire — checks master, group, and per-pattern toggle.
export function isPatternEnabled(patternId, groupId) {
  const c = load()
  if (c.masterEnabled === false) return false
  if (groupId && c.groups[groupId] === false) return false
  if (c.patterns[patternId] === false) return false
  return true
}

export function setPatternEnabled(patternId, enabled) {
  const c = load()
  if (enabled) delete c.patterns[patternId]
  else         c.patterns[patternId] = false
  save(c)
}

export function setGroupEnabled(groupId, enabled) {
  const c = load()
  if (enabled) delete c.groups[groupId]
  else         c.groups[groupId] = false
  save(c)
}

export function setMasterEnabled(enabled) {
  const c = load()
  c.masterEnabled = enabled
  save(c)
}

export function resetBreakerConfig() {
  try { localStorage.removeItem(STORAGE_KEY) } catch {}
}
