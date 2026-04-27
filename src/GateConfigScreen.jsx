import { useState, useEffect, useMemo } from 'react'
import { useInventory } from './InventoryContext'
import { WORLD_SPHERE_DESTINATIONS } from './worldSphereConfig'
import { GRAMMAR_CLUSTERS } from './grammarClustering.en'
import { ATOMS } from './grammarAtoms.en'
import { loadGateConfig, saveGateConfig, buildWordDataMap, evaluateGate } from './gateConfig'

const CEFR_LEVELS  = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const CLUSTER_IDS  = GRAMMAR_CLUSTERS.map(c => c.id)

const RULE_TYPES = [
  { id: 'minWordCount',  label: 'Min word count'       },
  { id: 'keyWords',      label: 'Key words'             },
  { id: 'keyFilter',     label: 'Key filter (advanced)' },
  { id: 'requiredAtoms', label: 'Required atoms'        },
  { id: 'minCluster',    label: 'Min cluster'           },
]

// ── Helpers ────────────────────────────────────────────────────────────────

function makeId() { return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }

function makeRule(type) {
  const id = makeId()
  if (type === 'minWordCount')  return { id, type, enabled: true, group: null, value: 5 }
  if (type === 'keyWords')      return { id, type, enabled: true, group: null, words: [], minMatches: 1 }
  if (type === 'keyFilter')     return { id, type, enabled: true, group: null, filter: { words: [], atoms: [], grammaticalCategories: [] }, minMatches: 3 }
  if (type === 'requiredAtoms') return { id, type, enabled: true, group: null, atoms: [] }
  if (type === 'minCluster')    return { id, type, enabled: true, group: null, value: 2 }
}

const GROUP_PALETTE = ['#4466ff', '#ff6633', '#33cc88', '#ffaa22', '#cc44ff']
function buildGroupColors(rules) {
  const colors = {}; let idx = 0
  for (const r of rules) {
    if (r.group && !(r.group in colors)) colors[r.group] = GROUP_PALETTE[idx++ % GROUP_PALETTE.length]
  }
  return colors
}

// ── Rule field components ──────────────────────────────────────────────────

function MinWordCountFields({ rule, onChange }) {
  return (
    <Row>
      <L>At least</L>
      <NumInput value={rule.value ?? 1} min={1} onChange={v => onChange({ value: v })} />
      <L>total words in bank</L>
    </Row>
  )
}

function MinClusterFields({ rule, onChange }) {
  return (
    <Row>
      <L>Cluster</L>
      <NumInput value={rule.value ?? 1} min={1} onChange={v => onChange({ value: v })} />
      <L>or higher (learner position)</L>
    </Row>
  )
}

