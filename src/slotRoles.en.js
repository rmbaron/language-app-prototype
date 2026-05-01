// Slot Roles — English
//
// The 5 slot roles are the "alphabet" of English clause structure.
// They are not 5 sentence shapes — they are 5 primitives that compose
// (per a verb's argument structure) to produce any compositional sentence.
//
// Forward-momentum principle: each slot role announces what was just
// filled and constrains what the verb wants next. The macro layer is a
// forward-flowing pipeline; this file is its first floor.
//
// ── Record shape: truth above, design (future) below ──────────────────────
// Truth fields (intrinsic linguistic properties):
//   • id, shortLabel, label, description
//   • polymorphic flag + polymorphismNote
//   • typicalFillers (what filler types this slot commonly accepts)
//   • relations (how this role relates to operations / other roles)
//   • examples (sentences with the role highlighted)
//
// Design fields (revisable presentation choices): none today. Future
// additions (displayOrder, promptLabel, etc.) go in a defaults block
// alongside truth fields, mirroring the atom record shape.
//
// Source of truth for the macro-layer architecture: notes/macro-layer-sketch.md
//
// Router: slotRoles.js

export const SLOT_ROLES = [
  {
    id: 'subject',
    shortLabel: 'S',
    label: 'Subject',
    description: 'The thing the clause is about. Typically the doer of the action, the bearer of a property, or the topic. Almost always present, except in imperatives where it is elided.',
    polymorphic: false,
    polymorphismNote: null,
    typicalFillers: ['NP', 'pronoun', 'gerund_clause', 'infinitive_clause', 'that_clause', 'wh_clause'],
    relations: [
      'Almost always the leftmost element of a declarative clause',
      'Agrees with the verb in number and person',
      'Elided in imperatives (subject_elision operation)',
      'Inverted with auxiliary in yes/no questions (subject_aux_inversion operation)',
    ],
    examples: [
      { sentence: 'She runs.',                    highlight: 'She' },
      { sentence: 'The happy dog ate the food.',  highlight: 'The happy dog' },
      { sentence: 'Swimming is fun.',             highlight: 'Swimming' },
      { sentence: 'That she left surprised me.',  highlight: 'That she left' },
    ],
  },
  {
    id: 'verb',
    shortLabel: 'V',
    label: 'Verb',
    description: "The predicate's head. The verb declares the clause's argument structure — which other slots are required, which are optional. Once the verb is identified, the remaining trajectory of the clause is largely determined.",
    polymorphic: false,
    polymorphismNote: null,
    typicalFillers: ['lexical_verb', 'copula', 'modal_verb_chain', 'auxiliary_verb_chain'],
    relations: [
      "Central engine of the macro layer — the verb's argument structure announces what slots come next",
      'Decorated by TAM markers (auxiliaries, modals, "not")',
      'May be inverted, fronted, or elided by operations',
      'Copular verbs (be, seem, become, appear, feel, look, sound, taste, remain, stay, get, grow, turn) license a Subject Complement',
    ],
    examples: [
      { sentence: 'She runs.',         highlight: 'runs' },
      { sentence: 'I am eating.',      highlight: 'am eating' },
      { sentence: 'He has been told.', highlight: 'has been told' },
      { sentence: 'She can swim.',     highlight: 'can swim' },
    ],
  },
  {
    id: 'object',
    shortLabel: 'O',
    label: 'Object',
    description: 'What the verb acts on. Polymorphic: a clause can have one Object (direct), or two (indirect + direct). Some verbs require an Object; some allow but don\'t require one; some never take one.',
    polymorphic: true,
    polymorphismNote: 'Can fire once (direct object) or twice (indirect + direct, in ditransitive clauses). The function distinction (Od vs. Oi) is encoded in the verb\'s argument structure, not in the role itself.',
    typicalFillers: ['NP', 'pronoun', 'gerund_clause', 'infinitive_clause', 'that_clause', 'wh_clause', 'bare_infinitive_clause'],
    relations: [
      'Verbs declare per-slot accepted filler types — "I want to eat" works because want.O.fillers includes infinitive_clause; "I think to eat" fails because think.O.fillers excludes it',
      'In ditransitive clauses, Indirect Object precedes Direct Object: "He gave [me] [a book]"',
      'Dative shift: SVOO ↔ SVO+PP — "He gave [me] [a book]" ↔ "He gave [a book] [to me]"',
      'Wh-questions can front the Object: "What did she eat?" — late-bound role assignment',
    ],
    examples: [
      { sentence: 'She eats food.',         highlight: 'food' },
      { sentence: 'He gave me a book.',     highlight: 'me, a book' },
      { sentence: 'I want to leave.',       highlight: 'to leave' },
      { sentence: 'I think she is happy.',  highlight: 'she is happy' },
    ],
  },
  {
    id: 'complement',
    shortLabel: 'C',
    label: 'Complement',
    description: 'Predicates a property over the Subject or the Object. Polymorphic: a Subject Complement (Cs) describes the Subject ("She is happy"); an Object Complement (Co) describes the Object ("She painted the wall red"). Distinguished by which element it attaches to, not by being a different role.',
    polymorphic: true,
    polymorphismNote: 'Subject Complement (Cs) attaches to Subject — used after copular verbs (be, seem, become, etc.). Object Complement (Co) attaches to Object — used after verbs like paint, call, consider, make. Same role; attachment determined by clause structure.',
    typicalFillers: ['NP', 'AdjP', 'PP', 'gerund_clause', 'infinitive_clause'],
    relations: [
      'After a copular verb, Cs predicates over Subject',
      'After verbs like paint, call, consider, make, Co predicates over Object',
      'Distinct from Adverbial: a Complement asserts a property; an Adverbial locates/modifies the action',
      'Distinct from Object: a Complement describes (predicates); an Object is acted upon',
    ],
    examples: [
      { sentence: 'She is happy.',              highlight: 'happy' },
      { sentence: 'He is a teacher.',           highlight: 'a teacher' },
      { sentence: 'They are in the garden.',    highlight: 'in the garden' },
      { sentence: 'She painted the wall red.',  highlight: 'red' },
      { sentence: 'They called him Tom.',       highlight: 'Tom' },
    ],
  },
  {
    id: 'adverbial',
    shortLabel: 'A',
    label: 'Adverbial',
    description: 'Locates or modifies the action. Most adverbials are optional adjuncts that can attach freely. Some verbs require an obligatory Adverbial (live, put, remain) — "He lives" is ungrammatical because live demands a locative complement.',
    polymorphic: false,
    polymorphismNote: null,
    typicalFillers: ['AdvP', 'PP', 'NP_temporal', 'subordinate_clause'],
    relations: [
      'Optional vs. obligatory — declared per-verb in argument structure. Live, put, remain require an A; eat, sleep do not',
      'Multiple optional Adverbials can attach to one clause: "She ran [quickly] [yesterday] [in the park]"',
      'Frequency adverbs have fixed positions (pre-verbal): "She [always] eats food", not "She eats [always] food"',
      'Adverbial fronting is an operation: "Yesterday, she ran"',
    ],
    examples: [
      { sentence: 'He lives in London.',             highlight: 'in London' },
      { sentence: 'She put the book on the table.',  highlight: 'on the table' },
      { sentence: 'She ran quickly.',                highlight: 'quickly' },
      { sentence: 'I always eat breakfast.',         highlight: 'always' },
      { sentence: 'Yesterday, she left.',            highlight: 'Yesterday' },
    ],
  },
]
