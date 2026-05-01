// Verb Internal Chain — English
//
// The V slot's internal structure. Where the Subject slot has alternative
// internal shapes (pronoun OR det+noun OR gerund — pick one), the Verb
// slot has SEQUENCED internal positions. Multiple positions can be filled
// at once, and they appear in a fixed canonical order.
//
// Quirk et al.'s notation:    M + Perf + Prog + Pass + V
//   (Modal) (Perfect) (Progressive) (Passive) (Lexical)
//
// Maximally: "She might have been being watched"
//            modal + perfect + progressive + passive + lexical
//
// Each position projects forward to a specific verb form, which is what
// makes this a forward-momentum dispatch surface — the moment one position
// fills, the form of the next is constrained.
//
// Plus two non-position entries that interact with the chain:
//   - Negation:   a decoration that attaches after the chain's first element
//   - Do-support: a mechanism that inserts do/does/did when no other
//                 auxiliary is available to bear negation/inversion/emphasis
//
// ── Record shape ──────────────────────────────────────────────────────────
//   id          — string, machine id matching the detector's classification
//   label       — string, human-readable position name
//   kind        — 'chain_position' | 'decoration' | 'mechanism'
//   order       — integer (chain_position only) for the canonical order
//   words       — array of surface forms that fill this position (or null for lexical)
//   projects    — string, what verb form this position forces next (or null)
//   examples    — array of { sentence, highlight }
//   notes       — string, explanatory note
//
// Source: notes/macro-layer-sketch.md (alternative vs. sequenced catalogs)
//
// Router: verbInternalChain.js

export const VERB_INTERNAL_CHAIN = [
  // ── Canonical chain positions (in order) ─────────────────────────────────
  {
    id:       'modal',
    label:    'Modal',
    kind:     'chain_position',
    order:    1,
    words:    ['can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must', 'ought'],
    projects: 'bare infinitive',
    examples: [
      { sentence: 'I must run.',           highlight: 'must' },
      { sentence: 'She can swim.',         highlight: 'can' },
      { sentence: 'They will go home.',    highlight: 'will' },
    ],
    notes:    'Defective verbs: no -s for 3rd person singular ("she must" not "she musts"), no infinitive ("to must" doesn\'t exist), no participles. The next verb in the cluster is in bare infinitive form.',
  },
  {
    id:       'perfect',
    label:    'Perfect',
    kind:     'chain_position',
    order:    2,
    words:    ['have', 'has', 'had', 'having'],
    projects: 'past participle',
    examples: [
      { sentence: 'She has eaten.',        highlight: 'has' },
      { sentence: 'They had left early.',  highlight: 'had' },
      { sentence: 'I have seen it.',       highlight: 'have' },
    ],
    notes:    'have/has/had + past participle. Bears subject-verb agreement when leftmost in the chain (he has, they have). Realizes perfect aspect: the action is completed before the reference time.',
  },
  {
    id:       'progressive',
    label:    'Progressive',
    kind:     'chain_position',
    order:    3,
    words:    ['am', 'is', 'are', 'was', 'were', 'being', 'been', 'be'],
    projects: 'present participle (-ing form)',
    examples: [
      { sentence: 'She is running.',       highlight: 'is' },
      { sentence: 'They were eating.',     highlight: 'were' },
      { sentence: 'I am reading.',         highlight: 'am' },
    ],
    notes:    'be + -ing form. Realizes progressive aspect: the action is ongoing at the reference time. Surface form (BE) is shared with Passive — the next verb form disambiguates (BE + -ing = Progressive; BE + past participle = Passive).',
  },
  {
    id:       'passive',
    label:    'Passive',
    kind:     'chain_position',
    order:    4,
    words:    ['am', 'is', 'are', 'was', 'were', 'being', 'been', 'be'],
    projects: 'past participle',
    examples: [
      { sentence: 'The food was eaten.',   highlight: 'was' },
      { sentence: 'She is admired.',       highlight: 'is' },
      { sentence: 'It has been seen.',     highlight: 'been' },
    ],
    notes:    'be + past participle. Realizes passive voice: the surface subject is the patient/theme, not the agent. Surface form (BE) is shared with Progressive — disambiguated by what comes next.',
  },
  {
    id:       'lexical',
    label:    'Lexical verb',
    kind:     'chain_position',
    order:    5,
    words:    null,  // any content verb in the language
    projects: null,  // end of chain
    examples: [
      { sentence: 'She runs.',                 highlight: 'runs' },
      { sentence: 'She might have been running.', highlight: 'running' },
      { sentence: 'They eat food.',            highlight: 'eat' },
    ],
    notes:    'The content-bearing verb that anchors the predicate. Always the rightmost element of the chain. Its form is determined by whatever chain position immediately precedes it (modal → bare; perfect → past participle; progressive → -ing; passive → past participle). When the chain has only this position (no auxiliaries), it bears subject-verb agreement directly.',
  },

  // ── Decoration ──────────────────────────────────────────────────────────
  {
    id:       'negation',
    label:    'Negation',
    kind:     'decoration',
    order:    null,
    words:    ['not', "n't"],
    projects: null,
    examples: [
      { sentence: 'She has not eaten.',    highlight: 'not' },
      { sentence: 'I cannot run.',         highlight: 'not' },
      { sentence: 'They don\'t know.',     highlight: "n't" },
    ],
    notes:    'Not a chain position — a decoration that attaches after the chain\'s first element. When no auxiliary is otherwise present, triggers do-support: "She runs" + negation → "She does not run" (do is inserted). Contracted form -n\'t attaches to the same element ("hasn\'t", "won\'t", "doesn\'t").',
  },

  // ── Mechanism ───────────────────────────────────────────────────────────
  {
    id:       'do_support',
    label:    'Do-support',
    kind:     'mechanism',
    order:    null,
    words:    ['do', 'does', 'did'],
    projects: 'bare infinitive',
    examples: [
      { sentence: 'Did you eat?',          highlight: 'Did' },
      { sentence: 'She does not run.',     highlight: 'does' },
      { sentence: 'I do eat.',             highlight: 'do' },  // emphatic
    ],
    notes:    'Not a canonical chain position — a mechanism that inserts do/does/did when there is no other auxiliary available to bear negation, question inversion, or emphasis. "She runs" → "Does she run?" / "She does not run" / "She *does* run" (emphatic). Surface form do/does/did is shared with the lexical verb "do" ("She does her homework"); disambiguation depends on what follows.',
  },
]
