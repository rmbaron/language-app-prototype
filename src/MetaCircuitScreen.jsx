import { useState } from 'react'
import { evaluateMetaCircuit, getMetaCircuitOverride, setMetaCircuitOverride, clearMetaCircuitOverride } from './metaCircuit'
import { ATOMS } from './grammarAtoms.en'
import { GRAMMAR_CLUSTERS } from './grammarClustering.en'
import { getActiveLanguage } from './learnerProfile'

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

const C = {
  bg:            '#f5f6fb',
  card:          '#ffffff',
  border:        '#dde0f0',
  primary:       '#1a1a2e',
  secondary:     '#4a5080',
  muted:         '#8890b8',
  accent:        '#3355cc',
  accentBg:      '#eef1ff',
  accentBorder:  '#b0bef0',
  success:       '#1a7a35',
  successBg:     '#e8f5ed',
  successBorder: '#88c8a0',
  warning:       '#8a6000',
  warningBg:     '#fffbec',
  warningBorder: '#f0d080',
  sim:           '#6633cc',
  simBg:         '#f3eeff',
  simBorder:     '#c4a8f0',
}

function Chip({ active, onClick, color, children }) {
  const bg     = active ? (color ? color + '18' : C.accentBg)     : C.card
  const border = active ? (color ? color + '66' : C.accentBorder) : C.border
  const text   = active ? (color ?? C.accent)                     : C.muted
  return (
    <button onClick={onClick} style={{
      background: bg, border: `1.5px solid ${border}`, color: text,
      borderRadius: 4, padding: '4px 10px', fontSize: 11,
      cursor: onClick ? 'pointer' : 'default', fontWeight: active ? 600 : 400,
    }}>
      {children}
    </button>
  )
}

function SL({ children, style }) {
  return <div style={{ fontSize: 11, color: C.secondary, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, ...style }}>{children}</div>
}

function Card({ children, style }) {
  return <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 16px', ...style }}>{children}</div>
}

