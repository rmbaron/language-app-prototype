// Grammar Breaker — Couplings (Level 3) and Composites (Level 4)
//
// The structural layers above atomic micro-patterns:
//
//   Level 1: Atoms (single grammatical types) — defined in grammarAtoms.en.js
//   Level 2: Micro-patterns (atomic structural shapes) — defined in grammarBreakerPatterns.js
//   Level 3: Couplings (this file) — structural concepts that micro-patterns implement.
//            E.g., 'copula_complement' is implemented by ~5 different patterns.
//   Level 4: Composites (this file) — bigger structural shapes that combine couplings.
//            E.g., 'svo_clause' = subject_verb + verb_object.
//   Level 5: Macro-structures (whole-sentence shape) — deferred; no patterns yet.
//
// Couplings exist as data here. Patterns declare which coupling they implement
// via their `coupling` field. The dev panel can group/filter patterns by their
// coupling for understanding "all the patterns implementing concept X."
//
// Composites exist as data here. They reference couplings by id. No pattern
// directly implements a composite — composites are inferred from the union of
// their constituent couplings. Future macro-patterns may consume composites.

// ── Level 3: Couplings ──────────────────────────────────────────────────────

export const COUPLINGS = [
  // ─── Clause-internal relationships ─────────────────────────────────────
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

  // ─── Noun-phrase internal ──────────────────────────────────────────────
  {
    id:          'noun_phrase_internal',
    label:       'Noun Phrase Internal',
    description: 'Modifiers attaching to a head noun within a noun phrase: determiners, demonstratives, possessive determiners, attributive adjectives.',
  },

  // ─── Verb chains ───────────────────────────────────────────────────────
  {
    id:          'modal_verb_chain',
    label:       'Modal + Verb Chain',
    description: 'A modal auxiliary licensing a bare verb (lexical or copula). Includes the subject when the chain is full (subject + modal + verb).',
  },
  {
    id:          'negation_chain',
    label:       'Negation Chain',
    description: 'Do-support auxiliary + negation marker + lexical verb. The construction English uses to negate present and past simple lexical verbs.',
  },

  // ─── Adverbial / prepositional ─────────────────────────────────────────
  {
    id:          'adverbial_position',
    label:       'Adverbial Position',
    description: 'Adverbs in their licit positions — sentence-final for time/place, pre-verb for frequency, pre-adjective for degree.',
  },
  {
    id:          'prepositional_phrase',
    label:       'Prepositional Phrase',
    description: 'Preposition + (determiner) + noun. A self-contained chunk that can fill an adverbial slot or modify a noun.',
  },

  // ─── Pronoun-specific ──────────────────────────────────────────────────
  {
    id:          'reflexive_object',
    label:       'Reflexive Object',
    description: 'A reflexive pronoun in object position, referring back to the subject. Coreference enforcement (matching person/number/gender to the subject) is deferred.',
  },
  {
    id:          'indefinite_subject_object',
    label:       'Indefinite Pronoun in Subject/Object',
    description: 'Indefinite pronouns (someone, something, anyone, nothing) filling subject or object positions.',
  },

  // ─── Higher-order syntactic relations ──────────────────────────────────
  {
    id:          'infinitive',
    label:       'Infinitive Construction',
    description: 'Verb + "to" + bare verb (e.g., "want to go"). The infinitive marker bridges a main verb and an embedded action.',
  },
  {
    id:          'coordination',
    label:       'Coordination',
    description: 'A coordinating conjunction joining equal grammatical units — nouns, verbs, or whole clauses.',
  },
  {
    id:          'subordination',
    label:       'Subordination',
    description: 'A subordinating conjunction introducing a dependent clause attached to the main clause.',
  },

  // ─── Boundary / morphology ─────────────────────────────────────────────
  {
    id:          'sentence_boundary',
    label:       'Sentence Boundary',
    description: 'Patterns sensitive to where in the sentence a token sits — sentence-initial or sentence-final.',
  },
  {
    id:          'morphology_inflection',
    label:       'Morphological Inflection',
    description: 'Patterns flagging the form of a single word — past tense, progressive (-ing), perfect (past participle), possessive clitic.',
  },
]

export const COUPLINGS_BY_ID = Object.fromEntries(COUPLINGS.map(c => [c.id, c]))

// ── Level 4: Composites ────────────────────────────────────────────────────

export const COMPOSITES = [
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

export const COMPOSITES_BY_ID = Object.fromEntries(COMPOSITES.map(c => [c.id, c]))

// ── Lookup helpers ─────────────────────────────────────────────────────────

// Returns the composites that include a given coupling.
export function compositesContainingCoupling(couplingId) {
  return COMPOSITES.filter(c => c.couplings.includes(couplingId))
}

// Returns true if every coupling listed in a composite exists in COUPLINGS.
// Used as a development sanity check.
export function allCompositesValid() {
  const known = new Set(COUPLINGS.map(c => c.id))
  const broken = []
  for (const comp of COMPOSITES) {
    const missing = comp.couplings.filter(c => !known.has(c))
    if (missing.length > 0) broken.push({ composite: comp.id, missing })
  }
  return { ok: broken.length === 0, broken }
}
