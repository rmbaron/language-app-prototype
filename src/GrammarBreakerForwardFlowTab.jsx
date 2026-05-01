// Grammar Breaker — Forward Flow tab.
//
// Top-down visualization of the macro layer. Where the Flow tab is
// retrospective (atoms → patterns → couplings → composites, after a
// sentence is parsed), Forward Flow is prospective — as a sentence is
// built, what's committed, what's expected next, what hypotheses are
// still in play.
//
// This file is the orchestrator. The pieces it composes live in src/forwardFlow/:
//   theme.js            — color constants + slot color map + matchesSearch
//   primitives.jsx      — Section, SlotChip, SlotSignature, StatusAccordionSection, FuturePhasePlaceholder
//   dispatch.js         — left-edge lane classification + auxiliary chain
//   frameLibrary.js     — verb-frame inversion (verb-first → frame-first)
//   useParsedSentence.js — typed-sentence → macro-layer parse
//   SlotRoleCard.jsx, FrameCard.jsx, SubjectShapeCard.jsx,
//   ExceptionShapeCard.jsx, VerbChainCard.jsx — per-catalog cards
//
// Source of truth for the macro-layer architecture: notes/macro-layer-sketch.md

import { useState } from 'react'
import { getSlotRoles } from './slotRoles'
import { getSubjectShapes, getSubjectShape } from './forwardFlow/units/subject/shapesIndex'
import { getExceptionShapes } from './forwardFlow/units/exceptions/shapesIndex'
import { getVerbInternalChain } from './forwardFlow/units/verb/internalChainIndex'
import { FORWARD_FLOW_FINDINGS } from './forwardFlowFindings.en.js'

import { T, SLOT_COLORS, matchesSearch } from './forwardFlow/theme'
import { Section, SlotChip, StatusAccordionSection, FuturePhasePlaceholder } from './forwardFlow/primitives'
import { EXCEPTION_LANE_LABELS, EXCEPTION_LANE_NOTES } from './forwardFlow/units/exceptions/dispatch'
import { FRAME_LIBRARY } from './forwardFlow/units/verb/frameLibrary'
import { SlotRoleCard } from './forwardFlow/SlotRoleCard'
import { FrameCard } from './forwardFlow/units/verb/FrameCard'
import { SubjectShapeCard } from './forwardFlow/units/subject/ShapeCard'
import { ExceptionShapeCard } from './forwardFlow/units/exceptions/ShapeCard'
import { VerbChainCard } from './forwardFlow/units/verb/ChainCard'
import { useParsedSentence } from './forwardFlow/useParsedSentence'

const SLOT_ROLES = getSlotRoles('en')
const SUBJECT_SHAPES = getSubjectShapes('en')
const EXCEPTION_SHAPES = getExceptionShapes('en')
const VERB_CHAIN = getVerbInternalChain('en')

