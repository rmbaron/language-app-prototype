// Forward Flow — Subject live-status accordion section.
// Visible only on the fundamental lane when a subject candidate has been parsed.

import { T } from '../../theme'
import { StatusAccordionSection } from '../../primitives'
import { getStructure } from '../../structures.en.js'
import { getShapeFamily } from '../../shapeFamilies.en.js'
import { getCategory } from '../../categoryLookup'
import { diagnoseSubjectFailure, liveSubjectHypotheses } from './detector'

export function SubjectStatusBlock({
  lane, subjectText, subjectShape, nounNumber, articleWarning, subjectFeatures,
  statusOpen, toggleStatus,
}) {
  if (lane !== 'fundamental' || !subjectText) return null

  // Compact preview line includes everything the user usually wants to know
  // at a glance — shape, candidate text, person/number — so they rarely
  // have to expand. Full breakdown is still available on click.
  const shapeLabel  = subjectShape ? (getStructure(subjectShape)?.label ?? subjectShape) : null
  const familyId    = subjectShape ? getStructure(subjectShape)?.family : null
  const familyLabel = familyId ? (getShapeFamily(familyId)?.label ?? familyId) : null
  const featTag = subjectFeatures
    ? `${subjectFeatures.person} ${subjectFeatures.number}`
    : (nounNumber !== 'unknown' ? nounNumber : null)

  // Per-token category resolution — what the engine sees when classifying.
  // A '?' marks tokens the lookup couldn't categorize (likely outside the
  // function-word map and the word registry).
  const tokenCats = subjectText
    ? subjectText.trim().split(/\s+/).filter(Boolean).map(t => ({ token: t, category: getCategory(t) }))
    : []

  // When no shape matched, name the categorical reason — lives in detector
  // so the failure cases stay in sync with the detection branches.
  const failureReason = !subjectShape ? diagnoseSubjectFailure(subjectText) : null

  // Multi-hypothesis: shapes still in play beyond the one the detector commits
  // to. Forming = pending; extends-with = could grow into another shape.
  const liveHypotheses = liveSubjectHypotheses(subjectText).filter(h => h.state !== 'matched')

  return (
    <StatusAccordionSection title="Subject"
      accent={T.blue}
      preview={
        shapeLabel
          ? (familyLabel ? `${familyLabel} → ${shapeLabel}` : shapeLabel) + ` · ${subjectText}` +
            (featTag ? ` · ${featTag}` : '') +
            (articleWarning ? ' · a/an' : '')
          : `${subjectText} · ${failureReason ?? 'shape not yet recognized'}`
      }
      open={!!statusOpen.subject} onToggle={() => toggleStatus('subject')}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap', fontSize: 11 }}>
          <span style={{ padding: '1px 8px', background: T.blueBg, border: `1px solid ${T.blueBord}`, borderRadius: 3, fontFamily: 'monospace', fontWeight: 700, color: T.blue }}>{subjectText}</span>
          {familyLabel && (
            <span style={{ padding: '1px 6px', background: T.blueBg, border: `1px solid ${T.blueBord}`, borderRadius: 3, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.blue }}>{familyLabel}</span>
          )}
          {shapeLabel && (
            <span style={{ fontSize: 10, color: T.textSub, fontStyle: 'italic' }}>{shapeLabel.toLowerCase()}</span>
          )}
          {featTag && (
            <span style={{ fontSize: 10, color: T.textDim, fontFamily: 'monospace' }}>{featTag}</span>
          )}
        </div>
        {tokenCats.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', fontSize: 10 }}>
            <span style={{ color: T.textDim, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: 9 }}>engine reads</span>
            {tokenCats.map(({ token, category }, i) => (
              <span key={i} style={{ fontFamily: 'monospace', color: T.textSub }}>
                {token}<span style={{ color: category ? T.textDim : T.amber }}>:{category ?? '?'}</span>
              </span>
            ))}
          </div>
        )}
        {failureReason && (
          <div style={{ padding: '6px 10px', background: T.amberBg, border: `1px solid ${T.amberBord}`, borderRadius: 4, fontSize: 11, color: T.amber, lineHeight: 1.5 }}>
            <span style={{ fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: 9, marginRight: 6 }}>no shape</span>
            {failureReason}
          </div>
        )}
        {liveHypotheses.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 10 }}>
            <span style={{ color: T.textDim, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: 9 }}>still in play</span>
            {liveHypotheses.map((h, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 6, fontFamily: 'monospace' }}>
                <span style={{ color: T.blue, fontWeight: 700 }}>{h.shape}</span>
                <span style={{ color: T.textDim, fontSize: 9, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{h.state}</span>
                {h.hint && <span style={{ color: T.textSub, fontFamily: 'system-ui, sans-serif' }}>{h.hint}</span>}
              </div>
            ))}
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
