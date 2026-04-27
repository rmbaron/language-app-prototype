import { useState, useMemo } from 'react'
import { useInventory } from './InventoryContext'
import { ATOMS } from './grammarAtoms.en'
import { getLayerOne } from './wordLayerOne'
import { getLayerTwo } from './wordLayerTwo'
import { FIXED_UNITS } from './multiWordUnits.en'
import { ALWAYS_PASS_WORDS } from './circuitCheck'

// ── Saved groups (localStorage) ──────────────────────────────────────────────

const GROUPS_KEY = 'lapp-index-groups'
function loadGroups()      { try { return JSON.parse(localStorage.getItem(GROUPS_KEY) ?? '[]') } catch { return [] } }
function persistGroups(g)  { localStorage.setItem(GROUPS_KEY, JSON.stringify(g)) }
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

  const [folder,        setFolder]        = useState('atoms')
  const [selectedAtoms, setSelectedAtoms] = useState(new Set())
  const [search,        setSearch]        = useState('')
  const [groups,        setGroups]        = useState(loadGroups)
  const [editGroup,     setEditGroup]     = useState(null)

  // ── Word data ──

  const allWords = useMemo(() => wordBank.map(id => {
    const l2       = getLayerTwo(id, lang)
    const l1       = getLayerOne(id, lang)
    const baseForm = id.startsWith(`${lang}-`) ? id.slice(lang.length + 1) : id
    return { id, baseForm, l2, l1 }
  }), [wordBank, lang])

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
    if (selectedAtoms.size > 0) r = r.filter(w => w.l2 && selectedAtoms.has(w.l2.grammaticalAtom))
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

  // ── Groups CRUD ──

  function applyGroup(g) { setSelectedAtoms(new Set(g.atoms)); setFolder('atoms') }

  function startNewGroup() { setEditGroup({ id: null, name: '', atoms: new Set(selectedAtoms) }) }

  function openEditGroup(g) { setEditGroup({ ...g, atoms: new Set(g.atoms) }) }

  function toggleEditAtom(atomId) {
    setEditGroup(prev => {
      const next = new Set(prev.atoms)
      if (next.has(atomId)) next.delete(atomId); else next.add(atomId)
      return { ...prev, atoms: next }
    })
  }

  function saveGroup() {
    if (!editGroup?.name.trim()) return
    const saved   = { ...editGroup, atoms: [...editGroup.atoms] }
    const updated = editGroup.id
      ? groups.map(g => g.id === editGroup.id ? saved : g)
      : [...groups, { ...saved, id: newGroupId() }]
    setGroups(updated); persistGroups(updated); setEditGroup(null)
  }

  function deleteGroup(id) {
    const updated = groups.filter(g => g.id !== id)
    setGroups(updated); persistGroups(updated)
  }

  const noL2Count  = allWords.filter(w => !w.l2).length
  const isFiltered = selectedAtoms.size > 0

  // Atom display order: system order from grammarAtoms.en.js, unknown at end
  const displayOrder = [...ATOMS.map(a => a.id), '__unknown']

  return (
    <div style={{ background: C.bg, minHeight: '100vh', paddingBottom: 24 }}>
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
        <div style={{ display: 'flex', marginBottom: 16, borderBottom: `1px solid ${C.border}` }}>
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

          {/* Atom chips — system order, no grouping labels */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
            {ATOMS.map(atom => {
              const on    = selectedAtoms.has(atom.id)
              const count = atomCounts[atom.id] ?? 0
              return (
                <button key={atom.id} onClick={() => toggleAtom(atom.id)} title={atom.description}
                  style={{
                    background:   on ? C.accentBg : C.card,
                    border:       `1.5px solid ${on ? C.accent : C.border}`,
                    color:        on ? C.accent : count > 0 ? C.secondary : C.muted,
                    borderRadius: 5, padding: '4px 10px', fontSize: 11, cursor: 'pointer',
                    fontWeight:   on ? 600 : 400, opacity: count === 0 ? 0.4 : 1,
                  }}>
                  {atom.label}
                  {count > 0 && <span style={{ marginLeft: 4, fontSize: 9, opacity: 0.6 }}>({count})</span>}
                </button>
              )
            })}
            {isFiltered && (
              <button onClick={() => setSelectedAtoms(new Set())} style={{
                background: 'none', border: `1px dashed ${C.border}`, color: C.muted,
                borderRadius: 5, padding: '4px 10px', fontSize: 11, cursor: 'pointer',
              }}>clear</button>
            )}
          </div>

          {/* Search */}
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search within results..."
            style={{
              width: '100%', boxSizing: 'border-box', marginBottom: 12,
              background: C.card, border: `1px solid ${C.border}`, color: C.primary,
              borderRadius: 6, padding: '7px 10px', fontSize: 12,
            }}
          />

          {/* Results — always visible; atom chips filter them */}
          {displayOrder.map(atomId => {
            const atomDef    = ATOMS.find(a => a.id === atomId)
            const bankWords  = isFiltered ? (resultsByAtom[atomId] ?? []) : []
            const multiWords = FIXED_UNITS.filter(u => u.atomClass === atomId && (!isFiltered || selectedAtoms.has(atomId)))
            const alwaysPass = ALWAYS_PASS_WORDS.filter(w => w.atomClass === atomId && (!isFiltered || selectedAtoms.has(atomId)))
            if (!bankWords.length && !multiWords.length && !alwaysPass.length) return null

            return (
              <div key={atomId} style={{ marginBottom: 26 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.primary, marginBottom: 4 }}>
                  {atomDef?.label ?? 'Unenriched'}
                </div>
                {atomDef?.description && (
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 10, lineHeight: 1.45, maxWidth: 480 }}>
                    {atomDef.description}
                  </div>
                )}

                {/* Multi-word units */}
                {multiWords.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>
                      Multi-word units ({multiWords.length})
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {multiWords.map(u => (
                        <span key={u.id} style={{
                          background: '#f0f2fa', border: `1px solid ${C.border}`,
                          color: C.secondary, borderRadius: 5, padding: '4px 10px', fontSize: 13,
                        }}>{u.text}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Circuit always-pass */}
                {alwaysPass.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>
                      Circuit always-pass — no bank check ({alwaysPass.length})
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {alwaysPass.map(w => (
                        <span key={w.word} style={{
                          background: '#fff8f0', border: `1px solid #ffb74d`,
                          color: '#8a5000', borderRadius: 5, padding: '4px 10px', fontSize: 13,
                        }}>{w.word}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Word bank — only shown when that atom is selected */}
                {bankWords.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>
                      Word bank ({bankWords.length})
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {bankWords.map(w => (
                        <span key={w.id} title={w.id} style={{
                          background: C.card, border: `1px solid ${C.border}`,
                          color: C.secondary, borderRadius: 5, padding: '4px 10px', fontSize: 13,
                        }}>
                          {w.baseForm}
                          {w.l2?.cefrLevel && <span style={{ fontSize: 9, opacity: 0.5, marginLeft: 4 }}>{w.l2.cefrLevel}</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {!isFiltered && !FIXED_UNITS.length && !ALWAYS_PASS_WORDS.length && (
            <div style={{ fontSize: 12, color: C.muted }}>Nothing in the system index yet.</div>
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
            <div key={g.id} style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 8,
              padding: '11px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.primary, marginBottom: 3 }}>{g.name}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{g.atoms.length} atom{g.atoms.length !== 1 ? 's' : ''}: {g.atoms.join(', ')}</div>
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
                placeholder="Group name..."
                style={{ width: '100%', boxSizing: 'border-box', marginBottom: 12, background: '#f7f8ff', border: `1px solid ${C.border}`, color: C.primary, borderRadius: 5, padding: '6px 9px', fontSize: 12 }}
              />
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>Atoms to include:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
                {ATOMS.map(atom => {
                  const on = editGroup.atoms.has(atom.id)
                  return (
                    <button key={atom.id} onClick={() => toggleEditAtom(atom.id)} style={{
                      background: on ? C.accentBg : C.card,
                      border:     `1.5px solid ${on ? C.accent : C.border}`,
                      color:      on ? C.accent : C.muted,
                      borderRadius: 4, padding: '3px 9px', fontSize: 11, cursor: 'pointer', fontWeight: on ? 600 : 400,
                    }}>{atom.label}</button>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={saveGroup} style={{ background: C.accentBg, border: `1px solid ${C.accentBorder}`, color: C.accent, borderRadius: 6, padding: '7px 18px', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}>Save</button>
                <button onClick={() => setEditGroup(null)} style={{ background: C.card, border: `1px solid ${C.border}`, color: C.secondary, borderRadius: 6, padding: '7px 16px', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={startNewGroup} style={{
              width: '100%', marginTop: 8, padding: '10px',
              background: C.card, border: `1.5px dashed ${C.border}`,
              color: C.muted, borderRadius: 8, fontSize: 12, cursor: 'pointer',
            }}>
              + New group{selectedAtoms.size > 0 ? ' (pre-filled from current filter)' : ''}
            </button>
          )}
        </>}

      </div>
    </div>
  )
}
