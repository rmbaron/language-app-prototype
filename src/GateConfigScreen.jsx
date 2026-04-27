import { useState, useEffect, useMemo } from 'react'
import { useInventory } from './InventoryContext'
import { WORLD_SPHERE_DESTINATIONS } from './worldSphereConfig'
import { GRAMMAR_CLUSTERS } from './grammarClustering.en'
import { ATOMS } from './grammarAtoms.en'
import { loadGateConfig, saveGateConfig, buildWordDataMap, evaluateGate, loadGateOverride, saveGateOverride } from './gateConfig'
import { evaluateMetaCircuit } from './metaCircuit'

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const CLUSTER_IDS = GRAMMAR_CLUSTERS.map(c => c.id)

const RULE_TYPES = [
  { id: 'minWordCount',  label: 'Word count'       },
  { id: 'keyWords',      label: 'Key words'         },
  { id: 'keyFilter',     label: 'Filter (advanced)' },
  { id: 'requiredAtoms', label: 'Atoms'             },
  { id: 'minCluster',    label: 'Cluster'           },
]

const GROUP_PALETTE = ['#3355cc', '#cc4422', '#229966', '#cc7700', '#8833cc']

// ── Colors ─────────────────────────────────────────────────────────────────

const C = {
  bg:             '#f5f6fb',
  card:           '#ffffff',
  border:         '#dde0f0',
  input:          '#f7f8ff',
  primary:        '#1a1a2e',
  secondary:      '#4a5080',
  muted:          '#8890b8',
  accent:         '#3355cc',
  accentBg:       '#eef1ff',
  accentBorder:   '#b0bef0',
  success:        '#1a7a35',
  successBg:      '#e8f5ed',
  successBorder:  '#88c8a0',
  error:          '#aa2222',
  errorBg:        '#fdf0f0',
  errorBorder:    '#e0a0a0',
  warning:        '#8a6000',
  warningBg:      '#fffbec',
  warningBorder:  '#f0d080',
  override:       '#e65100',
  overrideBg:     '#fff8f0',
  overrideBorder: '#ffb74d',
}

