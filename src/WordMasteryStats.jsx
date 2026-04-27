import WordMasteryBar from './WordMasteryBar'
import { getUsage } from './wordUsageStore'
import { computeScore, LANE_CONFIG } from './wordMasteryScoring'
import { LANE } from './lanes'

const DISPLAY_ORDER = ['writing', 'speaking', 'reading', 'listening']

export default function WordMasteryStats({ wordId }) {
  const usage        = getUsage(wordId)
  const { lanes, total } = computeScore(usage)

  return (
    <div style={{ width: '100%' }}>
      <WordMasteryBar wordId={wordId} />

      <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {DISPLAY_ORDER.map(lane => {
          const cfg    = LANE_CONFIG[lane]
          const count  = usage[lane]?.count ?? 0
          const fill   = lanes[lane]
          const pts    = (fill * cfg.weight).toFixed(1)
          const color  = LANE[lane]?.color ?? '#888'

          // What the next use would contribute
          const nextFill = (count + 1) / (count + 1 + cfg.halfAt)
          const gain     = (nextFill * cfg.weight - fill * cfg.weight).toFixed(2)

          return (
            <div key={lane} style={{ borderRadius: 5, border: '1px solid #e0e0e0', padding: '7px 10px', background: '#fafafa', fontSize: 11 }}>
              <div style={{ fontWeight: 700, color, textTransform: 'capitalize', marginBottom: 4, letterSpacing: '0.03em' }}>{lane}</div>
              <div style={{ color: '#555', lineHeight: 1.8 }}>
                <span style={{ display: 'inline-block', width: 100 }}>count</span>
                <b style={{ color: '#1a1a1a' }}>{count}</b>
                <span style={{ color: '#bbb' }}> / half at {cfg.halfAt}</span>
              </div>
              <div style={{ color: '#555', lineHeight: 1.8 }}>
                <span style={{ display: 'inline-block', width: 100 }}>fill</span>
                <b style={{ color: '#1a1a1a' }}>{(fill * 100).toFixed(1)}%</b>
                <span style={{ color: '#bbb' }}> → {pts}/{cfg.weight}pts</span>
              </div>
              <div style={{ color: '#2a7a2a', lineHeight: 1.8 }}>
                <span style={{ display: 'inline-block', width: 100 }}>next +1</span>
                <b>+{gain}pts</b>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 8, padding: '6px 10px', background: '#f0f0f0', borderRadius: 4, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
        <span style={{ color: '#555' }}>total</span>
        <b style={{ color: '#1a1a1a' }}>{total} / 100</b>
      </div>
    </div>
  )
}
