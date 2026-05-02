// Forward Flow — Subject live-status accordion section.
// Visible only on the fundamental lane when a subject candidate has been parsed.

import { T } from '../../theme'
import { StatusAccordionSection } from '../../primitives'
import { getStructure } from '../../structures.en.js'

export function SubjectStatusBlock({
  lane, subjectText, subjectShape, nounNumber, articleWarning, subjectFeatures,
  statusOpen, toggleStatus,
}) {
  if (lane !== 'fundamental' || !subjectText) return null

  // Compact preview line includes everything the user usually wants to know
  // at a glance — shape, candidate text, person/number — so they rarely
  // have to expand. Full breakdown is still available on click.
  const shapeLabel = subjectShape ? (getStructure(subjectShape)?.label ?? subjectShape) : null
  const featTag = subjectFeatures
    ? `${subjectFeatures.person} ${subjectFeatures.number}`
    : (nounNumber !== 'unknown' ? nounNumber : null)

  return (
    <StatusAccordionSection title="Subject"
      accent={T.blue}
      preview={
        shapeLabel
          ? `${shapeLabel} · ${subjectText}` +
            (featTag ? ` · ${featTag}` : '') +
            (articleWarning ? ' · a/an' : '')
          : `${subjectText} · shape not yet recognized`
      }
      open={!!statusOpen.subject} onToggle={() => toggleStatus('subject')}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap', fontSize: 11 }}>
          <span style={{ padding: '1px 8px', background: T.blueBg, border: `1px solid ${T.blueBord}`, borderRadius: 3, fontFamily: 'monospace', fontWeight: 700, color: T.blue }}>{subjectText}</span>
          {shapeLabel && (
            <span style={{ fontSize: 10, color: T.textSub, fontStyle: 'italic' }}>{shapeLabel.toLowerCase()}</span>
          )}
          {featTag && (
            <span style={{ fontSize: 10, color: T.textDim, fontFamily: 'monospace' }}>{featTag}</span>
          )}
        </div>
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
