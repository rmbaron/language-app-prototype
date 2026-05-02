// Forward Flow — Verb live-status accordion sections.
// Two sub-blocks combined: the auxiliary chain (when chain elements are
// present) and the expected agreement signal (fundamental lane only).

import { T } from '../../theme'
import { StatusAccordionSection } from '../../primitives'

export function VerbStatusBlock({
  lane, auxChain, expectedAgreement,
  statusOpen, toggleStatus,
}) {
  return (
    <>
      {auxChain.length > 0 && (
        <StatusAccordionSection title="Auxiliary chain"
          accent={T.violet}
          preview={`${auxChain.length} element${auxChain.length === 1 ? '' : 's'} between Subject and Verb: ${auxChain.map(({ token }) => token).join(' ')}`}
          open={!!statusOpen.chain} onToggle={() => toggleStatus('chain')}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {auxChain.map(({ token, slot }, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', fontSize: 11 }}>
                <span style={{ padding: '1px 8px', background: T.violetBg, border: `1px solid ${T.violetBord}`, borderRadius: 3, fontFamily: 'monospace', fontWeight: 700, color: T.violet }}>{token}</span>
                {slot ? (<>
                  <span style={{ padding: '1px 6px', background: '#fff', border: `1px solid ${T.violetBord}`, borderRadius: 3, fontSize: 10, fontWeight: 700, color: T.violet, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{slot.label}</span>
                  {slot.projects && (
                    <span style={{ color: T.textSub }}>→ projects:&nbsp;<span style={{ fontFamily: 'monospace', color: T.text }}>{slot.projects}</span></span>
                  )}
                </>) : <span style={{ color: T.textDim, fontStyle: 'italic' }}>unrecognized</span>}
              </div>
            ))}
            <div style={{ marginTop: 4, fontSize: 10, color: T.textDim, fontStyle: 'italic', lineHeight: 1.5 }}>
              Canonical order: Modal → Perfect → Progressive → Passive → Lexical. Agreement bears on the first element.
            </div>
          </div>
        </StatusAccordionSection>
      )}

      {lane === 'fundamental' && expectedAgreement && (
        <StatusAccordionSection title="Verb expected"
          accent={T.green}
          preview={`${expectedAgreement.pattern} (${expectedAgreement.label})`}
          open={!!statusOpen.agreement} onToggle={() => toggleStatus('agreement')}>
          <div>
            <div style={{ fontSize: 12, color: T.green, fontWeight: 700, marginBottom: 4 }}>
              {expectedAgreement.pattern} <span style={{ fontWeight: 400, fontStyle: 'italic' }}>· {expectedAgreement.label}</span>
            </div>
            <div style={{ fontSize: 11, color: T.textSub, lineHeight: 1.5, marginBottom: 6 }}>
              {expectedAgreement.hint}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {expectedAgreement.examples.map((ex, i) => (
                <span key={i} style={{ padding: '1px 6px', background: '#fff', border: `1px solid ${T.greenBord}`, borderRadius: 3, fontSize: 10, color: T.green, fontFamily: 'monospace' }}>{ex}</span>
              ))}
            </div>
          </div>
        </StatusAccordionSection>
      )}
    </>
  )
}
