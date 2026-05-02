// Forward Flow — Object live-status accordion section.
// Shows: detected frame, each object's tokens + shape (with role implied by
// order — DIRECT for the only object in SVO, INDIRECT-then-DIRECT for SVOO),
// remainder tokens (handed to Complement / Adverbial later), mismatch flag.

import { T } from '../../theme'
import { StatusAccordionSection } from '../../primitives'
import { getStructure } from '../../structures.en.js'

export function ObjectStatusBlock({
  lane, objectAnalysis,
  statusOpen, toggleStatus,
}) {
  if (lane !== 'fundamental' || !objectAnalysis) return null
  const { frame, objects, remainder, expected, mismatch } = objectAnalysis

  // Preview surfaces the frame + a one-glance summary of objects so the user
  // doesn't usually need to expand. "frame SVO · the dog" beats "frame SVO ·
  // 1 object" — show what was matched, not just the count.
  const objectsSummary = objects?.length
    ? objects.map(o => o.tokens.join(' ')).join(', ')
    : (expected?.count > 0 ? 'none found' : null)
  const preview = [
    frame && `frame ${frame}`,
    objectsSummary,
    mismatch && 'mismatch',
  ].filter(Boolean).join(' · ') || 'no analysis'

  return (
    <StatusAccordionSection title="Object"
      accent={T.green}
      preview={preview}
      open={!!statusOpen.object} onToggle={() => toggleStatus('object')}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* Frame line — compact: signature + (expected count if non-trivial) */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap', fontSize: 11 }}>
          <span style={{ padding: '1px 6px', background: T.greenBg, border: `1px solid ${T.greenBord}`, borderRadius: 3, fontWeight: 700, color: T.green, fontFamily: 'monospace' }}>
            {frame ?? '—'}
          </span>
          {expected?.count > 0 && (
            <span style={{ fontSize: 10, color: T.textDim, fontStyle: 'italic' }}>
              expects {expected.count} object{expected.count === 1 ? '' : 's'}
            </span>
          )}
        </div>

        {/* Per-object rows — token + small italic shape label. Role only
            shown when there are 2 objects (ditransitive) where it matters. */}
        {objects && objects.length > 0 && objects.map((obj, i) => {
          const showRole = objects.length > 1
          const shapeLabel = obj.shape ? (getStructure(obj.shape)?.label ?? obj.shape) : 'shape unknown'
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap', fontSize: 11 }}>
              {showRole && (
                <span style={{ fontSize: 9, fontWeight: 700, color: T.textDim, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {obj.role}
                </span>
              )}
              <span style={{ padding: '1px 8px', background: T.greenBg, border: `1px solid ${T.greenBord}`, borderRadius: 3, fontFamily: 'monospace', fontWeight: 700, color: T.green }}>
                {obj.tokens.join(' ')}
              </span>
              <span style={{ fontSize: 10, color: T.textSub, fontStyle: 'italic' }}>
                {shapeLabel.toLowerCase()}
              </span>
            </div>
          )
        })}

        {/* Remainder — tokens that go to the next slot (C/A). Compact line. */}
        {remainder && (
          <div style={{ fontSize: 11, color: T.textSub }}>
            → remainder: <span style={{ fontFamily: 'monospace', color: T.text }}>{remainder.tokens.join(' ')}</span>
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
