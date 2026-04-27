import { useState, useMemo } from 'react'
import { useInventory } from './InventoryContext'
import { ATOMS } from './grammarAtoms.en'
import { TIMES, ASPECTS, ASPECT_LABELS } from './tenseGrid.en'
import { buildIndexEntries, searchEntries, passFilter } from './buildIndexEntries'

// ── Persist groups ────────────────────────────────────────────────────────────

const GROUPS_KEY = 'lapp-index-groups'
const loadGroups    = () => { try { return JSON.parse(localStorage.getItem(GROUPS_KEY) ?? '[]') } catch { return [] } }
const persistGroups = g  => localStorage.setItem(GROUPS_KEY, JSON.stringify(g))
const newGroupId    = () => `g-${Date.now()}`

// ── Colors ────────────────────────────────────────────────────────────────────

const C = {
  bg:           '#f5f6fb',
  card:         '#ffffff',
  border:       '#dde0f0',
  primary:      '#1a1a2e',
  secondary:    '#4a5080',
  muted:        '#8890b8',
  accent:       '#3355cc',
  accentBg:     '#eef1ff',
  accentBorder: '#b0bef0',
}

// Chip background/border/color by entry type
const TYPE_STYLE = {
  word:         { bg: '#ffffff', border: C.border,   text: C.secondary },
  fixed_unit:   { bg: '#edf2ff', border: '#b0bef0',  text: '#3355cc'   },
  always_pass:  { bg: '#fff8f0', border: '#ffb74d',  text: '#8a5000'   },
  construction: { bg: '#f0faf5', border: '#80c8a0',  text: '#1a6640'   },
}

// Atoms that have no standalone words by design (structure-unlocks)
const STRUCTURE_UNLOCK = {
  progressive_auxiliary: 'Derived from copula — no standalone words. Unlocks when copula is banked.',
  perfect_auxiliary:     'Derived from have — no standalone words. Unlocks at A2.',
}

// ── Sub-components ────────────────────────────────────────────────────────────

function EntryChip({ entry, banked, expanded, onExpand }) {
  const s   = TYPE_STYLE[entry.type] ?? TYPE_STYLE.word
  const dim = entry.type === 'word' && banked === false
  const isConstruction = entry.type === 'construction'
  return (
    <span onClick={isConstruction ? onExpand : undefined}
      style={{
        background: expanded ? '#d4edda' : s.bg,
        border:     `1px solid ${expanded ? '#80c8a0' : s.border}`,
        color:      s.text,
        borderRadius: 5, padding: '3px 9px', fontSize: 12,
        opacity: dim ? 0.4 : 1,
        cursor: isConstruction ? 'pointer' : 'default',
        userSelect: 'none',
      }}>
      {entry.surface}
      {entry.isPioneer && <span style={{ marginLeft: 3, fontSize: 9 }}>★</span>}
      {isConstruction && entry.spaceCount > 0 &&
        <span style={{ marginLeft: 4, fontSize: 9, opacity: 0.6 }}>{entry.spaceCount + 1}w ▾</span>}
    </span>
  )
}

