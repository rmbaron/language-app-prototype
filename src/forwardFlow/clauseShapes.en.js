// Clause Shapes + Clause Relations — English (Floor 3)
//
// The Floor 3 (Clause) registry. Floor 2 (Phrase) catalogs the things that
// fill slots (NP, PP, AdjP, etc.); this file catalogs:
//
//   CLAUSE_SHAPES    — clause-level shapes (svo_clause, copular_clause)
//   CLAUSE_RELATIONS — clause-internal pairwise relations that compose them
//                      (subject_verb, verb_object, copula_complement, …)
//
// ── Floor 3 alignment status ──────────────────────────────────────────────
// Step 3 (collapse/retag) complete. Of the original 10 entries, 8 retired or
// parked once the unified-system ruler showed they belonged elsewhere or
// duplicated existing shapes:
//
//   RETIRED — modality / negation / adjuncts are NOT new clause shapes:
//     • modal_clause              → svo_clause (modality is VP-internal)
//     • modal_copular_clause      → copular_clause (modality is VP-internal)
//     • negated_clause            → svo_clause / copular_clause (negation is VP-internal)
//     • svo_with_adverbial        → svo_clause (A is an adjunct, attached at clause-build time)
//     • svo_with_pp               → svo_clause (PP-A is an adjunct)
//     • verb_with_infinitive      → frame-driven (subsumed by FRAME_TEMPLATES)
//
//   PARKED — wrong floor / wrong layer; will move when those land:
//     • coordinated_nouns         → operations layer (NP coordination is an operation, not a clause shape)
//     • subordinate_clause        → Floor 4 (Sentence — multi-clause)
//
// What remains: two truly distinct clause shapes — svo_clause and
// copular_clause. Each is wired to a FRAME_TEMPLATES id (Wire F) and
// declares its grammatical-function slot sequence (Wire G).
//
// CLAUSE_RELATIONS are unchanged this pass. `reflexive_object` and
// `indefinite_subject_object` remain candidates for migration to atom
// metadata; deferred until the atom-side work is done.
//
// ── CLAUSE_SHAPES record shape ────────────────────────────────────────────
//   id          — string, machine id
//   label       — human-readable name
//   description — what the clause shape is and when it shows up
//   slots       — Wire G: ordered grammatical functions (e.g. ['S','V','O'])
//   frame       — Wire F: FRAME_TEMPLATES id this shape instantiates
//   couplings   — array of CLAUSE_RELATIONS ids this shape is built from
//                 (kept as `couplings` until the old GrammarBreakerFlowTab is
//                 retired; the rename to `relations` waits for the circuit
//                 rebuild to avoid touching dead-code-walking surfaces)
//
// ── CLAUSE_RELATIONS record shape ─────────────────────────────────────────
//   id          — string, machine id
//   label       — human-readable name
//   description — the clause-internal relationship being expressed

export const CLAUSE_SHAPES = [
  {
    id:          'svo_clause',
    label:       'SVO Clause',
    description: 'Subject + Verb + Object. The standard transitive clause shape in English. Built from subject_verb fed into verb_object. Modality, negation, and adjuncts (adverbial, PP) attach to this same shape rather than producing distinct clause shapes.',
    slots:       ['S', 'V', 'O'],
    frame:       'transitive',
    couplings:   ['subject_verb', 'verb_object'],
  },
  {
    id:          'copular_clause',
    label:       'Copular Clause',
    description: 'Subject + Copula + Complement. Predication and identification clauses ("she is happy", "I am Mary", "we are friends"). Modality on the copula does not produce a distinct shape.',
    slots:       ['S', 'V', 'C'],
    frame:       'copular',
    couplings:   ['subject_copula', 'copula_complement'],
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
// Returns the clause shapes that include a given coupling id.
export function clauseShapesContainingCoupling(couplingId) {
  return CLAUSE_SHAPES.filter(c => c.couplings.includes(couplingId))
}
