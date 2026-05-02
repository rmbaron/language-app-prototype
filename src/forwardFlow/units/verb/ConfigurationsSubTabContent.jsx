// Forward Flow — Verb · Aux Cluster Configurations sub-tab content.
// Renders the 6 named configurations (Bare / Modal-led / Perfect-led /
// Progressive-led / Passive-led / Do-support). Highlights the configuration
// the live parser is currently in.

import { T, matchesSearch } from '../../theme'
import { Section } from '../../primitives'
import { getAuxConfigurations } from './auxConfigurationsIndex'
import { BE_LED_AMBIGUOUS } from './auxConfigurations.en.js'

const AUX_CONFIGURATIONS = getAuxConfigurations('en')

export function ConfigurationsSubTabContent({
  auxConfiguration,
  expanded, setExpanded, toggle,
  search, setSearch,
}) {
  const filtered = AUX_CONFIGURATIONS.filter(c =>
    matchesSearch(c, search, ['label', 'description', 'pattern'])
  )

  // BE-led-ambiguous lights up BOTH Progressive-led and Passive-led.
  const matchedIds = new Set()
  if (auxConfiguration === BE_LED_AMBIGUOUS) {
    matchedIds.add('progressive_led')
    matchedIds.add('passive_led')
  } else if (auxConfiguration) {
    matchedIds.add(auxConfiguration)
  }

  return (
    <>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: T.violet, textTransform: 'uppercase', marginBottom: 8 }}>
        Verb cluster · 6 named configurations
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <Section>Aux Configurations ({AUX_CONFIGURATIONS.length}) — what kind of cluster the chain is in</Section>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setExpanded(curr => ({ ...curr, ...Object.fromEntries(AUX_CONFIGURATIONS.map(c => [`cfg-${c.id}`, true])) }))}
            style={{ padding: '3px 8px', fontSize: 11, border: `1px solid ${T.border}`, borderRadius: 4, background: '#fff', color: T.textDim, cursor: 'pointer' }}>
            expand all
          </button>
          <button onClick={() => setExpanded(curr => { const n = { ...curr }; for (const c of AUX_CONFIGURATIONS) delete n[`cfg-${c.id}`]; return n })}
            style={{ padding: '3px 8px', fontSize: 11, border: `1px solid ${T.border}`, borderRadius: 4, background: '#fff', color: T.textDim, cursor: 'pointer' }}>
            collapse all
          </button>
        </div>
      </div>
      <div style={{ fontSize: 12, color: T.textDim, marginBottom: 14, lineHeight: 1.6, fontStyle: 'italic' }}>
        The Verb's equivalent of Subject's shape families. Compositional from the chain positions (M + Perf + Prog + Pass + V plus do-support); what's named here is the leading-aux pattern. Progressive-led and Passive-led share BE forms — disambiguated by the lexical verb's form.
      </div>
      <input type="text" placeholder="search configurations…" value={search} onChange={e => setSearch(e.target.value)}
        style={{ width: '100%', padding: '6px 10px', fontSize: 12, border: `1px solid ${T.border}`, borderRadius: 4, marginBottom: 10, boxSizing: 'border-box' }} />

      {auxConfiguration === BE_LED_AMBIGUOUS && (
        <div style={{
          padding: '6px 10px', marginBottom: 10,
          background: T.amberBg, border: `1px solid ${T.amberBord}`, borderRadius: 4,
          fontSize: 11, color: T.amber, lineHeight: 1.5,
        }}>
          <span style={{ fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: 9, marginRight: 6 }}>
            BE-led ambiguous
          </span>
          Progressive vs Passive can't be resolved yet. Both are highlighted; the lexical verb's form ({'-ing'} → Progressive; past participle → Passive) will resolve it.
        </div>
      )}

      <div>
        {filtered.map(cfg => {
          const isMatch = matchedIds.has(cfg.id)
          const isOpen = !!expanded[`cfg-${cfg.id}`]
          return (
            <div key={cfg.id}
              style={{
                outline: isMatch ? `3px solid ${T.violetBord}` : 'none',
                outlineOffset: '3px',
                borderRadius: 6,
                transition: 'outline 200ms',
                marginBottom: 6,
              }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: isOpen ? '12px 14px' : '8px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                  <span style={{
                    padding: '3px 9px', background: T.violetBg, border: `1px solid ${T.violetBord}`, borderRadius: 4,
                    fontSize: 12, fontWeight: 700, color: T.violet, fontFamily: 'monospace',
                  }}>V</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{cfg.label}</div>
                    <div style={{ fontSize: 11, color: T.textDim, fontFamily: 'monospace', marginTop: 1 }}>{cfg.pattern}</div>
                  </div>
                  <button onClick={() => toggle(`cfg-${cfg.id}`)}
                    style={{ padding: '3px 9px', background: '#fff', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 11, color: T.textDim, cursor: 'pointer' }}>
                    {isOpen ? '▴ less' : '▾ more'}
                  </button>
                </div>

                {isOpen && (<>
                  <div style={{ fontSize: 12, color: T.textSub, lineHeight: 1.55, marginTop: 6, marginBottom: 6 }}>
                    {cfg.description}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {cfg.examples.map((ex, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', fontSize: 12 }}>
                        <span style={{ color: T.text, fontStyle: 'italic' }}>"{ex.sentence}"</span>
                        <span style={{ color: T.violet, fontWeight: 600, fontFamily: 'monospace' }}>→ {ex.highlight}</span>
                      </div>
                    ))}
                  </div>
                </>)}
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', fontSize: 12, color: T.textDim, fontStyle: 'italic' }}>
            no configurations match the search
          </div>
        )}
      </div>
    </>
  )
}
