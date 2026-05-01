// Grammar Breaker — Forward Flow tab
//
// Top-down visualization of the macro layer. Where the Flow tab is
// retrospective (atoms → patterns → couplings → composites, after a
// sentence is parsed), Forward Flow is prospective — as a sentence is
// built, what's committed, what's expected next, what hypotheses are
// still in play.
//
// Phase 1 surface: the 5 slot roles registry, fully documented.
// Phase 2 surface: per-verb argument structures for a starter set of verbs.
// Future phases (predictor, TAM, marked constructions, operations) fill in
// additional sub-panels on this tab.
//
// Source of truth for the macro-layer architecture: notes/macro-layer-sketch.md

import { useState } from 'react'
import { getSlotRoles, getSlotRoleByShortLabel } from './slotRoles'
import { getArgumentStructures } from './argumentStructures'

const SLOT_ROLES = getSlotRoles('en')
const VERB_STRUCTURES = getArgumentStructures('en')

const T = {
  page: '#ffffff', card: '#e8e8ea', border: '#c4c4c6',
  text: '#1a1a1a', textDim: '#777', textSub: '#444', label: '#666',
  green: '#1a5a1a', greenBg: '#d8eed8', greenBord: '#90c090',
  red: '#7a1a1a', redBg: '#f0d8d8', redBord: '#d09090',
  amber: '#7a4000', amberBg: '#fde8c8', amberBord: '#d8a050',
  blue: '#004a7a', blueBg: '#d8eef8', blueBord: '#7ab0d0',
  violet: '#5a1a7a', violetBg: '#e8d8f0', violetBord: '#a878c0',
}

function Section({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: T.label, textTransform: 'uppercase', marginBottom: 10 }}>
      {children}
    </div>
  )
}

