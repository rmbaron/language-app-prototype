// LaneStatusBar — compact lane lock indicator for list views.
//
// Shows four lane badges (R W L S) each with a small padlock above.
// Locked: grey badge, grey lock.
// Unlocked/graduated: lane color badge, lock opens (shackle raised).
//
// Reads initials and colors from LANE (lanes.js) — the single source of truth.
// To swap letters for icons: change LANE_DISPLAY.initial in lanes.js.
// Nothing here needs to change.
//
// laneProgress: the .lanes object from getWordProgress() —
//   { reading: { graduated }, writing: { graduated }, ... }

import { LANES, LANE } from './lanes'

export default function LaneStatusBar({ laneProgress }) {
  return (
    <div className="lane-status-bar">
      {LANES.map(({ id }) => {
        const lane = LANE[id]
        const graduated = laneProgress[id].graduated
        return (
          <div
            key={id}
            className={`lane-status-badge ${graduated ? 'lane-status-badge--open' : ''}`}
            style={{ '--lane-color': lane.color }}
          >
            <div className="lane-status-lock" />
            <span className="lane-status-initial">{lane.initial}</span>
          </div>
        )
      })}
    </div>
  )
}
