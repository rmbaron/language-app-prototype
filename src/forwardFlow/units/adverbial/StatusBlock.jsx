// Forward Flow — Adverbial live-status accordion section.
// Shows: detected role (argument vs adjunct), the matched structure, the
// tokens, mismatch flag. Argument adverbials come from the verb's frame;
// adjuncts are free-attaching.

import { T } from '../../theme'
import { StatusAccordionSection } from '../../primitives'
import { getStructure } from '../../structures.en.js'
import { getShapeFamily } from '../../shapeFamilies.en.js'

export function AdverbialStatusBlock({
  lane, adverbialAnalysis,
  statusOpen, toggleStatus,
}) {
  if (lane !== 'fundamental' || !adverbialAnalysis) return null
  const { frame, role, structure, tokens, mismatch } = adverbialAnalysis

  const struct = structure ? getStructure(structure) : null
  const family = struct ? getShapeFamily(struct.family) : null

  const tokensStr = tokens?.length ? tokens.join(' ') : null
  const preview = [
    `${role}${frame ? ` (${frame})` : ''}`,
    tokensStr ? `${struct?.label?.toLowerCase() ?? '?'} · ${tokensStr}` : null,
    mismatch && 'mismatch',
  ].filter(Boolean).join(' · ')

  return (
    <StatusAccordionSection title="Adverbial"
      accent={T.violet}
      preview={preview || 'no analysis'}
      open={!!statusOpen.adverbial} onToggle={() => toggleStatus('adverbial')}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap', fontSize: 11 }}>
          <span style={{
            padding: '1px 6px', background: T.violetBg, border: `1px solid ${T.violetBord}`, borderRadius: 3,
            fontWeight: 700, color: T.violet, fontFamily: 'monospace',
          }}>{frame ?? '—'}</span>
          <span style={{
            padding: '1px 6px', background: '#fff', border: `1px solid ${T.violetBord}`, borderRadius: 3,
            fontSize: 10, fontWeight: 700, color: T.violet, letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>{role}</span>
          <span style={{ fontSize: 10, color: T.textDim, fontStyle: 'italic' }}>
            {role === 'argument' ? 'required by the verb\'s frame' : 'free-attaching, not in the verb\'s frame'}
          </span>
        </div>

        {struct && tokens && (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap', fontSize: 11 }}>
            <span style={{
              padding: '1px 8px', background: T.violetBg, border: `1px solid ${T.violetBord}`, borderRadius: 3,
              fontFamily: 'monospace', fontWeight: 700, color: T.violet,
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
          <div style={{ padding: '6px 10px', background: T.amberBg, border: `1px solid ${T.amberBord}`, borderRadius: 4, fontSize: 11, color: T.amber, lineHeight: 1.5 }}>
            <span style={{ fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: 9, marginRight: 6 }}>{mismatch.kind}</span>
            {mismatch.detail ?? ''}
          </div>
        )}
      </div>
    </StatusAccordionSection>
  )
}
