import { useState, useEffect } from 'react'
import { evaluateMetaCircuit, setMetaCircuitOverride, clearMetaCircuitOverride, getMetaCircuitOverride } from './metaCircuit'
import { ATOMS } from './grammarAtoms.en'
import { GRAMMAR_CLUSTERS } from './grammarClustering.en'
import { getActiveLanguage } from './learnerProfile'

const LANES = [
  { id: 'reading',   label: 'Reading'   },
  { id: 'writing',   label: 'Writing'   },
  { id: 'speaking',  label: 'Speaking'  },
  { id: 'listening', label: 'Listening' },
]

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

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
  success:      '#1a7a35',
  successBg:    '#e8f5ed',
  successBorder:'#88c8a0',
  sim:          '#6633cc',
  simBg:        '#f3eeff',
  simBorder:    '#c4a8f0',
}

const directiveKey = lane => `lapp-factory-directive-${lane}`

function loadDirective(lane) {
  try { return localStorage.getItem(directiveKey(lane)) ?? '' } catch { return '' }
}
function saveDirective(lane, text) {
  try { localStorage.setItem(directiveKey(lane), text) } catch {}
}

function SL({ children, style }) {
  return <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 6, ...style }}>{children}</div>
}

function ToggleChip({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      display: 'block', width: '100%', textAlign: 'left',
      padding: '4px 8px', marginBottom: 2, borderRadius: 4,
      fontSize: 11, cursor: 'pointer', fontWeight: active ? 600 : 400,
      background: active ? C.accentBg : 'transparent',
      border: `1px solid ${active ? C.accentBorder : 'transparent'}`,
      color: active ? C.accent : C.secondary,
    }}>
      {children}
    </button>
  )
}

const taStyle = {
  width: '100%', boxSizing: 'border-box',
  background: '#f7f8ff', border: `1px solid ${C.border}`,
  color: C.primary, borderRadius: 4, padding: '8px 10px',
  fontSize: 12, fontFamily: 'monospace', lineHeight: 1.6,
  resize: 'vertical',
}

