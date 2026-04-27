// ── Word Mastery Scoring ──────────────────────────────────────────────────────
//
// This is the only file that defines how usage data becomes a score.
// Change this file freely — nothing else in the app needs to change.
//
// LANE_CONFIG controls:
//   weight   — how much of the 0–100 total this lane is worth
//   halfAt   — how many uses get you to 50% of this lane's fill
//              (lower = fills faster, e.g. reading needs less repetition)
//
// The curve: score = weight × count / (count + halfAt)
//   0 uses   → 0
//   halfAt   → 50% of lane max
//   3×halfAt → 75% of lane max
//   ∞        → asymptotic to lane max (never quite full — intentional)

const LANE_CONFIG = {
  writing:   { weight: 35, halfAt: 8 },
  speaking:  { weight: 35, halfAt: 8 },
  reading:   { weight: 15, halfAt: 4 },
  listening: { weight: 15, halfAt: 4 },
}

// Returns { lanes: { writing, speaking, reading, listening }, total }
// lanes values are 0–1 fractions (fill level for that lane's segment)
// total is 0–100
export function computeScore(usage) {
  let total = 0
  const lanes = {}

  for (const [lane, cfg] of Object.entries(LANE_CONFIG)) {
    const count = usage?.[lane]?.count ?? 0
    const raw = count === 0 ? 0 : cfg.weight * count / (count + cfg.halfAt)
    lanes[lane] = raw / cfg.weight   // normalise to 0–1 for the bar fill
    total += raw
  }

  return { lanes, total: Math.round(total) }
}

export { LANE_CONFIG }
