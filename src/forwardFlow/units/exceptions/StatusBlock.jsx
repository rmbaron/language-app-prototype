// Forward Flow — Exception live-status accordion section.
// Visible only when the exception lane fires.

import { T } from '../../theme'
import { StatusAccordionSection } from '../../primitives'
import { EXCEPTION_LANE_LABELS, EXCEPTION_LANE_NOTES } from './dispatch'

export function ExceptionStatusBlock({ lane, exceptionType, statusOpen, toggleStatus }) {
  if (lane !== 'exception') return null
  return (
    <StatusAccordionSection title="Exception details"
      accent={T.violet}
      preview={EXCEPTION_LANE_LABELS[exceptionType] ?? exceptionType}
      open={!!statusOpen.exception} onToggle={() => toggleStatus('exception')}>
      <div style={{ fontSize: 11, color: T.textDim, lineHeight: 1.55, fontStyle: 'italic' }}>
        {EXCEPTION_LANE_NOTES[exceptionType] ?? 'Exception detected; full handling in later phases.'}
      </div>
    </StatusAccordionSection>
  )
}