function KeyWordsFields({ rule, result, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <Row>
        <L>At least</L>
        <NumInput value={rule.minMatches ?? 1} min={1} onChange={v => onChange({ minMatches: v })} />
        <L>of these specific words must be banked:</L>
      </Row>
      <input
        value={(rule.words ?? []).join(', ')}
        onChange={e => onChange({ words: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
        placeholder="word IDs, comma-separated — e.g. en-eat, en-drink, en-food"
        style={{ ...TXT, width: '100%', boxSizing: 'border-box' }}
      />
      {result?.qualifying?.length > 0 && (
        <div style={{ fontSize: 10, color: '#3a6a3a' }}>banked: {result.qualifying.join(', ')}</div>
      )}
    </div>
  )
}

function RequiredAtomsFields({ rule, result, onChange, activeAtoms }) {
  const selected = new Set(rule.atoms ?? [])
  const active   = new Set(activeAtoms ?? [])
  function toggle(a) {
    onChange({ atoms: selected.has(a) ? [...selected].filter(x => x !== a) : [...selected, a] })
  }
  return (
    <div>
      <L style={{ display: 'block', marginBottom: 5 }}>All of these atoms must be active in learner progression:</L>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {ATOMS.map(atom => {
          const on = selected.has(atom.id), met = on && active.has(atom.id)
          return (
            <button key={atom.id} onClick={() => toggle(atom.id)} style={{
              background: on ? (met ? '#1a3a2a' : '#2a1a1a') : '#12121a',
              border:     `1px solid ${on ? (met ? '#335533' : '#553333') : '#2a2a3a'}`,
              color:      on ? (met ? '#55aa55' : '#aa4433') : '#4a4a6a',
              borderRadius: 3, padding: '2px 6px', fontSize: 9, cursor: 'pointer',
            }}>{atom.id}</button>
          )
        })}
      </div>
      <L style={{ display: 'block', marginTop: 4 }}>green = required + active · red = required + not active</L>
    </div>
  )
}

function KeyFilterFields({ rule, result, onChange }) {
  const filter = rule.filter ?? {}
  const selAtoms = new Set(filter.atoms ?? [])
  function updateFilter(ch) { onChange({ filter: { ...filter, ...ch } }) }
  function toggleAtom(a) {
    updateFilter({ atoms: selAtoms.has(a) ? [...selAtoms].filter(x => x !== a) : [...selAtoms, a] })
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Row>
        <L>At least</L>
        <NumInput value={rule.minMatches ?? 1} min={1} onChange={v => onChange({ minMatches: v })} />
        <L>words passing all active filters below</L>
      </Row>
      <div>
        <L style={{ display: 'block', marginBottom: 3 }}>Specific word IDs (comma-separated · empty = any word)</L>
        <input value={(filter.words ?? []).join(', ')}
          onChange={e => updateFilter({ words: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
          placeholder="e.g. en-eat, en-drink  (empty = no word restriction)"
          style={{ ...TXT, width: '100%', boxSizing: 'border-box' }} />
      </div>
      <div>
        <L style={{ display: 'block', marginBottom: 3 }}>Word's grammar atom must be one of (empty = any)</L>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {ATOMS.map(atom => {
            const on = selAtoms.has(atom.id)
            return (
              <button key={atom.id} onClick={() => toggleAtom(atom.id)} style={{
                background: on ? '#1a2a3a' : '#12121a',
                border:     `1px solid ${on ? '#335599' : '#2a2a3a'}`,
                color:      on ? '#6699cc' : '#4a4a6a',
                borderRadius: 3, padding: '2px 6px', fontSize: 9, cursor: 'pointer',
              }}>{atom.id}</button>
            )
          })}
        </div>
      </div>
      <div>
        <L style={{ display: 'block', marginBottom: 3 }}>Grammatical category (comma-separated · empty = any)</L>
        <input value={(filter.grammaticalCategories ?? []).join(', ')}
          onChange={e => updateFilter({ grammaticalCategories: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
          placeholder="e.g. verb, noun  (empty = no category restriction)"
          style={{ ...TXT, width: '100%', boxSizing: 'border-box' }} />
      </div>
      {result?.qualifying?.length > 0 && (
        <div style={{ fontSize: 10, color: '#3a6a3a' }}>qualifying: {result.qualifying.join(', ')}</div>
      )}
    </div>
  )
}

// ── Rule card ──────────────────────────────────────────────────────────────

function RuleCard({ rule, result, groupColor, activeAtoms, onChange, onDelete }) {
  const enabled     = rule.enabled !== false
  const passed      = result?.passed
  const resultColor = result == null ? '#4a4a6a' : passed ? '#55cc55' : '#cc5544'

  return (
    <div style={{
      background:   '#0d0d22',
      border:       '1px solid #2a2a4a',
      borderLeft:   `3px solid ${groupColor}`,
      borderRadius: 6,
      padding:      '10px 12px',
      opacity:      enabled ? 1 : 0.5,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <input type="checkbox" checked={enabled} onChange={e => onChange({ enabled: e.target.checked })} style={{ cursor: 'pointer' }} />
        <span style={{ fontSize: 11, color: '#7070b0', fontWeight: 600, flex: 1 }}>
          {RULE_TYPES.find(rt => rt.id === rule.type)?.label ?? rule.type}
        </span>
        {result != null && (
          <span style={{ fontSize: 11, color: resultColor, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            {passed ? '✓' : '✗'}{result.have != null ? ` ${result.have}/${result.need}` : ''}
          </span>
        )}
        <button onClick={onDelete} style={{ background: 'none', border: 'none', color: '#5a3030', cursor: 'pointer', fontSize: 15, padding: '0 2px', lineHeight: 1 }}>×</button>
      </div>

      {rule.type === 'minWordCount'  && <MinWordCountFields  rule={rule} onChange={onChange} />}
      {rule.type === 'minCluster'    && <MinClusterFields    rule={rule} onChange={onChange} />}
      {rule.type === 'keyWords'      && <KeyWordsFields      rule={rule} result={result} onChange={onChange} />}
      {rule.type === 'requiredAtoms' && <RequiredAtomsFields rule={rule} result={result} onChange={onChange} activeAtoms={activeAtoms} />}
      {rule.type === 'keyFilter'     && <KeyFilterFields     rule={rule} result={result} onChange={onChange} />}

      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        <L>Group (OR):</L>
        <input value={rule.group ?? ''} onChange={e => onChange({ group: e.target.value || null })}
          placeholder="none"
          style={{ ...TXT, width: 80, color: rule.group ? '#7070c8' : '#3a3a5a' }} />
        {rule.group && <span style={{ width: 7, height: 7, borderRadius: '50%', background: groupColor, display: 'inline-block' }} />}
      </div>

      {result?.unenrichedWords?.length > 0 && (
        <div style={{ marginTop: 6, fontSize: 10, color: '#888833' }}>
          ⚠ skipped (no L2 data): {result.unenrichedWords.join(', ')}
        </div>
      )}
    </div>
  )
}

// ── Context selector ───────────────────────────────────────────────────────

function ContextSelector({ selLevel, selCluster, selAtom, onLevel, onCluster, onAtom, userLevel, userCluster }) {
  return (
    <div style={{ background: '#0d0d22', border: '1px solid #2a2a4a', borderRadius: 6, padding: '10px 12px', marginBottom: 14 }}>
      <div style={{ ...SEC, marginBottom: 10 }}>Progression context — designing rules for:</div>

      {/* Level */}
      <div style={{ marginBottom: 8 }}>
        <L style={{ display: 'block', marginBottom: 5 }}>Level</L>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <ChipBtn active={selLevel === null} onClick={() => { onLevel(null); onCluster(null) }}>any</ChipBtn>
          {CEFR_LEVELS.map(lv => (
            <ChipBtn key={lv} active={selLevel === lv} onClick={() => { onLevel(lv); onCluster(null) }}
              dim={lv !== userLevel}>
              {lv}
            </ChipBtn>
          ))}
        </div>
      </div>

      {/* Cluster (only shown when a level is selected) */}
      {selLevel !== null && (
        <div style={{ marginBottom: 8 }}>
          <L style={{ display: 'block', marginBottom: 5 }}>Cluster within {selLevel}</L>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <ChipBtn active={selCluster === null} onClick={() => onCluster(null)}>all</ChipBtn>
            {CLUSTER_IDS.map(c => (
              <ChipBtn key={c} active={selCluster === c} onClick={() => onCluster(selCluster === c ? null : c)}
                dim={c !== userCluster}>
                C{c}
              </ChipBtn>
            ))}
          </div>
        </div>
      )}

      {/* Atom (always visible) */}
      <div>
        <L style={{ display: 'block', marginBottom: 5 }}>Atom condition</L>
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <ChipBtn active={selAtom === null} onClick={() => onAtom(null)}>any</ChipBtn>
          {ATOMS.map(a => (
            <ChipBtn key={a.id} active={selAtom === a.id} onClick={() => onAtom(selAtom === a.id ? null : a.id)} style={{ fontSize: 9 }}>
              {a.id}
            </ChipBtn>
          ))}
        </div>
      </div>

      {/* Current user position hint */}
      <div style={{ marginTop: 8, fontSize: 10, color: '#3a3a6a' }}>
        Your position: {userLevel} · C{userCluster}
      </div>
    </div>
  )
}

// ── Main screen ────────────────────────────────────────────────────────────

export default function GateConfigScreen({ initialDest, onBack }) {
  const { inventory }          = useInventory()
  const { wordBank, identity, grammarPosition } = inventory
  const { lang, cefrLevel }    = identity
  const { activeAtoms, currentCluster } = grammarPosition

  const [selectedDest, setSelectedDest] = useState(initialDest ?? WORLD_SPHERE_DESTINATIONS[0].id)
  const [config,       setConfig]       = useState(() => loadGateConfig(selectedDest))
  const [selLevel,     setSelLevel]     = useState(null)
  const [selCluster,   setSelCluster]   = useState(null)
  const [selAtom,      setSelAtom]      = useState(null)
  const [newRuleType,  setNewRuleType]  = useState('minWordCount')
  const [saved,        setSaved]        = useState(false)

  useEffect(() => { setConfig(loadGateConfig(selectedDest)); setSaved(false) }, [selectedDest])

  const wordDataMap = useMemo(
    () => buildWordDataMap(wordBank, lang),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wordBank.join(','), lang]
  )
  const gateResult = useMemo(
    () => evaluateGate(config, inventory, wordDataMap),
    [config, inventory, wordDataMap]
  )

  // Rules for the currently selected context
  const editingContext = config.contexts.find(ctx =>
    ctx.level === selLevel && ctx.cluster === selCluster && ctx.atom === selAtom
  )
  const editingRules = editingContext?.rules ?? []

  function withUpdatedContext(fn) {
    setConfig(prev => {
      const existingIdx = prev.contexts.findIndex(ctx =>
        ctx.level === selLevel && ctx.cluster === selCluster && ctx.atom === selAtom
      )
      if (existingIdx >= 0) {
        const updated = [...prev.contexts]
        updated[existingIdx] = fn(updated[existingIdx])
        return { ...prev, contexts: updated }
      } else {
        const newCtx = { id: makeId(), level: selLevel, cluster: selCluster, atom: selAtom, rules: [] }
        return { ...prev, contexts: [...prev.contexts, fn(newCtx)] }
      }
    })
    setSaved(false)
  }

  function updateRule(id, changes) {
    withUpdatedContext(ctx => ({ ...ctx, rules: ctx.rules.map(r => r.id === id ? { ...r, ...changes } : r) }))
  }
  function removeRule(id) {
    withUpdatedContext(ctx => ({ ...ctx, rules: ctx.rules.filter(r => r.id !== id) }))
  }
  function addRule() {
    withUpdatedContext(ctx => ({ ...ctx, rules: [...ctx.rules, makeRule(newRuleType)] }))
  }
  function handleSave() {
    saveGateConfig(selectedDest, config)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const groupColors = buildGroupColors(editingRules)

  const contextLabel = [
    selLevel   ?? 'any level',
    selCluster != null ? `C${selCluster}` : (selLevel ? 'all clusters' : null),
    selAtom    ?? null,
  ].filter(Boolean).join(' · ')

  const configuredContextCount = config.contexts.filter(ctx => (ctx.rules ?? []).length > 0).length

  return (
    <div style={{ position: 'fixed', inset: 0, overflowY: 'auto', background: '#0a0a18', color: '#9090b8', fontFamily: 'inherit', fontSize: 12, zIndex: 999 }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: 16 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <button onClick={onBack} style={{ background: 'none', border: '1px solid #2a2a4a', color: '#6060a0', borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>
            ← Back
          </button>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#b0b0d8' }}>Gate Config</span>
          {configuredContextCount > 0 && (
            <span style={{ fontSize: 10, color: '#4a4a7a' }}>{configuredContextCount} context{configuredContextCount !== 1 ? 's' : ''} configured</span>
          )}
        </div>

        {/* Destination */}
        <div style={{ marginBottom: 14 }}>
          <div style={SEC}>Destination</div>
          <select value={selectedDest} onChange={e => setSelectedDest(e.target.value)} style={{ ...SEL, width: '100%' }}>
            {WORLD_SPHERE_DESTINATIONS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
          </select>
        </div>

        {/* Gate status */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
          padding: '10px 12px', background: '#0d0d22', borderRadius: 6,
          border: `1px solid ${gateResult.open ? '#335533' : '#553333'}`,
        }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: gateResult.open ? '#55cc55' : '#cc5544' }}>
            {gateResult.open ? '✓ OPEN' : '✗ LOCKED'}
          </span>
          <span style={{ fontSize: 10, color: '#3a3a6a' }}>
            {gateResult.matchedContext
              ? `matched: ${contextDescription(gateResult.matchedContext)}`
              : 'no matching context'}
          </span>
          {!gateResult.open && gateResult.closestRule && (
            <span style={{ fontSize: 10, color: '#6060a0', marginLeft: 'auto' }}>gap: {gateResult.closestRule.gap}</span>
          )}
        </div>

        {/* Unenriched warning */}
        {gateResult.unenrichedWords.length > 0 && (
          <div style={{ marginBottom: 12, padding: '7px 10px', background: '#181800', border: '1px solid #444400', borderRadius: 4, fontSize: 10, color: '#aaaa44' }}>
            ⚠ {gateResult.unenrichedWords.length} banked word(s) not evaluated — no L2 data: {gateResult.unenrichedWords.join(', ')}
          </div>
        )}

        {/* Default open */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 16, cursor: 'pointer', fontSize: 11, color: '#5050a0' }}>
          <input type="checkbox" checked={config.defaultOpen ?? false} onChange={e => { setConfig(p => ({ ...p, defaultOpen: e.target.checked })); setSaved(false) }} />
          Open by default when no context matches
        </label>

        {/* Context selector */}
        <ContextSelector
          selLevel={selLevel} selCluster={selCluster} selAtom={selAtom}
          onLevel={setSelLevel} onCluster={setSelCluster} onAtom={setSelAtom}
          userLevel={cefrLevel} userCluster={currentCluster}
        />

        {/* Rules for selected context */}
        <div style={{ marginBottom: 6 }}>
          <div style={{ ...SEC, marginBottom: 8 }}>
            Rules for: <span style={{ color: '#7070b0' }}>{contextLabel}</span>
            {editingRules.length === 0 && <span style={{ color: '#3a3a6a', fontWeight: 400 }}> — no rules yet</span>}
          </div>

          {editingRules.length > 1 && (
            <div style={{ marginBottom: 8, fontSize: 10, color: '#3a3a6a' }}>
              Rules in the same <b style={{ color: '#5050a0' }}>Group</b> are OR'd — any one passing satisfies the group. All groups must pass.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            {editingRules.map((rule, i) => {
              const result     = gateResult.rules.find(r => r.rule.id === rule.id)
              const groupColor = rule.group ? (groupColors[rule.group] ?? '#4466ff') : '#2a2a4a'
              const prevRule   = editingRules[i - 1]
              const showOr     = prevRule?.group && prevRule.group === rule.group
              return (
                <div key={rule.id}>
                  {showOr && <div style={{ textAlign: 'center', fontSize: 9, color: groupColor, letterSpacing: '0.12em', marginBottom: 2, fontWeight: 700 }}>OR</div>}
                  <RuleCard
                    rule={rule} result={result} groupColor={groupColor} activeAtoms={activeAtoms}
                    onChange={ch => updateRule(rule.id, ch)} onDelete={() => removeRule(rule.id)}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* Add rule */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20 }}>
          <select value={newRuleType} onChange={e => setNewRuleType(e.target.value)} style={{ ...SEL, flex: 1 }}>
            {RULE_TYPES.map(rt => <option key={rt.id} value={rt.id}>{rt.label}</option>)}
          </select>
          <button onClick={addRule} style={{ background: '#12122a', border: '1px solid #3a3a6a', color: '#8888cc', borderRadius: 4, padding: '5px 14px', fontSize: 11, cursor: 'pointer' }}>
            + Add rule
          </button>
        </div>

        {/* All configured contexts summary */}
        {config.contexts.filter(c => c.rules?.length > 0).length > 0 && (
          <div style={{ marginBottom: 16, padding: '8px 12px', background: '#0d0d22', border: '1px solid #1e1e38', borderRadius: 6 }}>
            <div style={{ ...SEC, marginBottom: 6 }}>All configured contexts</div>
            {config.contexts.filter(c => c.rules?.length > 0).map(ctx => (
              <div key={ctx.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, fontSize: 10 }}>
                <span style={{ color: '#5555a0', flex: 1 }}>{contextDescription(ctx)}</span>
                <span style={{ color: '#3a3a6a' }}>{ctx.rules.length} rule{ctx.rules.length !== 1 ? 's' : ''}</span>
                <button onClick={() => { setSelLevel(ctx.level); setSelCluster(ctx.cluster); setSelAtom(ctx.atom) }}
                  style={{ background: 'none', border: 'none', color: '#4455aa', cursor: 'pointer', fontSize: 10, padding: 0 }}>
                  edit
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Save */}
        <button onClick={handleSave} style={{
          width: '100%', padding: 10,
          background: saved ? '#0d1f0d' : '#12122a',
          border:     `1px solid ${saved ? '#336633' : '#3a3a6a'}`,
          color:      saved ? '#55cc55' : '#8888cc',
          borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 600,
        }}>
          {saved ? '✓ Saved' : 'Save gate config'}
        </button>

      </div>
    </div>
  )
}

// ── Tiny shared components ─────────────────────────────────────────────────

function Row({ children }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{children}</div>
}

function L({ children, style }) {
  return <span style={{ fontSize: 10, color: '#4a4a7a', ...style }}>{children}</span>
}

function ChipBtn({ active, onClick, children, dim, style }) {
  return (
    <button onClick={onClick} style={{
      background:   active ? '#1a2a4a' : '#12121a',
      border:       `1px solid ${active ? '#3355aa' : '#2a2a3a'}`,
      color:        active ? '#7799dd' : dim ? '#2a2a4a' : '#5555a0',
      borderRadius: 3, padding: '2px 7px', fontSize: 10, cursor: 'pointer',
      ...style,
    }}>
      {children}
    </button>
  )
}

function NumInput({ value, min = 1, onChange }) {
  return (
    <input type="number" value={value} min={min}
      onChange={e => onChange(parseInt(e.target.value) || min)}
      style={{ ...TXT, width: 52, textAlign: 'center' }}
    />
  )
}

function contextDescription(ctx) {
  const parts = [ctx.level ?? 'any level']
  if (ctx.level && ctx.cluster != null) parts.push(`C${ctx.cluster}`)
  else if (ctx.level) parts.push('all clusters')
  if (ctx.atom) parts.push(ctx.atom)
  return parts.join(' · ')
}

// Micro-styles
const TXT = { background: '#0a0a18', border: '1px solid #2a2a4a', color: '#9090b8', borderRadius: 3, padding: '3px 7px', fontSize: 10 }
const SEL = { background: '#12122a', border: '1px solid #2a2a4a', color: '#9090b8', borderRadius: 4, padding: '5px 8px', fontSize: 11 }
const SEC = { fontSize: 10, color: '#4a4a7a', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }
