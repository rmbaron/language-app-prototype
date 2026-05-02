// Forward Flow — Verb · Verb Matched sub-block.
// Shows the matched verb base form, its surface form (if different),
// and the formsMap form-type tag.

import { T } from '../../../theme'
import { StatusAccordionSection } from '../../../primitives'

// Human-readable labels for formsMap form-type tags. Local to this sub-block;
// promote to a shared map only when a second consumer needs it.
const FORM_TYPE_LABEL = {
  base: 'base form',
  third_person_present: '3rd-sg present (-s)',
  present: 'present',
  first_person_present: '1st-sg present',
  past: 'past',
  past_participle: 'past participle',
  present_participle: 'present participle (-ing)',
}
function formTypeLabel(type) {
  if (!type) return 'unknown form'
  if (Array.isArray(type)) return type.map(t => FORM_TYPE_LABEL[t] ?? t).join(' / ')
  return FORM_TYPE_LABEL[type] ?? type
}

export function VerbMatchedStatus({ matchedVerb, matchedVerbForm, statusOpen, toggleStatus }) {
  if (!matchedVerb || !matchedVerbForm) return null
  return (
    <StatusAccordionSection title="Verb matched"
      accent={T.green}
      preview={
        matchedVerbForm.surface === matchedVerbForm.base
          ? `${matchedVerbForm.base} (${formTypeLabel(matchedVerbForm.type)})`
          : `${matchedVerbForm.surface} → ${matchedVerbForm.base} (${formTypeLabel(matchedVerbForm.type)})`
      }
      open={!!statusOpen.verbMatch} onToggle={() => toggleStatus('verbMatch')}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', fontSize: 11 }}>
        <span style={{ padding: '1px 8px', background: T.greenBg, border: `1px solid ${T.greenBord}`, borderRadius: 3, fontFamily: 'monospace', fontWeight: 700, color: T.green }}>{matchedVerbForm.surface}</span>
        {matchedVerbForm.surface !== matchedVerbForm.base && (<>
          <span style={{ color: T.textSub }}>→</span>
          <span style={{ padding: '1px 8px', background: '#fff', border: `1px solid ${T.greenBord}`, borderRadius: 3, fontFamily: 'monospace', fontWeight: 700, color: T.green }}>{matchedVerbForm.base}</span>
        </>)}
        <span style={{ padding: '1px 6px', background: '#fff', border: `1px solid ${T.greenBord}`, borderRadius: 3, fontSize: 10, fontWeight: 700, color: T.green, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{formTypeLabel(matchedVerbForm.type)}</span>
      </div>
    </StatusAccordionSection>
  )
}