const inputStyle = {
  background: C.input, border: `1px solid ${C.border}`, color: C.primary,
  borderRadius: 4, padding: '5px 8px', fontSize: 12,
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeId() { return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }

function makeRule(type) {
  const id = makeId()
  const base = { id, type, enabled: true, mode: 'require', group: null }
  if (type === 'minWordCount')  return { ...base, value: 5 }
  if (type === 'keyWords')      return { ...base, words: [], minMatches: 1 }
  if (type === 'keyFilter')     return { ...base, filter: { words: [], atoms: [], grammaticalCategories: [] }, minMatches: 3 }
  if (type === 'requiredAtoms') return { ...base, atoms: [] }
  if (type === 'minCluster')    return { ...base, value: 2 }
}

function buildGroupColors(rules) {
  const colors = {}; let idx = 0
  for (const r of rules) {
    if (r.group && !(r.group in colors)) colors[r.group] = GROUP_PALETTE[idx++ % GROUP_PALETTE.length]
  }
  return colors
}

function getSelectedCombos(selLevels, selClusters, selAtoms) {
  const levels   = selLevels.length   > 0 ? selLevels   : [null]
  const clusters = selClusters.length > 0 ? selClusters : [null]
  const atoms    = selAtoms.length    > 0 ? selAtoms    : [null]
  return levels.flatMap(l => clusters.flatMap(c => atoms.map(a => ({ level: l, cluster: c, atom: a }))))
}

function contextDescription(ctx) {
  const parts = [ctx.level ?? 'any level']
  if (ctx.level && ctx.cluster != null) parts.push(`C${ctx.cluster}`)
  else if (ctx.level) parts.push('all clusters')
  if (ctx.atom) parts.push(ctx.atom)
  return parts.join(' · ')
}

// ── Rule field editors ───────────────────────────────────────────────────────

function MinWordCountFields({ rule, onChange }) {
  return (
    <Row>
      <FL>At least</FL>
      <NumInput value={rule.value ?? 1} min={1} onChange={v => onChange({ value: v })} />
      <FL>total words in bank</FL>
    </Row>
  )
}

function MinClusterFields({ rule, onChange }) {
  return (
    <Row>
      <FL>Cluster</FL>
      <NumInput value={rule.value ?? 1} min={1} onChange={v => onChange({ value: v })} />
      <FL>or higher (learner position)</FL>
    </Row>
  )
}

function KeyWordsFields({ rule, result, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <Row>
        <FL>At least</FL>
        <NumInput value={rule.minMatches ?? 1} min={1} onChange={v => onChange({ minMatches: v })} />
        <FL>of these specific words must be banked:</FL>
      </Row>
      <input
        value={(rule.words ?? []).join(', ')}
        onChange={e => onChange({ words: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
        placeholder="word IDs, comma-separated — e.g. en-eat, en-drink"
        style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
      />
      {result?.qualifying?.length > 0 && (
        <div style={{ fontSize: 11, color: C.success }}>Banked: {result.qualifying.join(', ')}</div>
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
      <FL style={{ display: 'block', marginBottom: 6 }}>All of these atoms must be active in learner progression:</FL>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {ATOMS.map(atom => {
          const on = selected.has(atom.id), met = on && active.has(atom.id)
          return (
            <button key={atom.id} onClick={() => toggle(atom.id)} style={{
              background: on ? (met ? C.successBg : C.errorBg) : C.card,
              border:     `1px solid ${on ? (met ? C.successBorder : C.errorBorder) : C.border}`,
              color:      on ? (met ? C.success : C.error) : C.muted,
              borderRadius: 4, padding: '3px 7px', fontSize: 11, cursor: 'pointer',
            }}>{atom.id}</button>
          )
        })}
      </div>
      <FL style={{ display: 'block', marginTop: 5 }}>green = required + active · red = required + not yet active</FL>
    </div>
  )
}

function KeyFilterFields({ rule, result, onChange }) {
  const filter   = rule.filter ?? {}
  const selAtoms = new Set(filter.atoms ?? [])
  function updateFilter(ch) { onChange({ filter: { ...filter, ...ch } }) }
  function toggleAtom(a) {
    updateFilter({ atoms: selAtoms.has(a) ? [...selAtoms].filter(x => x !== a) : [...selAtoms, a] })
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Row>
        <FL>At least</FL>
        <NumInput value={rule.minMatches ?? 1} min={1} onChange={v => onChange({ minMatches: v })} />
        <FL>words passing all active filters below</FL>
      </Row>
      <div>
        <FL style={{ display: 'block', marginBottom: 3 }}>Specific word IDs (comma-separated · empty = any word)</FL>
        <input value={(filter.words ?? []).join(', ')}
          onChange={e => updateFilter({ words: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
          placeholder="e.g. en-eat, en-drink  (empty = no restriction)"
          style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
      </div>
      <div>
        <FL style={{ display: 'block', marginBottom: 4 }}>Word's grammar atom must be one of (empty = any)</FL>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {ATOMS.map(atom => {
            const on = selAtoms.has(atom.id)
            return (
              <button key={atom.id} onClick={() => toggleAtom(atom.id)} style={{
                background: on ? C.accentBg : C.card, border: `1px solid ${on ? C.accentBorder : C.border}`,
                color: on ? C.accent : C.muted, borderRadius: 4, padding: '3px 7px', fontSize: 11, cursor: 'pointer',
              }}>{atom.id}</button>
            )
          })}
        </div>
      </div>
      <div>
        <FL style={{ display: 'block', marginBottom: 3 }}>Grammatical category (comma-separated · empty = any)</FL>
        <input value={(filter.grammaticalCategories ?? []).join(', ')}
          onChange={e => updateFilter({ grammaticalCategories: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
          placeholder="e.g. verb, noun"
          style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
      </div>
      {result?.qualifying?.length > 0 && (
        <div style={{ fontSize: 11, color: C.success }}>Qualifying: {result.qualifying.join(', ')}</div>
      )}
    </div>
  )
}

// ── Rule card ────────────────────────────────────────────────────────────────

function RuleCard({ rule, result, groupColor, activeAtoms, onChange, onDelete }) {
  const enabled     = rule.enabled !== false
  const passed      = result?.passed
  const isExclude   = rule.mode === 'exclude'
  const resultColor = result == null ? C.muted : passed ? C.success : C.error

  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderLeft: `4px solid ${groupColor}`, borderRadius: 8,
      padding: '12px 14px', opacity: enabled ? 1 : 0.55,
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <input type="checkbox" checked={enabled} onChange={e => onChange({ enabled: e.target.checked })} style={{ cursor: 'pointer' }} />
        <span style={{ fontSize: 13, color: C.primary, fontWeight: 600, flex: 1 }}>
          {RULE_TYPES.find(rt => rt.id === rule.type)?.label ?? rule.type}
        </span>

        {/* Mode toggle */}
        <button onClick={() => onChange({ mode: isExclude ? 'require' : 'exclude' })} style={{
          background: isExclude ? '#fff3e0' : C.successBg,
          border:     `1px solid ${isExclude ? '#ffb74d' : C.successBorder}`,
          color:      isExclude ? '#e65100' : C.success,
          borderRadius: 4, padding: '2px 9px', fontSize: 10, cursor: 'pointer', fontWeight: 700, letterSpacing: '0.05em',
        }}>
          {isExclude ? 'EXCLUDE' : 'REQUIRE'}
        </button>

        {/* Live result */}
        {result != null && (
          <span style={{ fontSize: 12, color: resultColor, fontWeight: 700, fontVariantNumeric: 'tabular-nums', minWidth: 40, textAlign: 'right' }}>
            {passed ? '✓' : '✗'}{result.have != null ? ` ${result.have}/${result.need}` : ''}
          </span>
        )}
        <button onClick={onDelete} style={{ background: 'none', border: 'none', color: '#cc6666', cursor: 'pointer', fontSize: 17, padding: '0 2px', lineHeight: 1 }}>×</button>
      </div>

      {/* Mode description */}
      <div style={{ marginBottom: 10, fontSize: 11, color: C.muted, fontStyle: 'italic' }}>
        {isExclude ? 'Gate opens when this condition is NOT met' : 'Gate opens when this condition IS met'}
      </div>

      {rule.type === 'minWordCount'  && <MinWordCountFields  rule={rule} onChange={onChange} />}
      {rule.type === 'minCluster'    && <MinClusterFields    rule={rule} onChange={onChange} />}
      {rule.type === 'keyWords'      && <KeyWordsFields      rule={rule} result={result} onChange={onChange} />}
      {rule.type === 'requiredAtoms' && <RequiredAtomsFields rule={rule} result={result} onChange={onChange} activeAtoms={activeAtoms} />}
      {rule.type === 'keyFilter'     && <KeyFilterFields     rule={rule} result={result} onChange={onChange} />}

      {/* OR group */}
      <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <FL>OR group:</FL>
        <input
          value={rule.group ?? ''}
          onChange={e => onChange({ group: e.target.value || null })}
          placeholder="empty = AND (standalone)"
          style={{ ...inputStyle, width: 160, fontSize: 12 }}
        />
        {rule.group && (
          <span style={{ fontSize: 10, color: groupColor, fontWeight: 600 }}>
            ● rules with this name are OR'd — only one needs to pass
          </span>
        )}
      </div>

      {result?.unenrichedWords?.length > 0 && (
        <div style={{ marginTop: 6, fontSize: 11, color: C.warning }}>
          ⚠ skipped (no L2 data): {result.unenrichedWords.join(', ')}
        </div>
      )}
    </div>
  )
}

// ── Main screen ──────────────────────────────────────────────────────────────

export default function GateConfigScreen({ initialDest, onBack }) {
  const { inventory }                         = useInventory()
  const { wordBank, identity, grammarPosition } = inventory
  const { lang }                              = identity

  const circuit       = evaluateMetaCircuit(lang)
  const cefrLevel     = circuit.level ?? identity.cefrLevel
  const currentCluster = circuit.cluster
  const activeAtoms   = circuit.activeAtoms

  // Build a circuit-aware inventory for evaluateGate — substitutes Meta Circuit position
  const circuitInventory = {
    ...inventory,
    grammarPosition: { ...grammarPosition, activeAtoms, currentCluster },
    identity:        { ...identity, cefrLevel },
  }

  const [selectedDest, setSelectedDest] = useState(initialDest ?? WORLD_SPHERE_DESTINATIONS[0].id)
  const [config,       setConfig]       = useState(() => loadGateConfig(selectedDest))
  const [selLevels,    setSelLevels]    = useState([])
  const [selClusters,  setSelClusters]  = useState([])
  const [selAtoms,     setSelAtoms]     = useState([])
  const [saved,        setSaved]        = useState(false)
  const [grantAll,     setGrantAll]     = useState(() => loadGateOverride())

  useEffect(() => { setConfig(loadGateConfig(selectedDest)); setSaved(false) }, [selectedDest])

  const wordDataMap = useMemo(
    () => buildWordDataMap(wordBank, lang),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wordBank.join(','), lang]
  )

  const gateResult = useMemo(
    () => evaluateGate(config, circuitInventory, wordDataMap),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config, circuitInventory.grammarPosition.activeAtoms.join(','), circuitInventory.identity.cefrLevel, circuitInventory.grammarPosition.currentCluster, wordDataMap]
  )

  const selectedCombos = useMemo(
    () => getSelectedCombos(selLevels, selClusters, selAtoms),
    [selLevels, selClusters, selAtoms]
  )

  const editingContexts = useMemo(() =>
    config.contexts.filter(ctx =>
      selectedCombos.some(c => ctx.level === c.level && ctx.cluster === c.cluster && ctx.atom === c.atom)
    ),
    [config.contexts, selectedCombos]
  )

  const editingRules = editingContexts.flatMap(ctx => ctx.rules ?? [])
  const showCtxBadge = editingContexts.length > 1

  // Context chip toggles
  function toggleLevel(lv) {
    if (lv === null) { setSelLevels([]); return }
    setSelLevels(p => p.includes(lv) ? p.filter(x => x !== lv) : [...p, lv])
  }
  function toggleCluster(c) {
    if (c === null) { setSelClusters([]); return }
    setSelClusters(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c])
  }
  function toggleAtom(a) {
    if (a === null) { setSelAtoms([]); return }
    setSelAtoms(p => p.includes(a) ? p.filter(x => x !== a) : [...p, a])
  }

  // Rule mutations
  function addRule(type) {
    const combos = getSelectedCombos(selLevels, selClusters, selAtoms)
    setConfig(prev => {
      let ctxs = [...prev.contexts]
      for (const combo of combos) {
        const idx = ctxs.findIndex(ctx =>
          ctx.level === combo.level && ctx.cluster === combo.cluster && ctx.atom === combo.atom
        )
        const newRule = makeRule(type)
        if (idx >= 0) {
          ctxs = ctxs.map((ctx, i) => i === idx ? { ...ctx, rules: [...(ctx.rules ?? []), newRule] } : ctx)
        } else {
          ctxs = [...ctxs, { id: makeId(), level: combo.level, cluster: combo.cluster, atom: combo.atom, rules: [newRule] }]
        }
      }
      return { ...prev, contexts: ctxs }
    })
    setSaved(false)
  }

  function updateRule(id, changes) {
    setConfig(prev => ({
      ...prev,
      contexts: prev.contexts.map(ctx => ({
        ...ctx,
        rules: (ctx.rules ?? []).map(r => r.id === id ? { ...r, ...changes } : r)
      }))
    }))
    setSaved(false)
  }

  function removeRule(id) {
    setConfig(prev => ({
      ...prev,
      contexts: prev.contexts.map(ctx => ({
        ...ctx,
        rules: (ctx.rules ?? []).filter(r => r.id !== id)
      }))
    }))
    setSaved(false)
  }

  function handleSave() {
    saveGateConfig(selectedDest, config)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleOverride(checked) {
    setGrantAll(checked)
    saveGateOverride(checked)
  }

  const groupColors = buildGroupColors(editingRules)

  const contextLabel = [
    selLevels.length   > 0 ? selLevels.join(', ')                : 'any level',
    selClusters.length > 0 ? selClusters.map(c => `C${c}`).join(', ') : (selLevels.length > 0 ? 'all clusters' : null),
    selAtoms.length    > 0 ? selAtoms.join(', ')                 : null,
  ].filter(Boolean).join(' · ')

  const configuredContexts = config.contexts.filter(c => (c.rules ?? []).length > 0)

  return (
    <div style={{ position: 'fixed', inset: 0, overflowY: 'auto', background: C.bg, color: C.primary, fontFamily: 'inherit', fontSize: 13, zIndex: 999 }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '16px 16px 40px' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <button onClick={onBack} style={{
            background: C.card, border: `1px solid ${C.border}`, color: C.secondary,
            borderRadius: 5, padding: '5px 12px', fontSize: 12, cursor: 'pointer',
          }}>← Back</button>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.primary, flex: 1 }}>Gate Config</span>
          {circuit.isSimulated && (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#6633cc', background: '#f3eeff', border: '1px solid #c4a8f0', borderRadius: 4, padding: '3px 10px' }}>
              SIMULATED
            </span>
          )}

          {/* Master override */}
          <label style={{
            display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer',
            background: grantAll ? C.overrideBg : C.card,
            border: `1.5px solid ${grantAll ? C.overrideBorder : C.border}`,
            borderRadius: 8, padding: '6px 12px',
          }}>
            <input type="checkbox" checked={grantAll} onChange={e => handleOverride(e.target.checked)} style={{ cursor: 'pointer', width: 14, height: 14 }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: grantAll ? C.override : C.muted }}>
              {grantAll ? '🔓 ALL OPEN' : 'Grant all access'}
            </span>
          </label>
        </div>

        {grantAll && (
          <div style={{ marginBottom: 14, padding: '8px 12px', background: C.overrideBg, border: `1px solid ${C.overrideBorder}`, borderRadius: 6, fontSize: 12, color: C.override, fontWeight: 600 }}>
            ⚠ All gates are currently open regardless of rules.
          </div>
        )}

        {/* ── Destination ── */}
        <SL style={{ marginBottom: 4 }}>Destination</SL>
        <select value={selectedDest} onChange={e => setSelectedDest(e.target.value)} style={{ ...inputStyle, width: '100%', marginBottom: 14 }}>
          {WORLD_SPHERE_DESTINATIONS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
        </select>

        {/* ── Gate status ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
          padding: '10px 14px', background: C.card, borderRadius: 8,
          border: `1.5px solid ${gateResult.open || grantAll ? C.successBorder : C.errorBorder}`,
        }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: gateResult.open || grantAll ? C.success : C.error }}>
            {gateResult.open || grantAll ? '✓ OPEN' : '✗ LOCKED'}
          </span>
          <span style={{ fontSize: 11, color: C.muted, flex: 1 }}>
            {grantAll ? 'override active' : gateResult.matchedContext
              ? `context: ${contextDescription(gateResult.matchedContext)}`
              : 'no matching context — using default'}
          </span>
          {!gateResult.open && !grantAll && gateResult.closestRule && (
            <span style={{ fontSize: 11, color: C.secondary }}>gap: {gateResult.closestRule.gap}</span>
          )}
        </div>

        {/* Unenriched warning */}
        {gateResult.unenrichedWords.length > 0 && (
          <div style={{ marginBottom: 12, padding: '7px 10px', background: C.warningBg, border: `1px solid ${C.warningBorder}`, borderRadius: 6, fontSize: 11, color: C.warning }}>
            ⚠ {gateResult.unenrichedWords.length} banked word(s) skipped — no L2 data: {gateResult.unenrichedWords.join(', ')}
          </div>
        )}

        {/* Default open */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 18, cursor: 'pointer', fontSize: 12, color: C.secondary }}>
          <input type="checkbox" checked={config.defaultOpen ?? false} onChange={e => { setConfig(p => ({ ...p, defaultOpen: e.target.checked })); setSaved(false) }} />
          Open by default when no context matches
        </label>

        {/* ── Context selector ── */}
        <Card style={{ marginBottom: 16 }}>
          <SL style={{ marginBottom: 12 }}>Applying rules to</SL>

          <RL>Level — select one or more, or leave on "Any"</RL>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
            <Chip active={selLevels.length === 0} onClick={() => setSelLevels([])}>Any</Chip>
            {CEFR_LEVELS.map(lv => (
              <Chip key={lv} active={selLevels.includes(lv)} dim={lv !== cefrLevel} onClick={() => toggleLevel(lv)}>
                {lv === cefrLevel ? <><strong>{lv}</strong> ←</> : lv}
              </Chip>
            ))}
          </div>

          {selLevels.length > 0 && <>
            <RL>Cluster within selected level(s)</RL>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
              <Chip active={selClusters.length === 0} onClick={() => setSelClusters([])}>All</Chip>
              {CLUSTER_IDS.map(c => (
                <Chip key={c} active={selClusters.includes(c)} dim={c !== currentCluster} onClick={() => toggleCluster(c)}>
                  {c === currentCluster ? <><strong>C{c}</strong> ←</> : `C${c}`}
                </Chip>
              ))}
            </div>
          </>}

          <RL>Atom condition</RL>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <Chip active={selAtoms.length === 0} onClick={() => setSelAtoms([])}>Any</Chip>
            {ATOMS.map(a => (
              <Chip key={a.id} active={selAtoms.includes(a.id)} dim={!activeAtoms.includes(a.id)} onClick={() => toggleAtom(a.id)}>
                {a.id}
              </Chip>
            ))}
          </div>

          <div style={{ marginTop: 10, fontSize: 11, color: C.muted }}>
            Your position: <strong>{cefrLevel}</strong> · <strong>C{currentCluster}</strong>
            {activeAtoms.length > 0 && <> · {activeAtoms.length} atom{activeAtoms.length !== 1 ? 's' : ''} active</>}
            {' '}— highlighted above with ←
          </div>

          {selectedCombos.length > 1 && (
            <div style={{ marginTop: 8, fontSize: 11, color: C.accent, fontWeight: 600 }}>
              Adding a rule will apply it to {selectedCombos.length} context combinations.
            </div>
          )}
        </Card>

        {/* ── Rules for selected context(s) ── */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
            <SL>Rules for:</SL>
            <span style={{ fontSize: 13, color: C.accent, fontWeight: 600 }}>{contextLabel}</span>
            {editingRules.length === 0 && <span style={{ fontSize: 11, color: C.muted }}>— no rules</span>}
          </div>

          {editingRules.length > 1 && (
            <div style={{ marginBottom: 12, padding: '7px 11px', background: C.accentBg, border: `1px solid ${C.accentBorder}`, borderRadius: 6, fontSize: 11, color: C.secondary }}>
              <strong>Logic:</strong> All rules must pass (AND). To OR two rules together, give them the same name in the <strong>OR group</strong> field — then only one of them needs to pass.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {editingContexts.map(ctx => {
              const ctxRules = ctx.rules ?? []
              if (ctxRules.length === 0) return null
              return (
                <div key={ctx.id}>
                  {showCtxBadge && (
                    <div style={{ fontSize: 10, color: C.muted, marginBottom: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                      {contextDescription(ctx)}
                    </div>
                  )}
                  {ctxRules.map((rule, i) => {
                    const result     = gateResult.rules.find(r => r.rule.id === rule.id)
                    const groupColor = rule.group ? (groupColors[rule.group] ?? GROUP_PALETTE[0]) : C.border
                    const prevRule   = ctxRules[i - 1]
                    const showOr     = prevRule?.group && prevRule.group === rule.group
                    return (
                      <div key={rule.id}>
                        {showOr && (
                          <div style={{ textAlign: 'center', fontSize: 11, color: groupColor, letterSpacing: '0.1em', margin: '2px 0', fontWeight: 700 }}>
                            — OR —
                          </div>
                        )}
                        <RuleCard
                          rule={rule} result={result} groupColor={groupColor} activeAtoms={activeAtoms}
                          onChange={ch => updateRule(rule.id, ch)} onDelete={() => removeRule(rule.id)}
                        />
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Add rule buttons ── */}
        <div style={{ marginBottom: 20 }}>
          <RL style={{ marginBottom: 8 }}>Add a rule</RL>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {RULE_TYPES.map(rt => (
              <button key={rt.id} onClick={() => addRule(rt.id)} style={{
                background: C.accentBg, border: `1px solid ${C.accentBorder}`, color: C.accent,
                borderRadius: 5, padding: '6px 14px', fontSize: 12, cursor: 'pointer', fontWeight: 600,
              }}>
                + {rt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── All configured contexts summary ── */}
        {configuredContexts.length > 0 && (
          <Card style={{ marginBottom: 16 }}>
            <SL style={{ marginBottom: 10 }}>All configured contexts</SL>
            {configuredContexts.map(ctx => (
              <div key={ctx.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: C.secondary, flex: 1 }}>{contextDescription(ctx)}</span>
                <span style={{ fontSize: 11, color: C.muted }}>{ctx.rules.length} rule{ctx.rules.length !== 1 ? 's' : ''}</span>
                <button onClick={() => {
                  setSelLevels(ctx.level ? [ctx.level] : [])
                  setSelClusters(ctx.cluster != null ? [ctx.cluster] : [])
                  setSelAtoms(ctx.atom ? [ctx.atom] : [])
                }} style={{ background: C.card, border: `1px solid ${C.border}`, color: C.accent, cursor: 'pointer', fontSize: 11, padding: '2px 9px', borderRadius: 4 }}>
                  edit
                </button>
              </div>
            ))}
          </Card>
        )}

        {/* ── Save ── */}
        <button onClick={handleSave} style={{
          width: '100%', padding: 12,
          background: saved ? C.successBg : C.card,
          border: `1.5px solid ${saved ? C.successBorder : C.border}`,
          color: saved ? C.success : C.secondary,
          borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 700,
        }}>
          {saved ? '✓ Saved' : 'Save gate config'}
        </button>

      </div>
    </div>
  )
}

// ── Shared tiny components ───────────────────────────────────────────────────

function Row({ children }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{children}</div>
}

function FL({ children, style }) {
  return <span style={{ fontSize: 11, color: C.secondary, ...style }}>{children}</span>
}

function RL({ children, style }) {
  return <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 5, ...style }}>{children}</div>
}

function SL({ children, style }) {
  return <div style={{ fontSize: 11, color: C.secondary, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, ...style }}>{children}</div>
}

function Card({ children, style }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 16px', ...style }}>
      {children}
    </div>
  )
}

function Chip({ active, onClick, dim, children }) {
  return (
    <button onClick={onClick} style={{
      background:   active ? C.accentBg : C.card,
      border:       `1.5px solid ${active ? C.accent : C.border}`,
      color:        active ? C.accent : dim ? '#c0c4d8' : C.secondary,
      borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontWeight: active ? 600 : 400,
    }}>
      {children}
    </button>
  )
}

function NumInput({ value, min = 1, onChange }) {
  return (
    <input type="number" value={value} min={min}
      onChange={e => onChange(parseInt(e.target.value) || min)}
      style={{ ...inputStyle, width: 56, textAlign: 'center' }}
    />
  )
}