export default function GrammarBreakerForwardFlowTab() {
  const [expanded, setExpanded] = useState({})
  const [typedSentence, setTypedSentence] = useState('')
  const [subTab, setSubTab] = useState('roles')

  // Per-catalog search queries. Each catalog has its own search box at top.
  const [subjectSearch,   setSubjectSearch]   = useState('')
  const [frameSearch,     setFrameSearch]     = useState('')
  const [vchainSearch,    setVchainSearch]    = useState('')
  const [exceptionSearch, setExceptionSearch] = useState('')
  const [findingsSearch,  setFindingsSearch]  = useState('')

  // Hierarchical grouping. Skeleton wired to Findings; pattern extends as
  // catalogs scale.
  const [findingsGroupBy, setFindingsGroupBy] = useState('status') // 'status' | 'priority' | 'none'

  // Tiered live status — which accordion sections are open
  const [statusOpen, setStatusOpen] = useState({})
  const toggleStatus = (id) => setStatusOpen(curr => ({ ...curr, [id]: !curr[id] }))

  // Live parse of the typed sentence — feeds the status panel and the
  // catalog highlights.
  const {
    lane, exceptionType, matchedVerb, subjectText,
    subjectShape, nounNumber, articleWarning,
    subjectFeatures, expectedAgreement, auxChain, matchedChainIds,
    activeRoles,
  } = useParsedSentence(typedSentence)

  function toggle(id) {
    setExpanded(curr => ({ ...curr, [id]: !curr[id] }))
  }
  function expandAllRoles() {
    setExpanded(curr => ({ ...curr, ...Object.fromEntries(SLOT_ROLES.map(r => [r.id, true])) }))
  }
  function collapseAllRoles() {
    setExpanded(curr => {
      const next = { ...curr }
      for (const r of SLOT_ROLES) delete next[r.id]
      return next
    })
  }

  // Sub-tab definitions. The live detection panel sits above these and
  // stays visible regardless of which sub-tab is active.
  const SUB_TABS = [
    { id: 'roles',     label: 'Slot Roles',          group: 'shared',    count: SLOT_ROLES.length },
    { id: 'subjects',  label: 'Subject Shapes',      group: 'core',      count: SUBJECT_SHAPES.length },
    { id: 'frames',    label: 'Frame Library',       group: 'core',      count: FRAME_LIBRARY.length },
    { id: 'vchain',    label: 'Verb Internal',       group: 'core',      count: VERB_CHAIN.filter(e => e.kind === 'chain_position').length },
    { id: 'exceptions',label: 'Exception Shapes',    group: 'exception', count: EXCEPTION_SHAPES.length },
    { id: 'findings',  label: 'Findings',            group: 'shared',    count: FORWARD_FLOW_FINDINGS.filter(f => f.status === 'open').length },
    { id: 'future',    label: 'Future phases',       group: 'shared',    count: 4 },
  ]

  return (
    <div>
      {/* Header / explanation */}
      <div style={{
        background: T.card, border: `1px solid ${T.border}`, borderRadius: 6,
        padding: '14px 16px', marginBottom: 16, fontSize: 12, color: T.textSub, lineHeight: 1.65,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 6 }}>
          Forward Flow — top-down view of the macro layer
        </div>
        Where the <b>Flow</b> tab is retrospective (after a sentence is parsed, what fired), Forward Flow is prospective — as a sentence is built, what's committed, what's expected next, what hypotheses are still in play. The architecture is a forward-flowing pipeline; this tab is its dev surface.
        <br /><br />
        Design principle: <b>forward momentum</b>. A macro shape is the right primitive only if it can be detected from what's already been typed (left-to-right), constrains what can come next, and composes naturally with the next shape. See <code style={{ background: '#fff', padding: '1px 5px', borderRadius: 3 }}>notes/macro-layer-sketch.md</code> for the full architecture.
      </div>

      {/* Live forward-flow detection — phase 3a. */}
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

        {/* Tiered status panel — one-line summary always visible; click sections
            below to expand each detail group. */}
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
                  <span style={{ fontFamily: 'monospace', color: T.text, fontWeight: 700 }}>{subjectText}</span>
                  {subjectShape && (
                    <span style={{ color: T.textDim }}>
                      ({getSubjectShape(subjectShape, 'en')?.label ?? subjectShape}
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

          {/* ── Detail sections (default-collapsed; click to expand) ── */}

          {/* Subject details — fundamental lane only */}
          {lane === 'fundamental' && subjectText && (
            <StatusAccordionSection title="Subject"
              accent={T.blue}
              preview={
                subjectShape
                  ? `${getSubjectShape(subjectShape, 'en')?.label ?? subjectShape}` +
                    (nounNumber !== 'unknown' ? ` (${nounNumber})` : '') +
                    (articleWarning ? ' · a/an warning' : '')
                  : 'shape not yet recognized'
              }
              open={!!statusOpen.subject} onToggle={() => toggleStatus('subject')}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 11, color: T.textSub }}>
                  candidate text: <span style={{ fontFamily: 'monospace', fontWeight: 700, color: T.text }}>{subjectText}</span>
                </div>
                {subjectShape && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: T.label, letterSpacing: '0.08em', textTransform: 'uppercase', minWidth: 60 }}>shape</span>
                    <span style={{ padding: '1px 6px', background: T.blueBg, border: `1px solid ${T.blueBord}`, borderRadius: 3, fontSize: 11, fontWeight: 700, color: T.blue }}>
                      {getSubjectShape(subjectShape, 'en')?.label ?? subjectShape}
                    </span>
                    {nounNumber !== 'unknown' && (
                      <span style={{ padding: '1px 6px', background: '#fff', border: `1px solid ${T.border}`, borderRadius: 3, fontSize: 10, color: T.textDim, fontFamily: 'monospace' }}>
                        {nounNumber}
                      </span>
                    )}
                  </div>
                )}
                {subjectFeatures && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: T.label, letterSpacing: '0.08em', textTransform: 'uppercase', minWidth: 60 }}>features</span>
                    <span style={{ padding: '1px 6px', background: '#fff', border: `1px solid ${T.border}`, borderRadius: 3, fontSize: 11, color: T.textSub, fontFamily: 'monospace' }}>{subjectFeatures.person}</span>
                    <span style={{ padding: '1px 6px', background: '#fff', border: `1px solid ${T.border}`, borderRadius: 3, fontSize: 11, color: T.textSub, fontFamily: 'monospace' }}>{subjectFeatures.number}</span>
                  </div>
                )}
                {articleWarning && (
                  <div style={{ padding: '6px 10px', background: T.amberBg, border: `1px solid ${T.amberBord}`, borderRadius: 4, fontSize: 11, color: T.amber, lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: 9, marginRight: 6 }}>a/an</span>
                    {articleWarning}
                  </div>
                )}
              </div>
            </StatusAccordionSection>
          )}

          {/* Auxiliary chain — when chain has elements */}
          {auxChain.length > 0 && (
            <StatusAccordionSection title="Auxiliary chain"
              accent={T.violet}
              preview={`${auxChain.length} element${auxChain.length === 1 ? '' : 's'} between Subject and Verb: ${auxChain.map(({token}) => token).join(' ')}`}
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

          {/* Verb agreement expected — fundamental lane only */}
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

          {/* Exception details — exception lane only */}
          {lane === 'exception' && (
            <StatusAccordionSection title="Exception details"
              accent={T.violet}
              preview={EXCEPTION_LANE_LABELS[exceptionType] ?? exceptionType}
              open={!!statusOpen.exception} onToggle={() => toggleStatus('exception')}>
              <div style={{ fontSize: 11, color: T.textDim, lineHeight: 1.55, fontStyle: 'italic' }}>
                {EXCEPTION_LANE_NOTES[exceptionType] ?? 'Exception detected; full handling in later phases.'}
              </div>
            </StatusAccordionSection>
          )}
        </div>

        <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px dashed ${T.border}`, fontSize: 10, color: T.textDim, fontStyle: 'italic' }}>
          Detection currently matches base forms only (eat, give, run, live, put, make, be). Inflected forms ("ate", "gave") will match later when morphology is wired in.
        </div>
      </div>

      {/* Sub-tab navigation */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 5,
        background: T.page, paddingTop: 8, paddingBottom: 0,
        borderBottom: `1px solid ${T.border}`, marginBottom: 16,
      }}>
        <div style={{ display: 'flex', gap: 0, flexWrap: 'wrap' }}>
          {SUB_TABS.map(t => {
            const isActive = subTab === t.id
            const groupColor = t.group === 'core' ? T.green : t.group === 'exception' ? T.violet : T.textDim
            return (
              <button key={t.id} onClick={() => setSubTab(t.id)}
                style={{
                  padding: '8px 14px',
                  fontSize: 12, fontWeight: 600,
                  border: 'none',
                  borderBottom: isActive ? `2px solid ${groupColor}` : '2px solid transparent',
                  marginBottom: -1,
                  background: 'transparent',
                  color: isActive ? T.text : T.textDim,
                  cursor: 'pointer',
                }}>
                {t.label}
                {t.count != null && <span style={{ color: groupColor, marginLeft: 4, fontWeight: 400 }}>({t.count})</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Slot Roles sub-tab ─────────────────────────────────────────────── */}
      {subTab === 'roles' && (<>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <Section>Slot Roles ({SLOT_ROLES.length}) — the macro primitives</Section>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={expandAllRoles}
            style={{ padding: '3px 8px', fontSize: 11, border: `1px solid ${T.border}`, borderRadius: 4, background: '#fff', color: T.textDim, cursor: 'pointer' }}>
            expand all
          </button>
          <button onClick={collapseAllRoles}
            style={{ padding: '3px 8px', fontSize: 11, border: `1px solid ${T.border}`, borderRadius: 4, background: '#fff', color: T.textDim, cursor: 'pointer' }}>
            collapse all
          </button>
        </div>
      </div>
      <div style={{ fontSize: 12, color: T.textDim, marginBottom: 14, lineHeight: 1.6, fontStyle: 'italic' }}>
        These five are the alphabet, not the words. They compose (per a verb's argument structure) to produce any compositional sentence — never enumerated as fixed shapes.
      </div>
      <div>
        {SLOT_ROLES.map(role => {
          const isActive = activeRoles.has(role.id)
          const c = SLOT_COLORS[role.shortLabel] ?? { border: T.border }
          return (
            <div key={role.id}
              style={{
                outline: isActive ? `3px solid ${c.border}` : 'none',
                outlineOffset: '3px',
                borderRadius: 6,
                transition: 'outline 200ms',
              }}>
              <SlotRoleCard role={role} expanded={!!expanded[role.id]} onToggle={() => toggle(role.id)} />
            </div>
          )
        })}
      </div>
      </>)}

      {/* ── Subject Shapes sub-tab ─────────────────────────────────────────── */}
      {subTab === 'subjects' && (<>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: T.green, textTransform: 'uppercase', marginBottom: 8 }}>
          Core group · alternative catalog
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
          <Section>Subject Shapes ({SUBJECT_SHAPES.length}) — alternative shapes that fill S</Section>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setExpanded(curr => ({ ...curr, ...Object.fromEntries(SUBJECT_SHAPES.map(s => [`subj-${s.id}`, true])) }))}
              style={{ padding: '3px 8px', fontSize: 11, border: `1px solid ${T.border}`, borderRadius: 4, background: '#fff', color: T.textDim, cursor: 'pointer' }}>
              expand all
            </button>
            <button onClick={() => setExpanded(curr => { const n = { ...curr }; for (const s of SUBJECT_SHAPES) delete n[`subj-${s.id}`]; return n })}
              style={{ padding: '3px 8px', fontSize: 11, border: `1px solid ${T.border}`, borderRadius: 4, background: '#fff', color: T.textDim, cursor: 'pointer' }}>
              collapse all
            </button>
          </div>
        </div>
        <div style={{ fontSize: 12, color: T.textDim, marginBottom: 14, lineHeight: 1.6, fontStyle: 'italic' }}>
          {SUBJECT_SHAPES.length} ways an English Subject can be shaped. <b>Alternative catalog</b> — each Subject matches one of these shapes (or none yet), not a combination.
        </div>
        <input type="text" placeholder="search subject shapes…" value={subjectSearch} onChange={e => setSubjectSearch(e.target.value)}
          style={{ width: '100%', padding: '6px 10px', fontSize: 12, border: `1px solid ${T.border}`, borderRadius: 4, marginBottom: 10, boxSizing: 'border-box' }} />
        <div>
          {SUBJECT_SHAPES.filter(s => matchesSearch(s, subjectSearch, ['label', 'description', 'pattern'])).map(shape => {
            const isMatch = lane === 'fundamental' && subjectShape === shape.id
            return (
              <div key={shape.id}
                style={{
                  outline: isMatch ? `3px solid ${T.blueBord}` : 'none',
                  outlineOffset: '3px',
                  borderRadius: 6,
                  transition: 'outline 200ms',
                }}>
                <SubjectShapeCard shape={shape}
                  expanded={!!expanded[`subj-${shape.id}`]}
                  onToggle={() => toggle(`subj-${shape.id}`)} />
              </div>
            )
          })}
        </div>
      </>)}

      {/* ── Frame Library sub-tab ──────────────────────────────────────────── */}
      {subTab === 'frames' && (<>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: T.green, textTransform: 'uppercase', marginBottom: 8 }}>
          Core group · per-verb catalog
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
          <Section>Frame Library ({FRAME_LIBRARY.length}) — verb argument structures</Section>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setExpanded(curr => ({ ...curr, ...Object.fromEntries(FRAME_LIBRARY.map(f => [`frame-${f.signature}`, true])) }))}
              style={{ padding: '3px 8px', fontSize: 11, border: `1px solid ${T.border}`, borderRadius: 4, background: '#fff', color: T.textDim, cursor: 'pointer' }}>
              expand all
            </button>
            <button onClick={() => setExpanded(curr => { const n = { ...curr }; for (const f of FRAME_LIBRARY) delete n[`frame-${f.signature}`]; return n })}
              style={{ padding: '3px 8px', fontSize: 11, border: `1px solid ${T.border}`, borderRadius: 4, background: '#fff', color: T.textDim, cursor: 'pointer' }}>
              collapse all
            </button>
          </div>
        </div>
        <div style={{ fontSize: 12, color: T.textDim, marginBottom: 14, lineHeight: 1.6, fontStyle: 'italic' }}>
          The {FRAME_LIBRARY.length} frames an English clause's predicate can take. Frame is the structure (slot signature); the verbs that fit each frame are listed underneath. <b>Per-verb catalog</b> — each verb permits one or more of these frames. Free adjuncts (yesterday, in the kitchen) can attach to any frame without being declared.
        </div>
        <input type="text" placeholder="search frames or verbs…" value={frameSearch} onChange={e => setFrameSearch(e.target.value)}
          style={{ width: '100%', padding: '6px 10px', fontSize: 12, border: `1px solid ${T.border}`, borderRadius: 4, marginBottom: 10, boxSizing: 'border-box' }} />
        <div>
          {FRAME_LIBRARY.filter(f => {
            const q = frameSearch.toLowerCase().trim()
            if (!q) return true
            if (f.signature.toLowerCase().includes(q) || f.label.toLowerCase().includes(q) || f.description.toLowerCase().includes(q)) return true
            return f.verbs.some(({ verb }) => verb.baseForm.toLowerCase().includes(q) || verb.verbId.toLowerCase().includes(q))
          }).map(frame => {
            const isFrameMatched = matchedVerb && frame.verbs.some(v => v.verb.verbId === matchedVerb.verbId)
            return (
              <div key={frame.signature}
                style={{
                  outline: isFrameMatched ? `3px solid ${T.amber}` : 'none',
                  outlineOffset: '3px',
                  borderRadius: 6,
                  transition: 'outline 200ms',
                }}>
                <FrameCard frame={frame}
                  matchedVerbId={matchedVerb?.verbId ?? null}
                  expanded={!!expanded[`frame-${frame.signature}`]}
                  onToggle={() => toggle(`frame-${frame.signature}`)} />
              </div>
            )
          })}
        </div>
      </>)}

      {/* ── Verb Internal sub-tab ──────────────────────────────────────────── */}
      {subTab === 'vchain' && (<>
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
        <input type="text" placeholder="search positions or words…" value={vchainSearch} onChange={e => setVchainSearch(e.target.value)}
          style={{ width: '100%', padding: '6px 10px', fontSize: 12, border: `1px solid ${T.border}`, borderRadius: 4, marginBottom: 10, boxSizing: 'border-box' }} />
        <div>
          {VERB_CHAIN.filter(e => {
            const q = vchainSearch.toLowerCase().trim()
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
      </>)}

      {/* ── Exception Shapes sub-tab ───────────────────────────────────────── */}
      {subTab === 'exceptions' && (<>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: T.violet, textTransform: 'uppercase', marginBottom: 8 }}>
          Exception group · marked openings
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
          <Section>Exception Shapes ({EXCEPTION_SHAPES.length}) — sentences that don&apos;t open with a Subject</Section>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setExpanded(curr => ({ ...curr, ...Object.fromEntries(EXCEPTION_SHAPES.map(s => [`exc-${s.id}`, true])) }))}
              style={{ padding: '3px 8px', fontSize: 11, border: `1px solid ${T.border}`, borderRadius: 4, background: '#fff', color: T.textDim, cursor: 'pointer' }}>
              expand all
            </button>
            <button onClick={() => setExpanded(curr => { const n = { ...curr }; for (const s of EXCEPTION_SHAPES) delete n[`exc-${s.id}`]; return n })}
              style={{ padding: '3px 8px', fontSize: 11, border: `1px solid ${T.border}`, borderRadius: 4, background: '#fff', color: T.textDim, cursor: 'pointer' }}>
              collapse all
            </button>
          </div>
        </div>
        <div style={{ fontSize: 12, color: T.textDim, marginBottom: 14, lineHeight: 1.6, fontStyle: 'italic' }}>
          The {EXCEPTION_SHAPES.length} marked openings — each announces a different sentence trajectory than the regular declarative. Each card shows whether detection is currently wired.
        </div>
        <input type="text" placeholder="search exception shapes…" value={exceptionSearch} onChange={e => setExceptionSearch(e.target.value)}
          style={{ width: '100%', padding: '6px 10px', fontSize: 12, border: `1px solid ${T.border}`, borderRadius: 4, marginBottom: 10, boxSizing: 'border-box' }} />
        <div>
          {EXCEPTION_SHAPES.filter(s => matchesSearch(s, exceptionSearch, ['label', 'description', 'pattern', 'trigger'])).map(shape => {
            const isMatch = lane === 'exception' && exceptionType === shape.id
            return (
              <div key={shape.id}
                style={{
                  outline: isMatch ? `3px solid ${T.violetBord}` : 'none',
                  outlineOffset: '3px',
                  borderRadius: 6,
                  transition: 'outline 200ms',
                }}>
                <ExceptionShapeCard shape={shape}
                  expanded={!!expanded[`exc-${shape.id}`]}
                  onToggle={() => toggle(`exc-${shape.id}`)} />
              </div>
            )
          })}
        </div>
      </>)}

      {/* ── Findings sub-tab ───────────────────────────────────────────────── */}
      {subTab === 'findings' && (<>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: T.textDim, textTransform: 'uppercase', marginBottom: 8 }}>
          Forward Flow as discovery surface · gap log
        </div>
        <Section>Findings ({FORWARD_FLOW_FINDINGS.filter(f => f.status === 'open').length} open · {FORWARD_FLOW_FINDINGS.filter(f => f.status === 'resolved').length} resolved)</Section>
        <div style={{ fontSize: 12, color: T.textDim, marginBottom: 14, lineHeight: 1.6, fontStyle: 'italic' }}>
          As Forward Flow grows, it surfaces gaps in the broader system — things this dev surface can detect that the rest of the app can&apos;t yet handle. Each finding names what surfaced it, what&apos;s missing, the current workaround (if any), and where the fix lives. Mirror of notes/forward-flow-findings.md.
        </div>

        {/* Search + group-by controls */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input type="text" placeholder="search findings…" value={findingsSearch} onChange={e => setFindingsSearch(e.target.value)}
            style={{ flex: 1, minWidth: 200, padding: '6px 10px', fontSize: 12, border: `1px solid ${T.border}`, borderRadius: 4, boxSizing: 'border-box' }} />
          <span style={{ fontSize: 10, color: T.textDim, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>group by</span>
          {['status', 'priority', 'none'].map(g => (
            <button key={g} onClick={() => setFindingsGroupBy(g)}
              style={{
                padding: '4px 10px', fontSize: 11, fontWeight: 600,
                border: `1px solid ${findingsGroupBy === g ? T.text : T.border}`, borderRadius: 4,
                background: findingsGroupBy === g ? T.text : '#fff',
                color:      findingsGroupBy === g ? T.page : T.textDim,
                cursor: 'pointer',
              }}>{g}</button>
          ))}
        </div>

        {(() => {
          const filtered = FORWARD_FLOW_FINDINGS.filter(f => {
            const q = findingsSearch.toLowerCase().trim()
            if (!q) return true
            return [f.title, f.surfacedBy, f.missing, f.workaround, f.fix].some(s => (s ?? '').toLowerCase().includes(q))
          })

          let groups
          if (findingsGroupBy === 'status') {
            groups = [
              { label: 'Open',     items: filtered.filter(f => f.status === 'open') },
              { label: 'Resolved', items: filtered.filter(f => f.status === 'resolved') },
            ]
          } else if (findingsGroupBy === 'priority') {
            groups = [
              { label: 'Important', items: filtered.filter(f => f.priority === 'important') },
              { label: 'Can wait',  items: filtered.filter(f => f.priority === 'can wait') },
              { label: 'Resolved',  items: filtered.filter(f => f.status === 'resolved') },
            ]
          } else {
            groups = [{ label: null, items: filtered }]
          }

          return groups.map((group, gi) => group.items.length === 0 ? null : (
            <div key={gi} style={{ marginBottom: 16 }}>
              {group.label && (
                <div style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: T.label, textTransform: 'uppercase',
                  marginBottom: 6, paddingBottom: 4, borderBottom: `1px solid ${T.border}`,
                }}>
                  {group.label} ({group.items.length})
                </div>
              )}
              {group.items.map(f => {
                const isResolved = f.status === 'resolved'
                const priorityColor =
                  f.priority === 'critical'  ? T.red    :
                  f.priority === 'important' ? T.amber  :
                  T.textDim
                return (
                  <div key={f.id} style={{
                    background: isResolved ? T.greenBg : T.card,
                    border: `1px solid ${isResolved ? T.greenBord : T.border}`,
                    borderRadius: 6, padding: '12px 14px', marginBottom: 8,
                    opacity: isResolved ? 0.75 : 1,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: T.textDim, fontFamily: 'monospace', minWidth: 28,
                      }}>#{f.id}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: T.text, flex: 1 }}>
                        {isResolved && <span style={{ textDecoration: 'line-through' }}>{f.title}</span>}
                        {!isResolved && f.title}
                      </span>
                      <span style={{
                        padding: '1px 7px', background: '#fff', border: `1px solid ${priorityColor}`, color: priorityColor,
                        borderRadius: 3, fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
                      }}>{f.priority}</span>
                      <span style={{
                        padding: '1px 7px', background: isResolved ? T.greenBg : '#fff', border: `1px solid ${isResolved ? T.greenBord : T.border}`,
                        color: isResolved ? T.green : T.textDim, borderRadius: 3, fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
                      }}>{f.status}</span>
                    </div>
                    <div style={{ fontSize: 11, color: T.textSub, lineHeight: 1.55, marginBottom: 4 }}>
                      <b style={{ color: T.label }}>Surfaced by:</b> {f.surfacedBy}
                    </div>
                    <div style={{ fontSize: 11, color: T.textSub, lineHeight: 1.55, marginBottom: 4 }}>
                      <b style={{ color: T.label }}>What&apos;s missing:</b> {f.missing}
                    </div>
                    <div style={{ fontSize: 11, color: T.textSub, lineHeight: 1.55, marginBottom: 4 }}>
                      <b style={{ color: T.label }}>Workaround:</b> {f.workaround}
                    </div>
                    <div style={{ fontSize: 11, color: T.textSub, lineHeight: 1.55 }}>
                      <b style={{ color: T.label }}>Fix:</b> {f.fix}
                    </div>
                  </div>
                )
              })}
            </div>
          ))
        })()}
      </>)}

      {/* ── Future phases sub-tab ──────────────────────────────────────────── */}
      {subTab === 'future' && (<>
        <Section>Future phases — coming online as built</Section>
        <FuturePhasePlaceholder phase={3} title="Forward-trajectory predictor"
          description="As a sentence is typed, the predictor announces what slot is wanted next, which canonicals are still in play, and which next-words would break the trajectory." />
        <FuturePhasePlaceholder phase={4} title="TAM layer"
          description="Tense / aspect / modality / voice / polarity decoration on the predicate. Detected as auxiliaries and modals appear before the verb." />
        <FuturePhasePlaceholder phase={5} title="Marked constructions"
          description="Small registry of stored shapes that don't decompose (existentials, weather verbs, idioms-with-syntax). Matched by left-edge fingerprint." />
        <FuturePhasePlaceholder phase={6} title="Operations layer"
          description="Sentence-level transformations (imperative, yes/no question, wh-question, fronting, inversion, dummy insertion). Multi-hypothesis announcement at the left edge." />
      </>)}
    </div>
  )
}
