// Forward Flow — Subject Shapes sub-tab content.
// Renders the alternative-catalog list of Subject shapes; highlights the
// shape the live parser currently matches.

import { T, matchesSearch } from '../../theme'
import { Section } from '../../primitives'
import { getSubjectShapes } from './shapesIndex'
import { SubjectShapeCard } from './ShapeCard'

const SUBJECT_SHAPES = getSubjectShapes('en')

export function SubjectSubTabContent({
  lane, subjectShape,
  expanded, setExpanded, toggle,
  search, setSearch,
}) {
  return (
    <>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: T.green, textTransform: 'uppercase', marginBottom: 8 }}>
        Core group · alternative catalog
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <Section>Subject Shapes ({SUBJECT_SHAPES.length}) — alternative shapes that fill S</Section>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setExpanded(curr => ({ ...curr, ...Object.fromEntries(SUBJECT_SHAPES.map(s => [`subj-${s.id}`, true])) }))}
            style={{ padding: '3px 8px', fontSize: 11, border: `1px solid ${T.border}`, borderRadius: 4, background: '#fff', color: T.textDim, cursor: 'pointer' }}>
            expand all
          </button>
          <button onClick={() => setExpanded(curr => { const n = { ...curr }; for (const s of SUBJECT_SHAPES) delete n[`subj-${s.id}`]; return n })}
            style={{ padding: '3px 8px', fontSize: 11, border: `1px solid ${T.border}`, borderRadius: 4, background: '#fff', color: T.textDim, cursor: 'pointer' }}>
            collapse all
          </button>
        </div>
      </div>
      <div style={{ fontSize: 12, color: T.textDim, marginBottom: 14, lineHeight: 1.6, fontStyle: 'italic' }}>
        {SUBJECT_SHAPES.length} ways an English Subject can be shaped. <b>Alternative catalog</b> — each Subject matches one of these shapes (or none yet), not a combination.
      </div>
      <input type="text" placeholder="search subject shapes…" value={search} onChange={e => setSearch(e.target.value)}
        style={{ width: '100%', padding: '6px 10px', fontSize: 12, border: `1px solid ${T.border}`, borderRadius: 4, marginBottom: 10, boxSizing: 'border-box' }} />
      <div>
        {SUBJECT_SHAPES.filter(s => matchesSearch(s, search, ['label', 'description', 'pattern'])).map(shape => {
          const isMatch = lane === 'fundamental' && subjectShape === shape.id
          return (
            <div key={shape.id}
              style={{
                outline: isMatch ? `3px solid ${T.blueBord}` : 'none',
                outlineOffset: '3px',
                borderRadius: 6,
                transition: 'outline 200ms',
              }}>
              <SubjectShapeCard shape={shape}
                expanded={!!expanded[`subj-${shape.id}`]}
                onToggle={() => toggle(`subj-${shape.id}`)} />
            </div>
          )
        })}
      </div>
    </>
  )
}
