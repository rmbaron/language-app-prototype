// Verb SubTabContent — internal 3-view nav under Slots → Verb.
//
// V is compositional, not catalog-based. The three internal views map onto
// different angles on the same underlying object:
//   Frame Library      — verb argument structures (slot signatures)
//   Verb Internal      — sequenced positions (Modal/Perf/Prog/Pass/Lex)
//   Aux Configurations — the 6 named cluster shapes
//
// `verbView` state is local — switching away from V and back resets to the
// first view, which is fine UX for a dev surface.

import { useState } from 'react'
import { T } from '../../theme'
import { FRAME_LIBRARY } from './frameLibrary'
import { getVerbInternalChain } from './internalChainIndex'
import { getAuxConfigurations } from './auxConfigurationsIndex'
import { FrameSubTabContent }     from './FrameSubTabContent'
import { InternalSubTabContent }  from './InternalSubTabContent'
import { ConfigurationsSubTabContent } from './ConfigurationsSubTabContent'

const VERB_CHAIN         = getVerbInternalChain('en')
const AUX_CONFIGURATIONS = getAuxConfigurations('en')

const VIEWS = [
  { id: 'frames',   label: 'Frame Library',      count: FRAME_LIBRARY.length },
  { id: 'internal', label: 'Verb Internal',      count: VERB_CHAIN.filter(e => e.kind === 'chain_position').length },
  { id: 'configs',  label: 'Aux Configurations', count: AUX_CONFIGURATIONS.length },
]

export function VerbSubTabContent({
  matchedVerb, matchedChainIds, auxConfiguration,
  expanded, setExpanded, toggle,
  frameSearch,  setFrameSearch,
  vchainSearch, setVchainSearch,
  configSearch, setConfigSearch,
}) {
  const [view, setView] = useState('frames')

  return (
    <>
      <div style={{ display: 'flex', gap: 0, marginBottom: 14, borderBottom: `1px solid ${T.border}` }}>
        {VIEWS.map(v => {
          const isActive = view === v.id
          return (
            <button key={v.id} onClick={() => setView(v.id)}
              style={{
                padding: '6px 12px', fontSize: 11, fontWeight: 600,
                border: 'none', background: 'transparent',
                borderBottom: isActive ? `2px solid ${T.amber}` : '2px solid transparent',
                marginBottom: -1,
                color: isActive ? T.amber : T.textDim,
                cursor: 'pointer',
              }}>
              {v.label}
              {v.count != null && <span style={{ color: T.textDim, marginLeft: 4, fontWeight: 400 }}>({v.count})</span>}
            </button>
          )
        })}
      </div>
      {view === 'frames' && (
        <FrameSubTabContent
          matchedVerb={matchedVerb}
          expanded={expanded} setExpanded={setExpanded} toggle={toggle}
          search={frameSearch} setSearch={setFrameSearch} />
      )}
      {view === 'internal' && (
        <InternalSubTabContent
          matchedChainIds={matchedChainIds}
          expanded={expanded} setExpanded={setExpanded} toggle={toggle}
          search={vchainSearch} setSearch={setVchainSearch} />
      )}
      {view === 'configs' && (
        <ConfigurationsSubTabContent
          auxConfiguration={auxConfiguration}
          expanded={expanded} setExpanded={setExpanded} toggle={toggle}
          search={configSearch} setSearch={setConfigSearch} />
      )}
    </>
  )
}
