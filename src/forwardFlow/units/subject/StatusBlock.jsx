// Forward Flow — Subject live-status accordion section.
// Renders the "Subject" detail section in the live detection panel.
// Visible only on the fundamental lane when a subject candidate has been parsed.

import { T } from '../../theme'
import { StatusAccordionSection } from '../../primitives'
import { getSubjectShape } from './shapesIndex'

export function SubjectStatusBlock({
  lane, subjectText, subjectShape, nounNumber, articleWarning, subjectFeatures,
  statusOpen, toggleStatus,
}) {
  if (lane !== 'fundamental' || !subjectText) return null

  return (
    <StatusAccordionSection title="Subject"
      accent={T.blue}
      preview={
        subjectShape
          ? `${getSubjectShape(subjectShape, 'en')?.label ?? subjectShape}` +
            (nounNumber !== 'unknown' ? ` (${nounNumber})` : '') +
            (articleWarning ? ' · a/an warning' : '')
          : 'shape not yet recognized'
      }
      open={!!statusOpen.subject} onToggle={() => toggleStatus('subject')}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 11, color: T.textSub }}>
          candidate text: <span style={{ fontFamily: 'monospace', fontWeight: 700, color: T.text }}>{subjectText}</span>
        </div>
        {subjectShape && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: T.label, letterSpacing: '0.08em', textTransform: 'uppercase', minWidth: 60 }}>shape</span>
            <span style={{ padding: '1px 6px', background: T.blueBg, border: `1px solid ${T.blueBord}`, borderRadius: 3, fontSize: 11, fontWeight: 700, color: T.blue }}>
              {getSubjectShape(subjectShape, 'en')?.label ?? subjectShape}
            </span>
            {nounNumber !== 'unknown' && (
              <span style={{ padding: '1px 6px', background: '#fff', border: `1px solid ${T.border}`, borderRadius: 3, fontSize: 10, color: T.textDim, fontFamily: 'monospace' }}>
                {nounNumber}
              </span>
            )}
          </div>
        )}
        {subjectFeatures && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: T.label, letterSpacing: '0.08em', textTransform: 'uppercase', minWidth: 60 }}>features</span>
            <span style={{ padding: '1px 6px', background: '#fff', border: `1px solid ${T.border}`, borderRadius: 3, fontSize: 11, color: T.textSub, fontFamily: 'monospace' }}>{subjectFeatures.person}</span>
            <span style={{ padding: '1px 6px', background: '#fff', border: `1px solid ${T.border}`, borderRadius: 3, fontSize: 11, color: T.textSub, fontFamily: 'monospace' }}>{subjectFeatures.number}</span>
          </div>
        )}
        {articleWarning && (
          <div style={{ padding: '6px 10px', background: T.amberBg, border: `1px solid ${T.amberBord}`, borderRadius: 4, fontSize: 11, color: T.amber, lineHeight: 1.5 }}>
            <span style={{ fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: 9, marginRight: 6 }}>a/an</span>
            {articleWarning}
          </div>
        )}
      </div>
    </StatusAccordionSection>
  )
}
