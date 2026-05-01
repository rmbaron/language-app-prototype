import { useState, useMemo } from 'react'
import { getAtoms } from './grammarAtoms'
import { validateSentence } from './grammarBreaker'
import { PATTERNS, getAllGroups, PATTERN_TYPES, INVALID_PATTERNS } from './grammarBreakerPatterns'
import GrammarBreakerFlowTab from './GrammarBreakerFlowTab'
import GrammarBreakerForwardFlowTab from './GrammarBreakerForwardFlowTab'
import GrammarBreakerL2Health from './GrammarBreakerL2Health'
import {
  getBreakerConfig, isPatternEnabled,
  setPatternEnabled, setGroupEnabled, setMasterEnabled, resetBreakerConfig,
} from './grammarBreakerConfig'
import { getBankedWords, getAllWords } from './wordRegistry'
import { getWordBank } from './userStore'
import { getFormsForWord, resolveSystemFormWithType } from './formsMap'
import { ALWAYS_PASS_WORDS } from './circuitCheck'

const T = {
  page: '#ffffff', card: '#e8e8ea', border: '#c4c4c6',
  text: '#1a1a1a', textDim: '#777', textSub: '#444', label: '#666',
  green: '#1a5a1a', greenBg: '#d8eed8', greenBord: '#90c090',
  red: '#7a1a1a', redBg: '#f0d8d8', redBord: '#d09090',
  amber: '#7a4000', amberBg: '#fde8c8', amberBord: '#d8a050',
  blue: '#004a7a', blueBg: '#d8eef8', blueBord: '#7ab0d0',
}

function Section({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: T.label, textTransform: 'uppercase', marginBottom: 10 }}>
      {children}
    </div>
  )
}

function Chip({ bg, border, color, children, style }) {
  return (
    <span style={{ padding: '3px 8px', background: bg, border: `1px solid ${border}`, borderRadius: 4, fontSize: 11, color, fontWeight: 600, ...style }}>
      {children}
    </span>
  )
}

function fmtType(t) {
  if (t == null) return '—'
  return Array.isArray(t) ? t.join(' / ') : t
}