function EntryList({ entries, label, bankedSurfaces }) {
  const [q,          setQ]          = useState('')
  const [expandedId, setExpandedId] = useState(null)
  if (!entries.length) return null
  const shown    = q ? entries.filter(e => e.surface.toLowerCase().includes(q.toLowerCase())) : entries
  const visible  = shown.slice(0, 100)
  const overflow = shown.length > 100
  const expanded = visible.find(e => e.id === expandedId)

  function toggleExpand(id) { setExpandedId(prev => prev === id ? null : id) }

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>
        {label} ({entries.length})
      </div>
      {entries.length > 100 && (
        <input value={q} onChange={e => setQ(e.target.value)} placeholder={`Filter ${entries.length}...`}
          style={{ width: '100%', boxSizing: 'border-box', marginBottom: 6, padding: '5px 8px', fontSize: 11,
            border: `1px solid ${C.border}`, borderRadius: 5, background: C.bg, color: C.primary }} />
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {visible.map(e => (
          <EntryChip key={e.id + e.sourceId} entry={e} banked={bankedSurfaces?.has(e.surface)}
            expanded={expandedId === e.id} onExpand={() => toggleExpand(e.id)} />
        ))}
      </div>
      {expanded && (
        <div style={{ marginTop: 8, background: '#f0faf5', border: '1px solid #80c8a0', borderRadius: 6, padding: '9px 12px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1a6640', marginBottom: 3 }}>{expanded.pattern}</div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>e.g. &ldquo;{expanded.example}&rdquo;</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Atoms</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {expanded.atomClasses.map(atomId => {
              const atom = ATOMS.find(a => a.id === atomId)
              return (
                <span key={atomId} style={{ background: C.accentBg, border: `1px solid ${C.accentBorder}`, color: C.accent, borderRadius: 5, padding: '3px 9px', fontSize: 11 }}>
                  {atom?.label ?? atomId}
                </span>
              )
            })}
          </div>
        </div>
      )}
      {overflow && !q && (
        <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>showing 100 of {shown.length} — type to filter</div>
      )}
    </div>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function IndexScreen({ onBack }) {
  const { inventory } = useInventory()
  const lang          = inventory.identity.lang ?? 'en'
  const wordBank      = inventory.wordBank

  const [folder,        setFolder]        = useState('atoms')
  const [selectedAtoms, setSelectedAtoms] = useState(new Set())
  const [cefrFilter,    setCefrFilter]    = useState(null)
  const [timeFilter,    setTimeFilter]    = useState(null)
  const [aspectFilter,  setAspectFilter]  = useState(null)
  const [search,        setSearch]        = useState('')
  const [groups,        setGroups]        = useState(loadGroups)
  const [editGroup,     setEditGroup]     = useState(null)

  // Build index once per lang
  const indexData = useMemo(() => buildIndexEntries(lang), [lang])
  const { entries, byAtom, atomWordCounts } = indexData

  // Surfaces of banked words (for overlay)
  const bankedSurfaces = useMemo(() =>
    new Set(wordBank.map(id => id.startsWith(`${lang}-`) ? id.slice(lang.length + 1) : id)),
    [wordBank, lang])

  // Words in bank that don't appear in any system source
  const unclassified = useMemo(() => {
    const sysIds = new Set(entries.filter(e => e.type === 'word').map(e => e.id))
    return wordBank.filter(id => {
      const norm = id.startsWith(`${lang}-`) ? id : `${lang}-${id}`
      return !sysIds.has(norm)
    })
  }, [entries, wordBank, lang])

  // Search results — when active, replaces atom sections
  const searchResults = useMemo(() =>
    search.trim() ? searchEntries(search, indexData) : null,
    [search, indexData])

  // System stats for header line (respects cefrFilter)
  const systemStats = useMemo(() => {
    const filters = { cefrFilter, timeFilter: null, aspectFilter: null }
    const wordCount = new Set(
      entries.filter(e => e.type === 'word' && passFilter(e, filters)).map(e => e.id)
    ).size
    const atomCount = Object.entries(atomWordCounts).filter(([, c]) => c > 0).length
    return { wordCount, atomCount }
  }, [entries, atomWordCounts, cefrFilter])

  const filters = { cefrFilter, timeFilter, aspectFilter }
  const passes  = e => passFilter(e, filters)
  const hasTenseFilter = timeFilter || aspectFilter
  const atomOrder = ATOMS.map(a => a.id)

  // ── Handlers ──
  function toggleAtom(id) {
    setSelectedAtoms(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  function applyGroup(g) { setSelectedAtoms(new Set(g.atoms)); setFolder('atoms') }
  function saveGroup() {
    if (!editGroup?.name.trim()) return
    const saved   = { ...editGroup, atoms: [...editGroup.atoms] }
    const updated = editGroup.id
      ? groups.map(g => g.id === editGroup.id ? saved : g)
      : [...groups, { ...saved, id: newGroupId() }]
    setGroups(updated); persistGroups(updated); setEditGroup(null)
  }
  function deleteGroup(id) { const u = groups.filter(g => g.id !== id); setGroups(u); persistGroups(u) }
  function toggleEditAtom(id) {
    setEditGroup(prev => {
      const n = new Set(prev.atoms); n.has(id) ? n.delete(id) : n.add(id)
      return { ...prev, atoms: n }
    })
  }

  // ── Filter pill helper ──
  function FilterRow({ label, options, value, set, labelMap }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginBottom: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: 50 }}>{label}</span>
        {[null, ...options].map(opt => (
          <button key={opt ?? 'all'} onClick={() => set(opt)}
            style={{
              background: value === opt ? C.accentBg : C.card,
              border: `1px solid ${value === opt ? C.accent : C.border}`,
              color: value === opt ? C.accent : C.secondary,
              borderRadius: 5, padding: '3px 9px', fontSize: 11, cursor: 'pointer',
              fontWeight: value === opt ? 600 : 400,
            }}>
            {opt === null ? 'All' : (labelMap?.[opt] ?? opt.charAt(0).toUpperCase() + opt.slice(1))}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', paddingBottom: 32 }}>
      <div style={{ maxWidth: 540, margin: '0 auto', padding: '16px 14px 0' }}>

        {/* Header */}
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 13, padding: '0 0 8px', display: 'block' }}>← Back</button>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.primary, letterSpacing: '-0.02em', marginBottom: 3 }}>Index</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>
          {lang.toUpperCase()} system vocabulary
          {cefrFilter ? ` · ${cefrFilter}` : ''}
          {' · '}{systemStats.wordCount} words · {systemStats.atomCount} atoms
        </div>

        {/* Unclassified — visible at top when present */}
        {unclassified.length > 0 && (
          <div style={{ background: '#fff9f0', border: '1px solid #ffb74d', borderRadius: 7, padding: '10px 14px', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#8a5000', marginBottom: 6 }}>
              Unclassified words ({unclassified.length}) — in bank but not in any system source
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {unclassified.map(id => (
                <span key={id} style={{ background: '#fff3e0', border: '1px solid #ffb74d', color: '#8a5000', borderRadius: 5, padding: '3px 9px', fontSize: 12 }}>
                  {id.startsWith(`${lang}-`) ? id.slice(lang.length + 1) : id}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Folder tabs */}
        <div style={{ display: 'flex', marginBottom: 14, borderBottom: `1px solid ${C.border}` }}>
          {[{ id: 'atoms', label: 'Atoms' }, { id: 'groups', label: 'My groups' }].map(t => (
            <button key={t.id} onClick={() => setFolder(t.id)} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '7px 16px', fontSize: 13,
              fontWeight: folder === t.id ? 700 : 400,
              color: folder === t.id ? C.accent : C.muted,
              borderBottom: `2px solid ${folder === t.id ? C.accent : 'transparent'}`, marginBottom: -1,
            }}>{t.label}</button>
          ))}
        </div>

        {/* ═══ ATOMS FOLDER ═══ */}
        {folder === 'atoms' && <>

          {/* Filters */}
          <FilterRow label="Level" options={['A1','A2','B1','B2','C1','C2']} value={cefrFilter} set={setCefrFilter} />
          <FilterRow label="Tense"  options={TIMES}   value={timeFilter}   set={setTimeFilter}   />
          <FilterRow label="Aspect" options={ASPECTS} value={aspectFilter} set={setAspectFilter} labelMap={ASPECT_LABELS} />

          {/* Global search */}
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search all sources — words, forms, constructions..."
            style={{ width: '100%', boxSizing: 'border-box', margin: '10px 0 12px',
              background: C.card, border: `1px solid ${C.border}`, color: C.primary,
              borderRadius: 6, padding: '7px 10px', fontSize: 12 }} />

          {/* ── Search results ── */}
          {searchResults && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                Results ({searchResults.length})
              </div>
              {searchResults.length === 0
                ? <div style={{ fontSize: 12, color: C.muted }}>No matches.</div>
                : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {searchResults.map(e => (
                      <EntryChip key={e.id + e.sourceId} entry={e} banked={bankedSurfaces.has(e.surface)} />
                    ))}
                  </div>
              }
            </div>
          )}

          {/* ── Atom chips ── */}
          {!searchResults && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 16 }}>
              {atomOrder.map(atomId => {
                const on    = selectedAtoms.has(atomId)
                const count = atomWordCounts[atomId] ?? 0
                const atom  = ATOMS.find(a => a.id === atomId)
                return (
                  <button key={atomId} onClick={() => toggleAtom(atomId)} title={atom?.description}
                    style={{
                      background:   on ? C.accentBg : C.card,
                      border:       `1.5px solid ${on ? C.accent : C.border}`,
                      color:        on ? C.accent : count > 0 ? C.secondary : C.muted,
                      borderRadius: 5, padding: '4px 10px', fontSize: 11, cursor: 'pointer',
                      fontWeight:   on ? 600 : 400, opacity: count === 0 ? 0.5 : 1,
                    }}>
                    {atom?.label ?? atomId}
                    {count > 0 && <span style={{ marginLeft: 4, fontSize: 9, opacity: 0.6 }}>({count})</span>}
                  </button>
                )
              })}
              {selectedAtoms.size > 0 && (
                <button onClick={() => setSelectedAtoms(new Set())} style={{
                  background: 'none', border: `1px dashed ${C.border}`, color: C.muted,
                  borderRadius: 5, padding: '4px 10px', fontSize: 11, cursor: 'pointer',
                }}>clear</button>
              )}
            </div>
          )}

          {/* ── Circuit always-pass — global section in default view ── */}
          {!searchResults && selectedAtoms.size === 0 && (() => {
            const all = entries.filter(e => e.type === 'always_pass' && passes(e))
            return all.length > 0
              ? <div style={{ marginBottom: 20 }}><EntryList entries={all} label="Circuit always-pass" bankedSurfaces={null} /></div>
              : null
          })()}

          {/* ── Atom content sections ── */}
          {!searchResults && atomOrder.map(atomId => {
            const atomDef     = ATOMS.find(a => a.id === atomId)
            const allForAtom  = byAtom[atomId] ?? []
            const isSelected  = selectedAtoms.has(atomId)

            const multiWords    = allForAtom.filter(e => e.type === 'fixed_unit'  && passes(e))
            // always-pass shown per-atom only when that atom is expanded
            const alwaysPass    = isSelected ? allForAtom.filter(e => e.type === 'always_pass' && passes(e)) : []
            const systemWords   = isSelected ? allForAtom.filter(e => e.type === 'word'        && passes(e)) : []
            const constructions = (isSelected || hasTenseFilter)
              ? allForAtom.filter(e => e.type === 'construction' && passes(e))
              : []

            if (!multiWords.length && !alwaysPass.length && !systemWords.length && !constructions.length) return null

            const noWords = isSelected && systemWords.length === 0 && STRUCTURE_UNLOCK[atomId]

            return (
              <div key={atomId} style={{ marginBottom: 26 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.primary, marginBottom: 2 }}>{atomDef?.label ?? atomId}</div>
                {atomDef?.description && (
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 10, lineHeight: 1.45, maxWidth: 480 }}>{atomDef.description}</div>
                )}
                <EntryList entries={multiWords}    label="Multi-word units"    bankedSurfaces={null} />
                <EntryList entries={alwaysPass}    label="Circuit always-pass" bankedSurfaces={null} />
                <EntryList entries={systemWords}   label="System vocabulary"   bankedSurfaces={bankedSurfaces} />
                <EntryList entries={constructions} label="Constructions"       bankedSurfaces={null} />
                {noWords && (
                  <div style={{ fontSize: 11, color: C.muted, fontStyle: 'italic' }}>{STRUCTURE_UNLOCK[atomId]}</div>
                )}
              </div>
            )
          })}

          {/* Hint when no atom selected and no tense filter */}
          {!searchResults && selectedAtoms.size === 0 && !hasTenseFilter && (
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
              Select an atom above to see its vocabulary and constructions.
            </div>
          )}
        </>}

        {/* ═══ GROUPS FOLDER ═══ */}
        {folder === 'groups' && <>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>
            Save named atom combinations for quick reference.
          </div>

          {groups.length === 0 && !editGroup && (
            <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 12, color: C.muted }}>No groups yet.</div>
          )}

          {groups.map(g => (
            <div key={g.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '11px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.primary, marginBottom: 3 }}>{g.name}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{g.atoms.length} atom{g.atoms.length !== 1 ? 's' : ''}: {g.atoms.join(', ')}</div>
              </div>
              <button onClick={() => applyGroup(g)} style={{ background: C.accentBg, border: `1px solid ${C.accentBorder}`, color: C.accent, borderRadius: 5, padding: '4px 11px', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>View</button>
              <button onClick={() => { setEditGroup({ ...g, atoms: new Set(g.atoms) }) }} style={{ background: C.card, border: `1px solid ${C.border}`, color: C.secondary, borderRadius: 5, padding: '4px 11px', fontSize: 11, cursor: 'pointer' }}>Edit</button>
              <button onClick={() => deleteGroup(g.id)} style={{ background: 'none', border: 'none', color: '#cc6666', cursor: 'pointer', fontSize: 17, padding: '0 2px', lineHeight: 1 }}>×</button>
            </div>
          ))}

          {editGroup ? (
            <div style={{ background: C.card, border: `1.5px solid ${C.accentBorder}`, borderRadius: 8, padding: '14px 16px', marginTop: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.accent, marginBottom: 10 }}>
                {editGroup.id ? 'Edit group' : 'New group'}
              </div>
              <input value={editGroup.name} onChange={e => setEditGroup(g => ({ ...g, name: e.target.value }))}
                placeholder="Group name..."
                style={{ width: '100%', boxSizing: 'border-box', marginBottom: 12, background: '#f7f8ff', border: `1px solid ${C.border}`, color: C.primary, borderRadius: 5, padding: '6px 9px', fontSize: 12 }} />
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>Atoms to include:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
                {ATOMS.map(atom => {
                  const on = editGroup.atoms.has(atom.id)
                  return (
                    <button key={atom.id} onClick={() => toggleEditAtom(atom.id)} style={{
                      background: on ? C.accentBg : C.card, border: `1.5px solid ${on ? C.accent : C.border}`,
                      color: on ? C.accent : C.secondary, borderRadius: 5, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontWeight: on ? 600 : 400,
                    }}>{atom.label}</button>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={saveGroup} style={{ background: C.accent, border: 'none', color: '#fff', borderRadius: 5, padding: '6px 16px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Save</button>
                <button onClick={() => setEditGroup(null)} style={{ background: C.card, border: `1px solid ${C.border}`, color: C.muted, borderRadius: 5, padding: '6px 14px', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setEditGroup({ id: null, name: '', atoms: new Set(selectedAtoms) })}
              style={{ background: C.accentBg, border: `1px solid ${C.accentBorder}`, color: C.accent, borderRadius: 6, padding: '8px 16px', fontSize: 12, cursor: 'pointer', fontWeight: 600, marginTop: 8 }}>
              + New group
            </button>
          )}
        </>}

      </div>
    </div>
  )
}
