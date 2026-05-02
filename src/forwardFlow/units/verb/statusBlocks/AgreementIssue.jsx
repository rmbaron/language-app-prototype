// Forward Flow — Verb · Agreement Issue sub-block.
// Surfaces a subject-verb agreement mismatch when one is detected.

import { T } from '../../../theme'
import { StatusAccordionSection } from '../../../primitives'

export function AgreementIssueStatus({ agreementCheck, statusOpen, toggleStatus }) {
  if (!agreementCheck) return null
  return (
    <StatusAccordionSection title="Agreement issue"
      accent={T.red}
      preview={`${agreementCheck.issue} — got "${agreementCheck.got}", expected ${agreementCheck.expected}`}
      open={!!statusOpen.agreementIssue} onToggle={() => toggleStatus('agreementIssue')}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11 }}>
        <div style={{ color: T.red, fontWeight: 700 }}>{agreementCheck.issue}</div>
        <div style={{ color: T.textSub }}>
          Got:&nbsp;<span style={{ fontFamily: 'monospace', color: T.text, fontWeight: 700 }}>{agreementCheck.got}</span>
        </div>
        <div style={{ color: T.textSub }}>
          Expected: <span style={{ color: T.text }}>{agreementCheck.expected}</span>
        </div>
      </div>
    </StatusAccordionSection>
  )
}
