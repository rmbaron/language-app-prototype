// Forward Flow — Frame Library sub-tab content.
// Verb-frame inversion: frame is the structure (slot signature), the verbs
// that fit each frame are listed underneath. Highlights the frame whose
// verb list contains the live-parser's matched verb.

import { T } from '../../theme'
import { Section } from '../../primitives'
import { FRAME_LIBRARY } from './frameLibrary'
import { FrameCard } from './FrameCard'

export function FrameSubTabContent({
  matchedVerb,
  expanded, setExpanded, toggle,
  search, setSearch,
}) {
  return (
    <>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: T.green, textTransform: 'uppercase', marginBottom: 8 }}>
        Core group · per-verb catalog
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <Section>Frame Library ({FRAME_LIBRARY.length}) — verb argument structures</Section>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setExpanded(curr => ({ ...curr, ...Object.fromEntries(FRAME_LIBRARY.map(f => [`frame-${f.signature}`, true])) }))}
            style={{ padding: '3px 8px', fontSize: 11, border: `1px solid ${T.border}`, borderRadius: 4, background: '#fff', color: T.textDim, cursor: 'pointer' }}>
            expand all
          </button>
          <button onClick={() => setExpanded(curr => { const n = { ...curr }; for (const f of FRAME_LIBRARY) delete n[`frame-${f.signature}`]; return n })}
            style={{ padding: '3px 8px', fontSize: 11, border: `1px solid ${T.border}`, borderRadius: 4, background: '#fff', color: T.textDim, cursor: 'pointer' }}>
            collapse all
          </button>
        </div>
      </div>
      <div style={{ fontSize: 12, color: T.textDim, marginBottom: 14, lineHeight: 1.6, fontStyle: 'italic' }}>
        The {FRAME_LIBRARY.length} frames an English clause's predicate can take. Frame is the structure (slot signature); the verbs that fit each frame are listed underneath. <b>Per-verb catalog</b> — each verb permits one or more of these frames. Free adjuncts (yesterday, in the kitchen) can attach to any frame without being declared.
      </div>
      <input type="text" placeholder="search frames or verbs…" value={search} onChange={e => setSearch(e.target.value)}
        style={{ width: '100%', padding: '6px 10px', fontSize: 12, border: `1px solid ${T.border}`, borderRadius: 4, marginBottom: 10, boxSizing: 'border-box' }} />
      <div>
        {FRAME_LIBRARY.filter(f => {
          const q = search.toLowerCase().trim()
          if (!q) return true
          if (f.signature.toLowerCase().includes(q) || f.label.toLowerCase().includes(q) || f.description.toLowerCase().includes(q)) return true
          return f.verbs.some(({ verb }) => verb.baseForm.toLowerCase().includes(q) || verb.verbId.toLowerCase().includes(q))
        }).map(frame => {
          const isFrameMatched = matchedVerb && frame.verbs.some(v => v.verb.verbId === matchedVerb.verbId)
          return (
            <div key={frame.signature}
              style={{
                outline: isFrameMatched ? `3px solid ${T.amber}` : 'none',
                outlineOffset: '3px',
                borderRadius: 6,
                transition: 'outline 200ms',
              }}>
              <FrameCard frame={frame}
                matchedVerbId={matchedVerb?.verbId ?? null}
                expanded={!!expanded[`frame-${frame.signature}`]}
                onToggle={() => toggle(`frame-${frame.signature}`)} />
            </div>
          )
        })}
      </div>
    </>
  )
}
