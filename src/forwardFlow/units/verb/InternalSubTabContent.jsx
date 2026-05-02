// Forward Flow — Verb Internal Structure sub-tab content.
// The 5 sequenced positions (Modal → Perfect → Progressive → Passive →
// Lexical) plus 2 non-position entries (Negation, Do-support). Highlights
// the chain positions the live parser currently matches.

import { T } from '../../theme'
import { Section } from '../../primitives'
import { getVerbInternalChain } from './internalChainIndex'
import { VerbChainCard } from './ChainCard'

const VERB_CHAIN = getVerbInternalChain('en')

export function InternalSubTabContent({
  matchedChainIds,
  expanded, setExpanded, toggle,
  search, setSearch,
}) {
  return (
    <>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: T.green, textTransform: 'uppercase', marginBottom: 8 }}>
        Core group · sequenced catalog (V&apos;s internal structure)
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <Section>Verb Internal Structure ({VERB_CHAIN.filter(e => e.kind === 'chain_position').length}) — sequenced positions inside V</Section>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setExpanded(curr => ({ ...curr, ...Object.fromEntries(VERB_CHAIN.map(e => [`vchain-${e.id}`, true])) }))}
            style={{ padding: '3px 8px', fontSize: 11, border: `1px solid ${T.border}`, borderRadius: 4, background: '#fff', color: T.textDim, cursor: 'pointer' }}>
            expand all
          </button>
          <button onClick={() => setExpanded(curr => { const n = { ...curr }; for (const e of VERB_CHAIN) delete n[`vchain-${e.id}`]; return n })}
            style={{ padding: '3px 8px', fontSize: 11, border: `1px solid ${T.border}`, borderRadius: 4, background: '#fff', color: T.textDim, cursor: 'pointer' }}>
            collapse all
          </button>
        </div>
      </div>
      <div style={{ fontSize: 12, color: T.textDim, marginBottom: 14, lineHeight: 1.6, fontStyle: 'italic' }}>
        The 5 canonical positions inside the verb cluster, in fixed order: Modal → Perfect → Progressive → Passive → Lexical. <b>Sequenced catalog</b> — multiple positions can fire at once and they appear in this order on the surface (e.g. <i>&quot;might have been running&quot;</i> fills 4 of 5). Plus 2 non-position entries: Negation (decoration on the chain) and Do-support (mechanism).
      </div>
      <input type="text" placeholder="search positions or words…" value={search} onChange={e => setSearch(e.target.value)}
        style={{ width: '100%', padding: '6px 10px', fontSize: 12, border: `1px solid ${T.border}`, borderRadius: 4, marginBottom: 10, boxSizing: 'border-box' }} />
      <div>
        {VERB_CHAIN.filter(e => {
          const q = search.toLowerCase().trim()
          if (!q) return true
          if (e.label.toLowerCase().includes(q) || e.id.toLowerCase().includes(q)) return true
          return (e.words ?? []).some(w => w.toLowerCase().includes(q))
        }).map(entry => {
          const isMatch = matchedChainIds.has(entry.id)
          return (
            <div key={entry.id}
              style={{
                outline: isMatch ? `3px solid ${T.violetBord}` : 'none',
                outlineOffset: '3px',
                borderRadius: 6,
                transition: 'outline 200ms',
              }}>
              <VerbChainCard entry={entry}
                expanded={!!expanded[`vchain-${entry.id}`]}
                onToggle={() => toggle(`vchain-${entry.id}`)} />
            </div>
          )
        })}
      </div>
    </>
  )
}
