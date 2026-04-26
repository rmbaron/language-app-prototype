import { TENSE_GRID, TIMES, ASPECTS, ASPECT_LABELS, getCell } from './tenseGrid.en.js'

const T = {
  page: '#ffffff', card: '#e8e8ea', border: '#c4c4c6',
  text: '#1a1a1a', textDim: '#777', textSub: '#444', label: '#666',
}

const SPACE_COLOR = {
  0: { bg: T.card,    border: T.border,   color: T.textDim  },
  1: { bg: '#d8e0f4', border: '#90a8d8',  color: '#1a2a7a'  },
  2: { bg: '#e8d8f4', border: '#b890d8',  color: '#4a1a8a'  },
  3: { bg: '#f4d8e8', border: '#d890b8',  color: '#7a1a4a'  },
}

export default function MultiWordLab({ onClose }) {
  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui, sans-serif', background: T.page, minHeight: '100vh', color: T.text }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <button onClick={onClose}
          style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 4, color: T.textSub, cursor: 'pointer', fontSize: 13, padding: '5px 12px' }}>
          ← close
        </button>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Multi-Word Lab</h2>
      </div>

      {/* Space count legend */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[0, 1, 2, 3].map(n => {
          const c = SPACE_COLOR[n]
          return (
            <div key={n} style={{ padding: '4px 10px', background: c.bg, border: `1px solid ${c.border}`, borderRadius: 4, fontSize: 11, color: c.color, fontWeight: 600 }}>
              {n} space{n !== 1 ? 's' : ''}
            </div>
          )
        })}
      </div>

      {/* 12-form grid */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 600 }}>
          <thead>
            <tr>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: T.label, textTransform: 'uppercase', borderBottom: `1px solid ${T.border}` }}></th>
              {TIMES.map(time => (
                <th key={time} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: T.label, textTransform: 'uppercase', borderBottom: `1px solid ${T.border}` }}>
                  {time}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ASPECTS.map((aspect, ai) => (
              <tr key={aspect}>
                <td style={{ padding: '10px 12px', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: T.label, textTransform: 'uppercase', whiteSpace: 'nowrap', borderBottom: `1px solid ${T.border}`, borderRight: `1px solid ${T.border}` }}>
                  {ASPECT_LABELS[aspect]}
                </td>
                {TIMES.map(time => {
                  const cell = getCell(time, aspect)
                  if (!cell) return <td key={time} />
                  const c = SPACE_COLOR[cell.spaceCount] ?? SPACE_COLOR[3]
                  return (
                    <td key={time} style={{ padding: '10px 12px', borderBottom: `1px solid ${T.border}`, verticalAlign: 'top' }}>
                      <div style={{ padding: '10px 12px', background: c.bg, border: `1px solid ${c.border}`, borderRadius: 5 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: c.color, marginBottom: 4 }}>{cell.name}</div>
                        <div style={{ fontSize: 11, color: T.textSub, fontFamily: 'monospace', marginBottom: 6 }}>{cell.structure}</div>
                        <div style={{ fontSize: 11, color: T.textDim, fontStyle: 'italic', marginBottom: 6 }}>{cell.example}</div>
                        <div style={{ fontSize: 10, color: c.color, opacity: 0.7 }}>{cell.spaceCount} space{cell.spaceCount !== 1 ? 's' : ''}</div>
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
