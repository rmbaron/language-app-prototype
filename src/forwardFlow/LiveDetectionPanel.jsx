// Live forward-flow detection panel.
//
// The "what does the parser see right now" surface that sits above the
// tab strip. Owns the typed-sentence input, the one-line summary, and the
// per-unit status accordion blocks.
//
// Status accordion `statusOpen` state is local to this panel — nothing
// else in the orchestrator reads it.

import { useState } from 'react'
import { T } from './theme'
import { SlotChip } from './primitives'
import { getStructure } from './structures.en.js'
import { getShapeFamily } from './shapeFamilies.en.js'
import { getCategory } from './categoryLookup'

// Token-level role styling for slot text in the live one-liner.
// Heads (nouns, pronouns, proper-noun-ish) get the strong text color;
// openers (det/quant) dim; adjectives italic; unknowns amber.
function styledTokens(text) {
  if (!text) return null
  const tokens = text.trim().split(/\s+/).filter(Boolean)
  return tokens.map((tok, i) => {
    const cat = getCategory(tok)
    const isHead     = cat === 'pronoun' || cat === 'pronoun_object' || cat === 'noun' || (cat && cat.startsWith('noun'))
    const isModifier = cat === 'adjective'
    const isOpener   = cat === 'determiner' || cat === 'quantifier'
    const isCoord    = cat === 'coordinator'
    const isUnknown  = cat == null
    const looksProper = !cat && /^[A-Z]/.test(tok.replace(/[^\w'-]/g, ''))
    return (
      <span key={i} style={{
        fontFamily: 'monospace',
        fontWeight: isHead || looksProper ? 700 : 400,
        fontStyle: isModifier ? 'italic' : 'normal',
        color: isHead || looksProper ? T.text
              : isUnknown            ? T.amber
              : isOpener || isCoord  ? T.textDim
              : T.textSub,
      }}>{tok}{i < tokens.length - 1 ? ' ' : ''}</span>
    )
  })
}
import { EXCEPTION_LANE_LABELS } from './units/exceptions/dispatch'
import { SubjectStatusBlock }    from './units/subject/StatusBlock'
import { VerbStatusBlock }       from './units/verb/StatusBlock'
import { ObjectStatusBlock }     from './units/object/StatusBlock'
import { ComplementStatusBlock } from './units/complement/StatusBlock'
import { AdverbialStatusBlock }  from './units/adverbial/StatusBlock'
import { ExceptionStatusBlock }  from './units/exceptions/StatusBlock'

export function LiveDetectionPanel({ typedSentence, setTypedSentence, parsed }) {
  const [statusOpen, setStatusOpen] = useState({})
  const toggleStatus = (id) => setStatusOpen(curr => ({ ...curr, [id]: !curr[id] }))

  const {
    lane, exceptionType, matchedVerb, matchedVerbForm, subjectText,
    subjectShape, nounNumber, articleWarning,
    subjectFeatures, expectedAgreement, agreementCheck,
    auxChain, auxConfiguration,
    objectAnalysis, complementAnalysis, adverbialAnalysis,
  } = parsed

  const subjectStruct      = subjectShape ? getStructure(subjectShape) : null
  const subjectFamilyLabel = subjectStruct?.family ? getShapeFamily(subjectStruct.family)?.label : null

  return (
    <div style={{
      background: '#fff', border: `1px solid ${T.border}`, borderRadius: 6,
      padding: '12px 14px', marginBottom: 24,
    }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: T.label, textTransform: 'uppercase', marginBottom: 8 }}>
        Live forward-flow detection
      </div>
      <input type="text" value={typedSentence} onChange={e => setTypedSentence(e.target.value)}
        placeholder="Type a sentence — e.g. 'I gave him a book' or 'Did you eat?'"
        style={{
          width: '100%', padding: '8px 12px', fontSize: 15, color: T.text,
          border: `1px solid ${T.border}`, borderRadius: 4, background: T.page,
          boxSizing: 'border-box', fontFamily: 'system-ui, sans-serif',
        }} />

      {/* Tiered status panel — one-line summary always visible; per-unit
          sections below expand on click. */}
      <div style={{ marginTop: 10, fontSize: 12, color: T.textSub }}>

        {/* ── One-line summary ── */}
        {lane === 'empty' && (
          <div style={{ fontStyle: 'italic', color: T.textDim }}>waiting for input</div>
        )}
        {lane === 'fundamental' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              padding: '2px 8px', background: T.greenBg, border: `1px solid ${T.greenBord}`, borderRadius: 4,
              fontSize: 11, fontWeight: 700, color: T.green, letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>fundamental</span>
            {subjectText && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <SlotChip shortLabel="S" />
                <span>{styledTokens(subjectText)}</span>
                {subjectShape && (
                  <span style={{ color: T.textDim }}>
                    ({subjectFamilyLabel ? `${subjectFamilyLabel} → ` : ''}{subjectStruct?.label ?? subjectShape}
                    {subjectFeatures && `, ${subjectFeatures.person} ${subjectFeatures.number}`})
                  </span>
                )}
              </span>
            )}
            {matchedVerb && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <SlotChip shortLabel="V" />
                <span style={{
                  padding: '1px 6px', background: T.amberBg, border: `1px solid ${T.amberBord}`, borderRadius: 3,
                  fontSize: 11, fontWeight: 700, fontFamily: 'monospace', color: T.amber,
                }}>{matchedVerb.baseForm}</span>
              </span>
            )}
            {!matchedVerb && subjectText && (
              <span style={{ color: T.textDim, fontStyle: 'italic' }}>looking for a known verb…</span>
            )}
          </div>
        )}
        {lane === 'exception' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              padding: '2px 8px', background: T.violetBg, border: `1px solid ${T.violetBord}`, borderRadius: 4,
              fontSize: 11, fontWeight: 700, color: T.violet, letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>exception</span>
            <span style={{ color: T.violet, fontWeight: 700 }}>{EXCEPTION_LANE_LABELS[exceptionType] ?? exceptionType}</span>
            {matchedVerb && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <SlotChip shortLabel="V" />
                <span style={{
                  padding: '1px 6px', background: T.amberBg, border: `1px solid ${T.amberBord}`, borderRadius: 3,
                  fontSize: 11, fontWeight: 700, fontFamily: 'monospace', color: T.amber,
                }}>{matchedVerb.baseForm}</span>
              </span>
            )}
          </div>
        )}

        {/* ── Per-unit detail sections (default-collapsed; click to expand) ── */}

        <SubjectStatusBlock
          lane={lane}
          subjectText={subjectText} subjectShape={subjectShape}
          nounNumber={nounNumber} articleWarning={articleWarning}
          subjectFeatures={subjectFeatures}
          statusOpen={statusOpen} toggleStatus={toggleStatus} />

        <VerbStatusBlock
          lane={lane} exceptionType={exceptionType}
          matchedVerb={matchedVerb} matchedVerbForm={matchedVerbForm}
          auxChain={auxChain} auxConfiguration={auxConfiguration}
          expectedAgreement={expectedAgreement}
          agreementCheck={agreementCheck}
          statusOpen={statusOpen} toggleStatus={toggleStatus} />

        <ObjectStatusBlock
          lane={lane} objectAnalysis={objectAnalysis}
          statusOpen={statusOpen} toggleStatus={toggleStatus} />

        <ComplementStatusBlock
          lane={lane} complementAnalysis={complementAnalysis}
          statusOpen={statusOpen} toggleStatus={toggleStatus} />

        <AdverbialStatusBlock
          lane={lane} adverbialAnalysis={adverbialAnalysis}
          statusOpen={statusOpen} toggleStatus={toggleStatus} />

        <ExceptionStatusBlock
          lane={lane} exceptionType={exceptionType}
          statusOpen={statusOpen} toggleStatus={toggleStatus} />
      </div>

      <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px dashed ${T.border}`, fontSize: 10, color: T.textDim, fontStyle: 'italic' }}>
        Detection covers base forms + inflected surface forms via formsMap (irregulars seeded from the morphology table; regulars resolve once their base is in the word registry).
      </div>
    </div>
  )
}
