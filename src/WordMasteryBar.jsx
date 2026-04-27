import { getUsage } from './wordUsageStore'
import { computeScore, LANE_CONFIG } from './wordMasteryScoring'
import { LANE } from './lanes'

// Lane order for display: production lanes first (wider), then receptive
const DISPLAY_ORDER = ['writing', 'speaking', 'reading', 'listening']

const TOTAL_WEIGHT = Object.values(LANE_CONFIG).reduce((s, c) => s + c.weight, 0)

export default function WordMasteryBar({ wordId, label }) {
  const usage = getUsage(wordId)
  const { lanes, total } = computeScore(usage)

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#555', marginBottom: 6 }}>
        <span style={{ fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: 11 }}>{label}</span>
        <span style={{ fontWeight: 600 }}>{total}</span>
      </div>

      {/* Segmented bar */}
      <div style={{ display: 'flex', width: '100%', height: 8, borderRadius: 4, overflow: 'hidden', gap: 2 }}>
        {DISPLAY_ORDER.map(lane => {
          const cfg    = LANE_CONFIG[lane]
          const fill   = lanes[lane]           // 0–1
          const color  = LANE[lane]?.color ?? '#888'
          const widthPct = (cfg.weight / TOTAL_WEIGHT) * 100

          return (
            <div
              key={lane}
              style={{ flex: `0 0 calc(${widthPct}% - 1.5px)`, background: '#e8e8e8', borderRadius: 3, overflow: 'hidden', position: 'relative' }}
            >
              <div style={{
                position: 'absolute', inset: 0,
                width: `${fill * 100}%`,
                background: color,
                borderRadius: 3,
                transition: 'width 0.4s ease',
              }} />
            </div>
          )
        })}
      </div>

      {/* Lane labels */}
      <div style={{ display: 'flex', width: '100%', marginTop: 5, gap: 2 }}>
        {DISPLAY_ORDER.map(lane => {
          const cfg      = LANE_CONFIG[lane]
          const widthPct = (cfg.weight / TOTAL_WEIGHT) * 100
          const color    = LANE[lane]?.color ?? '#888'
          const count    = usage[lane]?.count ?? 0

          return (
            <div key={lane} style={{ flex: `0 0 calc(${widthPct}% - 1.5px)`, textAlign: 'center' }}>
              <span style={{ fontSize: 9, color, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {LANE[lane]?.initial ?? lane[0].toUpperCase()}
              </span>
              <span style={{ fontSize: 9, color: '#aaa', marginLeft: 2 }}>{count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
