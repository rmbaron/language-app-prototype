// Forward Flow — Verb · Aux Chain sub-block.
// Shows the auxiliary cluster between Subject and the lexical Verb,
// including which configuration the cluster is in (Bare / Modal-led /
// Perfect-led / Progressive-led / Passive-led / Do-support).

import { T } from '../../../theme'
import { StatusAccordionSection } from '../../../primitives'
import { getAuxConfiguration } from '../auxConfigurationsIndex'
import { BE_LED_AMBIGUOUS } from '../auxConfigurations.en.js'
import { isInvertedExceptionType } from '../auxChain'

function configurationLabel(id) {
  if (id === BE_LED_AMBIGUOUS) return 'BE-led (Progressive or Passive)'
  return getAuxConfiguration(id, 'en')?.label ?? null
}

export function AuxChainStatus({ auxChain, auxConfiguration, exceptionType, statusOpen, toggleStatus }) {
  if (!auxChain || auxChain.length === 0) return null
  const configLabel = configurationLabel(auxConfiguration)
  const inverted = isInvertedExceptionType(exceptionType)
  // Forward projection: what form is expected next, derived from the last
  // chain position. Only the chain's tail projection matters at the boundary
  // — intermediate projections are catalog-level facts, not status signals.
  const lastSlot = auxChain[auxChain.length - 1]?.slot
  const projects = lastSlot?.projects ?? null
  return (
    <StatusAccordionSection title="Auxiliary chain"
      accent={T.violet}
      preview={
        (configLabel ? `${configLabel} · ` : '') +
        `${auxChain.map(({ token }) => token).join(' ')}` +
        (inverted ? ' · fronted' : '')
      }
      open={!!statusOpen.chain} onToggle={() => toggleStatus('chain')}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* One row per chain element. Token + small slot tag. The first
            element gets the operator badge (and inversion tag when applicable);
            slot tags on later elements are visually subordinate. */}
        {auxChain.map(({ token, slot }, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap', fontSize: 11 }}>
            <span style={{ padding: '1px 8px', background: T.violetBg, border: `1px solid ${T.violetBord}`, borderRadius: 3, fontFamily: 'monospace', fontWeight: 700, color: T.violet }}>{token}</span>
            {slot
              ? <span style={{ fontSize: 10, color: T.textSub, fontStyle: 'italic' }}>{slot.label.toLowerCase()}</span>
              : <span style={{ fontSize: 10, color: T.textDim, fontStyle: 'italic' }}>unrecognized</span>}
            {i === 0 && (
              <span title="First element of the cluster — bears the NICE properties (Negation, Inversion, Code, Emphasis)."
                style={{ padding: '1px 5px', background: '#fff', border: `1px solid ${T.violet}`, borderRadius: 3, fontSize: 8, fontWeight: 700, color: T.violet, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                operator
              </span>
            )}
            {i === 0 && inverted && (
              <span title="Operator is fronted before the Subject — Inversion NICE property in effect."
                style={{ padding: '1px 5px', background: T.violet, borderRadius: 3, fontSize: 8, fontWeight: 700, color: '#fff', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                inversion
              </span>
            )}
          </div>
        ))}
        {/* One projection line — what form the lexical verb is expected to
            take, derived from the rightmost chain position. */}
        {projects && (
          <div style={{ marginTop: 2, fontSize: 11, color: T.textSub }}>
            → next: <span style={{ fontFamily: 'monospace', color: T.text }}>{projects}</span>
          </div>
        )}
      </div>
    </StatusAccordionSection>
  )
}
