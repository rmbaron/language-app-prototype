// Forward Flow — Adverbial sub-tab content.
//
// Like Complement, A is built against the shared structure registry — no
// per-unit shape catalog. The sub-tab renders only the structures A
// accepts, sourced from src/forwardFlow/structures.en.js.

import { T, matchesSearch } from '../../theme'
import { Section } from '../../primitives'
import { STRUCTURES } from '../../structures.en.js'
import { SHAPE_FAMILIES } from '../../shapeFamilies.en.js'
import { ADVERBIAL_ACCEPTS } from './acceptance.en.js'

const ACCEPTED_STRUCTURES = STRUCTURES.filter(s => ADVERBIAL_ACCEPTS.includes(s.id))

function groupByFamily(structures) {
  return SHAPE_FAMILIES
    .map(fam => ({ family: fam, structures: structures.filter(s => s.family === fam.id) }))
    .filter(g => g.structures.length > 0)
}

export function AdverbialSubTabContent({
  adverbialAnalysis,
  expanded, setExpanded, toggle,
  search, setSearch,
}) {
  const matchedId = adverbialAnalysis?.structure ?? null
  const filtered = ACCEPTED_STRUCTURES.filter(s => matchesSearch(s, search, ['label', 'description', 'pattern']))
  const groups = groupByFamily(filtered)
  const detectedCount = ACCEPTED_STRUCTURES.filter(s => s.detected !== false).length

  return (
    <>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: T.violet, textTransform: 'uppercase', marginBottom: 8 }}>
        Slot acceptance · sourced from shared structure registry
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <Section>Adverbial accepts ({ACCEPTED_STRUCTURES.length}) — {detectedCount} detected, {ACCEPTED_STRUCTURES.length - detectedCount} catalog-only</Section>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setExpanded(curr => ({ ...curr, ...Object.fromEntries(ACCEPTED_STRUCTURES.map(s => [`adv-${s.id}`, true])) }))}
            style={{ padding: '3px 8px', fontSize: 11, border: `1px solid ${T.border}`, borderRadius: 4, background: '#fff', color: T.textDim, cursor: 'pointer' }}>
            expand all
          </button>
          <button onClick={() => setExpanded(curr => { const n = { ...curr }; for (const s of ACCEPTED_STRUCTURES) delete n[`adv-${s.id}`]; return n })}
            style={{ padding: '3px 8px', fontSize: 11, border: `1px solid ${T.border}`, borderRadius: 4, background: '#fff', color: T.textDim, cursor: 'pointer' }}>
            collapse all
          </button>
        </div>
      </div>
      <div style={{ fontSize: 12, color: T.textDim, marginBottom: 14, lineHeight: 1.6, fontStyle: 'italic' }}>
        Adverbial fills two roles depending on the verb's frame. <b>Argument</b> A is required (live → "in London", put → "on the table"). <b>Adjunct</b> A is free-attaching ("She runs <i>in the park</i>" — frame is SV; "in the park" attaches anyway). v1 detects end-position A only; medial ("She <i>often</i> runs") and initial ("<i>Yesterday</i> she arrived") A are deferred.
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
              padding: '2px 8px', background: T.violetBg, border: `1px solid ${T.violetBord}`,
              borderRadius: 3, fontSize: 10, fontWeight: 700, color: T.violet,
              letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>{family.label}</span>
            <span style={{ fontSize: 11, color: T.textDim }}>({structures.length})</span>
            <span style={{ fontSize: 11, color: T.textSub, fontStyle: 'italic' }}>{family.description}</span>
          </div>
          {structures.map(struct => (
            <StructureCard key={struct.id}
              structure={struct}
              isMatch={matchedId === struct.id}
              expanded={!!expanded[`adv-${struct.id}`]}
              onToggle={() => toggle(`adv-${struct.id}`)} />
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

function StructureCard({ structure, isMatch, expanded, onToggle }) {
  const dim = structure.detected === false
  return (
    <div style={{
      outline: isMatch ? `3px solid ${T.violetBord}` : 'none',
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
            padding: '3px 9px', background: T.violetBg, border: `1px solid ${T.violetBord}`, borderRadius: 4,
            fontSize: 12, fontWeight: 700, color: T.violet, fontFamily: 'monospace',
          }}>A</span>
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
                <span style={{ color: T.violet, fontWeight: 600, fontFamily: 'monospace' }}>→ {ex.highlight}</span>
              </div>
            ))}
          </div>
        </>)}
      </div>
    </div>
  )
}
