// Forward Flow — Verb · Live Hypotheses sub-block.
// Surfaces V's multi-hypothesis state: be-aux Prog/Pass ambiguity, aux-chain
// forming without lexical verb yet, frame ambiguity (verbs that declare more
// than one frame). Hidden when nothing notable.

import { T } from '../../../theme'
import { liveVerbHypotheses } from '../detector'

export function VerbHypothesesStatus({ matchedVerb, auxChain, auxConfiguration, pickedFrameSlots }) {
  const hyps = liveVerbHypotheses(matchedVerb, auxChain, auxConfiguration, pickedFrameSlots)
  const live = hyps.filter(h => h.state !== 'matched')
  if (live.length === 0) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 10, marginTop: 4, marginBottom: 4 }}>
      <span style={{ color: T.textDim, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: 9 }}>still in play (V)</span>
      {live.map((h, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 6, fontFamily: 'monospace' }}>
          <span style={{ color: T.amber, fontWeight: 700 }}>{h.kind === 'frame' ? `frame ${h.shape}` : h.shape}</span>
          <span style={{ color: T.textDim, fontSize: 9, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{h.state}</span>
          {h.hint && <span style={{ color: T.textSub, fontFamily: 'system-ui, sans-serif' }}>{h.hint}</span>}
        </div>
      ))}
    </div>
  )
}
