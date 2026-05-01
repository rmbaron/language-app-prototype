// Verb unit — auxiliary chain detection (between Subject and the lexical Verb).
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
