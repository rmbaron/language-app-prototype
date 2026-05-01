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

import { useState, useMemo, useEffect, useRef } from 'react'
import { getSlotRoles, getSlotRoleByShortLabel } from './slotRoles'
import { getArgumentStructures } from './argumentStructures'
import { getSubjectShapes, getSubjectShape } from './subjectShapes'
import { detectSubjectShape, detectNounNumber, checkArticleAgreement } from './subjectShapeDetector'
import { getExceptionShapes } from './exceptionShapes'

const SLOT_ROLES = getSlotRoles('en')
const VERB_STRUCTURES = getArgumentStructures('en')
const SUBJECT_SHAPES = getSubjectShapes('en')
const EXCEPTION_SHAPES = getExceptionShapes('en')

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

// ── Dispatch classification ─────────────────────────────────────────────────
// The first word of a sentence announces which lane the sentence is on:
// the fundamental lane (regular declarative — Subject first) or one of
// several exception lanes (operations / marked constructions).

const EXCEPTION_OPENERS = {
  yes_no_question: new Set([
    'do', 'does', 'did',
    'am', 'is', 'are', 'was', 'were',
    'have', 'has', 'had',
    'can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must',
  ]),
  wh_question: new Set([
    'what', 'where', 'when', 'why', 'how', 'who', 'whom', 'whose', 'which',
  ]),
  existential_or_locative: new Set(['there']),
  negative_inversion: new Set([
    'never', 'rarely', 'seldom', 'hardly', 'scarcely', 'nowhere',
  ]),
  adverbial_fronting: new Set([
    'yesterday', 'today', 'tomorrow', 'now',
    'sometimes', 'always', 'often', 'occasionally',
  ]),
  minor_sentence: new Set([
    'hello', 'hi', 'hey', 'wow', 'oh', 'ah', 'ouch', 'oops',
    'sorry', 'thanks', 'please', 'welcome', 'goodbye', 'bye',
    'okay', 'ok', 'yeah', 'hmm', 'well',
  ]),
  // Imperative is detected separately — verb baseForm at position 0.
  // Quotative is detected separately — leading quote character.
}

const EXCEPTION_LANE_LABELS = {
  yes_no_question:         'Yes/no question',
  wh_question:             'Wh-question',
  existential_or_locative: 'Existential or locative-fronted',
  negative_inversion:      'Negative inversion',
  adverbial_fronting:      'Adverbial fronting',
  quotative_inversion:     'Quotative inversion',
  minor_sentence:          'Minor sentence / interjection',
  imperative:              'Imperative',
}

const EXCEPTION_LANE_NOTES = {
  yes_no_question:         'Auxiliary or modal at position 0 — sentence opens with subject-aux inversion. Subject comes after the auxiliary; full handling in Phase 6 (operations).',
  wh_question:             'Wh-word at position 0 — sentence opens with wh-fronting. Full handling in Phase 6 (operations).',
  existential_or_locative: '"There" at position 0 — likely existential ("There is a problem") or locative-fronted ("There, on the table"). Full handling in Phase 5 (marked constructions).',
  negative_inversion:      'Negative or restrictive adverb at position 0 — forces subject-aux inversion. Marked register, often literary or emphatic.',
  adverbial_fronting:      'Time, place, or frequency adverb at position 0 — topicalized declarative. Subject and verb keep their normal order; only the adverbial moved.',
  quotative_inversion:     'Direct quotation at position 0, followed by an inverted verb of saying and its subject.',
  minor_sentence:          'A standalone discourse element — interjection, greeting, reply, or politeness marker. No Subject-Verb structure; the whole utterance is the unit.',
  imperative:              'Verb in base form at position 0 — sentence is an imperative; subject "you" is elided. Full handling in Phase 6 (subject_elision operation).',
}

