// Constructor Tiers — English
//
// Each tier introduces one slot into the sentence structure.
// band: which cluster band this tier belongs to (1–4 = A1 clusters, 5 = A2+)
// atoms: atom classes newly introduced at this tier (empty = structural reuse of existing atoms)
//
// slotOverrides encode the subject phrase rule:
//   - Tiers without `determiner` in slotIds → subject_noun restricted to personal_pronoun
//   - Tiers with `determiner` in slotIds → subject_noun restricted to noun, determiner required

export const CONSTRUCTOR_TIERS = [
  { id: 1,  band: 1, label: 'T1: Subject + Verb',          targetSlotId: 'verb',              atoms: ['personal_pronoun', 'lexical_verb'],
    slotIds: ['subject_noun', 'verb'],
    slotOverrides: { subject_noun: { accepts: ['personal_pronoun'] }, verb: { accepts: ['lexical_verb'] } },
    examples: ['I eat.', 'She runs.', 'We sleep.', 'You work.'] },

  { id: 2,  band: 1, label: 'T2: + Noun / Object',          targetSlotId: 'object',            atoms: ['noun', 'object_pronoun'],
    slotIds: ['interjection', 'subject_noun', 'verb', 'object'],
    slotOverrides: { interjection: { accepts: ['interjection'], optional: true }, subject_noun: { accepts: ['personal_pronoun'] }, verb: { accepts: ['lexical_verb'] } },
    examples: ['I want food.', 'She likes him.', 'Wow, I like music.', 'I see her.'] },

  { id: 3,  band: 2, label: 'T3: + Copula / Complement',   targetSlotId: 'complement',        atoms: ['copula', 'adjective'],
    slotIds: ['subject_noun', 'verb', 'complement'],
    slotOverrides: { subject_noun: { accepts: ['personal_pronoun'] }, verb: { accepts: ['copula'] } },
    examples: ['I am happy.', 'She is tired.', 'We are friends.', 'You are good.'] },

  { id: 4,  band: 2, label: 'T4: + Determiner',            targetSlotId: 'determiner',        atoms: ['determiner', 'possessive_determiner', 'demonstrative'],
    slotIds: ['determiner', 'subject_noun', 'verb', 'object'],
    slotOverrides: { subject_noun: { accepts: ['noun'] }, determiner: { optional: false }, verb: { accepts: ['lexical_verb'] } },
    examples: ['The friend eats.', 'My cat sleeps.', 'This teacher helps.', 'A dog runs.'] },

  { id: 5,  band: 2, label: 'T5: + Attributive Adjective', targetSlotId: 'subject_adjective', atoms: [],
    slotIds: ['determiner', 'subject_adjective', 'subject_noun', 'verb', 'object'],
    slotOverrides: { subject_noun: { accepts: ['noun'] }, determiner: { optional: false }, verb: { accepts: ['lexical_verb'] } },
    examples: ['A good friend helps.', 'The tired teacher sleeps.', 'My happy dog eats food.'] },

  { id: 6,  band: 3, label: 'T6: + Adverbial',             targetSlotId: 'adverbial',         atoms: ['adverb', 'preposition'],
    slotIds: ['subject_noun', 'verb', 'object', 'adverbial'],
    slotOverrides: { subject_noun: { accepts: ['personal_pronoun'] }, verb: { accepts: ['lexical_verb'] }, adverbial: { accepts: ['adverb'] } },
    examples: ['I eat here.', 'She sleeps now.', 'We work there.', 'I eat quickly.'] },

  { id: 7,  band: 4, label: 'T7: + Modal',                 targetSlotId: 'modal',             atoms: ['modal_auxiliary'],
    slotIds: ['subject_noun', 'modal', 'verb', 'object'],
    slotOverrides: { subject_noun: { accepts: ['personal_pronoun'] }, verb: { accepts: ['lexical_verb'] } },
    examples: ['I can help.', 'She will eat.', 'We should sleep.', 'You must go.'] },

  { id: 8,  band: 4, label: 'T8: + Negation',              targetSlotId: 'negation',          atoms: ['negation_marker', 'auxiliary'],
    slotIds: ['subject_noun', 'negation', 'verb', 'object'],
    slotOverrides: { subject_noun: { accepts: ['personal_pronoun'] }, verb: { accepts: ['lexical_verb'] } },
    examples: ['I do not eat.', 'She does not like food.', 'We do not sleep.'] },

  { id: 9,  band: 4, label: 'T9: + Progressive',           targetSlotId: 'progressive',       atoms: [],
    slotIds: ['subject_noun', 'progressive', 'verb', 'object'],
    slotOverrides: { subject_noun: { accepts: ['personal_pronoun'] }, verb: { accepts: ['lexical_verb'] } },
    forceWords: { progressive: ['be'] },
    examples: ['I am eating.', 'She is sleeping.', 'We are working.', 'You are helping.'] },

  { id: 10, band: 5, label: 'T10: + Perfect',              targetSlotId: 'perfect',           atoms: [],
    slotIds: ['subject_noun', 'perfect', 'verb', 'object'],
    slotOverrides: { subject_noun: { accepts: ['personal_pronoun'] }, verb: { accepts: ['lexical_verb'] } },
    forceWords: { perfect: ['have'] },
    examples: ['I have eaten.', 'She has slept.', 'We have worked.', 'You have helped.'] },
]

export const CONSTRUCTOR_BANDS = [
  { id: 1, label: 'Cluster 1 — Base clause' },
  { id: 2, label: 'Cluster 2 — Identity + description' },
  { id: 3, label: 'Cluster 3 — Clause expansion' },
  { id: 4, label: 'Cluster 4 — Stance + control' },
  { id: 5, label: 'A2+' },
]
