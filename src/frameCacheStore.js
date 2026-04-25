// Frame Cache Store
//
// Stores sentence frame pools keyed by atom-unlock state + language.
// A frame is a slot sequence template — no words, just structure.
// Words from the learner's bank fill slots at runtime via the assembler.
//
// State hash: sorted join of unlocked atom IDs.
// e.g. ['lexical_verb', 'personal_pronoun'] → 'lexical_verb|personal_pronoun'
//
// Storage key: lapp-frame-cache-{lang}-{stateHash}
// Schema: Frame[] where Frame = { slotIds: string[] }

const PREFIX = 'lapp-frame-cache-'

function storageKey(lang, stateHash) {
  return `${PREFIX}${lang}-${stateHash}`
}

// Returns a stable, order-independent hash for a set of unlocked atom IDs.
export function getStateHash(unlockedAtomIds) {
  return [...unlockedAtomIds].sort().join('|')
}

export function getCachedFrames(lang, stateHash) {
  try {
    const raw = localStorage.getItem(storageKey(lang, stateHash))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setCachedFrames(lang, stateHash, frames) {
  localStorage.setItem(storageKey(lang, stateHash), JSON.stringify(frames))
}

export function hasCachedFrames(lang, stateHash) {
  return localStorage.getItem(storageKey(lang, stateHash)) !== null
}

export function clearCachedFrames(lang, stateHash) {
  localStorage.removeItem(storageKey(lang, stateHash))
}

// Wipes all frame caches for a language — use when atom definitions change.
export function clearAllFrameCaches(lang) {
  const prefix = `${PREFIX}${lang}-`
  Object.keys(localStorage)
    .filter(k => k.startsWith(prefix))
    .forEach(k => localStorage.removeItem(k))
}
