// Forward Flow — Verb · Failure sub-block.
// Visible only when no verb matched but the input has tokens. Names the
// categorical reason via diagnoseVerbFailure so the panel narrates *why*
// the engine couldn't find a verb instead of going silent.

import { T } from '../../../theme'
import { diagnoseVerbFailure } from '../detector'

export function VerbFailureStatus({ matchedVerb, tokens, lane }) {
  if (matchedVerb) return null
  if (!tokens || tokens.length === 0) return null
  if (lane !== 'fundamental' && lane !== 'exception') return null
  const reason = diagnoseVerbFailure(tokens)
  if (!reason) return null
  return (
    <div style={{
      padding: '6px 10px', background: T.amberBg, border: `1px solid ${T.amberBord}`,
      borderRadius: 4, fontSize: 11, color: T.amber, lineHeight: 1.5, marginTop: 2,
    }}>
      <span style={{ fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: 9, marginRight: 6 }}>no verb</span>
      {reason}
    </div>
  )
}
