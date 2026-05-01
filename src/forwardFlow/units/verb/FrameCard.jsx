// Forward Flow — Frame card. One verb-frame (slot signature) + the verbs that fit it.

import { useState } from 'react'
import { T } from '../../theme'
import { SlotSignature } from '../../primitives'

// Frame card pagination — start with 30 verbs and expand on demand. The
// frame's verb list grows linearly with the seed; this is the foundation
// for handling 1000+ verbs without rendering them all at once.
const FRAME_VERBS_PAGE_SIZE = 30

export function FrameCard({ frame, matchedVerbId, expanded, onToggle }) {
  const [showAllVerbs, setShowAllVerbs] = useState(false)
  const matchedVerbInFrame = matchedVerbId && frame.verbs.some(v => v.verb.verbId === matchedVerbId)
  // If the matched verb is past the first page, force-show all so the user
  // doesn't have to click "show more" to see why their card is highlighted.
  const matchedPastFirstPage = matchedVerbId && frame.verbs.slice(FRAME_VERBS_PAGE_SIZE).some(v => v.verb.verbId === matchedVerbId)
  const effectiveShowAll = showAllVerbs || matchedPastFirstPage
  const verbsToShow = effectiveShowAll ? frame.verbs : frame.verbs.slice(0, FRAME_VERBS_PAGE_SIZE)
  const hiddenCount = frame.verbs.length - verbsToShow.length

  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: expanded ? '14px 16px' : '10px 14px', marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: expanded ? 8 : 0, flexWrap: 'wrap' }}>
        <SlotSignature slots={frame.slots} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{frame.label}</div>
          <div style={{ fontSize: 11, color: T.textDim, fontFamily: 'monospace', marginTop: 1 }}>
            {frame.signature} · {frame.verbs.length} verb{frame.verbs.length === 1 ? '' : 's'}
            {matchedVerbInFrame && <span style={{ marginLeft: 6, color: T.amber, fontWeight: 700 }}>· match: {matchedVerbId}</span>}
          </div>
        </div>
        <button onClick={onToggle}
          style={{ padding: '4px 10px', background: '#fff', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 11, color: T.textDim, cursor: 'pointer' }}>
          {expanded ? '▴ less' : '▾ more'}
        </button>
      </div>

      {expanded && (<>
      <div style={{ fontSize: 12, color: T.textSub, lineHeight: 1.55, marginBottom: 8 }}>
        {frame.description}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {verbsToShow.map(({ verb, frame: verbFrame }) => {
          const isVerbMatched = matchedVerbId === verb.verbId
          return (
            <div key={verb.verbId + ':' + verbFrame.id}
              style={{
                background: '#fff',
                border: `1px solid ${isVerbMatched ? T.amberBord : T.border}`,
                outline: isVerbMatched ? `2px solid ${T.amberBord}` : 'none',
                outlineOffset: '1px',
                borderRadius: 5,
                padding: '8px 12px',
                transition: 'outline 200ms, border 200ms',
              }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                <span style={{
                  padding: '3px 10px', background: T.amberBg, border: `1px solid ${T.amberBord}`, borderRadius: 4,
                  fontSize: 14, fontWeight: 800, fontFamily: 'monospace', color: T.amber,
                }}>
                  {verb.baseForm}
                </span>
                <span style={{ fontSize: 11, color: T.textDim, fontFamily: 'monospace' }}>
                  {verbFrame.label}
                </span>
                <span style={{ fontSize: 12, color: T.text, fontStyle: 'italic', flex: 1 }}>
                  "{verbFrame.example}"
                </span>
                {!verb.inSeed && (
                  <span style={{ fontSize: 9, color: T.amber, fontStyle: 'italic' }}>
                    not in seed
                  </span>
                )}
              </div>

              {(verbFrame.notes || verbFrame.slotNotes) && (
                <div style={{ marginTop: 6, paddingTop: 6, borderTop: `1px dashed ${T.border}` }}>
                  {verbFrame.notes && (
                    <div style={{ fontSize: 11, color: T.textSub, lineHeight: 1.5, marginBottom: verbFrame.slotNotes ? 6 : 0 }}>
                      {verbFrame.notes}
                    </div>
                  )}
                  {verbFrame.slotNotes && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {Object.entries(verbFrame.slotNotes).map(([idx, note]) => {
                        const slotChar = verbFrame.slots[Number(idx)]
                        return (
                          <div key={idx} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                            <span style={{ fontSize: 10, color: T.textDim, fontFamily: 'monospace', minWidth: 50 }}>
                              slot {idx} ({slotChar})
                            </span>
                            <span style={{ fontSize: 10, color: T.textSub, lineHeight: 1.5, flex: 1 }}>{note}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
      {hiddenCount > 0 && !effectiveShowAll && (
        <button onClick={() => setShowAllVerbs(true)}
          style={{
            marginTop: 8, padding: '6px 12px',
            background: '#fff', border: `1px solid ${T.border}`, borderRadius: 4,
            fontSize: 12, color: T.textSub, cursor: 'pointer', fontWeight: 600,
          }}>
          show all {frame.verbs.length} verbs ({hiddenCount} hidden)
        </button>
      )}
      {effectiveShowAll && frame.verbs.length > FRAME_VERBS_PAGE_SIZE && !matchedPastFirstPage && (
        <button onClick={() => setShowAllVerbs(false)}
          style={{
            marginTop: 8, padding: '6px 12px',
            background: '#fff', border: `1px solid ${T.border}`, borderRadius: 4,
            fontSize: 12, color: T.textSub, cursor: 'pointer', fontWeight: 600,
          }}>
          show only first {FRAME_VERBS_PAGE_SIZE}
        </button>
      )}
      </>)}
    </div>
  )
}
