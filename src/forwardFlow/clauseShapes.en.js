// Clause Shapes + Clause Relations — English (Floor 3)
//
// The Floor 3 (Clause) registry. Floor 2 (Phrase) catalogs the things that
// fill slots (NP, PP, AdjP, etc.); this file catalogs:
//
//   CLAUSE_SHAPES    — clause-level shapes (svo_clause, copular_clause, …)
//   CLAUSE_RELATIONS — clause-internal pairwise relations that compose them
//                      (subject_verb, verb_object, copula_complement, …)
//
// Both relocated from grammarBreakerCouplings.js as part of Floor 2 alignment.
// Old names retired: "composite" → CLAUSE_SHAPES; the Floor-3 entries that
// were called "couplings" → CLAUSE_RELATIONS. Clause relations are the source
// of truth here; grammarBreakerCouplings.js's COUPLINGS spreads them back in
// during the transition (derivation shim, mirrors the Floor 1 pattern).
//
// ── CLAUSE_SHAPES record shape ────────────────────────────────────────────
//   id          — string, machine id
//   label       — human-readable name
//   description — what the clause shape is and when it shows up
//   couplings   — array of CLAUSE_RELATIONS ids (or remaining System A coupling
//                 ids during transition; field will be renamed `relations` in
//                 a later retag pass)
//
// ── CLAUSE_RELATIONS record shape ─────────────────────────────────────────
//   id          — string, machine id
//   label       — human-readable name
//   description — the clause-internal relationship being expressed
//
// ── Pending consolidations (next moves under Floor 2 alignment) ───────────
//   • Several CLAUSE_SHAPES entries are likely redundant once Floor 2 wires
//     P/G/F properly:
//       - modal_clause / modal_copular_clause: modality is VP-internal, so
//         the underlying clause shape is still svo_clause / copular_clause.
//       - negated_clause: negation is VP-internal; clause shape unchanged.
//       - svo_with_adverbial / svo_with_pp: A is an adjunct; clause shape is
//         still svo_clause.
//   • coordinated_nouns is misclassified — NP coordination is an operation,
//     not a clause shape. Will move to the operations layer when it lands.
//   • subordinate_clause is Floor 4 (Sentence — multi-clause). Will move
//     when Floor 4 work begins.
//   • verb_with_infinitive is frame-driven (verb takes infinitive complement).
//     Subsumed by the frame system; candidate for retirement.
//   • reflexive_object and indefinite_subject_object are partly atom-level
//     concerns (pronoun case / indefinite-pronoun atoms) and may move to
//     atom metadata when the wire G work lands.
// All deferred to follow-on moves.

export const CLAUSE_SHAPES = [
  {
    id:          'svo_clause',
    label:       'SVO Clause',
    description: 'Subject + Verb + Object. The standard transitive clause shape in English. Built from subject_verb fed into verb_object.',
    couplings:   ['subject_verb', 'verb_object'],
  },
  {
    id:          'copular_clause',
    label:       'Copular Clause',
    description: 'Subject + Copula + Complement. Predication and identification clauses ("she is happy", "I am Mary", "we are friends").',
    couplings:   ['subject_copula', 'copula_complement'],
  },
  {
    id:          'modal_clause',
    label:       'Modal Clause',
    description: 'Subject + Modal + Verb + (Object). A modal-licensed action ("I can help", "she will eat food").',
    couplings:   ['modal_verb_chain', 'verb_object'],
  },
  {
    id:          'modal_copular_clause',
    label:       'Modal Copular Clause',
    description: 'Subject + Modal + Copula + Complement ("I can be happy", "she will be tired").',
    couplings:   ['modal_verb_chain', 'copula_complement'],
  },
  {
    id:          'negated_clause',
    label:       'Negated Clause',
    description: 'Subject + Auxiliary + Not + Verb. The do-support negation shape ("I do not eat", "she does not like food").',
    couplings:   ['negation_chain'],
  },
  {
    id:          'svo_with_adverbial',
    label:       'SVO + Adverbial',
    description: 'Standard clause with adverbial modification ("I eat here", "She runs quickly", "We always work").',
    couplings:   ['subject_verb', 'verb_object', 'adverbial_position'],
  },
  {
    id:          'svo_with_pp',
    label:       'SVO + Prepositional Phrase',
    description: 'Clause modified by a prepositional phrase ("I eat at school", "She works in the city").',
    couplings:   ['subject_verb', 'verb_object', 'prepositional_phrase'],
  },
  {
    id:          'coordinated_nouns',
    label:       'Coordinated Nouns',
    description: 'Two or more nouns joined by a coordinating conjunction ("apples and oranges", "cats or dogs").',
    couplings:   ['coordination', 'noun_phrase_internal'],
  },
  {
    id:          'subordinate_clause',
    label:       'Main + Subordinate Clause',
    description: 'Main clause attached to a dependent clause via a subordinating conjunction ("I eat because I am hungry").',
    couplings:   ['subordination', 'subject_verb'],
  },
  {
    id:          'verb_with_infinitive',
    label:       'Verb + Infinitive',
    description: 'A main verb taking an infinitive complement ("I want to go", "She likes to eat").',
    couplings:   ['subject_verb', 'infinitive'],
  },
]

export const CLAUSE_SHAPES_BY_ID = Object.fromEntries(CLAUSE_SHAPES.map(c => [c.id, c]))

// ── Clause Relations ────────────────────────────────────────────────────
// Clause-internal pairwise relationships. Source of truth for these ids;
// grammarBreakerCouplings.js's COUPLINGS array spreads these back in.

export const CLAUSE_RELATIONS = [
  {
    id:          'subject_verb',
    label:       'Subject + Verb',
    description: 'The subject of a clause adjacent to its main lexical verb. The basic spine of every transitive or intransitive clause.',
  },
  {
    id:          'subject_copula',
    label:       'Subject + Copula',
    description: 'Subject directly followed by a copula (be). Distinct from subject_verb because the copula opens up complement positions, not object positions.',
  },
  {
    id:          'verb_object',
    label:       'Verb + Object',
    description: 'A lexical verb taking a direct object — noun phrase, pronoun, or in some contexts an indefinite pronoun. Sensitive to verb transitivity and noun countability/properness.',
  },
  {
    id:          'copula_complement',
    label:       'Copula + Complement',
    description: 'A copula taking its complement — adjective, noun phrase, possessive pronoun, or proper noun. The right side of identification and predication clauses.',
  },
  {
    id:          'reflexive_object',
    label:       'Reflexive Object',
    description: 'A reflexive pronoun in object position, referring back to the subject. Coreference enforcement (matching person/number/gender to the subject) is deferred. Partly atom-level: candidate for migration to atom metadata once Wire G lands.',
  },
  {
    id:          'indefinite_subject_object',
    label:       'Indefinite Pronoun in Subject/Object',
    description: 'Indefinite pronouns (someone, something, anyone, nothing) filling subject or object positions. Partly atom-level: candidate for migration to atom metadata.',
  },
]

export const CLAUSE_RELATIONS_BY_ID = Object.fromEntries(CLAUSE_RELATIONS.map(r => [r.id, r]))

// ── Lookup helpers ──────────────────────────────────────────────────────
// Returns the clause shapes that include a given coupling/relation id.
export function clauseShapesContainingCoupling(couplingId) {
  return CLAUSE_SHAPES.filter(c => c.couplings.includes(couplingId))
}
