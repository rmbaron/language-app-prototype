import { useInventory } from './InventoryContext'
import { getStrings } from './uiStrings'
import { WORLD_SPHERE_DESTINATIONS } from './worldSphereConfig'
import { loadGateConfig, buildWordDataMap, evaluateGate } from './gateConfig'

function gateHint(gr, s) {
  if (!gr.rules || gr.rules.length === 0) return s.worldSphere.gateNoRules
  const failing = gr.rules.filter(r => !r.passed)
  if (failing.length === 0) return s.worldSphere.gateOpen
  const r = gr.closestRule
    ? failing.find(f => f.rule.id === gr.closestRule.ruleId) ?? failing[0]
    : failing[0]
  if (r.rule.type === 'minWordCount')  return `${r.have} / ${r.need} words`
  if (r.rule.type === 'minCluster')    return `cluster ${r.have} / ${r.need}`
  if (r.rule.type === 'requiredAtoms') return `${r.have} / ${r.need} atoms`
  if (r.rule.type === 'keyFilter')     return `${r.have} / ${r.need} matching`
  return s.worldSphere.gateLocked
}

export default function WorldSphere({ onBack, onNavigate, onConfigureGate }) {
  const { inventory } = useInventory()
  const s = getStrings(inventory.identity.interfaceLang)
  const { wordBank, identity } = inventory
  const { lang } = identity

  const wordDataMap  = buildWordDataMap(wordBank, lang)
  const gateResults  = Object.fromEntries(
    WORLD_SPHERE_DESTINATIONS.map(dest => [
      dest.id,
      evaluateGate(loadGateConfig(dest.id), inventory, wordDataMap),
    ])
  )

  return (
    <div className="world-sphere">
      <button className="profile-back" onClick={onBack}>← Back</button>

      <div className="world-sphere-header">
        <h1 className="world-sphere-title">{s.worldSphere.title}</h1>
      </div>

      <div className="world-sphere-grid">
        {WORLD_SPHERE_DESTINATIONS.map(dest => {
          const gr   = gateResults[dest.id]
          const open = gr.open

          return (
            <div key={dest.id} className="world-sphere-tile">
              <button
                className={`world-sphere-btn${!open ? ' world-sphere-btn--locked' : ''}`}
                onClick={() => open && onNavigate(dest.id)}
                disabled={!open}
              >
                <span className="world-sphere-btn-label">{dest.label}</span>
                {dest.description && (
                  <span className="world-sphere-btn-description">{dest.description}</span>
                )}
                <span className={`world-sphere-btn-gate${open ? ' world-sphere-btn-gate--open' : ''}`}>
                  {open ? s.worldSphere.gateOpen : gateHint(gr, s)}
                </span>
              </button>
              <button className="world-sphere-configure-btn" onClick={() => onConfigureGate(dest.id)}>
                {s.worldSphere.configureGate}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