export default function PromptFactoryScreen({ onBack }) {
  const lang = getActiveLanguage() ?? 'en'

  const [, tick] = useState(0)
  const refresh  = () => tick(n => n + 1)

  const position = evaluateMetaCircuit(lang)
  const override = getMetaCircuitOverride()

  // Local mirrors of the override — initialise from current Meta Circuit state
  const [simLevel,   setSimLevel]   = useState(position.level ?? null)
  const [simCluster, setSimCluster] = useState(position.cluster ?? null)
  const [simAtoms,   setSimAtoms]   = useState([...position.activeAtoms])

  function pushOverride(level, cluster, atoms) {
    setMetaCircuitOverride({ level, cluster, activeAtoms: atoms })
    refresh()
  }

  function handleLevel(lv) {
    const next = simLevel === lv ? null : lv
    setSimLevel(next)
    pushOverride(next, simCluster, simAtoms)
  }

  function handleCluster(c) {
    const next = simCluster === c ? null : c
    setSimCluster(next)
    pushOverride(simLevel, next, simAtoms)
  }

  function handleAtom(atomId) {
    const next = simAtoms.includes(atomId)
      ? simAtoms.filter(a => a !== atomId)
      : [...simAtoms, atomId]
    setSimAtoms(next)
    pushOverride(simLevel, simCluster, next)
  }

  function handleReset() {
    clearMetaCircuitOverride()
    const real = evaluateMetaCircuit(lang)
    setSimLevel(real.level)
    setSimCluster(real.cluster)
    setSimAtoms([...real.activeAtoms])
    refresh()
  }

  const [lane,       setLane]       = useState('reading')
  const [l4Block,    setL4Block]    = useState('')
  const [directive,  setDirective]  = useState(() => loadDirective('reading'))
  const [count,      setCount]      = useState(3)
  const [running,    setRunning]    = useState(false)
  const [candidates, setCandidates] = useState([])
  const [error,      setError]      = useState(null)

  useEffect(() => {
    setDirective(loadDirective(lane))
    setCandidates([])
    setError(null)
  }, [lane])

  function handleDirectiveChange(text) {
    setDirective(text)
    saveDirective(lane, text)
  }

  async function handleGenerate() {
    if (!directive.trim()) return
    setRunning(true)
    setCandidates([])
    setError(null)
    try {
      const res = await fetch('/__factory-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ l4Block, directiveBlock: directive, count, lane }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setCandidates(data.candidates ?? [])
    } catch (err) {
      setError(err.message)
    } finally {
      setRunning(false)
    }
  }

  const clusterIds = GRAMMAR_CLUSTERS.map(c => c.id)
  const isSimulated = !!getMetaCircuitOverride()

  return (
    <div style={{ position: 'fixed', inset: 0, background: C.bg, color: C.primary, fontFamily: 'inherit', fontSize: 13, display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: C.card, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <button onClick={onBack} style={{
          background: C.bg, border: `1px solid ${C.border}`, color: C.secondary,
          borderRadius: 5, padding: '5px 12px', fontSize: 12, cursor: 'pointer',
        }}>← Back</button>
        <span style={{ fontSize: 14, fontWeight: 700, color: C.primary, flex: 1 }}>Prompt Factory</span>
        {isSimulated && (
          <span style={{ fontSize: 11, fontWeight: 700, color: C.sim, background: C.simBg, border: `1px solid ${C.simBorder}`, borderRadius: 4, padding: '3px 10px' }}>
            SIMULATED
          </span>
        )}
        <button onClick={handleReset} style={{
          background: 'none', border: `1px solid ${C.border}`, color: C.muted,
          borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer',
        }}>Reset position</button>
      </div>

      {/* Body: sidebar + main */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Sidebar ── */}
        <div style={{
          width: 180, flexShrink: 0, borderRight: `1px solid ${C.border}`,
          background: C.card, overflowY: 'auto', padding: '14px 10px',
        }}>

          <SL>Level</SL>
          {CEFR_LEVELS.map(lv => (
            <ToggleChip key={lv} active={simLevel === lv} onClick={() => handleLevel(lv)}>
              {lv}
            </ToggleChip>
          ))}

          <SL style={{ marginTop: 14 }}>Cluster</SL>
          {clusterIds.map(c => {
            const cl = GRAMMAR_CLUSTERS.find(g => g.id === c)
            return (
              <ToggleChip key={c} active={simCluster === c} onClick={() => handleCluster(c)}>
                C{c} — {cl?.label}
              </ToggleChip>
            )
          })}

          <SL style={{ marginTop: 14 }}>Atoms</SL>
          {ATOMS.map(a => (
            <ToggleChip key={a.id} active={simAtoms.includes(a.id)} onClick={() => handleAtom(a.id)}>
              {a.id}
            </ToggleChip>
          ))}
        </div>

        {/* ── Main ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

          {/* Lane tabs */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderRadius: 6, overflow: 'hidden', border: `1px solid ${C.border}` }}>
            {LANES.map(l => (
              <button key={l.id} onClick={() => setLane(l.id)} style={{
                flex: 1, padding: '8px 0', fontSize: 12, fontWeight: lane === l.id ? 700 : 400,
                background: lane === l.id ? C.accentBg : C.card,
                color: lane === l.id ? C.accent : C.muted,
                border: 'none', borderRight: `1px solid ${C.border}`,
                cursor: 'pointer',
              }}>
                {l.label}
              </button>
            ))}
          </div>

          {/* L4 */}
          <div style={{ marginBottom: 12 }}>
            <SL style={{ fontSize: 11 }}>L4 — Positioning</SL>
            <textarea
              value={l4Block}
              onChange={e => setL4Block(e.target.value)}
              placeholder="Describe where this learner is…"
              rows={5}
              style={taStyle}
            />
          </div>

          {/* Directive */}
          <div style={{ marginBottom: 12 }}>
            <SL style={{ fontSize: 11 }}>Directive — {LANES.find(l => l.id === lane)?.label}</SL>
            <textarea
              value={directive}
              onChange={e => handleDirectiveChange(e.target.value)}
              placeholder={`What should the AI produce for ${lane}?`}
              rows={6}
              style={taStyle}
            />
          </div>

          {/* Generate row */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 11, color: C.muted }}>Candidates</span>
            <input type="range" min={1} max={10} value={count}
              onChange={e => setCount(Number(e.target.value))} style={{ flex: 1 }} />
            <span style={{ fontSize: 12, color: C.secondary, minWidth: 16 }}>{count}</span>
            <button
              onClick={handleGenerate}
              disabled={running || !directive.trim()}
              style={{
                padding: '7px 20px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: running || !directive.trim() ? 'default' : 'pointer',
                background: running || !directive.trim() ? C.bg : C.accentBg,
                border: `1.5px solid ${running || !directive.trim() ? C.border : C.accentBorder}`,
                color: running || !directive.trim() ? C.muted : C.accent,
              }}
            >
              {running ? 'Generating…' : 'Generate'}
            </button>
          </div>

          {error && (
            <div style={{ marginBottom: 12, padding: '8px 12px', borderRadius: 6, background: '#fdf0f0', border: '1px solid #e0a0a0', fontSize: 12, color: '#aa2222' }}>
              {error}
            </div>
          )}

          {candidates.length > 0 && (
            <div>
              <SL style={{ fontSize: 11, marginBottom: 10 }}>Candidates — {candidates.length}</SL>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {candidates.map((c, i) => (
                  <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 14px' }}>
                    <div style={{ fontSize: 10, color: C.muted, marginBottom: 6, fontWeight: 600 }}>#{i + 1}</div>
                    <div style={{ fontSize: 13, color: C.primary, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{c}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
