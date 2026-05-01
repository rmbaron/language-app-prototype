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

import { useState, useMemo } from 'react'
import { getSlotRoles, getSlotRoleByShortLabel } from './slotRoles'
import { getArgumentStructures } from './argumentStructures'
import { getSubjectShapes, getSubjectShape } from './subjectShapes'
import { detectSubjectShape, detectNounNumber, checkArticleAgreement, computeSubjectFeatures, expectedVerbAgreement } from './subjectShapeDetector'
import { getExceptionShapes } from './exceptionShapes'
import { getVerbInternalChain } from './verbInternalChain'
import { FORWARD_FLOW_FINDINGS } from './forwardFlowFindings.en.js'

const SLOT_ROLES = getSlotRoles('en')
const VERB_STRUCTURES = getArgumentStructures('en')
const SUBJECT_SHAPES = getSubjectShapes('en')
const EXCEPTION_SHAPES = getExceptionShapes('en')
const VERB_CHAIN = getVerbInternalChain('en')

// ── Frame library ───────────────────────────────────────────────────────────
// Inverts the verb-first argumentStructures data into a frame-first index.
// Structure comes first; words follow. There are 7 frames; there can be
// arbitrarily many words per frame.

const FRAME_METADATA = {
  'S+V':       { label: 'Intransitive',                          description: 'Verb takes only a subject. No object, no complement, no obligatory adverbial.' },
  'S+V+O':     { label: 'Transitive',                            description: 'Verb takes a subject and a single direct object.' },
  'S+V+O+O':   { label: 'Ditransitive',                          description: 'Verb takes two objects: indirect (recipient) before direct (theme). "He gave [me] [a book]."' },
  'S+V+O+A':   { label: 'Transitive + obligatory adverbial',     description: 'Verb takes a subject, an object, and an obligatory adverbial. Includes the dative-shifted form of ditransitives ("He gave a book to me") and verbs that require a locative ("She put the book on the table").' },
  'S+V+O+C':   { label: 'Transitive + object complement',        description: 'Verb takes a subject, an object, and a complement that predicates over the object. "She makes him happy."' },
  'S+V+A':     { label: 'Intransitive + obligatory adverbial',   description: 'Verb takes a subject and an obligatory adverbial. The verb cannot stand without it. "He lives in London."' },
  'S+V+C':     { label: 'Copular',                               description: 'Linking verb (be, seem, become, etc.) connects the subject to a complement that predicates over it. "She is happy."' },
}