export default function GrammarBreakerScreen({ onClose }) {
  const atoms = getAtoms('en')
  const allGroups = getAllGroups()

  const [tab, setTab] = useState('validate')   // 'validate' | 'build' | 'patterns'
  const [input, setInput] = useState('I want food.')
  const [activeAtoms, setActiveAtoms] = useState(() => getAtoms('en').map(a => a.id))
  const [configRev, setConfigRev] = useState(0)  // bump to re-read config
  const [typeFilter, setTypeFilter] = useState(null)

  // Build-tab state
  const [placed, setPlaced] = useState([])              // string[] of surface forms
  const [searchQuery, setSearchQuery] = useState('')
  const [bankSource, setBankSource] = useState('bank')  // 'bank' | 'system'
  const [expandedWord, setExpandedWord] = useState(null)
  const [atomFilter, setAtomFilter] = useState(null)    // selected atom class

  const config = useMemo(() => getBreakerConfig(), [configRev])

  // Re-validate on every input/atom/config change.
  const result = useMemo(
    () => validateSentence(input, activeAtoms, 'en'),
    [input, activeAtoms, configRev]
  )

  function toggleAtom(atomId) {
    setActiveAtoms(curr => curr.includes(atomId) ? curr.filter(a => a !== atomId) : [...curr, atomId])
  }
  function toggleAllAtoms(on) {
    setActiveAtoms(on ? atoms.map(a => a.id) : [])
  }

  function togglePattern(id, enabled) { setPatternEnabled(id, enabled); setConfigRev(r => r + 1) }
  function toggleGroup(id, enabled)   { setGroupEnabled(id, enabled);   setConfigRev(r => r + 1) }
  function toggleMaster(enabled)      { setMasterEnabled(enabled);      setConfigRev(r => r + 1) }
  function resetConfig()              { resetBreakerConfig();           setConfigRev(r => r + 1) }

  // Build a per-pattern checked state.
  function patternEnabled(p) { return isPatternEnabled(p.id, p.group) }
  function groupEnabled(g)   { return config.groups[g] !== false && config.masterEnabled !== false }

  // Compute fail spans for highlighting tokens.
  const failSpans = result.failures.map(f => f.span)
  function tokenInFailSpan(idx) {
    return failSpans.some(([a, b]) => idx >= a && idx <= b)
  }

  // ── Build-tab derived state ───────────────────────────────────────────────
  const buildText = placed.join(' ')
  const buildResult = useMemo(
    () => validateSentence(buildText, activeAtoms, 'en'),
    [buildText, activeAtoms, configRev]
  )
  const buildFiredSet = useMemo(
    () => new Set(buildResult.fired.map(f => f.patternId)),
    [buildResult]
  )

  function appendToken(surface) {
    setPlaced(curr => [...curr, surface])
  }
  function removeAt(i) {
    setPlaced(curr => curr.filter((_, idx) => idx !== i))
  }
  function swapWith(i, j) {
    setPlaced(curr => {
      if (j < 0 || j >= curr.length) return curr
      const next = [...curr]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }
  function clearBuild() { setPlaced([]) }

  // Returns [{ surface, type }] for a base word — base form + every known surface form.
  function getFormsWithTypes(wordId) {
    const surfaces = getFormsForWord(wordId, 'en')
    if (!surfaces || surfaces.length === 0) return [{ surface: wordId, type: 'base' }]
    return surfaces.map(s => {
      const r = resolveSystemFormWithType(s, 'en')
      return { surface: s, type: r?.type ?? null }
    })
  }

  // All words in the current picker source (bank or system).
  const sourceWords = useMemo(() => {
    const lang = 'en'
    const all = bankSource === 'bank'
      ? getBankedWords(getWordBank(), lang)
      : getAllWords(lang)
    return all.filter(w => w?.baseForm)
  }, [bankSource, configRev])

  // Helper: every atom a word can be classified as (primary + alternates).
  function wordAtomSet(w) {
    const set = new Set()
    if (w?.grammaticalAtom) set.add(w.grammaticalAtom)
    for (const a of w?.alternateAtoms ?? []) if (a?.atom) set.add(a.atom)
    return set
  }

  // Atoms that have at least one word in the current source — for the atom-filter chips.
  // Returns [{ atomId, count }] sorted by count desc.
  const sourceAtomsWithCount = useMemo(() => {
    const counts = new Map()
    for (const w of sourceWords) {
      for (const a of wordAtomSet(w)) counts.set(a, (counts.get(a) ?? 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([atomId, count]) => ({ atomId, count }))
  }, [sourceWords])

  // Picker word list — visible only once an atom or a search query has been chosen.
  // Empty by default so the picker doesn't dump every bank word as a wall of text.
  const pickerWords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!atomFilter && !q) return []   // nothing selected → nothing rendered

    let list = sourceWords
    if (atomFilter) list = list.filter(w => wordAtomSet(w).has(atomFilter))
    if (q) list = list.filter(w =>
      w.baseForm.toLowerCase().includes(q) ||
      (w.meaning ?? '').toLowerCase().includes(q) ||
      getFormsForWord(w.id, 'en').some(f => f.toLowerCase().includes(q))
    )
    return list.slice(0, 100)
  }, [sourceWords, atomFilter, searchQuery])

  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui, sans-serif', background: T.page, minHeight: '100vh', color: T.text }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <button onClick={onClose}
          style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 4, color: T.textSub, cursor: 'pointer', fontSize: 13, padding: '5px 12px' }}>
          ← close
        </button>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Grammar Breaker</h2>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <label style={{ fontSize: 12, color: T.textSub, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input type="checkbox" checked={config.masterEnabled !== false} onChange={e => toggleMaster(e.target.checked)} />
            master
          </label>
          <button onClick={resetConfig}
            style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 4, color: T.textDim, cursor: 'pointer', fontSize: 11, padding: '4px 10px' }}>
            reset toggles
          </button>
        </div>
      </div>

      {/* Invalid pattern banner — only shown if any pattern failed validation at module load */}
      {INVALID_PATTERNS.length > 0 && (
        <div style={{
          marginBottom: 16, padding: '10px 14px', background: T.redBg, border: `1px solid ${T.redBord}`,
          borderRadius: 5, color: T.red, fontSize: 12,
        }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>
            ⚠ {INVALID_PATTERNS.length} invalid pattern{INVALID_PATTERNS.length === 1 ? '' : 's'} excluded from registry
          </div>
          {INVALID_PATTERNS.map((entry, i) => (
            <div key={i} style={{ paddingLeft: 12, fontFamily: 'monospace', fontSize: 11 }}>
              <span style={{ fontWeight: 700 }}>{entry.id ?? '<unknown>'}:</span> {entry.errors.join('; ')}
            </div>
          ))}
          <div style={{ paddingLeft: 12, marginTop: 4, fontSize: 10, fontStyle: 'italic' }}>
            Console has the same details. Fix in grammarBreakerPatterns.js to restore.
          </div>
        </div>
      )}

      {/* Tab nav */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: `1px solid ${T.border}` }}>
        {[
          { id: 'validate', label: 'Validate' },
          { id: 'build',    label: 'Build' },
          { id: 'flow',     label: 'Flow' },
          { id: 'forward',  label: 'Forward Flow' },
          { id: 'patterns', label: `Patterns (${PATTERNS.length})` },
          { id: 'l2',       label: 'L2 Health' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              border: 'none', borderBottom: tab === t.id ? `2px solid ${T.text}` : '2px solid transparent',
              background: 'transparent', color: tab === t.id ? T.text : T.textDim,
              marginBottom: -1,
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'validate' && <>
      {/* Sentence input + verdict */}
      <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Type a sentence…"
        style={{ width: '100%', minHeight: 60, border: `1px solid ${T.border}`, borderRadius: 4, color: T.text, fontSize: 15, padding: '10px 12px', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6, background: T.card, marginBottom: 12 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <div style={{ padding: '6px 14px', background: result.allowed ? T.greenBg : T.redBg, border: `1px solid ${result.allowed ? T.greenBord : T.redBord}`, color: result.allowed ? T.green : T.red, borderRadius: 5, fontSize: 13, fontWeight: 700 }}>
          {result.allowed ? '✓ allowed' : '✗ rejected'}
        </div>
        <div style={{ fontSize: 12, color: T.textDim }}>
          {result.fired.length} fired · {result.failures.length} failures · {result.skipped.length} skipped (disabled)
        </div>
      </div>

      <div>
        {/* atoms + tokens + fired patterns + failures */}
        <div>
          {/* Active atoms */}
          <Section>Active atoms ({activeAtoms.length} / {atoms.length})</Section>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '10px 12px', marginBottom: 10 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {atoms.map(a => {
                const on = activeAtoms.includes(a.id)
                return (
                  <button key={a.id} onClick={() => toggleAtom(a.id)} title={a.description}
                    style={{ padding: '3px 8px', background: on ? T.greenBg : '#fff', border: `1px solid ${on ? T.greenBord : T.border}`, borderRadius: 4, fontSize: 11, color: on ? T.green : T.textDim, fontWeight: on ? 700 : 400, cursor: 'pointer' }}>
                    {a.id}
                  </button>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => toggleAllAtoms(true)}  style={{ fontSize: 11, padding: '3px 8px', border: `1px solid ${T.border}`, borderRadius: 4, background: '#fff', color: T.textDim, cursor: 'pointer' }}>all</button>
              <button onClick={() => toggleAllAtoms(false)} style={{ fontSize: 11, padding: '3px 8px', border: `1px solid ${T.border}`, borderRadius: 4, background: '#fff', color: T.textDim, cursor: 'pointer' }}>none</button>
            </div>
          </div>

          {/* Tokens */}
          <Section>Tokens</Section>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-end', marginBottom: 16 }}>
            {result.tokens.map((t, i) => {
              if (t.isPunctuation) return <span key={i} style={{ color: T.textDim, fontSize: 18, paddingBottom: 22 }}>{t.surface}</span>
              const fail = tokenInFailSpan(i)
              const bg     = fail ? T.redBg   : t.isUnknown ? T.redBg   : t.isFunctionWord ? T.card    : T.blueBg
              const border = fail ? T.redBord : t.isUnknown ? T.redBord : t.isFunctionWord ? T.border  : T.blueBord
              const color  = fail ? T.red     : t.isUnknown ? T.red     : t.isFunctionWord ? T.textDim : T.blue
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 60 }}>
                  <div style={{ padding: '5px 10px', background: bg, border: `1px solid ${border}`, borderRadius: 4, color, fontSize: 14, fontWeight: 600 }}>
                    {t.surface}
                  </div>
                  <span style={{ fontSize: 9, color: T.textDim }}>{t.atoms.length > 0 ? t.atoms.join('/') : t.isUnknown ? 'unknown' : '—'}</span>
                  <span style={{ fontSize: 9, color: T.textDim, fontStyle: 'italic' }}>{fmtType(t.formType)}</span>
                </div>
              )
            })}
          </div>

          {/* Failures */}
          <Section>Failures ({result.failures.length})</Section>
          <div style={{ marginBottom: 16 }}>
            {result.failures.length === 0
              ? <div style={{ fontSize: 12, color: T.textDim, fontStyle: 'italic' }}>none</div>
              : result.failures.map((f, i) => {
                const tokSurfaces = result.tokens.slice(f.span[0], f.span[1] + 1).filter(t => !t.isPunctuation).map(t => t.surface).join(' ')
                return (
                  <div key={i} style={{ background: T.redBg, border: `1px solid ${T.redBord}`, borderRadius: 5, padding: '8px 12px', marginBottom: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, color: T.red, fontWeight: 700 }}>{f.patternId}</span>
                      <button onClick={() => togglePattern(f.patternId, false)}
                        style={{ background: '#fff', border: `1px solid ${T.redBord}`, borderRadius: 3, color: T.red, cursor: 'pointer', fontSize: 10, padding: '2px 8px' }}>
                        disable this pattern
                      </button>
                    </div>
                    <div style={{ fontSize: 11, color: T.textSub, marginTop: 3 }}>
                      "<span style={{ color: T.red, fontWeight: 600 }}>{tokSurfaces || '(boundary)'}</span>" — {f.reason}
                    </div>
                  </div>
                )
              })}
          </div>

          {/* Fired (informational) */}
          <Section>All fired patterns ({result.fired.length})</Section>
          <div>
            {result.fired.length === 0
              ? <div style={{ fontSize: 12, color: T.textDim, fontStyle: 'italic' }}>none</div>
              : result.fired.map((f, i) => {
                const tokSurfaces = result.tokens.slice(f.span[0], f.span[1] + 1).filter(t => !t.isPunctuation).map(t => t.surface).join(' ')
                const ok = f.verdict.allowed
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '4px 10px', borderBottom: `1px solid ${T.border}` }}>
                    <span style={{ fontSize: 11, color: ok ? T.green : T.red, fontWeight: 600, minWidth: 220 }}>{f.patternId}</span>
                    <span style={{ fontSize: 11, color: T.textSub, flex: 1 }}>"{tokSurfaces || '(boundary)'}"</span>
                    <span style={{ fontSize: 10, color: T.textDim }}>{f.group}</span>
                  </div>
                )
              })}
          </div>
        </div>
      </div>
      </>}

      {tab === 'build' && <>
        {/* Active atoms (compact) */}
        <Section>Active atoms ({activeAtoms.length} / {atoms.length})</Section>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '10px 12px', marginBottom: 16 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {atoms.map(a => {
              const on = activeAtoms.includes(a.id)
              return (
                <button key={a.id} onClick={() => toggleAtom(a.id)} title={a.description}
                  style={{ padding: '3px 8px', background: on ? T.greenBg : '#fff', border: `1px solid ${on ? T.greenBord : T.border}`, borderRadius: 4, fontSize: 11, color: on ? T.green : T.textDim, fontWeight: on ? 700 : 400, cursor: 'pointer' }}>
                  {a.id}
                </button>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => toggleAllAtoms(true)}  style={{ fontSize: 11, padding: '3px 8px', border: `1px solid ${T.border}`, borderRadius: 4, background: '#fff', color: T.textDim, cursor: 'pointer' }}>all</button>
            <button onClick={() => toggleAllAtoms(false)} style={{ fontSize: 11, padding: '3px 8px', border: `1px solid ${T.border}`, borderRadius: 4, background: '#fff', color: T.textDim, cursor: 'pointer' }}>none</button>
          </div>
        </div>

        {/* Picker — function words pinned + bank/system search */}
        <Section>Picker</Section>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '12px 14px', marginBottom: 16 }}>
          {/* Function words */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 10, color: T.label, letterSpacing: '0.08em', textTransform: 'uppercase', marginRight: 4 }}>function</span>
            {ALWAYS_PASS_WORDS.map(w => (
              <button key={w.word} onClick={() => appendToken(w.word)} title={w.atomClass}
                style={{ padding: '4px 10px', background: '#fff', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 13, color: T.text, cursor: 'pointer', fontFamily: 'monospace' }}>
                {w.word}
              </button>
            ))}
          </div>

          {/* Source toggle + search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 0 }}>
              <button onClick={() => { setBankSource('bank'); setAtomFilter(null) }}
                style={{ fontSize: 12, padding: '5px 12px', border: `1px solid ${T.border}`, borderRight: 'none', borderRadius: '4px 0 0 4px', cursor: 'pointer', background: bankSource === 'bank' ? T.blueBg : '#fff', color: bankSource === 'bank' ? T.blue : T.textDim, fontWeight: bankSource === 'bank' ? 700 : 400 }}>
                bank ({sourceWords.length})
              </button>
              <button onClick={() => { setBankSource('system'); setAtomFilter(null) }}
                style={{ fontSize: 12, padding: '5px 12px', border: `1px solid ${T.border}`, borderRadius: '0 4px 4px 0', cursor: 'pointer', background: bankSource === 'system' ? T.blueBg : '#fff', color: bankSource === 'system' ? T.blue : T.textDim, fontWeight: bankSource === 'system' ? 700 : 400 }}>
                system
              </button>
            </div>
            <input type="text" placeholder="search…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              style={{ flex: 1, padding: '5px 10px', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 13, color: T.text, background: '#fff', boxSizing: 'border-box' }} />
          </div>

          {/* Atom-class chips — pick one to drill in */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            <span style={{ fontSize: 10, color: T.label, letterSpacing: '0.08em', textTransform: 'uppercase', marginRight: 4 }}>atom class</span>
            {sourceAtomsWithCount.length === 0
              ? <span style={{ fontSize: 11, color: T.textDim, fontStyle: 'italic' }}>no atoms in this source</span>
              : sourceAtomsWithCount.map(({ atomId, count }) => {
                const on = atomFilter === atomId
                return (
                  <button key={atomId} onClick={() => setAtomFilter(on ? null : atomId)}
                    style={{ padding: '3px 8px', background: on ? T.blueBg : '#fff', border: `1px solid ${on ? T.blueBord : T.border}`, borderRadius: 4, fontSize: 11, color: on ? T.blue : T.textDim, fontWeight: on ? 700 : 400, cursor: 'pointer' }}>
                    {atomId} ({count})
                  </button>
                )
              })}
            {atomFilter && (
              <button onClick={() => setAtomFilter(null)}
                style={{ padding: '3px 8px', background: '#fff', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 11, color: T.textDim, cursor: 'pointer', marginLeft: 4 }}>
                clear
              </button>
            )}
          </div>

          {/* Word list — only renders when an atom or a search query is active */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto' }}>
            {!atomFilter && !searchQuery.trim()
              ? <div style={{ fontSize: 12, color: T.textDim, fontStyle: 'italic' }}>pick an atom class above (or search) to see words</div>
              : pickerWords.length === 0
                ? <div style={{ fontSize: 12, color: T.textDim, fontStyle: 'italic' }}>no matches</div>
                : pickerWords.map(w => {
                const isExpanded = expandedWord === w.id
                const forms = isExpanded ? getFormsWithTypes(w.id) : null
                return (
                  <div key={w.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button onClick={() => appendToken(w.baseForm)}
                        style={{ padding: '4px 10px', background: '#fff', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 13, color: T.text, cursor: 'pointer', fontFamily: 'monospace', fontWeight: 600 }}>
                        {w.baseForm}
                      </button>
                      <button onClick={() => setExpandedWord(isExpanded ? null : w.id)}
                        style={{ padding: '4px 8px', background: '#fff', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 11, color: T.textDim, cursor: 'pointer' }}>
                        {isExpanded ? '▴' : '▾'}
                      </button>
                      <span style={{ fontSize: 11, color: T.textDim }}>{w.grammaticalAtom ?? w.grammaticalCategory ?? '—'}</span>
                      {w.meaning && <span style={{ fontSize: 11, color: T.textDim, fontStyle: 'italic' }}>· {w.meaning}</span>}
                    </div>
                    {isExpanded && forms && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6, marginLeft: 16, paddingLeft: 8, borderLeft: `2px solid ${T.border}` }}>
                        {forms.map((f, i) => (
                          <button key={i} onClick={() => appendToken(f.surface)}
                            style={{ padding: '3px 8px', background: '#fff', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 12, color: T.text, cursor: 'pointer' }}>
                            <span style={{ fontFamily: 'monospace' }}>{f.surface}</span>
                            <span style={{ fontSize: 10, color: T.textDim, marginLeft: 5 }}>{fmtType(f.type)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        </div>

        {/* Sentence row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <Section>Sentence ({placed.length} token{placed.length === 1 ? '' : 's'})</Section>
          {placed.length > 0 && (
            <button onClick={clearBuild}
              style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 4, color: T.textDim, cursor: 'pointer', fontSize: 11, padding: '3px 10px' }}>
              clear
            </button>
          )}
        </div>
        <div style={{ minHeight: 80, padding: '12px 14px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-end' }}>
          {placed.length === 0
            ? <span style={{ fontSize: 12, color: T.textDim, fontStyle: 'italic' }}>pick a word to start</span>
            : placed.map((surface, i) => {
              const tok = buildResult.tokens[i]
              const fail = buildResult.failures.some(f => i >= f.span[0] && i <= f.span[1])
              const bg     = fail ? T.redBg   : tok?.isUnknown ? T.redBg   : tok?.isFunctionWord ? '#fff' : T.blueBg
              const border = fail ? T.redBord : tok?.isUnknown ? T.redBord : tok?.isFunctionWord ? T.border : T.blueBord
              const color  = fail ? T.red     : tok?.isUnknown ? T.red     : tok?.isFunctionWord ? T.textDim : T.blue
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 60 }}>
                  <div style={{ padding: '5px 10px', background: bg, border: `1px solid ${border}`, borderRadius: 4, color, fontSize: 14, fontWeight: 600, fontFamily: 'monospace' }}>
                    {surface}
                  </div>
                  <span style={{ fontSize: 9, color: T.textDim }}>{tok?.atoms?.length > 0 ? tok.atoms.join('/') : tok?.isUnknown ? 'unknown' : '—'}</span>
                  <span style={{ fontSize: 9, color: T.textDim, fontStyle: 'italic' }}>{fmtType(tok?.formType)}</span>
                  <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
                    <button onClick={() => swapWith(i, i - 1)} disabled={i === 0}
                      style={{ padding: '1px 5px', fontSize: 10, border: `1px solid ${T.border}`, borderRadius: 3, background: '#fff', color: i === 0 ? T.border : T.textDim, cursor: i === 0 ? 'default' : 'pointer' }}>◀</button>
                    <button onClick={() => removeAt(i)}
                      style={{ padding: '1px 5px', fontSize: 10, border: `1px solid ${T.border}`, borderRadius: 3, background: '#fff', color: T.textDim, cursor: 'pointer' }}>×</button>
                    <button onClick={() => swapWith(i, i + 1)} disabled={i === placed.length - 1}
                      style={{ padding: '1px 5px', fontSize: 10, border: `1px solid ${T.border}`, borderRadius: 3, background: '#fff', color: i === placed.length - 1 ? T.border : T.textDim, cursor: i === placed.length - 1 ? 'default' : 'pointer' }}>▶</button>
                  </div>
                </div>
              )
            })}
        </div>

        {/* Verdict */}
        {placed.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div style={{ padding: '6px 14px', background: buildResult.allowed ? T.greenBg : T.redBg, border: `1px solid ${buildResult.allowed ? T.greenBord : T.redBord}`, color: buildResult.allowed ? T.green : T.red, borderRadius: 5, fontSize: 13, fontWeight: 700 }}>
              {buildResult.allowed ? '✓ allowed' : '✗ rejected'}
            </div>
            <div style={{ fontSize: 12, color: T.textDim }}>
              {buildResult.fired.length} fired · {buildResult.failures.length} failures · {buildResult.skipped.length} skipped
            </div>
          </div>
        )}

        {/* Fired patterns — full inline cards */}
        {buildResult.fired.length > 0 && (<>
          <Section>Fired ({buildResult.fired.length})</Section>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 10, marginBottom: 16 }}>
            {buildResult.fired.map((f, i) => {
              const p = PATTERNS.find(p => p.id === f.patternId)
              const ok = f.verdict.allowed
              const tokSurfaces = placed.slice(f.span[0], f.span[1] + 1).join(' ')
              const licenseStr = p?.license?.alwaysForbidden
                ? 'forbidden'
                : p?.license?.requiresAtoms?.length > 0
                  ? `needs: ${p.license.requiresAtoms.join(', ')}`
                  : 'always allowed'
              return (
                <div key={i} style={{ background: ok ? T.greenBg : T.redBg, border: `1px solid ${ok ? T.greenBord : T.redBord}`, borderRadius: 5, padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                    <span style={{ fontSize: 13, color: ok ? T.green : T.red, fontWeight: 700, fontFamily: 'monospace' }}>{f.patternId}</span>
                    <span style={{ fontSize: 10, color: T.textDim }}>{f.group} · {p?.type}</span>
                  </div>
                  <div style={{ fontSize: 12, color: T.textSub, marginBottom: 4 }}>
                    on "<span style={{ color: ok ? T.green : T.red, fontWeight: 600, fontFamily: 'monospace' }}>{tokSurfaces || '(boundary)'}</span>" — {licenseStr}
                  </div>
                  {!ok && <div style={{ fontSize: 11, color: T.red, fontWeight: 600, marginBottom: 4 }}>✗ {f.verdict.reason}</div>}
                  <div style={{ fontSize: 11, color: T.textSub, lineHeight: 1.4 }}>{p?.description}</div>
                </div>
              )
            })}
          </div>
        </>)}

        {/* Library at bottom of Build, with subtle firing highlight */}
        <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${T.border}` }}>
          <Section>Library — patterns currently firing are tinted</Section>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 14 }}>
            {allGroups.map(group => {
              const inGroup = PATTERNS.filter(p => p.group === group)
              return (
                <div key={group} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '12px 14px' }}>
                  <div style={{ fontSize: 12, color: T.text, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10, paddingBottom: 8, borderBottom: `1px solid ${T.border}` }}>
                    {group}
                  </div>
                  {inGroup.map(p => {
                    const fired = buildFiredSet.has(p.id)
                    const licenseStr = p.license?.alwaysForbidden
                      ? 'forbidden'
                      : p.license?.requiresAtoms?.length > 0
                        ? `needs: ${p.license.requiresAtoms.join(', ')}`
                        : 'always allowed'
                    return (
                      <div key={p.id} style={{
                        marginBottom: 8, paddingLeft: 8, paddingBottom: 8,
                        borderLeft: fired ? `3px solid ${T.green}` : `3px solid transparent`,
                        borderBottom: `1px dashed ${T.border}`,
                      }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: T.text, fontFamily: 'monospace', marginBottom: 2 }}>
                          {p.id}
                          {fired && <span style={{ marginLeft: 6, fontSize: 9, color: T.green, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>● firing</span>}
                        </div>
                        <div style={{ fontSize: 10, color: T.textDim, fontFamily: 'monospace', marginBottom: 3 }}>
                          {p.type} · {licenseStr}
                        </div>
                        <div style={{ fontSize: 11, color: T.textSub, lineHeight: 1.4 }}>{p.description}</div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </>}

      {tab === 'flow' && <GrammarBreakerFlowTab activeAtoms={activeAtoms} />}

      {tab === 'forward' && <GrammarBreakerForwardFlowTab />}

      {tab === 'l2' && <GrammarBreakerL2Health />}

      {tab === 'patterns' && (
        <div>
          <div style={{ fontSize: 12, color: T.textDim, marginBottom: 16, lineHeight: 1.6 }}>
            The full library the validator reads from. Patterns are clustered by their <code style={{ background: T.card, padding: '1px 5px', borderRadius: 3 }}>group</code> tag — re-clustering happens by editing that field in <code style={{ background: T.card, padding: '1px 5px', borderRadius: 3 }}>grammarBreakerPatterns.js</code>. Group toggles disable every pattern inside in one click.
          </div>

          <Section>By group</Section>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 14 }}>
            {allGroups.map(group => {
              const inGroup = PATTERNS.filter(p => p.group === group)
              const groupOn = config.groups[group] !== false
              return (
                <div key={group} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 8, borderBottom: `1px solid ${T.border}` }}>
                    <label style={{ fontSize: 12, color: T.text, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input type="checkbox" checked={groupOn} onChange={e => toggleGroup(group, e.target.checked)} />
                      {group}
                    </label>
                    <span style={{ fontSize: 10, color: T.textDim }}>{inGroup.length} pattern{inGroup.length === 1 ? '' : 's'}</span>
                  </div>
                  {inGroup.map(p => {
                    const on = patternEnabled(p)
                    const licenseStr = p.license?.alwaysForbidden
                      ? 'forbidden'
                      : p.license?.requiresAtoms?.length > 0
                        ? `needs: ${p.license.requiresAtoms.join(', ')}`
                        : 'always allowed'
                    return (
                      <div key={p.id} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: `1px dashed ${T.border}`, opacity: groupOn ? 1 : 0.45 }}>
                        <label style={{ fontSize: 13, color: T.text, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 4 }}>
                          <input type="checkbox" checked={config.patterns[p.id] !== false} onChange={e => togglePattern(p.id, e.target.checked)} />
                          <span style={{ fontWeight: 700, color: on ? T.text : T.textDim, fontFamily: 'monospace' }}>{p.id}</span>
                        </label>
                        <div style={{ paddingLeft: 26 }}>
                          <Chip bg="#fff" border={T.border} color={T.textDim} style={{ marginRight: 6 }}>{p.type}</Chip>
                          <Chip bg={p.license?.alwaysForbidden ? T.redBg : T.blueBg} border={p.license?.alwaysForbidden ? T.redBord : T.blueBord} color={p.license?.alwaysForbidden ? T.red : T.blue}>
                            {licenseStr}
                          </Chip>
                          <div style={{ fontSize: 12, color: T.textSub, marginTop: 5, lineHeight: 1.5 }}>
                            {p.description}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>

          {/* ── By pattern type ─────────────────────────────────────── */}
          <div style={{ marginTop: 32, paddingTop: 24, borderTop: `1px solid ${T.border}` }}>
            <Section>By pattern type</Section>
            <div style={{ fontSize: 12, color: T.textDim, marginBottom: 16, lineHeight: 1.6 }}>
              The taxonomy I picked when seeding the library — four categories of evidence a sentence can carry. Each pattern declares its <code style={{ background: T.card, padding: '1px 5px', borderRadius: 3 }}>type</code> and lands in one of these. The taxonomy is metadata, not load-bearing — if a different cut works better, swap the strings; nothing in the validator breaks.
            </div>

            {/* Type filter buttons */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
              <button onClick={() => setTypeFilter(null)}
                style={{ padding: '4px 10px', background: typeFilter == null ? T.greenBg : '#fff', border: `1px solid ${typeFilter == null ? T.greenBord : T.border}`, borderRadius: 4, fontSize: 11, color: typeFilter == null ? T.green : T.textDim, fontWeight: typeFilter == null ? 700 : 400, cursor: 'pointer' }}>
                all ({PATTERNS.length})
              </button>
              {PATTERN_TYPES.map(t => {
                const count = PATTERNS.filter(p => p.type === t.id).length
                const on = typeFilter === t.id
                return (
                  <button key={t.id} onClick={() => setTypeFilter(on ? null : t.id)}
                    style={{ padding: '4px 10px', background: on ? T.greenBg : '#fff', border: `1px solid ${on ? T.greenBord : T.border}`, borderRadius: 4, fontSize: 11, color: on ? T.green : T.textDim, fontWeight: on ? 700 : 400, cursor: 'pointer' }}>
                    {t.id} ({count})
                  </button>
                )
              })}
            </div>

            {/* One card per type — definition + patterns of that type */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 14 }}>
              {PATTERN_TYPES.filter(t => typeFilter == null || typeFilter === t.id).map(t => {
                const inType = PATTERNS.filter(p => p.type === t.id)
                return (
                  <div key={t.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6, paddingBottom: 8, borderBottom: `1px solid ${T.border}` }}>
                      <span style={{ fontSize: 13, color: T.text, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'monospace' }}>
                        {t.id}
                      </span>
                      <span style={{ fontSize: 10, color: T.textDim }}>{inType.length} pattern{inType.length === 1 ? '' : 's'}</span>
                    </div>

                    <div style={{ fontSize: 12, color: T.textSub, lineHeight: 1.55, marginBottom: 12 }}>
                      {t.definition}
                    </div>

                    {inType.length === 0
                      ? <div style={{ fontSize: 11, color: T.textDim, fontStyle: 'italic' }}>no patterns of this type</div>
                      : inType.map(p => {
                        const on = patternEnabled(p)
                        const licenseStr = p.license?.alwaysForbidden
                          ? 'forbidden'
                          : p.license?.requiresAtoms?.length > 0
                            ? `needs: ${p.license.requiresAtoms.join(', ')}`
                            : 'always allowed'
                        return (
                          <div key={p.id} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: `1px dashed ${T.border}` }}>
                            <label style={{ fontSize: 12, color: T.text, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 3 }}>
                              <input type="checkbox" checked={config.patterns[p.id] !== false} onChange={e => togglePattern(p.id, e.target.checked)} />
                              <span style={{ fontWeight: 700, color: on ? T.text : T.textDim, fontFamily: 'monospace' }}>{p.id}</span>
                              <span style={{ fontSize: 10, color: T.textDim }}>· {p.group}</span>
                            </label>
                            <div style={{ paddingLeft: 26 }}>
                              <Chip bg={p.license?.alwaysForbidden ? T.redBg : T.blueBg} border={p.license?.alwaysForbidden ? T.redBord : T.blueBord} color={p.license?.alwaysForbidden ? T.red : T.blue}>
                                {licenseStr}
                              </Chip>
                              <div style={{ fontSize: 11, color: T.textSub, marginTop: 4, lineHeight: 1.5 }}>
                                {p.description}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
