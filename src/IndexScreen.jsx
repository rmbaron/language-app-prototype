import { useState, useMemo } from 'react'
import { useInventory } from './InventoryContext'
import { ATOMS } from './grammarAtoms.en'
import { getLayerOne } from './wordLayerOne'
import { getLayerTwo } from './wordLayerTwo'

// ── Classification constants ─────────────────────────────────────────────────

const ATOM_GROUPS = [
  {
    label: 'Content words',
    description: 'Open-class words — the meaning-carrying vocabulary.',
    color: '#1a7a35',
    bg:    '#e8f5ed',
    border:'#88c8a0',
    ids: ['noun', 'lexical_verb', 'adjective', 'adverb'],
  },
  {
    label: 'Function words',
    description: 'Closed-class grammatical words — structure and reference.',
    color: '#3355cc',
    bg:    '#eef1ff',
    border:'#b0bef0',
    ids: ['personal_pronoun', 'object_pronoun', 'possessive_determiner',
          'determiner', 'demonstrative', 'numeral',
          'preposition', 'conjunction', 'negation_marker', 'interrogative', 'interjection'],
  },
  {
    label: 'Auxiliary / verb structure',
    description: 'Grammatical verbs that build tense, aspect, mood, and negation.',
    color: '#8a6000',
    bg:    '#fffbec',
    border:'#f0d080',
    ids: ['copula', 'auxiliary', 'modal_auxiliary', 'perfect_auxiliary', 'progressive_auxiliary'],
  },
]

const FUNCTION_ATOM_IDS = new Set([...ATOM_GROUPS[1].ids, ...ATOM_GROUPS[2].ids])
const CONTENT_ATOM_IDS  = new Set(ATOM_GROUPS[0].ids)

function atomGroup(atomId) {
  return ATOM_GROUPS.find(g => g.ids.includes(atomId)) ?? null
}

// Stable order for results display — content first, then function, then aux, then unknown
const DISPLAY_ORDER = [...ATOM_GROUPS.flatMap(g => g.ids), '__unknown']

// ── Saved groups (localStorage) ──────────────────────────────────────────────

const GROUPS_KEY = 'lapp-index-groups'
function loadGroups() {
  try { return JSON.parse(localStorage.getItem(GROUPS_KEY) ?? '[]') } catch { return [] }
}
function persistGroups(g) { localStorage.setItem(GROUPS_KEY, JSON.stringify(g)) }
function newGroupId()      { return `g-${Date.now()}` }

// ── Colors ───────────────────────────────────────────────────────────────────

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

// ── Main screen ──────────────────────────────────────────────────────────────

