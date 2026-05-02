// Forward Flow — Exception Shapes sub-tab content.
// Marked openings (sentences that don't open with a Subject). Highlights
// the shape the live parser currently identifies.

import { T, matchesSearch } from '../../theme'
import { Section } from '../../primitives'
import { getExceptionShapes } from './shapesIndex'
import { ExceptionShapeCard } from './ShapeCard'

const EXCEPTION_SHAPES = getExceptionShapes('en')

export function ExceptionSubTabContent({
  lane, exceptionType,
  expanded, setExpanded, toggle,
  search, setSearch,
}) {
  return (
    <>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: T.violet, textTransform: 'uppercase', marginBottom: 8 }}>
        Exception group · marked openings
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <Section>Exception Shapes ({EXCEPTION_SHAPES.length}) — sentences that don&apos;t open with a Subject</Section>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setExpanded(curr => ({ ...curr, ...Object.fromEntries(EXCEPTION_SHAPES.map(s => [`exc-${s.id}`, true])) }))}
            style={{ padding: '3px 8px', fontSize: 11, border: `1px solid ${T.border}`, borderRadius: 4, background: '#fff', color: T.textDim, cursor: 'pointer' }}>
            expand all
          </button>
          <button onClick={() => setExpanded(curr => { const n = { ...curr }; for (const s of EXCEPTION_SHAPES) delete n[`exc-${s.id}`]; return n })}
            style={{ padding: '3px 8px', fontSize: 11, border: `1px solid ${T.border}`, borderRadius: 4, background: '#fff', color: T.textDim, cursor: 'pointer' }}>
            collapse all
          </button>
        </div>
      </div>
      <div style={{ fontSize: 12, color: T.textDim, marginBottom: 14, lineHeight: 1.6, fontStyle: 'italic' }}>
        The {EXCEPTION_SHAPES.length} marked openings — each announces a different sentence trajectory than the regular declarative. Each card shows whether detection is currently wired.
      </div>
      <input type="text" placeholder="search exception shapes…" value={search} onChange={e => setSearch(e.target.value)}
        style={{ width: '100%', padding: '6px 10px', fontSize: 12, border: `1px solid ${T.border}`, borderRadius: 4, marginBottom: 10, boxSizing: 'border-box' }} />
      <div>
        {EXCEPTION_SHAPES.filter(s => matchesSearch(s, search, ['label', 'description', 'pattern', 'trigger'])).map(shape => {
          const isMatch = lane === 'exception' && exceptionType === shape.id
          return (
            <div key={shape.id}
              style={{
                outline: isMatch ? `3px solid ${T.violetBord}` : 'none',
                outlineOffset: '3px',
                borderRadius: 6,
                transition: 'outline 200ms',
              }}>
              <ExceptionShapeCard shape={shape}
                expanded={!!expanded[`exc-${shape.id}`]}
                onToggle={() => toggle(`exc-${shape.id}`)} />
            </div>
          )
        })}
      </div>
    </>
  )
}
