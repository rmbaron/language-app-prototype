// Slot Roles — English
//
// The functional positions inside a sentence structure.
// Middle layer between grammar atoms and sentence structures.
//
// A slot role answers: what position does this element occupy in the sentence?
// A grammar atom answers: what kind of word fills that position?
//
// These are different things — a noun can be a subject or an object
// depending on where it appears. The role is the position; the atom
// is what's eligible to fill it.
//
// This list will grow with each level. Keep it here, not buried
// inside the sentence structures file.
//
// Router: slotRoles.js

export const SLOT_ROLES = [
  // ── Core clause roles ─────────────────────────────────────────
  {
    id: 'subject',
    label: 'Subject',
    description: 'The entity the sentence is about.',
  },
  {
    id: 'verb',
    label: 'Verb',
    description: 'The main action or state (lexical verb).',
  },
  {
    id: 'copula',
    label: 'Copula',
    description: 'The linking "be" verb.',
  },
  {
    id: 'object',
    label: 'Object',
    description: 'The entity affected by or receiving the verb.',
  },
  {
    id: 'object_optional',
    label: 'Object (optional)',
    description: 'Object that may or may not appear — AI decides based on naturalness.',
  },
  {
    id: 'object_1',
    label: 'First object',
    description: 'First object in a coordinated pair.',
  },
  {
    id: 'object_2',
    label: 'Second object',
    description: 'Second object in a coordinated pair.',
  },
  {
    id: 'object_of_preposition',
    label: 'Object of preposition',
    description: 'Noun following a preposition.',
  },

  // ── Complement roles ──────────────────────────────────────────
  {
    id: 'complement_adjective',
    label: 'Adjectival complement',
    description: 'Adjective describing the subject via copula.',
  },
  {
    id: 'complement_noun',
    label: 'Noun complement',
    description: 'Noun identifying or categorising the subject via copula.',
  },
  {
    id: 'complement_adverb',
    label: 'Adverbial complement',
    description: 'Adverb completing a copula phrase (e.g. "I am here").',
  },

  // ── Modifier / expansion roles ────────────────────────────────
  {
    id: 'adjective_1',
    label: 'First adjective',
    description: 'First adjective in a coordinated adjective pair.',
  },
  {
    id: 'adjective_2',
    label: 'Second adjective',
    description: 'Second adjective in a coordinated adjective pair.',
  },
  {
    id: 'adverbial',
    label: 'Adverbial',
    description: 'Adverb modifying the verb (time, place, manner).',
  },
  {
    id: 'determiner_optional',
    label: 'Determiner (optional)',
    description: 'Article or determiner that may or may not appear.',
  },
  {
    id: 'preposition',
    label: 'Preposition',
    description: 'Relational word introducing a noun phrase.',
  },
  {
    id: 'linker',
    label: 'Linker',
    description: 'Conjunction joining two parallel elements.',
  },

  // ── Question / negation roles ─────────────────────────────────
  {
    id: 'interrogative',
    label: 'Interrogative',
    description: 'Question word opening a wh-question.',
  },
  {
    id: 'auxiliary',
    label: 'Auxiliary',
    description: 'Helper verb in questions or negatives.',
  },
  {
    id: 'negation',
    label: 'Negation',
    description: 'Negation marker making the clause negative.',
  },
]
