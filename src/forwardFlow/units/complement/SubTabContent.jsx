// Forward Flow — Complement sub-tab content.
//
// First unit built against the shared structure registry. Renders only the
// structures C accepts, sourced from src/forwardFlow/structures.en.js (NOT
// from a per-unit catalog). Highlights the matched structure when the live
// parser is on a complement-licensing frame.

import { T, matchesSearch } from '../../theme'
import { Section } from '../../primitives'
import { STRUCTURES } from '../../structures.en.js'
import { SHAPE_FAMILIES } from '../../shapeFamilies.en.js'
import { COMPLEMENT_ACCEPTS } from './acceptance.en.js'

const ACCEPTED_STRUCTURES = STRUCTURES.filter(s => COMPLEMENT_ACCEPTS.includes(s.id))

function groupByFamily(structures) {
  return SHAPE_FAMILIES
    .map(fam => ({ family: fam, structures: structures.filter(s => s.family === fam.id) }))
    .filter(g => g.structures.length > 0)
}

export function ComplementSubTabContent({
  complementAnalysis,
  expanded, setExpanded, toggle,
  search, setSearch,
}) {
  const matchedId = complementAnalysis?.structure ?? null
  const filtered = ACCEPTED_STRUCTURES.filter(s => matchesSearch(s, search, ['label', 'description', 'pattern']))
  const groups = groupByFamily(filtered)
  const detectedCount = ACCEPTED_STRUCTURES.filter(s => s.detected !== false).length

  return (
    <>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: T.amber, textTransform: 'uppercase', marginBottom: 8 }}>
        Slot acceptance · sourced from shared structure registry
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <Section>Complement accepts ({ACCEPTED_STRUCTURES.length}) — {detectedCount} detected, {ACCEPTED_STRUCTURES.length - detectedCount} catalog-only</Section>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setExpanded(curr => ({ ...curr, ...Object.fromEntries(ACCEPTED_STRUCTURES.map(s => [`comp-${s.id}`, true])) }))}
            style={{ padding: '3px 8px', fontSize: 11, border: `1px solid ${T.border}`, borderRadius: 4, background: '#fff', color: T.textDim, cursor: 'pointer' }}>
            expand all
          </button>
          <button onClick={() => setExpanded(curr => { const n = { ...curr }; for (const s of ACCEPTED_STRUCTURES) delete n[`comp-${s.id}`]; return n })}
            style={{ padding: '3px 8px', fontSize: 11, border: `1px solid ${T.border}`, borderRadius: 4, background: '#fff', color: T.textDim, cursor: 'pointer' }}>
            collapse all
          </button>
        </div>
      </div>
      <div style={{ fontSize: 12, color: T.textDim, marginBottom: 14, lineHeight: 1.6, fontStyle: 'italic' }}>
        C is the first unit built without its own catalog. The structures shown here are pulled from the shared registry (<code>src/forwardFlow/structures.en.js</code>) — defined once, referenced by C's acceptance declaration. Subject and Object will eventually migrate to this same pattern.
        <br /><br />
        Cs (Subject Complement) appears in SVC frames; Co (Object Complement) in SVOC frames. Both accept the same structure set; the difference is what they predicate over.
      </div>
      <input type="text" placeholder="search structures…" value={search} onChange={e => setSearch(e.target.value)}
        style={{ width: '100%', padding: '6px 10px', fontSize: 12, border: `1px solid ${T.border}`, borderRadius: 4, marginBottom: 10, boxSizing: 'border-box' }} />

      {groups.map(({ family, structures }) => (
        <div key={family.id} style={{ marginBottom: 18 }}>
          <div style={{
            display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap',
            marginBottom: 6, paddingBottom: 4, borderBottom: `1px solid ${T.border}`,
          }}>
            <span style={{
              padding: '2px 8px', background: T.amberBg, border: `1px solid ${T.amberBord}`,
              borderRadius: 3, fontSize: 10, fontWeight: 700, color: T.amber,
              letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>{family.label}</span>
            <span style={{ fontSize: 11, color: T.textDim }}>({structures.length})</span>
            <span style={{ fontSize: 11, color: T.textSub, fontStyle: 'italic' }}>{family.description}</span>
          </div>
          {structures.map(struct => (
            <StructureCard key={struct.id}
              structure={struct}
              isMatch={matchedId === struct.id}
              expanded={!!expanded[`comp-${struct.id}`]}
              onToggle={() => toggle(`comp-${struct.id}`)} />
          ))}
        </div>
      ))}
      {groups.length === 0 && (
        <div style={{ padding: '20px', textAlign: 'center', fontSize: 12, color: T.textDim, fontStyle: 'italic' }}>
          no structures match the search
        </div>
      )}
    </>
  )
}

// Inline structure card — renders directly from the shared registry record.
// When S/O migrate to the structure registry, this component (or a shared
// version) replaces their per-unit ShapeCard files.
function StructureCard({ structure, isMatch, expanded, onToggle }) {
  const dim = structure.detected === false
  return (
    <div style={{
      outline: isMatch ? `3px solid ${T.amberBord}` : 'none',
      outlineOffset: '3px',
      borderRadius: 6,
      transition: 'outline 200ms',
    }}>
      <div style={{
        background: T.card, border: `1px solid ${T.border}`, borderRadius: 6,
        padding: expanded ? '12px 14px' : '8px 12px', marginBottom: 6,
        opacity: dim ? 0.7 : 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span style={{
            padding: '3px 9px', background: T.amberBg, border: `1px solid ${T.amberBord}`, borderRadius: 4,
            fontSize: 12, fontWeight: 700, color: T.amber, fontFamily: 'monospace',
          }}>C</span>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{structure.label}</span>
              {dim && (
                <span style={{ padding: '1px 6px', background: '#fff', border: `1px solid ${T.border}`, borderRadius: 3, fontSize: 9, fontWeight: 700, color: T.textDim, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  catalog-only
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: T.textDim, fontFamily: 'monospace', marginTop: 1 }}>{structure.pattern}</div>
          </div>
          <button onClick={onToggle}
            style={{ padding: '3px 9px', background: '#fff', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 11, color: T.textDim, cursor: 'pointer' }}>
            {expanded ? '▴ less' : '▾ more'}
          </button>
        </div>

        {expanded && (<>
          <div style={{ fontSize: 12, color: T.textSub, lineHeight: 1.55, marginTop: 6, marginBottom: 6 }}>
            {structure.description}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {structure.examples.map((ex, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', fontSize: 12 }}>
                <span style={{ color: T.text, fontStyle: 'italic' }}>"{ex.sentence}"</span>
                <span style={{ color: T.amber, fontWeight: 600, fontFamily: 'monospace' }}>→ {ex.highlight}</span>
              </div>
            ))}
          </div>
        </>)}
      </div>
    </div>
  )
}
