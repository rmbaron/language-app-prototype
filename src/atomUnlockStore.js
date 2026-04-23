// Atom Unlock Store
//
// Tracks which grammar atom classes the learner has unlocked via their pioneer word.
// This is grammar state — separate from the word bank (vocabulary state).
//
// Shape: { [atomId]: { unlockedAt: timestamp, pioneerWordId: string } }
//
// Rules:
// - An atom is unlocked when its pioneer word is banked
// - Until unlocked, no other word of that atom class can be surfaced by the recommender
// - Unlocking is an event, not a derived scan — stored explicitly so it can be rewound
// - progressive_auxiliary has no pioneer; it is derived in getLearnerGrammarState,
//   not stored here

export const ATOM_UNLOCKS_KEY = 'lapp-atom-unlocks'

function load() {
  try {
    return JSON.parse(localStorage.getItem(ATOM_UNLOCKS_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function save(data) {
  localStorage.setItem(ATOM_UNLOCKS_KEY, JSON.stringify(data))
}

// Returns the full unlock map: { [atomId]: { unlockedAt, pioneerWordId } }
export function getAtomUnlocks() {
  return load()
}

// Returns true if the atom class has been unlocked
export function isAtomUnlocked(atomId) {
  return atomId in load()
}

// Unlocks an atom class, recording which pioneer word triggered it
export function unlockAtom(atomId, pioneerWordId) {
  const data = load()
  if (data[atomId]) return // already unlocked — no-op
  data[atomId] = { unlockedAt: Date.now(), pioneerWordId }
  save(data)
}

// Locks an atom class (rewind). Does not touch the word bank.
export function lockAtom(atomId) {
  const data = load()
  delete data[atomId]
  save(data)
}

// Locks all atoms in a given cluster and above (rewind cluster N).
// clusterAtomIds: flat array of atomIds to lock.
export function lockAtoms(atomIds) {
  const data = load()
  for (const atomId of atomIds) delete data[atomId]
  save(data)
}

// Wipes all unlocks. For testing only.
export function clearAtomUnlocks() {
  localStorage.removeItem(ATOM_UNLOCKS_KEY)
}
