// Grammar Breaker — Forward Flow tab.
//
// Top-down visualization of the macro layer. Where the Flow tab is
// retrospective (atoms → patterns → couplings → composites, after a
// sentence is parsed), Forward Flow is prospective — as a sentence is
// built, what's committed, what's expected next, what hypotheses are
// still in play.
//
// This file is the orchestrator. Its job:
//   - own shared state (subTab, expanded, search queries)
//   - run useParsedSentence on the typed input
//   - render the two-row nav strip
//   - dispatch to one component per route
//
// Per-route content lives in dedicated files:
//   forwardFlow/LiveDetectionPanel.jsx        — above-the-tabs panel
//   forwardFlow/findings/FindingsSubTabContent.jsx
//   forwardFlow/library/WordCategoriesSubTab.jsx
//   forwardFlow/units/<slot>/SubTabContent.jsx (incl. verb's compound view)
//   forwardFlow/units/exceptions/SubTabContent.jsx
//
// Source of truth for the macro-layer architecture: notes/macro-layer-sketch.md

import { useState } from 'react'
import { getSlotRoles } from './slotRoles'
import { STRUCTURES } from './forwardFlow/structures.en.js'
import { SUBJECT_ACCEPTS } from './forwardFlow/units/subject/acceptance.en.js'
import { OBJECT_ACCEPTS } from './forwardFlow/units/object/acceptance.en.js'
import { getExceptionShapes } from './forwardFlow/units/exceptions/shapesIndex'
import { FORWARD_FLOW_FINDINGS } from './forwardFlowFindings.en.js'

import { T, SLOT_COLORS } from './forwardFlow/theme'
import { Section, FuturePhasePlaceholder } from './forwardFlow/primitives'
import { SlotRoleCard } from './forwardFlow/SlotRoleCard'
import { useParsedSentence } from './forwardFlow/useParsedSentence'
import { LiveDetectionPanel } from './forwardFlow/LiveDetectionPanel'

// Per-route content components.
import { SubjectSubTabContent }   from './forwardFlow/units/subject/SubTabContent'
import { VerbSubTabContent }      from './forwardFlow/units/verb/VerbSubTabContent'
import { ObjectSubTabContent }    from './forwardFlow/units/object/SubTabContent'
import { ComplementSubTabContent }from './forwardFlow/units/complement/SubTabContent'
import { COMPLEMENT_ACCEPTS }     from './forwardFlow/units/complement/acceptance.en.js'
import { AdverbialSubTabContent } from './forwardFlow/units/adverbial/SubTabContent'
import { ADVERBIAL_ACCEPTS }      from './forwardFlow/units/adverbial/acceptance.en.js'
import { ExceptionSubTabContent } from './forwardFlow/units/exceptions/SubTabContent'
import { WordCategoriesSubTabContent } from './forwardFlow/library/WordCategoriesSubTab'
import { FindingsSubTabContent }  from './forwardFlow/findings/FindingsSubTabContent'

const SLOT_ROLES         = getSlotRoles('en')
const SUBJECT_STRUCTURES = STRUCTURES.filter(s => SUBJECT_ACCEPTS.includes(s.id))
const OBJECT_STRUCTURES  = STRUCTURES.filter(s => OBJECT_ACCEPTS.includes(s.id))
const EXCEPTION_SHAPES   = getExceptionShapes('en')