function classifyLane(tokens, originalText) {
  if (tokens.length === 0) return { lane: 'empty', exceptionType: null }

  // Quotative inversion: text starts with a quote character.
  // Check the original (untokenized) text to preserve leading punctuation.
  if (originalText && /^["“'‘]/.test(originalText.trim())) {
    return { lane: 'exception', exceptionType: 'quotative_inversion' }
  }

  const word0 = tokens[0].toLowerCase().replace(/[^\w]/g, '')
  for (const [type, set] of Object.entries(EXCEPTION_OPENERS)) {
    if (set.has(word0)) return { lane: 'exception', exceptionType: type }
  }
  // Imperative: word 0 is a verb's baseForm
  if (VERB_STRUCTURES.some(v => v.baseForm === word0)) {
    return { lane: 'exception', exceptionType: 'imperative' }
  }
  return { lane: 'fundamental', exceptionType: null }
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
        {verb.frames.map(frame => (
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

// ── Subject shape card ──────────────────────────────────────────────────────

function SubjectShapeCard({ shape, expanded, onToggle }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '12px 14px', marginBottom: 8 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
        <span style={{
          padding: '3px 9px', background: T.blueBg, border: `1px solid ${T.blueBord}`, borderRadius: 4,
          fontSize: 12, fontWeight: 700, color: T.blue, fontFamily: 'monospace',
        }}>S</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{shape.label}</div>
          <div style={{ fontSize: 11, color: T.textDim, fontFamily: 'monospace', marginTop: 1 }}>{shape.pattern}</div>
        </div>
        <button onClick={onToggle}
          style={{ padding: '3px 9px', background: '#fff', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 11, color: T.textDim, cursor: 'pointer' }}>
          {expanded ? '▴ less' : '▾ more'}
        </button>
      </div>

      {/* Description (always shown) */}
      <div style={{ fontSize: 12, color: T.textSub, lineHeight: 1.55, marginBottom: 6 }}>
        {shape.description}
      </div>

      {/* Examples — first one always shown; rest when expanded */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {(expanded ? shape.examples : shape.examples.slice(0, 1)).map((ex, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', fontSize: 12 }}>
            <span style={{ color: T.text, fontStyle: 'italic' }}>"{ex.sentence}"</span>
            <span style={{ color: T.blue, fontWeight: 600, fontFamily: 'monospace' }}>→ {ex.highlight}</span>
          </div>
        ))}
        {!expanded && shape.examples.length > 1 && (
          <span style={{ fontSize: 10, color: T.textDim, fontStyle: 'italic' }}>+{shape.examples.length - 1} more</span>
        )}
      </div>

      {/* Test words — only when expanded */}
      {expanded && shape.testWords && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px dashed ${T.border}` }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: T.label, textTransform: 'uppercase', marginBottom: 4 }}>
            Test words
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {shape.testWords.map((w, i) => (
              <span key={i} style={{
                padding: '2px 7px', background: '#fff', border: `1px solid ${T.border}`, borderRadius: 3,
                fontSize: 11, color: T.textSub, fontFamily: 'monospace',
              }}>{w}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Exception shape card ────────────────────────────────────────────────────

function ExceptionShapeCard({ shape, expanded, onToggle }) {
  // Detected status: true (full), 'partial', false (not yet)
  const detectedText  = shape.detected === true  ? 'detected' : shape.detected === 'partial' ? 'partial' : 'not yet'
  const detectedBg    = shape.detected === true  ? T.greenBg : shape.detected === 'partial' ? T.amberBg : '#fff'
  const detectedBord  = shape.detected === true  ? T.greenBord : shape.detected === 'partial' ? T.amberBord : T.border
  const detectedFg    = shape.detected === true  ? T.green   : shape.detected === 'partial' ? T.amber  : T.textDim

  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '12px 14px', marginBottom: 8 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
        <span style={{
          padding: '3px 9px', background: T.violetBg, border: `1px solid ${T.violetBord}`, borderRadius: 4,
          fontSize: 11, fontWeight: 700, color: T.violet, fontFamily: 'monospace', letterSpacing: '0.04em', textTransform: 'uppercase',
        }}>exc</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{shape.label}</div>
          <div style={{ fontSize: 11, color: T.textDim, fontFamily: 'monospace', marginTop: 1 }}>{shape.pattern}</div>
        </div>
        <span style={{
          padding: '2px 7px', background: detectedBg, border: `1px solid ${detectedBord}`, borderRadius: 3,
          fontSize: 10, fontWeight: 700, color: detectedFg, letterSpacing: '0.04em', textTransform: 'uppercase',
        }}>{detectedText}</span>
        <button onClick={onToggle}
          style={{ padding: '3px 9px', background: '#fff', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 11, color: T.textDim, cursor: 'pointer' }}>
          {expanded ? '▴ less' : '▾ more'}
        </button>
      </div>

      {/* Description (always shown) */}
      <div style={{ fontSize: 12, color: T.textSub, lineHeight: 1.55, marginBottom: 6 }}>
        {shape.description}
      </div>

      {/* Trigger (always shown — central to detection) */}
      <div style={{ fontSize: 11, color: T.textSub, marginBottom: 6, display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: T.label, textTransform: 'uppercase', minWidth: 50 }}>trigger</span>
        <span style={{ fontStyle: 'italic' }}>{shape.trigger}</span>
      </div>

      {/* Examples — first one always shown; rest when expanded */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {(expanded ? shape.examples : shape.examples.slice(0, 1)).map((ex, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', fontSize: 12 }}>
            <span style={{ color: T.text, fontStyle: 'italic' }}>"{ex.sentence}"</span>
            <span style={{ color: T.violet, fontWeight: 600, fontFamily: 'monospace' }}>→ {ex.highlight}</span>
          </div>
        ))}
        {!expanded && shape.examples.length > 1 && (
          <span style={{ fontSize: 10, color: T.textDim, fontStyle: 'italic' }}>+{shape.examples.length - 1} more</span>
        )}
      </div>

      {/* Test words — only when expanded */}
      {expanded && shape.testWords && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px dashed ${T.border}` }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: T.label, textTransform: 'uppercase', marginBottom: 4 }}>
            Test words
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {shape.testWords.map((w, i) => (
              <span key={i} style={{
                padding: '2px 7px', background: '#fff', border: `1px solid ${T.border}`, borderRadius: 3,
                fontSize: 11, color: T.textSub, fontFamily: 'monospace',
              }}>{w}</span>
            ))}
          </div>
        </div>
      )}
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
  const [typedSentence, setTypedSentence] = useState('')
  const verbCardRefs = useRef({})

  // Phase 3a — process the typed sentence forward.
  //
  // Word 0 is the dispatch point: it announces which lane the sentence is on.
  //   • Fundamental lane: regular declarative (first word is a Subject candidate)
  //   • Exception lane:   operation announcement (auxiliary/modal/wh-word/bare verb/"there")
  //
  // For the fundamental lane: split the sentence around the verb.
  //   tokens before verb → candidate Subject
  //   the verb token     → matched verb (with its argument structures)
  //   tokens after verb  → not parsed yet (Phase 3c will handle this)
  //
  // For exception lanes: detection only in Phase 3a. Full handling comes in
  // Phase 5 (marked constructions) and Phase 6 (operations).
  //
  // Match on baseForm, lowercased, punctuation stripped. No morphology yet.
  const parsed = useMemo(() => {
    const trimmed = typedSentence.trim()
    if (!trimmed) {
      return {
        tokens: [], lane: 'empty', exceptionType: null,
        verbIndex: -1, matchedVerb: null, subjectText: '', afterVerbText: '',
      }
    }
    const tokens = trimmed.split(/\s+/).filter(Boolean)
    const { lane, exceptionType } = classifyLane(tokens, trimmed)

    let verbIndex = -1
    let matchedVerb = null
    for (let i = 0; i < tokens.length; i++) {
      const cleaned = tokens[i].toLowerCase().replace(/[^\w]/g, '')
      const match = VERB_STRUCTURES.find(v => v.baseForm === cleaned)
      if (match) {
        verbIndex = i
        matchedVerb = match
        break
      }
    }

    // Subject candidate is meaningful only on the fundamental lane.
    // On exception lanes the subject is either elided (imperative), inverted
    // (yes/no, wh), or a dummy (existential) — handled in later phases.
    const subjectText = lane === 'fundamental'
      ? (verbIndex >= 0 ? tokens.slice(0, verbIndex).join(' ') : tokens.join(' '))
      : ''

    // Detect subject shape (only on fundamental lane).
    const subjectShape = lane === 'fundamental' && subjectText
      ? detectSubjectShape(subjectText)
      : null
    const nounNumber = lane === 'fundamental' && subjectText
      ? detectNounNumber(subjectText)
      : 'unknown'
    const articleWarning = lane === 'fundamental' && subjectText
      ? checkArticleAgreement(subjectText)
      : null

    return { tokens, lane, exceptionType, verbIndex, matchedVerb, subjectText, subjectShape, nounNumber, articleWarning }
  }, [typedSentence])

  const { lane, exceptionType, matchedVerb, subjectText, subjectShape, nounNumber, articleWarning } = parsed

  // Which slot-role cards should light up?
  // Phase 3a:
  //   • Subject — only on the fundamental lane, and only when pre-verb text exists
  //   • Verb    — whenever a verb is matched (regardless of lane; even imperatives have a verb)
  // Object, Complement, Adverbial come online in Phase 3c.
  const activeRoles = useMemo(() => {
    const set = new Set()
    if (lane === 'fundamental' && subjectText) set.add('subject')
    if (matchedVerb) set.add('verb')
    return set
  }, [lane, subjectText, matchedVerb])

  // (Auto-scroll on verb match removed — the amber glow is enough.
  // verbCardRefs is kept in case future phases want it for inspection actions.)

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
        padding: '14px 16px', marginBottom: 16, fontSize: 12, color: T.textSub, lineHeight: 1.65,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 6 }}>
          Forward Flow — top-down view of the macro layer
        </div>
        Where the <b>Flow</b> tab is retrospective (after a sentence is parsed, what fired), Forward Flow is prospective — as a sentence is built, what's committed, what's expected next, what hypotheses are still in play. The architecture is a forward-flowing pipeline; this tab is its dev surface.
        <br /><br />
        Design principle: <b>forward momentum</b>. A macro shape is the right primitive only if it can be detected from what's already been typed (left-to-right), constrains what can come next, and composes naturally with the next shape. See <code style={{ background: '#fff', padding: '1px 5px', borderRadius: 3 }}>notes/macro-layer-sketch.md</code> for the full architecture.
      </div>

      {/* Phase 3a — live forward-flow detection. As the user types, classify
          the dispatch lane (fundamental vs. exception), detect the candidate
          Subject, and match the verb. Slot-role cards and verb-structure
          cards light up live. */}
      <div style={{
        background: '#fff', border: `1px solid ${T.border}`, borderRadius: 6,
        padding: '12px 14px', marginBottom: 24,
      }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: T.label, textTransform: 'uppercase', marginBottom: 8 }}>
          Live forward-flow detection (Phase 3a)
        </div>
        <input type="text" value={typedSentence} onChange={e => setTypedSentence(e.target.value)}
          placeholder="Type a sentence — e.g. 'I gave him a book' or 'Did you eat?'"
          style={{
            width: '100%', padding: '8px 12px', fontSize: 15, color: T.text,
            border: `1px solid ${T.border}`, borderRadius: 4, background: T.page,
            boxSizing: 'border-box', fontFamily: 'system-ui, sans-serif',
          }} />

        {/* Status panel — updates on every keystroke */}
        <div style={{ marginTop: 10, fontSize: 12, color: T.textSub, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {lane === 'empty' && (
            <span style={{ fontStyle: 'italic', color: T.textDim }}>waiting for input</span>
          )}

          {lane === 'fundamental' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: T.green, textTransform: 'uppercase', minWidth: 70 }}>lane</span>
                <span style={{ fontWeight: 700, color: T.green }}>fundamental</span>
                <span style={{ fontStyle: 'italic', color: T.textDim }}>(regular declarative — Subject opens the sentence)</span>
              </div>
              {subjectText && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <SlotChip shortLabel="S" />
                    <span style={{ color: T.text }}>candidate Subject: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{subjectText}</span></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', paddingLeft: 28 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: T.label, textTransform: 'uppercase' }}>shape</span>
                    {subjectShape ? (
                      <>
                        <span style={{
                          padding: '2px 8px', background: T.blueBg, border: `1px solid ${T.blueBord}`, borderRadius: 4,
                          fontSize: 12, fontWeight: 700, color: T.blue,
                        }}>{getSubjectShape(subjectShape, 'en')?.label ?? subjectShape}</span>
                        {nounNumber !== 'unknown' && (
                          <span style={{
                            padding: '1px 6px', background: '#fff', border: `1px solid ${T.border}`, borderRadius: 3,
                            fontSize: 10, color: T.textDim, fontFamily: 'monospace',
                          }}>{nounNumber}</span>
                        )}
                      </>
                    ) : (
                      <span style={{ fontStyle: 'italic', color: T.textDim }}>shape not yet recognized — try a pronoun, determiner+noun, or quantifier+noun</span>
                    )}
                  </div>
                  {articleWarning && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 28, marginTop: 4,
                      padding: '6px 10px', background: T.amberBg, border: `1px solid ${T.amberBord}`, borderRadius: 4,
                      fontSize: 11, color: T.amber, lineHeight: 1.5,
                    }}>
                      <span style={{ fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: 9 }}>a/an</span>
                      <span>{articleWarning}</span>
                    </div>
                  )}
                </>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <SlotChip shortLabel="V" />
                {matchedVerb ? (
                  <>
                    <span style={{ color: T.text }}>matched Verb:</span>
                    <span style={{
                      padding: '2px 8px', background: T.amberBg, border: `1px solid ${T.amberBord}`, borderRadius: 4,
                      fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: T.amber,
                    }}>{matchedVerb.baseForm}</span>
                    <span style={{ fontStyle: 'italic', color: T.textDim }}>· card scrolled into view</span>
                  </>
                ) : (
                  <span style={{ fontStyle: 'italic', color: T.textDim }}>looking for a known verb…</span>
                )}
              </div>
            </>
          )}

          {lane === 'exception' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: T.violet, textTransform: 'uppercase', minWidth: 70 }}>lane</span>
                <span style={{ fontWeight: 700, color: T.violet }}>exception</span>
                <span style={{
                  padding: '2px 8px', background: T.violetBg, border: `1px solid ${T.violetBord}`, borderRadius: 4,
                  fontSize: 12, fontWeight: 700, color: T.violet,
                }}>{EXCEPTION_LANE_LABELS[exceptionType] ?? exceptionType}</span>
              </div>
              <div style={{ fontSize: 11, color: T.textDim, lineHeight: 1.55, fontStyle: 'italic' }}>
                {EXCEPTION_LANE_NOTES[exceptionType] ?? 'Exception detected; full handling in later phases.'}
              </div>
              {matchedVerb && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <SlotChip shortLabel="V" />
                  <span style={{ color: T.text }}>verb in text:</span>
                  <span style={{
                    padding: '2px 8px', background: T.amberBg, border: `1px solid ${T.amberBord}`, borderRadius: 4,
                    fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: T.amber,
                  }}>{matchedVerb.baseForm}</span>
                  <span style={{ fontStyle: 'italic', color: T.textDim }}>· card scrolled into view</span>
                </div>
              )}
            </>
          )}
        </div>

        <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px dashed ${T.border}`, fontSize: 10, color: T.textDim, fontStyle: 'italic' }}>
          Phase 3a only matches base forms (eat, give, run, live, put, make, be). Inflected forms ("ate", "gave") will match later when morphology is wired in. Exception-lane handling is detection-only for now; full processing comes in Phase 5 (marked constructions) and Phase 6 (operations).
        </div>
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
          {VERB_STRUCTURES.map(verb => {
            const isMatch = matchedVerb?.verbId === verb.verbId
            return (
              <div key={verb.verbId}
                ref={el => { verbCardRefs.current[verb.verbId] = el }}
                style={{
                  outline: isMatch ? `3px solid ${T.amber}` : 'none',
                  outlineOffset: '3px',
                  borderRadius: 6,
                  transition: 'outline 200ms',
                }}>
                <VerbStructureCard verb={verb} expanded={!!expanded[verb.verbId]} onToggle={() => toggle(verb.verbId)} />
              </div>
            )
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          CORE GROUP — fundamental Subject shapes
          ───────────────────────────────────────────────────────────────────── */}
      <div style={{ marginTop: 32, paddingTop: 24, borderTop: `2px solid ${T.green}` }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: T.green, textTransform: 'uppercase', marginBottom: 6 }}>
          Core group — the fundamentals
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
          <Section>Subject Shapes ({SUBJECT_SHAPES.length}) — what fills the S slot</Section>
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
          The 8 ways an English Subject can be shaped. Type a sentence above; if its Subject matches one of these shapes, that card lights up.
        </div>
        <div>
          {SUBJECT_SHAPES.map(shape => {
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
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          EXCEPTION GROUP — marked sentence openings
          ───────────────────────────────────────────────────────────────────── */}
      <div style={{ marginTop: 32, paddingTop: 24, borderTop: `2px solid ${T.violet}` }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: T.violet, textTransform: 'uppercase', marginBottom: 6 }}>
          Exception group — the marked openings
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
          <Section>Exception Shapes ({EXCEPTION_SHAPES.length}) — sentences that don't open with a Subject</Section>
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
          The 7 marked openings — each announces a different sentence trajectory than the regular declarative. Each card shows whether Phase 3a currently detects it.
        </div>
        <div>
          {EXCEPTION_SHAPES.map(shape => {
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