const FRAME_LIBRARY = (() => {
  const byFrame = new Map()
  for (const verb of VERB_STRUCTURES) {
    for (const frame of verb.frames) {
      const sig = frame.slots.join('+')
      if (!byFrame.has(sig)) {
        const meta = FRAME_METADATA[sig] ?? { label: sig, description: '' }
        byFrame.set(sig, {
          signature: sig,
          slots: frame.slots,
          label: meta.label,
          description: meta.description,
          verbs: [],
        })
      }
      byFrame.get(sig).verbs.push({ verb, frame })
    }
  }
  // Sort by slot count, then by signature.
  return [...byFrame.values()].sort((a, b) =>
    a.slots.length - b.slots.length || a.signature.localeCompare(b.signature)
  )
})()

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
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: expanded ? '14px 16px' : '10px 14px', marginBottom: 8 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: expanded ? 8 : 0 }}>
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

      {/* Description (only when expanded) */}
      {expanded && (
      <div style={{ fontSize: 13, color: T.textSub, lineHeight: 1.55 }}>
        {role.description}
      </div>
      )}

      {/* Polymorphism note (only when expanded if polymorphic) */}
      {expanded && role.polymorphic && role.polymorphismNote && (
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

// ── The auxiliary chain — canonical 5-slot model ───────────────────────────
//
// Quirk et al.'s structure:    M + Perf + Prog + Pass + V
//   (Modal) (Perfect) (Progressive) (Passive) (Lexical verb)
//
// Each slot is optional, but if multiple are present they appear in this
// fixed order. Each one projects forward to a specific verb form:
//   Modal       → bare infinitive
//   Perfect     → past participle
//   Progressive → present participle (-ing)
//   Passive     → past participle
//   Lexical     → end of chain
//
// Progressive and Passive both use forms of BE; without morphology of the
// next word we can't always disambiguate, so they share a "BE-aux" detection
// label and resolve later when the lexical-verb form is known.
//
// Negation ("not", "n't") is NOT a slot — it's a decoration that attaches
// after the first element of the chain.
//
// Do-support is also NOT a slot — it's a mechanism that inserts "do/does/did"
// when there's no other auxiliary to bear negation, inversion, or emphasis.

const AUX_SLOTS = {
  modal: {
    id:       'modal',
    label:    'Modal',
    words:    new Set(['can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must', 'ought']),
    projects: 'bare infinitive',
    examples: ['run', 'eat', 'be', 'have', 'see'],
    note:     'Defective verbs — no -s for 3rd person, no infinitive, no participles. Project a bare-form verb next.',
  },
  perfect: {
    id:       'perfect',
    label:    'Perfect',
    words:    new Set(['have', 'has', 'had', 'having']),
    projects: 'past participle',
    examples: ['eaten', 'run', 'been', 'seen', 'taken'],
    note:     'have/has/had + past participle. Bears agreement (he has, they have).',
  },
  be_aux: {
    id:       'be_aux',
    label:    'Progressive or Passive',
    words:    new Set(['am', 'is', 'are', 'was', 'were', 'being', 'been', 'be']),
    projects: '-ing form (Progressive) OR past participle (Passive)',
    examples: ['running (Prog)', 'eaten (Pass)'],
    note:     'Ambiguous without the next form. Progressive uses BE + -ing ("is running"); Passive uses BE + past participle ("was seen"). Resolved when the lexical form is identified.',
  },
  do_support: {
    id:       'do_support',
    label:    'Do-support',
    words:    new Set(['do', 'does', 'did']),
    projects: 'bare infinitive',
    examples: ['run', 'eat', 'be'],
    note:     'Inserted when there\'s no other auxiliary available to bear negation ("does not eat"), question inversion ("did she eat?"), or emphasis ("I do eat"). Not a canonical chain slot — a mechanism.',
  },
}

const NEGATION = {
  id:       'negation',
  label:    'Negation',
  words:    new Set(['not', "n't"]),
  note:     'Attaches after the first element of the auxiliary chain. Decorates the chain rather than occupying its own slot. Triggers do-support when no auxiliary is otherwise present.',
}

const ALL_AUX_AND_NEG = new Set([
  ...AUX_SLOTS.modal.words,
  ...AUX_SLOTS.perfect.words,
  ...AUX_SLOTS.be_aux.words,
  ...AUX_SLOTS.do_support.words,
  ...NEGATION.words,
])

function classifyAuxToken(token) {
  const t = token.toLowerCase().replace(/[^\w']/g, '')
  for (const slot of Object.values(AUX_SLOTS)) {
    if (slot.words.has(t)) return slot
  }
  if (NEGATION.words.has(t)) return NEGATION
  return null
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

// ── Frame card — frame first, words underneath ─────────────────────────────

// Frame card pagination — start with 30 verbs and expand on demand. The
// frame's verb list grows linearly with the seed; this is the foundation
// for handling 1000+ verbs without rendering them all at once.
const FRAME_VERBS_PAGE_SIZE = 30

function FrameCard({ frame, matchedVerbId, expanded, onToggle }) {
  const [showAllVerbs, setShowAllVerbs] = useState(false)
  const matchedVerbInFrame = matchedVerbId && frame.verbs.some(v => v.verb.verbId === matchedVerbId)
  // If the matched verb is past the first page, force-show all so the user
  // doesn't have to click "show more" to see why their card is highlighted.
  const matchedPastFirstPage = matchedVerbId && frame.verbs.slice(FRAME_VERBS_PAGE_SIZE).some(v => v.verb.verbId === matchedVerbId)
  const effectiveShowAll = showAllVerbs || matchedPastFirstPage
  const verbsToShow = effectiveShowAll ? frame.verbs : frame.verbs.slice(0, FRAME_VERBS_PAGE_SIZE)
  const hiddenCount = frame.verbs.length - verbsToShow.length

  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: expanded ? '14px 16px' : '10px 14px', marginBottom: 8 }}>
      {/* Header — slot signature + general label + verb count */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: expanded ? 8 : 0, flexWrap: 'wrap' }}>
        <SlotSignature slots={frame.slots} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{frame.label}</div>
          <div style={{ fontSize: 11, color: T.textDim, fontFamily: 'monospace', marginTop: 1 }}>
            {frame.signature} · {frame.verbs.length} verb{frame.verbs.length === 1 ? '' : 's'}
            {matchedVerbInFrame && <span style={{ marginLeft: 6, color: T.amber, fontWeight: 700 }}>· match: {matchedVerbId}</span>}
          </div>
        </div>
        <button onClick={onToggle}
          style={{ padding: '4px 10px', background: '#fff', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 11, color: T.textDim, cursor: 'pointer' }}>
          {expanded ? '▴ less' : '▾ more'}
        </button>
      </div>

      {/* Description + verb list — only when expanded */}
      {expanded && (<>
      <div style={{ fontSize: 12, color: T.textSub, lineHeight: 1.55, marginBottom: 8 }}>
        {frame.description}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {verbsToShow.map(({ verb, frame: verbFrame }) => {
          const isVerbMatched = matchedVerbId === verb.verbId
          return (
            <div key={verb.verbId + ':' + verbFrame.id}
              style={{
                background: '#fff',
                border: `1px solid ${isVerbMatched ? T.amberBord : T.border}`,
                outline: isVerbMatched ? `2px solid ${T.amberBord}` : 'none',
                outlineOffset: '1px',
                borderRadius: 5,
                padding: '8px 12px',
                transition: 'outline 200ms, border 200ms',
              }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                <span style={{
                  padding: '3px 10px', background: T.amberBg, border: `1px solid ${T.amberBord}`, borderRadius: 4,
                  fontSize: 14, fontWeight: 800, fontFamily: 'monospace', color: T.amber,
                }}>
                  {verb.baseForm}
                </span>
                <span style={{ fontSize: 11, color: T.textDim, fontFamily: 'monospace' }}>
                  {verbFrame.label}
                </span>
                <span style={{ fontSize: 12, color: T.text, fontStyle: 'italic', flex: 1 }}>
                  "{verbFrame.example}"
                </span>
                {!verb.inSeed && (
                  <span style={{ fontSize: 9, color: T.amber, fontStyle: 'italic' }}>
                    not in seed
                  </span>
                )}
              </div>

              {/* Per-verb frame notes — only when expanded */}
              {expanded && (verbFrame.notes || verbFrame.slotNotes) && (
                <div style={{ marginTop: 6, paddingTop: 6, borderTop: `1px dashed ${T.border}` }}>
                  {verbFrame.notes && (
                    <div style={{ fontSize: 11, color: T.textSub, lineHeight: 1.5, marginBottom: verbFrame.slotNotes ? 6 : 0 }}>
                      {verbFrame.notes}
                    </div>
                  )}
                  {verbFrame.slotNotes && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {Object.entries(verbFrame.slotNotes).map(([idx, note]) => {
                        const slotChar = verbFrame.slots[Number(idx)]
                        return (
                          <div key={idx} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                            <span style={{ fontSize: 10, color: T.textDim, fontFamily: 'monospace', minWidth: 50 }}>
                              slot {idx} ({slotChar})
                            </span>
                            <span style={{ fontSize: 10, color: T.textSub, lineHeight: 1.5, flex: 1 }}>{note}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
      {hiddenCount > 0 && !effectiveShowAll && (
        <button onClick={() => setShowAllVerbs(true)}
          style={{
            marginTop: 8, padding: '6px 12px',
            background: '#fff', border: `1px solid ${T.border}`, borderRadius: 4,
            fontSize: 12, color: T.textSub, cursor: 'pointer', fontWeight: 600,
          }}>
          show all {frame.verbs.length} verbs ({hiddenCount} hidden)
        </button>
      )}
      {effectiveShowAll && frame.verbs.length > FRAME_VERBS_PAGE_SIZE && !matchedPastFirstPage && (
        <button onClick={() => setShowAllVerbs(false)}
          style={{
            marginTop: 8, padding: '6px 12px',
            background: '#fff', border: `1px solid ${T.border}`, borderRadius: 4,
            fontSize: 12, color: T.textSub, cursor: 'pointer', fontWeight: 600,
          }}>
          show only first {FRAME_VERBS_PAGE_SIZE}
        </button>
      )}
      </>)}
    </div>
  )
}

// ── Subject shape card ──────────────────────────────────────────────────────

function SubjectShapeCard({ shape, expanded, onToggle }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: expanded ? '12px 14px' : '8px 12px', marginBottom: 6 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: expanded ? 6 : 0 }}>
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

      {/* Description + examples + test words — only when expanded */}
      {expanded && (<>
      <div style={{ fontSize: 12, color: T.textSub, lineHeight: 1.55, marginBottom: 6 }}>
        {shape.description}
      </div>

      {/* Examples */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {shape.examples.map((ex, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', fontSize: 12 }}>
            <span style={{ color: T.text, fontStyle: 'italic' }}>"{ex.sentence}"</span>
            <span style={{ color: T.blue, fontWeight: 600, fontFamily: 'monospace' }}>→ {ex.highlight}</span>
          </div>
        ))}
      </div>
      </>)}

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
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: expanded ? '12px 14px' : '8px 12px', marginBottom: 6 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: expanded ? 6 : 0 }}>
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

      {/* Description, trigger, examples — only when expanded */}
      {expanded && (<>
      <div style={{ fontSize: 12, color: T.textSub, lineHeight: 1.55, marginBottom: 6 }}>
        {shape.description}
      </div>
      <div style={{ fontSize: 11, color: T.textSub, marginBottom: 6, display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: T.label, textTransform: 'uppercase', minWidth: 50 }}>trigger</span>
        <span style={{ fontStyle: 'italic' }}>{shape.trigger}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {shape.examples.map((ex, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', fontSize: 12 }}>
            <span style={{ color: T.text, fontStyle: 'italic' }}>"{ex.sentence}"</span>
            <span style={{ color: T.violet, fontWeight: 600, fontFamily: 'monospace' }}>→ {ex.highlight}</span>
          </div>
        ))}
      </div>
      </>)}

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

// ── Verb internal chain card ────────────────────────────────────────────────
// Shows one position (Modal/Perfect/Progressive/Passive/Lexical) or one
// non-position entry (Negation/Do-support). Sequenced catalog — the
// canonical chain order is preserved by the order of cards in the section.

function VerbChainCard({ entry, expanded, onToggle }) {
  // Decoration and mechanism get distinct visual treatment from the
  // canonical chain positions (which use violet, our verb-cluster color).
  const isPosition   = entry.kind === 'chain_position'
  const isMechanism  = entry.kind === 'mechanism'
  const isDecoration = entry.kind === 'decoration'

  const accentBg     = isPosition ? T.violetBg  : (isMechanism ? T.amberBg  : T.card)
  const accentBord   = isPosition ? T.violetBord: (isMechanism ? T.amberBord: T.border)
  const accentFg     = isPosition ? T.violet    : (isMechanism ? T.amber    : T.textDim)

  const kindLabel    = isPosition ? `position ${entry.order}` : (isMechanism ? 'mechanism' : 'decoration')

  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: expanded ? '12px 14px' : '8px 12px', marginBottom: 6 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: expanded ? 6 : 0 }}>
        <span style={{
          padding: '3px 9px', background: accentBg, border: `1px solid ${accentBord}`, borderRadius: 4,
          fontSize: 11, fontWeight: 700, color: accentFg, fontFamily: 'monospace', letterSpacing: '0.04em', textTransform: 'uppercase',
        }}>{kindLabel}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{entry.label}</div>
          {entry.projects && (
            <div style={{ fontSize: 11, color: T.textDim, fontFamily: 'monospace', marginTop: 1 }}>
              projects: {entry.projects}
            </div>
          )}
        </div>
        <button onClick={onToggle}
          style={{ padding: '3px 9px', background: '#fff', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 11, color: T.textDim, cursor: 'pointer' }}>
          {expanded ? '▴ less' : '▾ more'}
        </button>
      </div>

      {/* Words + examples + notes — only when expanded */}
      {expanded && (<>
      {entry.words && entry.words.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
          {entry.words.map((w, i) => (
            <span key={i} style={{
              padding: '2px 7px', background: '#fff', border: `1px solid ${accentBord}`, borderRadius: 3,
              fontSize: 11, color: accentFg, fontFamily: 'monospace',
            }}>{w}</span>
          ))}
        </div>
      )}
      {!entry.words && (
        <div style={{ fontSize: 11, color: T.textDim, fontStyle: 'italic', marginBottom: 6 }}>
          (any content verb in the language)
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {entry.examples.map((ex, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', fontSize: 12 }}>
            <span style={{ color: T.text, fontStyle: 'italic' }}>"{ex.sentence}"</span>
            <span style={{ color: accentFg, fontWeight: 600, fontFamily: 'monospace' }}>→ {ex.highlight}</span>
          </div>
        ))}
      </div>

      {entry.notes && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px dashed ${T.border}`, fontSize: 12, color: T.textSub, lineHeight: 1.55 }}>
          {entry.notes}
        </div>
      )}
      </>)}
    </div>
  )
}

// ── Status accordion section ────────────────────────────────────────────────
// Used inside the live status panel to give each detail group its own
// click-to-expand row. Default-collapsed; one-line preview when collapsed.

function StatusAccordionSection({ title, preview, accent = T.label, open, onToggle, children }) {
  return (
    <div style={{
      border: `1px solid ${T.border}`, borderRadius: 4,
      marginTop: 6, background: '#fff',
    }}>
      <button onClick={onToggle}
        style={{
          width: '100%', textAlign: 'left',
          padding: '6px 10px', background: 'transparent', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
        }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: accent, textTransform: 'uppercase', minWidth: 90 }}>
          {title}
        </span>
        {preview && !open && (
          <span style={{ flex: 1, fontSize: 11, color: T.textSub, fontStyle: 'italic' }}>{preview}</span>
        )}
        <span style={{ fontSize: 11, color: T.textDim, marginLeft: 'auto' }}>{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div style={{ padding: '6px 10px 10px', borderTop: `1px solid ${T.border}` }}>
          {children}
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

// Helper: case-insensitive match across an item's named text fields.
// Used by per-catalog search inputs.
function matchesSearch(item, query, fields) {
  const q = (query ?? '').toLowerCase().trim()
  if (!q) return true
  for (const f of fields) {
    const v = item[f]
    if (typeof v === 'string' && v.toLowerCase().includes(q)) return true
  }
  return false
}

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

  // Hierarchical grouping. Each catalog can group its entries by some
  // attribute. Skeleton implementation: a single state per catalog (currently
  // wired to Findings; pattern extends to Frame Library's verb lists,
  // Subject Shapes by atom-group, etc. as data scales).
  const [findingsGroupBy, setFindingsGroupBy] = useState('status') // 'status' | 'priority' | 'none'

  // Tiered live status — which accordion sections are open
  const [statusOpen, setStatusOpen] = useState({})
  const toggleStatus = (id) => setStatusOpen(curr => ({ ...curr, [id]: !curr[id] }))

  // Sub-tab definitions. The live detection panel sits above all of these
  // and stays visible regardless of which sub-tab is active.
  const SUB_TABS = [
    { id: 'roles',     label: 'Slot Roles',          group: 'shared',    count: SLOT_ROLES.length },
    { id: 'subjects',  label: 'Subject Shapes',      group: 'core',      count: SUBJECT_SHAPES.length },
    { id: 'frames',    label: 'Frame Library',       group: 'core',      count: FRAME_LIBRARY.length },
    { id: 'vchain',    label: 'Verb Internal',       group: 'core',      count: VERB_CHAIN.filter(e => e.kind === 'chain_position').length },
    { id: 'exceptions',label: 'Exception Shapes',    group: 'exception', count: EXCEPTION_SHAPES.length },
    { id: 'findings',  label: 'Findings',            group: 'shared',    count: FORWARD_FLOW_FINDINGS.filter(f => f.status === 'open').length },
    { id: 'future',    label: 'Future phases',       group: 'shared',    count: 4 },
  ]

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

    // Auxiliary chain: walk backwards from the lexical verb, picking up
    // canonical chain slots (Modal/Perfect/Progressive-or-Passive/Do-support)
    // and negation. The Subject ends where the chain begins.
    let chainStartIndex = verbIndex
    if (verbIndex > 0) {
      for (let i = verbIndex - 1; i >= 0; i--) {
        const t = tokens[i].toLowerCase().replace(/[^\w']/g, '')
        if (ALL_AUX_AND_NEG.has(t)) {
          chainStartIndex = i
        } else {
          break
        }
      }
    }
    const auxChain = (verbIndex > 0 && chainStartIndex < verbIndex)
      ? tokens.slice(chainStartIndex, verbIndex).map(tok => ({ token: tok, slot: classifyAuxToken(tok) }))
      : []

    // Subject candidate is meaningful only on the fundamental lane.
    // On exception lanes the subject is either elided (imperative), inverted
    // (yes/no, wh), or a dummy (existential) — handled later.
    // Subject ends at chainStartIndex (which equals verbIndex if no chain).
    const subjectText = lane === 'fundamental'
      ? (verbIndex >= 0 ? tokens.slice(0, chainStartIndex).join(' ') : tokens.join(' '))
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

    // Subject-Verb linking: once we have the Subject's shape, compute its
    // person/number features, then derive the expected verb agreement pattern.
    const subjectFeatures = (lane === 'fundamental' && subjectShape)
      ? computeSubjectFeatures(subjectText, subjectShape)
      : null
    const expectedAgreement = subjectFeatures
      ? expectedVerbAgreement(subjectFeatures)
      : null

    // Map detected chain elements to V-internal-chain catalog ids so we
    // can highlight the right catalog cards. The 'be_aux' detection is
    // ambiguous between Progressive and Passive, so it lights up both.
    const matchedChainIds = new Set()
    for (const { slot } of auxChain) {
      if (!slot) continue
      if (slot.id === 'be_aux') {
        matchedChainIds.add('progressive')
        matchedChainIds.add('passive')
      } else {
        matchedChainIds.add(slot.id)
      }
    }
    if (matchedVerb) matchedChainIds.add('lexical')

    return {
      tokens, lane, exceptionType, verbIndex, matchedVerb,
      subjectText, subjectShape, nounNumber, articleWarning,
      subjectFeatures, expectedAgreement, auxChain, matchedChainIds,
    }
  }, [typedSentence])

  const {
    lane, exceptionType, matchedVerb, subjectText,
    subjectShape, nounNumber, articleWarning,
    subjectFeatures, expectedAgreement, auxChain, matchedChainIds,
  } = parsed

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
            below to expand each detail group. Default-collapsed; the summary
            tells you the basics and you open what you want to inspect. */}
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
            <StatusAccordionSection title="Subject" id="subject"
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
            <StatusAccordionSection title="Auxiliary chain" id="chain"
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
            <StatusAccordionSection title="Verb expected" id="agreement"
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
            <StatusAccordionSection title="Exception details" id="exception"
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

      {/* Sub-tab navigation — switches between catalogs. The live panel above
          stays visible (sticky) regardless of which sub-tab is active. */}
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
          // Filter by search
          const filtered = FORWARD_FLOW_FINDINGS.filter(f => {
            const q = findingsSearch.toLowerCase().trim()
            if (!q) return true
            return [f.title, f.surfacedBy, f.missing, f.workaround, f.fix].some(s => (s ?? '').toLowerCase().includes(q))
          })

          // Group based on selection
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
