// Forward Flow — Complement live-status accordion section.
// Shows: detected role (Cs vs Co), the matched structure, the tokens,
// mismatch flag if the C-region didn't classify.

import { T } from '../../theme'
import { StatusAccordionSection } from '../../primitives'
import { getStructure } from '../../structures.en.js'
import { getShapeFamily } from '../../shapeFamilies.en.js'

export function ComplementStatusBlock({
  lane, complementAnalysis,
  statusOpen, toggleStatus,
}) {
  if (lane !== 'fundamental' || !complementAnalysis) return null
  const { frame, role, structure, tokens, mismatch } = complementAnalysis

  const struct = structure ? getStructure(structure) : null
  const family = struct ? getShapeFamily(struct.family) : null

  const tokensStr = tokens?.length ? tokens.join(' ') : null
  const preview = [
    `${frame} → ${role}`,
    tokensStr ? `${struct?.label?.toLowerCase() ?? '?'} · ${tokensStr}` : null,
    mismatch && 'mismatch',
  ].filter(Boolean).join(' · ')

  return (
    <StatusAccordionSection title="Complement"
      accent={T.amber}
      preview={preview || 'no analysis'}
      open={!!statusOpen.complement} onToggle={() => toggleStatus('complement')}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap', fontSize: 11 }}>
          <span style={{
            padding: '1px 6px', background: T.amberBg, border: `1px solid ${T.amberBord}`, borderRadius: 3,
            fontWeight: 700, color: T.amber, fontFamily: 'monospace',
          }}>{frame}</span>
          <span style={{ fontSize: 10, color: T.textDim, fontStyle: 'italic' }}>predicates over</span>
          <span style={{
            padding: '1px 6px', background: '#fff', border: `1px solid ${T.amberBord}`, borderRadius: 3,
            fontSize: 10, fontWeight: 700, color: T.amber, letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>{role === 'Cs' ? 'subject' : 'object'}</span>
          <span style={{ fontSize: 10, color: T.textDim, fontStyle: 'italic' }}>({role})</span>
        </div>

        {struct && tokens && (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap', fontSize: 11 }}>
            <span style={{
              padding: '1px 8px', background: T.amberBg, border: `1px solid ${T.amberBord}`, borderRadius: 3,
              fontFamily: 'monospace', fontWeight: 700, color: T.amber,
            }}>{tokens.join(' ')}</span>
            <span style={{ fontSize: 10, color: T.textSub, fontStyle: 'italic' }}>{struct.label.toLowerCase()}</span>
            {family && (
              <span style={{ fontSize: 9, color: T.textDim, fontFamily: 'monospace' }}>
                family: {family.label.toLowerCase()}
              </span>
            )}
          </div>
        )}

        {mismatch && (
          <div style={{ padding: '6px 10px', background: T.redBg ?? T.amberBg, border: `1px solid ${T.redBord ?? T.amberBord}`, borderRadius: 4, fontSize: 11, color: T.red ?? T.amber, lineHeight: 1.5 }}>
            <span style={{ fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: 9, marginRight: 6 }}>{mismatch.kind}</span>
            {mismatch.detail ?? ''}
          </div>
        )}
      </div>
    </StatusAccordionSection>
  )
}