function SlotRoleCard({ role, expanded, onToggle }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '14px 16px', marginBottom: 10 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
        <div style={{
          padding: '4px 12px', background: T.blueBg, border: `1px solid ${T.blueBord}`, borderRadius: 4,
          fontSize: 18, fontWeight: 800, fontFamily: 'monospace', color: T.blue,
          minWidth: 32, textAlign: 'center',
        }}>
          {role.shortLabel}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>
            {role.label}
            {role.polymorphic && (
              <span style={{
                marginLeft: 8, fontSize: 10, padding: '2px 6px',
                background: T.violetBg, border: `1px solid ${T.violetBord}`, color: T.violet,
                borderRadius: 3, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
              }}>polymorphic</span>
            )}
          </div>
          <div style={{ fontSize: 12, color: T.textDim, fontFamily: 'monospace' }}>{role.id}</div>
        </div>
        <button onClick={onToggle}
          style={{ padding: '4px 10px', background: '#fff', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 11, color: T.textDim, cursor: 'pointer' }}>
          {expanded ? '▴ less' : '▾ more'}
        </button>
      </div>

      {/* Description (always shown) */}
      <div style={{ fontSize: 13, color: T.textSub, lineHeight: 1.55 }}>
        {role.description}
      </div>

      {/* Polymorphism note (always shown if polymorphic) */}
      {role.polymorphic && role.polymorphismNote && (
        <div style={{
          marginTop: 10, padding: '8px 12px',
          background: T.violetBg, border: `1px solid ${T.violetBord}`, borderRadius: 5,
          fontSize: 12, color: T.violet, lineHeight: 1.55,
        }}>
          <span style={{ fontWeight: 700 }}>Polymorphism — </span>
          {role.polymorphismNote}
        </div>
      )}

      {/* Expanded content */}
      {expanded && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px dashed ${T.border}` }}>
          {/* Typical fillers */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: T.label, textTransform: 'uppercase', marginBottom: 5 }}>
              Typical fillers
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {role.typicalFillers.map(f => (
                <span key={f} style={{
                  padding: '3px 8px', background: '#fff', border: `1px solid ${T.border}`, borderRadius: 4,
                  fontSize: 11, color: T.textSub, fontFamily: 'monospace',
                }}>{f}</span>
              ))}
            </div>
          </div>

          {/* Relations */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: T.label, textTransform: 'uppercase', marginBottom: 5 }}>
              Relations
            </div>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {role.relations.map((rel, i) => (
                <li key={i} style={{ fontSize: 12, color: T.textSub, lineHeight: 1.55, marginBottom: 4 }}>{rel}</li>
              ))}
            </ul>
          </div>

          {/* Examples */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: T.label, textTransform: 'uppercase', marginBottom: 5 }}>
              Examples
            </div>
            {role.examples.map((ex, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 3, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: T.text, fontStyle: 'italic' }}>"{ex.sentence}"</span>
                <span style={{ fontSize: 11, color: T.blue, fontWeight: 600, fontFamily: 'monospace' }}>→ {ex.highlight}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Slot chip — colored badge for a slot-role short label (S/V/O/C/A) ──────

const SLOT_COLORS = {
  S: { bg: T.blueBg,    border: T.blueBord,    fg: T.blue   },
  V: { bg: T.amberBg,   border: T.amberBord,   fg: T.amber  },
  O: { bg: T.greenBg,   border: T.greenBord,   fg: T.green  },
  C: { bg: T.violetBg,  border: T.violetBord,  fg: T.violet },
  A: { bg: T.redBg,     border: T.redBord,     fg: T.red    },
}

function SlotChip({ shortLabel, size = 'normal' }) {
  const c = SLOT_COLORS[shortLabel] ?? { bg: '#fff', border: T.border, fg: T.textDim }
  const role = getSlotRoleByShortLabel(shortLabel, 'en')
  const big = size === 'big'
  return (
    <span title={role ? `${shortLabel} = ${role.label}` : shortLabel}
      style={{
        display: 'inline-block',
        padding: big ? '4px 10px' : '2px 7px',
        background: c.bg, border: `1px solid ${c.border}`, borderRadius: 4,
        fontSize: big ? 14 : 12, fontWeight: 800, fontFamily: 'monospace', color: c.fg,
        minWidth: big ? 22 : 16, textAlign: 'center',
      }}>
      {shortLabel}
    </span>
  )
}

function SlotSignature({ slots, gap = 4 }) {
  return (
    <div style={{ display: 'inline-flex', gap, alignItems: 'center' }}>
      {slots.map((s, i) => <SlotChip key={i} shortLabel={s} />)}
    </div>
  )
}

// ── Verb argument structure card ────────────────────────────────────────────

function VerbStructureCard({ verb, expanded, onToggle }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '14px 16px', marginBottom: 10 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
        <div style={{
          padding: '4px 12px', background: T.amberBg, border: `1px solid ${T.amberBord}`, borderRadius: 4,
          fontSize: 17, fontWeight: 800, fontFamily: 'monospace', color: T.amber,
        }}>
          {verb.baseForm}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: T.textDim, fontFamily: 'monospace' }}>
            {verb.verbId} · {verb.frames.length} frame{verb.frames.length === 1 ? '' : 's'}
          </div>
          {!verb.inSeed && (
            <div style={{ fontSize: 10, color: T.amber, fontStyle: 'italic', marginTop: 2 }}>
              not yet in word seed — declared as architecture demo
            </div>
          )}
        </div>
        <button onClick={onToggle}
          style={{ padding: '4px 10px', background: '#fff', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 11, color: T.textDim, cursor: 'pointer' }}>
          {expanded ? '▴ less' : '▾ more'}
        </button>
      </div>

      {/* Frames — always shown (the signature is the main content) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {verb.frames.map((frame, i) => (
          <div key={frame.id} style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 5, padding: '10px 12px' }}>
            {/* Frame header: label + slot signature + example */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginBottom: expanded ? 8 : 0 }}>
              <div style={{ fontSize: 11, color: T.textSub, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', minWidth: 140 }}>
                {frame.label}
              </div>
              <SlotSignature slots={frame.slots} />
              <div style={{ fontSize: 12, color: T.text, fontStyle: 'italic', flex: 1 }}>
                "{frame.example}"
              </div>
            </div>

            {/* Frame details — only when expanded */}
            {expanded && (
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px dashed ${T.border}` }}>
                {frame.notes && (
                  <div style={{ fontSize: 12, color: T.textSub, lineHeight: 1.55, marginBottom: frame.slotNotes ? 8 : 0 }}>
                    {frame.notes}
                  </div>
                )}
                {frame.slotNotes && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {Object.entries(frame.slotNotes).map(([idx, note]) => {
                      const slotChar = frame.slots[Number(idx)]
                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                          <span style={{ fontSize: 10, color: T.textDim, fontFamily: 'monospace', minWidth: 50 }}>
                            slot {idx} ({slotChar})
                          </span>
                          <span style={{ fontSize: 11, color: T.textSub, lineHeight: 1.5, flex: 1 }}>{note}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function FuturePhasePlaceholder({ phase, title, description }) {
  return (
    <div style={{
      background: '#fafafa', border: `1px dashed ${T.border}`, borderRadius: 6,
      padding: '12px 14px', marginBottom: 8, opacity: 0.75,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
        <span style={{
          fontSize: 9, padding: '2px 6px', background: '#fff', border: `1px solid ${T.border}`, color: T.textDim,
          borderRadius: 3, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'monospace',
        }}>phase {phase}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: T.textDim }}>{title}</span>
      </div>
      <div style={{ fontSize: 12, color: T.textDim, lineHeight: 1.55, fontStyle: 'italic' }}>{description}</div>
    </div>
  )
}

export default function GrammarBreakerForwardFlowTab() {
  const [expanded, setExpanded] = useState({})

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
  function expandAllVerbs() {
    setExpanded(curr => ({ ...curr, ...Object.fromEntries(VERB_STRUCTURES.map(v => [v.verbId, true])) }))
  }
  function collapseAllVerbs() {
    setExpanded(curr => {
      const next = { ...curr }
      for (const v of VERB_STRUCTURES) delete next[v.verbId]
      return next
    })
  }

  return (
    <div>
      {/* Header / explanation */}
      <div style={{
        background: T.card, border: `1px solid ${T.border}`, borderRadius: 6,
        padding: '14px 16px', marginBottom: 24, fontSize: 12, color: T.textSub, lineHeight: 1.65,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 6 }}>
          Forward Flow — top-down view of the macro layer
        </div>
        Where the <b>Flow</b> tab is retrospective (after a sentence is parsed, what fired), Forward Flow is prospective — as a sentence is built, what's committed, what's expected next, what hypotheses are still in play. The architecture is a forward-flowing pipeline; this tab is its dev surface.
        <br /><br />
        Design principle: <b>forward momentum</b>. A macro shape is the right primitive only if it can be detected from what's already been typed (left-to-right), constrains what can come next, and composes naturally with the next shape. See <code style={{ background: '#fff', padding: '1px 5px', borderRadius: 3 }}>notes/macro-layer-sketch.md</code> for the full architecture.
      </div>

      {/* Slot Roles section */}
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
        {SLOT_ROLES.map(role => (
          <SlotRoleCard key={role.id} role={role} expanded={!!expanded[role.id]} onToggle={() => toggle(role.id)} />
        ))}
      </div>

      {/* Verb Argument Structures section */}
      <div style={{ marginTop: 32, paddingTop: 24, borderTop: `1px solid ${T.border}` }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
          <Section>Verb Argument Structures ({VERB_STRUCTURES.length}) — the central engine</Section>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={expandAllVerbs}
              style={{ padding: '3px 8px', fontSize: 11, border: `1px solid ${T.border}`, borderRadius: 4, background: '#fff', color: T.textDim, cursor: 'pointer' }}>
              expand all
            </button>
            <button onClick={collapseAllVerbs}
              style={{ padding: '3px 8px', fontSize: 11, border: `1px solid ${T.border}`, borderRadius: 4, background: '#fff', color: T.textDim, cursor: 'pointer' }}>
              collapse all
            </button>
          </div>
        </div>
        <div style={{ fontSize: 12, color: T.textDim, marginBottom: 14, lineHeight: 1.6, fontStyle: 'italic' }}>
          Each verb declares which slot patterns it permits. Once the verb in a sentence is identified, the trajectory of the rest is largely determined. Free adjuncts (yesterday, in the kitchen) can attach without being declared — only argument slots are listed here.
        </div>
        <div>
          {VERB_STRUCTURES.map(verb => (
            <VerbStructureCard key={verb.verbId} verb={verb} expanded={!!expanded[verb.verbId]} onToggle={() => toggle(verb.verbId)} />
          ))}
        </div>
      </div>

      {/* Future phases placeholders */}
      <div style={{ marginTop: 32, paddingTop: 24, borderTop: `1px solid ${T.border}` }}>
        <Section>Future phases — coming online as built</Section>
        <FuturePhasePlaceholder phase={3} title="Forward-trajectory predictor"
          description="As a sentence is typed, the predictor announces what slot is wanted next, which canonicals are still in play, and which next-words would break the trajectory." />
        <FuturePhasePlaceholder phase={4} title="TAM layer"
          description="Tense / aspect / modality / voice / polarity decoration on the predicate. Detected as auxiliaries and modals appear before the verb." />
        <FuturePhasePlaceholder phase={5} title="Marked constructions"
          description="Small registry of stored shapes that don't decompose (existentials, weather verbs, idioms-with-syntax). Matched by left-edge fingerprint." />
        <FuturePhasePlaceholder phase={6} title="Operations layer"
          description="Sentence-level transformations (imperative, yes/no question, wh-question, fronting, inversion, dummy insertion). Multi-hypothesis announcement at the left edge." />
      </div>
    </div>
  )
}
