// Forward Flow — Slot Role card.
// Renders one of the 5 slot roles (S/V/O/C/A).

import { T } from './theme'

export function SlotRoleCard({ role, expanded, onToggle }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: expanded ? '14px 16px' : '10px 14px', marginBottom: 8 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: expanded ? 8 : 0 }}>
        <div style={{
          padding: '4px 12px', background: T.blueBg, border: `1px solid ${T.blueBord}`, borderRadius: 4,
          fontSize: 18, fontWeight: 800, fontFamily: 'monospace', color: T.blue,
          minWidth: 32, textAlign: 'center',
        }}>
          {role.shortLabel}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>
            {role.label}
            {role.polymorphic && (
              <span style={{
                marginLeft: 8, fontSize: 10, padding: '2px 6px',
                background: T.violetBg, border: `1px solid ${T.violetBord}`, color: T.violet,
                borderRadius: 3, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
              }}>polymorphic</span>
            )}
          </div>
          <div style={{ fontSize: 12, color: T.textDim, fontFamily: 'monospace' }}>{role.id}</div>
        </div>
        <button onClick={onToggle}
          style={{ padding: '4px 10px', background: '#fff', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 11, color: T.textDim, cursor: 'pointer' }}>
          {expanded ? '▴ less' : '▾ more'}
        </button>
      </div>

      {expanded && (
      <div style={{ fontSize: 13, color: T.textSub, lineHeight: 1.55 }}>
        {role.description}
      </div>
      )}

      {expanded && role.polymorphic && role.polymorphismNote && (
        <div style={{
          marginTop: 10, padding: '8px 12px',
          background: T.violetBg, border: `1px solid ${T.violetBord}`, borderRadius: 5,
          fontSize: 12, color: T.violet, lineHeight: 1.55,
        }}>
          <span style={{ fontWeight: 700 }}>Polymorphism — </span>
          {role.polymorphismNote}
        </div>
      )}

      {expanded && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px dashed ${T.border}` }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: T.label, textTransform: 'uppercase', marginBottom: 5 }}>
              Typical fillers
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {role.typicalFillers.map(f => (
                <span key={f} style={{
                  padding: '3px 8px', background: '#fff', border: `1px solid ${T.border}`, borderRadius: 4,
                  fontSize: 11, color: T.textSub, fontFamily: 'monospace',
                }}>{f}</span>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: T.label, textTransform: 'uppercase', marginBottom: 5 }}>
              Relations
            </div>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {role.relations.map((rel, i) => (
                <li key={i} style={{ fontSize: 12, color: T.textSub, lineHeight: 1.55, marginBottom: 4 }}>{rel}</li>
              ))}
            </ul>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: T.label, textTransform: 'uppercase', marginBottom: 5 }}>
              Examples
            </div>
            {role.examples.map((ex, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 3, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: T.text, fontStyle: 'italic' }}>"{ex.sentence}"</span>
                <span style={{ fontSize: 11, color: T.blue, fontWeight: 600, fontFamily: 'monospace' }}>→ {ex.highlight}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