export default function GrammarBreakerForwardFlowTab() {
  const [expanded, setExpanded] = useState({})
  const [typedSentence, setTypedSentence] = useState('')
  // Path-style IDs: 'slots/subject', 'library/wordcats', etc.
  // Top-level-only paths ('findings', 'roadmap') for tabs with no children.
  const [subTab, setSubTab] = useState('slots/overview')

  // Per-catalog search queries. State stays in the orchestrator so search
  // persists across sub-tab switches.
  const [subjectSearch,    setSubjectSearch]    = useState('')
  const [frameSearch,      setFrameSearch]      = useState('')
  const [vchainSearch,     setVchainSearch]     = useState('')
  const [configSearch,     setConfigSearch]     = useState('')
  const [objectSearch,     setObjectSearch]     = useState('')
  const [complementSearch, setComplementSearch] = useState('')
  const [adverbialSearch,  setAdverbialSearch]  = useState('')
  const [exceptionSearch,  setExceptionSearch]  = useState('')

  const parsed = useParsedSentence(typedSentence)
  const {
    lane, exceptionType, matchedVerb, subjectShape,
    matchedChainIds, auxConfiguration,
    objectAnalysis, complementAnalysis, adverbialAnalysis,
    activeRoles,
  } = parsed

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

  // Two-axis nav: top-level views grouped by what kind of thing they show,
  // sub-strip per top-tab for the children of the active view.
  const TOP_TABS = [
    { id: 'slots',      label: 'Slots' },
    { id: 'library',    label: 'Library' },
    { id: 'operations', label: 'Operations' },
    { id: 'findings',   label: 'Findings', count: FORWARD_FLOW_FINDINGS.filter(f => f.status === 'open').length },
    { id: 'roadmap',    label: 'Roadmap' },
  ]
  const SUB_TABS_BY_TOP = {
    slots: [
      { id: 'overview',   label: 'Overview',   count: SLOT_ROLES.length },
      { id: 'subject',    label: 'Subject',    count: SUBJECT_STRUCTURES.length },
      { id: 'verb',       label: 'Verb' },
      { id: 'object',     label: 'Object',     count: OBJECT_STRUCTURES.length },
      { id: 'complement', label: 'Complement', count: COMPLEMENT_ACCEPTS.length },
      { id: 'adverbial',  label: 'Adverbial',  count: ADVERBIAL_ACCEPTS.length },
    ],
    library: [
      { id: 'wordcats', label: 'Word Categories' },
    ],
    operations: [
      { id: 'exceptions', label: 'Exception Shapes', count: EXCEPTION_SHAPES.length },
    ],
    findings: [],
    roadmap:  [],
  }
  const [topTabId] = subTab.split('/')
  const subTabsForTop = SUB_TABS_BY_TOP[topTabId] ?? []
  function selectTop(id) {
    const subs = SUB_TABS_BY_TOP[id] ?? []
    setSubTab(subs.length > 0 ? `${id}/${subs[0].id}` : id)
  }

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

      {/* Live forward-flow detection panel — owns its own statusOpen state. */}
      <LiveDetectionPanel
        typedSentence={typedSentence} setTypedSentence={setTypedSentence}
        parsed={parsed} />

      {/* Two-row sub-tab navigation: top tabs (5) + sub-strip (children of active top). */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 5,
        background: T.page, paddingTop: 8, paddingBottom: 0,
        borderBottom: `1px solid ${T.border}`, marginBottom: 16,
      }}>
        {/* Top-level tabs */}
        <div style={{ display: 'flex', gap: 0, flexWrap: 'wrap' }}>
          {TOP_TABS.map(t => {
            const isActive = topTabId === t.id
            return (
              <button key={t.id} onClick={() => selectTop(t.id)}
                style={{
                  padding: '8px 14px',
                  fontSize: 13, fontWeight: 700,
                  border: 'none',
                  borderBottom: isActive ? `2px solid ${T.text}` : '2px solid transparent',
                  marginBottom: -1,
                  background: 'transparent',
                  color: isActive ? T.text : T.textDim,
                  cursor: 'pointer',
                  letterSpacing: '0.02em',
                }}>
                {t.label}
                {t.count != null && <span style={{ color: T.textDim, marginLeft: 4, fontWeight: 400 }}>({t.count})</span>}
              </button>
            )
          })}
        </div>
        {/* Sub-strip — only shown when active top has children */}
        {subTabsForTop.length > 0 && (
          <div style={{
            display: 'flex', gap: 0, flexWrap: 'wrap',
            paddingTop: 6, paddingLeft: 4,
            borderTop: `1px solid ${T.border}`,
          }}>
            {subTabsForTop.map(s => {
              const path = `${topTabId}/${s.id}`
              const isActive = subTab === path
              return (
                <button key={s.id} onClick={() => setSubTab(path)}
                  style={{
                    padding: '6px 12px',
                    fontSize: 12, fontWeight: 600,
                    border: 'none',
                    borderBottom: isActive ? `2px solid ${T.textDim}` : '2px solid transparent',
                    marginBottom: -1,
                    background: 'transparent',
                    color: isActive ? T.text : T.textDim,
                    cursor: 'pointer',
                  }}>
                  {s.label}
                  {s.count != null && <span style={{ color: T.textDim, marginLeft: 4, fontWeight: 400 }}>({s.count})</span>}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Slots / Overview (the 5 macro primitives) ──────────────────────── */}
      {subTab === 'slots/overview' && (<>
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

      {/* ── Slots / Subject ────────────────────────────────────────────────── */}
      {subTab === 'slots/subject' && (
        <SubjectSubTabContent
          lane={lane} subjectShape={subjectShape}
          expanded={expanded} setExpanded={setExpanded} toggle={toggle}
          search={subjectSearch} setSearch={setSubjectSearch} />
      )}

      {/* ── Slots / Verb (3-view internal nav lives in VerbSubTabContent) ──── */}
      {subTab === 'slots/verb' && (
        <VerbSubTabContent
          matchedVerb={matchedVerb}
          matchedChainIds={matchedChainIds}
          auxConfiguration={auxConfiguration}
          expanded={expanded} setExpanded={setExpanded} toggle={toggle}
          frameSearch={frameSearch}   setFrameSearch={setFrameSearch}
          vchainSearch={vchainSearch} setVchainSearch={setVchainSearch}
          configSearch={configSearch} setConfigSearch={setConfigSearch} />
      )}

      {/* ── Slots / Object ─────────────────────────────────────────────────── */}
      {subTab === 'slots/object' && (
        <ObjectSubTabContent
          lane={lane} objectAnalysis={objectAnalysis}
          expanded={expanded} setExpanded={setExpanded} toggle={toggle}
          search={objectSearch} setSearch={setObjectSearch} />
      )}

      {/* ── Slots / Complement ─────────────────────────────────────────────── */}
      {subTab === 'slots/complement' && (
        <ComplementSubTabContent
          complementAnalysis={complementAnalysis}
          expanded={expanded} setExpanded={setExpanded} toggle={toggle}
          search={complementSearch} setSearch={setComplementSearch} />
      )}

      {/* ── Slots / Adverbial ──────────────────────────────────────────────── */}
      {subTab === 'slots/adverbial' && (
        <AdverbialSubTabContent
          adverbialAnalysis={adverbialAnalysis}
          expanded={expanded} setExpanded={setExpanded} toggle={toggle}
          search={adverbialSearch} setSearch={setAdverbialSearch} />
      )}

      {/* ── Library / Word Categories (schema view) ────────────────────────── */}
      {subTab === 'library/wordcats' && (
        <WordCategoriesSubTabContent />
      )}

      {/* ── Operations / Exception Shapes ──────────────────────────────────── */}
      {subTab === 'operations/exceptions' && (
        <ExceptionSubTabContent
          lane={lane} exceptionType={exceptionType}
          expanded={expanded} setExpanded={setExpanded} toggle={toggle}
          search={exceptionSearch} setSearch={setExceptionSearch} />
      )}

      {/* ── Findings (top-level — gap log) ─────────────────────────────────── */}
      {subTab === 'findings' && <FindingsSubTabContent />}

      {/* ── Roadmap (top-level — phase placeholders) ───────────────────────── */}
      {subTab === 'roadmap' && (<>
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
