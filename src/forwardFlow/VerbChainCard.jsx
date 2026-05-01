// Forward Flow — Verb Internal Chain card.
// Shows one position (Modal/Perfect/Progressive/Passive/Lexical) or one
// non-position entry (Negation/Do-support).

import { T } from './theme'

export function VerbChainCard({ entry, expanded, onToggle }) {
  // Decoration and mechanism get distinct visual treatment from the
  // canonical chain positions (which use violet, our verb-cluster color).
  const isPosition   = entry.kind === 'chain_position'
  const isMechanism  = entry.kind === 'mechanism'

  const accentBg     = isPosition ? T.violetBg  : (isMechanism ? T.amberBg  : T.card)
  const accentBord   = isPosition ? T.violetBord: (isMechanism ? T.amberBord: T.border)
  const accentFg     = isPosition ? T.violet    : (isMechanism ? T.amber    : T.textDim)

  const kindLabel    = isPosition ? `position ${entry.order}` : (isMechanism ? 'mechanism' : 'decoration')

  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: expanded ? '12px 14px' : '8px 12px', marginBottom: 6 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: expanded ? 6 : 0 }}>
        <span style={{
          padding: '3px 9px', background: accentBg, border: `1px solid ${accentBord}`, borderRadius: 4,
          fontSize: 11, fontWeight: 700, color: accentFg, fontFamily: 'monospace', letterSpacing: '0.04em', textTransform: 'uppercase',
        }}>{kindLabel}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{entry.label}</div>
          {entry.projects && (
            <div style={{ fontSize: 11, color: T.textDim, fontFamily: 'monospace', marginTop: 1 }}>
              projects: {entry.projects}
            </div>
          )}
        </div>
        <button onClick={onToggle}
          style={{ padding: '3px 9px', background: '#fff', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 11, color: T.textDim, cursor: 'pointer' }}>
          {expanded ? '▴ less' : '▾ more'}
        </button>
      </div>

      {expanded && (<>
      {entry.words && entry.words.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
          {entry.words.map((w, i) => (
            <span key={i} style={{
              padding: '2px 7px', background: '#fff', border: `1px solid ${accentBord}`, borderRadius: 3,
              fontSize: 11, color: accentFg, fontFamily: 'monospace',
            }}>{w}</span>
          ))}
        </div>
      )}
      {!entry.words && (
        <div style={{ fontSize: 11, color: T.textDim, fontStyle: 'italic', marginBottom: 6 }}>
          (any content verb in the language)
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {entry.examples.map((ex, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', fontSize: 12 }}>
            <span style={{ color: T.text, fontStyle: 'italic' }}>"{ex.sentence}"</span>
            <span style={{ color: accentFg, fontWeight: 600, fontFamily: 'monospace' }}>→ {ex.highlight}</span>
          </div>
        ))}
      </div>

      {entry.notes && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px dashed ${T.border}`, fontSize: 12, color: T.textSub, lineHeight: 1.55 }}>
          {entry.notes}
        </div>
      )}
      </>)}
    </div>
  )
}
