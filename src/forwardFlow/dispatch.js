// Forward Flow — left-edge dispatch + auxiliary-chain detection.
//
// classifyLane: given the tokens (and the original text), decide whether
// the sentence is on the fundamental lane (regular declarative — Subject
// first) or one of the exception lanes (operations / marked constructions).
//
// AUX_SLOTS: the canonical 5-slot auxiliary chain (Quirk et al.):
//   Modal + Perfect + Progressive + Passive + Lexical
//
// classifyAuxToken: classify a single between-Subject-and-Verb token as
// belonging to one of the chain slots, do-support, or negation.

import { getArgumentStructures } from '../argumentStructures'

const VERB_STRUCTURES = getArgumentStructures('en')

export const EXCEPTION_OPENERS = {
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

export const EXCEPTION_LANE_LABELS = {
  yes_no_question:         'Yes/no question',
  wh_question:             'Wh-question',
  existential_or_locative: 'Existential or locative-fronted',
  negative_inversion:      'Negative inversion',
  adverbial_fronting:      'Adverbial fronting',
  quotative_inversion:     'Quotative inversion',
  minor_sentence:          'Minor sentence / interjection',
  imperative:              'Imperative',
}

export const EXCEPTION_LANE_NOTES = {
  yes_no_question:         'Auxiliary or modal at position 0 — sentence opens with subject-aux inversion. Subject comes after the auxiliary; full handling in Phase 6 (operations).',
  wh_question:             'Wh-word at position 0 — sentence opens with wh-fronting. Full handling in Phase 6 (operations).',
  existential_or_locative: '"There" at position 0 — likely existential ("There is a problem") or locative-fronted ("There, on the table"). Full handling in Phase 5 (marked constructions).',
  negative_inversion:      'Negative or restrictive adverb at position 0 — forces subject-aux inversion. Marked register, often literary or emphatic.',
  adverbial_fronting:      'Time, place, or frequency adverb at position 0 — topicalized declarative. Subject and verb keep their normal order; only the adverbial moved.',
  quotative_inversion:     'Direct quotation at position 0, followed by an inverted verb of saying and its subject.',
  minor_sentence:          'A standalone discourse element — interjection, greeting, reply, or politeness marker. No Subject-Verb structure; the whole utterance is the unit.',
  imperative:              'Verb in base form at position 0 — sentence is an imperative; subject "you" is elided. Full handling in Phase 6 (subject_elision operation).',
}

// ── Auxiliary chain ────────────────────────────────────────────────────────
//
// Quirk et al.'s structure: M + Perf + Prog + Pass + V
// Each slot is optional, but if multiple are present they appear in fixed
// order. Each one projects forward to a specific verb form.
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

export const AUX_SLOTS = {
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

export const NEGATION = {
  id:       'negation',
  label:    'Negation',
  words:    new Set(['not', "n't"]),
  note:     'Attaches after the first element of the auxiliary chain. Decorates the chain rather than occupying its own slot. Triggers do-support when no auxiliary is otherwise present.',
}

export const ALL_AUX_AND_NEG = new Set([
  ...AUX_SLOTS.modal.words,
  ...AUX_SLOTS.perfect.words,
  ...AUX_SLOTS.be_aux.words,
  ...AUX_SLOTS.do_support.words,
  ...NEGATION.words,
])

export function classifyAuxToken(token) {
  const t = token.toLowerCase().replace(/[^\w']/g, '')
  for (const slot of Object.values(AUX_SLOTS)) {
    if (slot.words.has(t)) return slot
  }
  if (NEGATION.words.has(t)) return NEGATION
  return null
}

export function classifyLane(tokens, originalText) {
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
