// Forward Flow — Verb · Verb Expected sub-block.
// On the fundamental lane, given the Subject's features, shows what
// agreement pattern the verb should follow.

import { T } from '../../../theme'
import { StatusAccordionSection } from '../../../primitives'

export function VerbExpectedStatus({ lane, expectedAgreement, statusOpen, toggleStatus }) {
  if (lane !== 'fundamental' || !expectedAgreement) return null
  return (
    <StatusAccordionSection title="Verb expected"
      accent={T.green}
      preview={`${expectedAgreement.pattern} (${expectedAgreement.label})`}
      open={!!statusOpen.agreement} onToggle={() => toggleStatus('agreement')}>
      <div>
        <div style={{ fontSize: 12, color: T.green, fontWeight: 700, marginBottom: 4 }}>
          {expectedAgreement.pattern} <span style={{ fontWeight: 400, fontStyle: 'italic' }}>· {expectedAgreement.label}</span>
        </div>
        <div style={{ fontSize: 11, color: T.textSub, lineHeight: 1.5, marginBottom: 6 }}>
          {expectedAgreement.hint}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {expectedAgreement.examples.map((ex, i) => (
            <span key={i} style={{ padding: '1px 6px', background: '#fff', border: `1px solid ${T.greenBord}`, borderRadius: 3, fontSize: 10, color: T.green, fontFamily: 'monospace' }}>{ex}</span>
          ))}
        </div>
      </div>
    </StatusAccordionSection>
  )
}
