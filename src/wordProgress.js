// wordProgress.js — aggregation layer between raw store data and UI.
//
// All translation from raw store state into displayable progress values lives here.
// UI components import from this file — they never compute progress directly from
// raw store data.
//
// If scoring logic changes (bonus multipliers, weighted attempts, etc.),
// update this file. The UI updates automatically.

import { LANES } from './lanes'
import { THRESHOLD } from './userStore'

// Returns the full progress state for a single word.
// Pass raw state from loadState() or live storeData.
//
//   lanes[laneId].attempts  — successful attempts, capped at THRESHOLD
//   lanes[laneId].graduated — word is in worldPools for this lane (lock fully dissolved)
//   mastery                 — 0–100. Stub: always 0 until World Sphere mechanic is built.
//                             When built, World Sphere usage writes here. Shape TBD.

export function getWordProgress(wordId, state) {
  const lanes = Object.fromEntries(
    LANES.map(({ id }) => {
      const raw = state.attempts[wordId]?.[id] ?? 0
      const attempts = Math.min(raw, THRESHOLD)
      const graduated = (state.worldPools[id] ?? []).includes(wordId)
      return [id, { attempts, graduated }]
    })
  )

  const fullyUnlocked = LANES.every(({ id }) => lanes[id].graduated)

  return {
    lanes,
    fullyUnlocked,
    mastery: 0,   // stub — World Sphere usage writes here. Shape TBD.
  }
}
