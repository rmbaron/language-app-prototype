// Shared primitives for Library schema-view sections.
// Used by every section file in this folder.

import { T } from '../../theme'

export function SchemaSectionHeader({ label, count, open, onToggle }) {
  return (
    <button onClick={onToggle}
      style={{
        width: '100%', textAlign: 'left',
        background: T.card, border: `1px solid ${T.border}`, borderRadius: 6,
        padding: '8px 12px', marginBottom: 8, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: T.text, flex: 1 }}>{label}</span>
      <span style={{ fontSize: 11, color: T.textDim, fontFamily: 'monospace' }}>{count}</span>
      <span style={{ fontSize: 11, color: T.textDim }}>{open ? '▴' : '▾'}</span>
    </button>
  )
}

// Generic row for sections that show a flat name + word count + flag.
// Used by ClosedClass and Atoms sections; not used by Features/Families
// (those have richer per-row state and use their own row components).
export function SchemaRow({ label, sublabel, count, flag, expandable, open, onToggle }) {
  const flagDisplay = {
    ok:    { mark: '✓', color: T.green },
    empty: { mark: '✗', color: T.red },
    warn:  { mark: '⚠', color: T.amber },
  }[flag] ?? { mark: '·', color: T.textDim }

  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', gap: 10,
      padding: '4px 12px', fontSize: 12,
      borderBottom: `1px dashed ${T.border}`,
      cursor: expandable ? 'pointer' : 'default',
    }}
    onClick={expandable ? onToggle : undefined}>
      <span style={{ color: flagDisplay.color, fontWeight: 700, minWidth: 14 }}>{flagDisplay.mark}</span>
      <span style={{ fontFamily: 'monospace', color: T.text, fontWeight: 600, minWidth: 180 }}>{label}</span>
      {sublabel && <span style={{ color: T.textDim, fontSize: 11, flex: 1 }}>{sublabel}</span>}
      {!sublabel && <span style={{ flex: 1 }} />}
      <span style={{ color: count === 0 ? T.red : T.textSub, fontWeight: count === 0 ? 700 : 400, fontFamily: 'monospace' }}>
        {count} {typeof count === 'number' && count === 1 ? 'word' : 'words'}
      </span>
      {expandable && <span style={{ fontSize: 10, color: T.textDim, minWidth: 12 }}>{open ? '▴' : '▾'}</span>}
    </div>
  )
}