export default function IndexScreen({ onBack }) {
  const { inventory } = useInventory()
  const lang          = inventory.identity.lang ?? 'en'
  const wordBank      = inventory.wordBank

  const [folder,        setFolder]        = useState('atoms')   // 'atoms' | 'groups'
  const [selectedAtoms, setSelectedAtoms] = useState(new Set())
  const [search,        setSearch]        = useState('')
  const [groups,        setGroups]        = useState(loadGroups)
  const [editGroup,     setEditGroup]     = useState(null)  // { id?, name, atoms: Set }

  // ── Word data ──

  const allWords = useMemo(() => wordBank.map(id => {
    const l2       = getLayerTwo(id, lang)
    const l1       = getLayerOne(id, lang)
    const baseForm = id.startsWith(`${lang}-`) ? id.slice(lang.length + 1) : id
    return { id, baseForm, l2, l1 }
  }), [wordBank, lang])

  // Per-atom counts (always over full bank, independent of filter)
  const atomCounts = useMemo(() => {
    const counts = {}
    for (const w of allWords) {
      const k = w.l2?.grammaticalAtom ?? '__unknown'
      counts[k] = (counts[k] ?? 0) + 1
    }
    return counts
  }, [allWords])

  const filteredWords = useMemo(() => {
    let r = allWords
    if (selectedAtoms.size > 0) {
      r = r.filter(w => w.l2 && selectedAtoms.has(w.l2.grammaticalAtom))
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      r = r.filter(w => w.baseForm.toLowerCase().includes(q))
    }
    return r
  }, [allWords, selectedAtoms, search])

  const resultsByAtom = useMemo(() => {
    const map = {}
    for (const w of filteredWords) {
      const k = w.l2?.grammaticalAtom ?? '__unknown'
      ;(map[k] ??= []).push(w)
    }
    return map
  }, [filteredWords])

  // ── Atom selection ──

  function toggleAtom(id) {
    setSelectedAtoms(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function applyPreset(preset) {
    if (preset === 'all')      setSelectedAtoms(new Set())
    if (preset === 'content')  setSelectedAtoms(new Set(CONTENT_ATOM_IDS))
    if (preset === 'function') setSelectedAtoms(new Set(FUNCTION_ATOM_IDS))
  }

  const isAll          = selectedAtoms.size === 0
  const isContentPreset = !isAll && ATOM_GROUPS[0].ids.every(id => selectedAtoms.has(id)) && selectedAtoms.size === CONTENT_ATOM_IDS.size
  const isFunctionPreset = !isAll && [...FUNCTION_ATOM_IDS].every(id => selectedAtoms.has(id)) && selectedAtoms.size === FUNCTION_ATOM_IDS.size

  // ── Groups CRUD ──

  function applyGroup(g) {
    setSelectedAtoms(new Set(g.atoms))
    setFolder('atoms')
  }

  function startNewGroup() {
    setEditGroup({ id: null, name: '', atoms: new Set(selectedAtoms) })
  }

  function openEditGroup(g) {
    setEditGroup({ ...g, atoms: new Set(g.atoms) })
  }

  function toggleEditAtom(atomId) {
    setEditGroup(prev => {
      const next = new Set(prev.atoms)
      if (next.has(atomId)) next.delete(atomId); else next.add(atomId)
      return { ...prev, atoms: next }
    })
  }

  function saveGroup() {
    if (!editGroup?.name.trim()) return
    const saved = { ...editGroup, atoms: [...editGroup.atoms] }
    const updated = editGroup.id
      ? groups.map(g => g.id === editGroup.id ? saved : g)
      : [...groups, { ...saved, id: newGroupId() }]
    setGroups(updated)
    persistGroups(updated)
    setEditGroup(null)
  }

  function deleteGroup(id) {
    const updated = groups.filter(g => g.id !== id)
    setGroups(updated)
    persistGroups(updated)
  }

  const noL2Count = allWords.filter(w => !w.l2).length

  // ── Render ──

  return (
    <div style={{ background: C.bg, minHeight: '100vh', paddingBottom: 72 }}>
      <div style={{ maxWidth: 540, margin: '0 auto', padding: '16px 14px 0' }}>

        {/* Header */}
        <div style={{ marginBottom: 14 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 13, padding: '0 0 8px', display: 'block' }}>← Back</button>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.primary, letterSpacing: '-0.02em' }}>Index</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
            {wordBank.length} words banked{noL2Count > 0 ? ` · ${noL2Count} without enrichment data` : ''}
          </div>
        </div>

        {/* Folder tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: `1px solid ${C.border}` }}>
          {[{ id: 'atoms', label: 'Atoms' }, { id: 'groups', label: 'My groups' }].map(t => (
            <button key={t.id} onClick={() => setFolder(t.id)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '7px 16px', fontSize: 13,
              fontWeight: folder === t.id ? 700 : 400,
              color: folder === t.id ? C.accent : C.muted,
              borderBottom: `2px solid ${folder === t.id ? C.accent : 'transparent'}`,
              marginBottom: -1,
            }}>{t.label}</button>
          ))}
        </div>

        {/* ═══ ATOMS FOLDER ═══ */}
        {folder === 'atoms' && <>

          {/* Quick presets */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
            <Preset active={isAll} onClick={() => applyPreset('all')}>All banked</Preset>
            <Preset active={isContentPreset} onClick={() => applyPreset('content')}
              color={ATOM_GROUPS[0].color} bg={ATOM_GROUPS[0].bg} border={ATOM_GROUPS[0].border}>
              Content words
            </Preset>
            <Preset active={isFunctionPreset} onClick={() => applyPreset('function')}
              color={ATOM_GROUPS[1].color} bg={ATOM_GROUPS[1].bg} border={ATOM_GROUPS[1].border}>
              Function words
            </Preset>
          </div>

          {/* Atom chip groups */}
          {ATOM_GROUPS.map(group => (
            <div key={group.label} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: group.color, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>
                {group.label}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {group.ids.map(atomId => {
                  const atom  = ATOMS.find(a => a.id === atomId)
                  const on    = selectedAtoms.has(atomId)
                  const count = atomCounts[atomId] ?? 0
                  return (
                    <button key={atomId} onClick={() => toggleAtom(atomId)} title={atom?.description}
                      style={{
                        background:   on ? group.bg : C.card,
                        border:       `1.5px solid ${on ? group.border : C.border}`,
                        color:        on ? group.color : count > 0 ? C.secondary : C.muted,
                        borderRadius: 5, padding: '4px 10px', fontSize: 11, cursor: 'pointer',
                        fontWeight:   on ? 600 : 400, opacity: count === 0 ? 0.45 : 1,
                      }}>
                      {atom?.label ?? atomId}
                      {count > 0 && <span style={{ marginLeft: 4, fontSize: 9, opacity: 0.65 }}>({count})</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Search */}
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search within results..."
            style={{
              width: '100%', boxSizing: 'border-box', marginBottom: 12, marginTop: 4,
              background: C.card, border: `1px solid ${C.border}`, color: C.primary,
              borderRadius: 6, padding: '7px 10px', fontSize: 12,
            }}
          />

          {/* Result count + clear */}
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>
            {filteredWords.length} word{filteredWords.length !== 1 ? 's' : ''}
            {!isAll && <>
              {' · '}
              <button onClick={() => setSelectedAtoms(new Set())} style={{ background: 'none', border: 'none', color: C.accent, cursor: 'pointer', fontSize: 12, padding: 0 }}>
                clear filter
              </button>
            </>}
          </div>

          {/* Results grouped by atom */}
          {DISPLAY_ORDER.map(atomId => {
            const atomWords = resultsByAtom[atomId]
            if (!atomWords?.length) return null
            const atomDef = ATOMS.find(a => a.id === atomId)
            const group   = atomGroup(atomId)
            return (
              <div key={atomId} style={{ marginBottom: 22 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: group?.color ?? C.primary }}>
                    {atomDef?.label ?? 'Unenriched'}
                  </span>
                  <span style={{ fontSize: 11, color: C.muted }}>{atomWords.length}</span>
                </div>
                {atomDef?.description && (
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 8, lineHeight: 1.45, maxWidth: 480 }}>
                    {atomDef.description}
                  </div>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {atomWords.map(w => (
                    <span key={w.id} title={`${w.id}${w.l2?.cefrLevel ? ' · ' + w.l2.cefrLevel : ''}`} style={{
                      background:   group ? group.bg : C.bg,
                      border:       `1px solid ${group ? group.border : C.border}`,
                      color:        group ? group.color : C.secondary,
                      borderRadius: 5, padding: '4px 10px', fontSize: 12,
                    }}>
                      {w.baseForm}
                      {w.l2?.cefrLevel && (
                        <span style={{ fontSize: 9, opacity: 0.55, marginLeft: 4 }}>{w.l2.cefrLevel}</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}

          {filteredWords.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 0', fontSize: 12, color: C.muted }}>
              {search ? 'No words match that search.' : selectedAtoms.size > 0 ? 'No banked words with this atom.' : 'No banked words yet.'}
            </div>
          )}
        </>}

        {/* ═══ GROUPS FOLDER ═══ */}
        {folder === 'groups' && <>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>
            Save atom combinations as named groups for quick reference.
          </div>

          {groups.length === 0 && !editGroup && (
            <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 12, color: C.muted }}>
              No groups yet.
            </div>
          )}

          {groups.map(g => (
            <div key={g.id} style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 8,
              padding: '11px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.primary, marginBottom: 3 }}>{g.name}</div>
                <div style={{ fontSize: 11, color: C.muted }}>
                  {g.atoms.length} atom{g.atoms.length !== 1 ? 's' : ''}: {g.atoms.join(', ')}
                </div>
              </div>
              <button onClick={() => applyGroup(g)} style={{ background: C.accentBg, border: `1px solid ${C.accentBorder}`, color: C.accent, borderRadius: 5, padding: '4px 11px', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>View</button>
              <button onClick={() => openEditGroup(g)} style={{ background: C.card, border: `1px solid ${C.border}`, color: C.secondary, borderRadius: 5, padding: '4px 11px', fontSize: 11, cursor: 'pointer' }}>Edit</button>
              <button onClick={() => deleteGroup(g.id)} style={{ background: 'none', border: 'none', color: '#cc6666', cursor: 'pointer', fontSize: 17, padding: '0 2px', lineHeight: 1 }}>×</button>
            </div>
          ))}

          {editGroup ? (
            <div style={{ background: C.card, border: `1.5px solid ${C.accentBorder}`, borderRadius: 8, padding: '14px 16px', marginTop: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.accent, marginBottom: 10 }}>
                {editGroup.id ? 'Edit group' : 'New group'}
              </div>
              <input
                value={editGroup.name}
                onChange={e => setEditGroup(g => ({ ...g, name: e.target.value }))}
                placeholder="Group name (e.g. Circuit breaker targets)"
                style={{
                  width: '100%', boxSizing: 'border-box', marginBottom: 12,
                  background: '#f7f8ff', border: `1px solid ${C.border}`, color: C.primary,
                  borderRadius: 5, padding: '6px 9px', fontSize: 12,
                }}
              />
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>Select atoms to include:</div>
              {ATOM_GROUPS.map(group => (
                <div key={group.label} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: group.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
                    {group.label}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {group.ids.map(atomId => {
                      const atom = ATOMS.find(a => a.id === atomId)
                      const on   = editGroup.atoms.has(atomId)
                      return (
                        <button key={atomId} onClick={() => toggleEditAtom(atomId)} style={{
                          background:   on ? group.bg : C.card,
                          border:       `1.5px solid ${on ? group.border : C.border}`,
                          color:        on ? group.color : C.muted,
                          borderRadius: 4, padding: '3px 9px', fontSize: 11, cursor: 'pointer', fontWeight: on ? 600 : 400,
                        }}>{atom?.label ?? atomId}</button>
                      )
                    })}
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button onClick={saveGroup} style={{ background: C.accentBg, border: `1px solid ${C.accentBorder}`, color: C.accent, borderRadius: 6, padding: '7px 18px', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}>
                  Save
                </button>
                <button onClick={() => setEditGroup(null)} style={{ background: C.card, border: `1px solid ${C.border}`, color: C.secondary, borderRadius: 6, padding: '7px 16px', fontSize: 12, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button onClick={startNewGroup} style={{
              width: '100%', marginTop: 8, padding: '10px',
              background: C.card, border: `1.5px dashed ${C.border}`,
              color: C.muted, borderRadius: 8, fontSize: 12, cursor: 'pointer',
            }}>
              + New group{selectedAtoms.size > 0 ? ` (pre-filled from current filter)` : ''}
            </button>
          )}
        </>}

      </div>
    </div>
  )
}

// ── Local helpers ────────────────────────────────────────────────────────────

function Preset({ active, onClick, color, bg, border, children }) {
  return (
    <button onClick={onClick} style={{
      background:   active ? (bg    ?? C.accentBg)     : C.card,
      border:       `1.5px solid ${active ? (border ?? C.accentBorder) : C.border}`,
      color:        active ? (color ?? C.accent)        : C.secondary,
      borderRadius: 6, padding: '5px 13px', fontSize: 12, cursor: 'pointer', fontWeight: active ? 700 : 400,
    }}>{children}</button>
  )
}