export default function MetaCircuitScreen({ onBack }) {
  const lang = getActiveLanguage() ?? 'en'

  const [, forceUpdate] = useState(0)
  const refresh = () => forceUpdate(n => n + 1)

  const position = evaluateMetaCircuit(lang)
  const override = getMetaCircuitOverride()

  // Simulation draft state — mirrors the override, editable before committing
  const [simLevel,   setSimLevel]   = useState(override?.level       ?? position.real.level)
  const [simCluster, setSimCluster] = useState(override?.cluster     ?? position.real.cluster)
  const [simAtoms,   setSimAtoms]   = useState(override?.activeAtoms ?? position.real.activeAtoms)
  const [simOn,      setSimOn]      = useState(!!override)

  function handleSimToggle(on) {
    setSimOn(on)
    if (!on) { clearMetaCircuitOverride(); refresh() }
  }

  function handleApply() {
    setMetaCircuitOverride({ level: simLevel, cluster: simCluster, activeAtoms: simAtoms })
    refresh()
  }

  function handleClear() {
    clearMetaCircuitOverride()
    setSimLevel(position.real.level)
    setSimCluster(position.real.cluster)
    setSimAtoms(position.real.activeAtoms)
    setSimOn(false)
    refresh()
  }

  function toggleSimAtom(atomId) {
    setSimAtoms(prev =>
      prev.includes(atomId) ? prev.filter(a => a !== atomId) : [...prev, atomId]
    )
  }

  const clusterIds = GRAMMAR_CLUSTERS.map(c => c.id)

  return (
    <div style={{ position: 'fixed', inset: 0, overflowY: 'auto', background: C.bg, color: C.primary, fontFamily: 'inherit', fontSize: 13, zIndex: 999 }}>
      <div style={{ maxWidth: 620, margin: '0 auto', padding: '16px 16px 40px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <button onClick={onBack} style={{
            background: C.card, border: `1px solid ${C.border}`, color: C.secondary,
            borderRadius: 5, padding: '5px 12px', fontSize: 12, cursor: 'pointer',
          }}>← Back</button>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.primary, flex: 1 }}>Meta Circuit</span>
          {position.isSimulated && (
            <span style={{ fontSize: 11, fontWeight: 700, color: C.sim, background: C.simBg, border: `1px solid ${C.simBorder}`, borderRadius: 4, padding: '3px 10px' }}>
              SIMULATED
            </span>
          )}
        </div>

        {/* Current position */}
        <Card style={{ marginBottom: 14 }}>
          <SL style={{ marginBottom: 12 }}>
            {position.isSimulated ? 'Simulated position — Gates see this' : 'Current position'}
          </SL>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <Chip active>{position.level ?? '—'}</Chip>
            <Chip active>C{position.cluster}</Chip>
            <span style={{ fontSize: 11, color: C.muted, alignSelf: 'center' }}>·</span>
            <span style={{ fontSize: 11, color: C.muted, alignSelf: 'center' }}>{position.activeAtoms.length} atom{position.activeAtoms.length !== 1 ? 's' : ''} active</span>
          </div>

          {position.activeAtoms.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 5 }}>Active atoms</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {position.activeAtoms.map(a => (
                  <Chip key={a} active color={C.success}>{a}</Chip>
                ))}
              </div>
            </div>
          )}

          {position.pioneerGaps.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 5 }}>Next up (pioneer gaps)</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {position.pioneerGaps.map(({ atomId }) => (
                  <Chip key={atomId} active color={C.warning}>{atomId}</Chip>
                ))}
              </div>
            </div>
          )}

          {position.isSimulated && (
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${C.border}`, fontSize: 11, color: C.muted }}>
              Real position: <strong>{position.real.level ?? '—'}</strong> · <strong>C{position.real.cluster}</strong> · {position.real.activeAtoms.length} atoms
            </div>
          )}
        </Card>

        {/* Simulation */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: simOn ? 16 : 0 }}>
            <SL style={{ flex: 1 }}>Simulate a different position</SL>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: simOn ? C.sim : C.muted }}>
              <input type="checkbox" checked={simOn} onChange={e => handleSimToggle(e.target.checked)} style={{ cursor: 'pointer' }} />
              {simOn ? 'On' : 'Off'}
            </label>
          </div>

          {simOn && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Level */}
              <div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 5 }}>Level</div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {CEFR_LEVELS.map(lv => (
                    <Chip key={lv} active={simLevel === lv} onClick={() => setSimLevel(lv)}>{lv}</Chip>
                  ))}
                </div>
              </div>

              {/* Cluster */}
              <div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 5 }}>Cluster</div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {clusterIds.map(c => (
                    <Chip key={c} active={simCluster === c} onClick={() => setSimCluster(c)}>C{c}</Chip>
                  ))}
                </div>
              </div>

              {/* Atoms */}
              <div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 5 }}>Active atoms</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {ATOMS.map(a => (
                    <Chip key={a.id} active={simAtoms.includes(a.id)} onClick={() => toggleSimAtom(a.id)}>
                      {a.id}
                    </Chip>
                  ))}
                </div>
              </div>

              {/* Apply / Clear */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleApply} style={{
                  flex: 1, padding: '8px 0', background: C.simBg,
                  border: `1.5px solid ${C.simBorder}`, color: C.sim,
                  borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 700,
                }}>
                  Apply simulation
                </button>
                <button onClick={handleClear} style={{
                  padding: '8px 16px', background: C.card,
                  border: `1px solid ${C.border}`, color: C.muted,
                  borderRadius: 6, fontSize: 12, cursor: 'pointer',
                }}>
                  Clear
                </button>
              </div>

              <div style={{ fontSize: 11, color: C.muted, fontStyle: 'italic' }}>
                Gates will use the simulated position while this is active.
              </div>
            </div>
          )}
        </Card>

      </div>
    </div>
  )
}
