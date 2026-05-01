// Forward Flow — Subject Shape card. Renders one of the 9 Subject shapes.

import { T } from './theme'

export function SubjectShapeCard({ shape, expanded, onToggle }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: expanded ? '12px 14px' : '8px 12px', marginBottom: 6 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: expanded ? 6 : 0 }}>
        <span style={{
          padding: '3px 9px', background: T.blueBg, border: `1px solid ${T.blueBord}`, borderRadius: 4,
          fontSize: 12, fontWeight: 700, color: T.blue, fontFamily: 'monospace',
        }}>S</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{shape.label}</div>
          <div style={{ fontSize: 11, color: T.textDim, fontFamily: 'monospace', marginTop: 1 }}>{shape.pattern}</div>
        </div>
        <button onClick={onToggle}
          style={{ padding: '3px 9px', background: '#fff', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 11, color: T.textDim, cursor: 'pointer' }}>
          {expanded ? '▴ less' : '▾ more'}
        </button>
      </div>

      {expanded && (<>
      <div style={{ fontSize: 12, color: T.textSub, lineHeight: 1.55, marginBottom: 6 }}>
        {shape.description}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {shape.examples.map((ex, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', fontSize: 12 }}>
            <span style={{ color: T.text, fontStyle: 'italic' }}>"{ex.sentence}"</span>
            <span style={{ color: T.blue, fontWeight: 600, fontFamily: 'monospace' }}>→ {ex.highlight}</span>
          </div>
        ))}
      </div>
      </>)}

      {expanded && shape.testWords && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px dashed ${T.border}` }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: T.label, textTransform: 'uppercase', marginBottom: 4 }}>
            Test words
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {shape.testWords.map((w, i) => (
              <span key={i} style={{
                padding: '2px 7px', background: '#fff', border: `1px solid ${T.border}`, borderRadius: 3,
                fontSize: 11, color: T.textSub, fontFamily: 'monospace',
              }}>{w}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
