// Slot Acceptance View — shared component for slot SubTabContent rendering.
//
// Used by Subject, Object, Complement, Adverbial. Each slot's SubTabContent
// is now a thin wrapper that supplies its accepts list, color, prefix, and
// the set of matched structure IDs from the live parser.
//
// Props:
//   acceptsList     — STRUCTURES filtered to the structures this slot accepts
//   colorKey        — 'blue' | 'green' | 'amber' | 'violet' (key into T)
//   slotShortLabel  — 'S' | 'O' | 'C' | 'A' (rendered on the card chip)
//   storagePrefix   — string used as the expanded-state key prefix
//   matchedIds      — Set<string> of structure IDs the live parser matched
//   introNode       — JSX rendered above the search box
//   search/setSearch, expanded/setExpanded, toggle — orchestrator state
//
// The wrappers compute matchedIds themselves (each unit's analysis shape
// differs); this component takes a uniform Set so it stays simple.

import { T, matchesSearch } from './theme'
import { Section } from './primitives'
import { SHAPE_FAMILIES } from './shapeFamilies.en.js'

function groupByFamily(structures) {
  return SHAPE_FAMILIES
    .map(fam => ({ family: fam, structures: structures.filter(s => s.family === fam.id) }))
    .filter(g => g.structures.length > 0)
}

export function SlotAcceptanceView({
  acceptsList,
  colorKey,
  slotShortLabel,
  storagePrefix,
  matchedIds,
  introNode,
  expanded, setExpanded, toggle,
  search, setSearch,
}) {
  const color    = T[colorKey]
  const colorBg  = T[`${colorKey}Bg`]
  const colorBord= T[`${colorKey}Bord`]
  const filtered = acceptsList.filter(s => matchesSearch(s, search, ['label', 'description', 'pattern']))
  const groups   = groupByFamily(filtered)
  const detected = acceptsList.filter(s => s.detected !== false).length

  return (
    <>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color, textTransform: 'uppercase', marginBottom: 8 }}>
        Slot acceptance · sourced from shared structure registry
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <Section>{slotShortLabel} accepts ({acceptsList.length}) — {detected} detected, {acceptsList.length - detected} catalog-only</Section>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setExpanded(curr => ({ ...curr, ...Object.fromEntries(acceptsList.map(s => [`${storagePrefix}${s.id}`, true])) }))}
            style={{ padding: '3px 8px', fontSize: 11, border: `1px solid ${T.border}`, borderRadius: 4, background: '#fff', color: T.textDim, cursor: 'pointer' }}>
            expand all
          </button>
          <button onClick={() => setExpanded(curr => { const n = { ...curr }; for (const s of acceptsList) delete n[`${storagePrefix}${s.id}`]; return n })}
            style={{ padding: '3px 8px', fontSize: 11, border: `1px solid ${T.border}`, borderRadius: 4, background: '#fff', color: T.textDim, cursor: 'pointer' }}>
            collapse all
          </button>
        </div>
      </div>
      {introNode && (
        <div style={{ fontSize: 12, color: T.textDim, marginBottom: 14, lineHeight: 1.6, fontStyle: 'italic' }}>
          {introNode}
        </div>
      )}
      <input type="text" placeholder="search structures…" value={search} onChange={e => setSearch(e.target.value)}
        style={{ width: '100%', padding: '6px 10px', fontSize: 12, border: `1px solid ${T.border}`, borderRadius: 4, marginBottom: 10, boxSizing: 'border-box' }} />

      {groups.map(({ family, structures }) => (
        <div key={family.id} style={{ marginBottom: 18 }}>
          <div style={{
            display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap',
            marginBottom: 6, paddingBottom: 4, borderBottom: `1px solid ${T.border}`,
          }}>
            <span style={{
              padding: '2px 8px', background: colorBg, border: `1px solid ${colorBord}`,
              borderRadius: 3, fontSize: 10, fontWeight: 700, color,
              letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>{family.label}</span>
            <span style={{ fontSize: 11, color: T.textDim }}>({structures.length})</span>
            <span style={{ fontSize: 11, color: T.textSub, fontStyle: 'italic' }}>{family.description}</span>
          </div>
          {structures.map(struct => (
            <StructureCard key={struct.id}
              structure={struct}
              isMatch={matchedIds.has(struct.id)}
              color={color} colorBg={colorBg} colorBord={colorBord}
              slotShortLabel={slotShortLabel}
              expanded={!!expanded[`${storagePrefix}${struct.id}`]}
              onToggle={() => toggle(`${storagePrefix}${struct.id}`)} />
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

function StructureCard({ structure, isMatch, color, colorBg, colorBord, slotShortLabel, expanded, onToggle }) {
  const dim = structure.detected === false
  return (
    <div style={{
      outline: isMatch ? `3px solid ${colorBord}` : 'none',
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
            padding: '3px 9px', background: colorBg, border: `1px solid ${colorBord}`, borderRadius: 4,
            fontSize: 12, fontWeight: 700, color, fontFamily: 'monospace',
          }}>{slotShortLabel}</span>
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
                <span style={{ color, fontWeight: 600, fontFamily: 'monospace' }}>→ {ex.highlight}</span>
              </div>
            ))}
          </div>
        </>)}
      </div>
    </div>
  )
}
