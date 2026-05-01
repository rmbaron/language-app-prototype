// Forward Flow — small UI primitives reused across cards.
//   Section, SlotChip, SlotSignature, StatusAccordionSection, FuturePhasePlaceholder

import { T, SLOT_COLORS } from './theme'
import { getSlotRoleByShortLabel } from '../slotRoles'

export function Section({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: T.label, textTransform: 'uppercase', marginBottom: 10 }}>
      {children}
    </div>
  )
}

export function SlotChip({ shortLabel, size = 'normal' }) {
  const c = SLOT_COLORS[shortLabel] ?? { bg: '#fff', border: T.border, fg: T.textDim }
  const role = getSlotRoleByShortLabel(shortLabel, 'en')
  const big = size === 'big'
  return (
    <span title={role ? `${shortLabel} = ${role.label}` : shortLabel}
      style={{
        display: 'inline-block',
        padding: big ? '4px 10px' : '2px 7px',
        background: c.bg, border: `1px solid ${c.border}`, borderRadius: 4,
        fontSize: big ? 14 : 12, fontWeight: 800, fontFamily: 'monospace', color: c.fg,
        minWidth: big ? 22 : 16, textAlign: 'center',
      }}>
      {shortLabel}
    </span>
  )
}

export function SlotSignature({ slots, gap = 4 }) {
  return (
    <div style={{ display: 'inline-flex', gap, alignItems: 'center' }}>
      {slots.map((s, i) => <SlotChip key={i} shortLabel={s} />)}
    </div>
  )
}

export function StatusAccordionSection({ title, preview, accent = T.label, open, onToggle, children }) {
  return (
    <div style={{
      border: `1px solid ${T.border}`, borderRadius: 4,
      marginTop: 6, background: '#fff',
    }}>
      <button onClick={onToggle}
        style={{
          width: '100%', textAlign: 'left',
          padding: '6px 10px', background: 'transparent', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
        }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: accent, textTransform: 'uppercase', minWidth: 90 }}>
          {title}
        </span>
        {preview && !open && (
          <span style={{ flex: 1, fontSize: 11, color: T.textSub, fontStyle: 'italic' }}>{preview}</span>
        )}
        <span style={{ fontSize: 11, color: T.textDim, marginLeft: 'auto' }}>{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div style={{ padding: '6px 10px 10px', borderTop: `1px solid ${T.border}` }}>
          {children}
        </div>
      )}
    </div>
  )
}

export function FuturePhasePlaceholder({ phase, title, description }) {
  return (
    <div style={{
      background: '#fafafa', border: `1px dashed ${T.border}`, borderRadius: 6,
      padding: '12px 14px', marginBottom: 8, opacity: 0.75,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
        <span style={{
          fontSize: 9, padding: '2px 6px', background: '#fff', border: `1px solid ${T.border}`, color: T.textDim,
          borderRadius: 3, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'monospace',
        }}>phase {phase}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: T.textDim }}>{title}</span>
      </div>
      <div style={{ fontSize: 12, color: T.textDim, lineHeight: 1.55, fontStyle: 'italic' }}>{description}</div>
    </div>
  )
}
