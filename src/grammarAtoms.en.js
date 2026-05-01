// Grammar Atoms — English
//
// The atomic grammatical types. Base layer of the sentence structure system.
// These answer: what kind of grammatical thing is this word or form?
//
// These are the building blocks that slot roles accept,
// and that sentence structures are composed from.
//
// This layer is separate from:
//   - Semantic refinements (noun_person, noun_place, verb_physical, etc.)
//   - Sentence structures (SVO, S+BE+ADJ, etc.)
//   - Pedagogical goals (basic needs, ask directions, etc.)
//
// ── Record shape: truth above, design defaults below ──────────────────────
// Each atom record has two zones:
//   • Truth fields (id, label, group, description, examples)
//     — what this atom IS. Intrinsic. Wrong = a bug.
//   • defaults block (category, pioneer, groups, promptLabel)
//     — design choices we ship with. Revisable. Wrong = a tunable.
// Design fields READ from truth fields; the reverse never holds. The legacy
// lookup files (atomToCategory, atomPioneers, atomGroups, PROMPT_LABEL) are
// derived from these defaults via src/atomMetadataDerivations.js.
//
// Router: grammarAtoms.js

export const ATOMS = [
  {
    id: 'personal_pronoun',
    label: 'Personal pronoun (subject)',
    group: 'Pronouns',
    description: 'Subject-position pronoun (nominative case). Fills the subject slot. I, you, he, she, we, they.',
    examples: ['I', 'you', 'he', 'she', 'we', 'they'],
    defaults: {
      category:    'pronoun',
      pioneer:     'i',
      groups:      ['pronoun_subject'],
      promptLabel: 'Pronoun',
    },
  },
  {
    id: 'object_pronoun',
    label: 'Object pronoun',
    group: 'Pronouns',
    description: 'Object-position pronoun (accusative case). Fills the object slot. Me, him, her, us, them. "You" and "it" are invariant — they fill both positions but are classified as personal_pronoun; they appear in object slot via alternateAtoms at A2+.',
    examples: ['me', 'him', 'her', 'us', 'them'],
    defaults: {
      category:    'pronoun',
      pioneer:     'me',
      groups:      ['pronoun_object'],
      promptLabel: 'Object pronoun',
    },
  },
  {
    id: 'noun',
    label: 'Noun',
    group: 'Nominals',
    description: 'A word naming a person, place, thing, or concept.',
    examples: ['food', 'water', 'house', 'book', 'teacher'],
    defaults: {
      category:    'noun',
      pioneer:     'food',
      groups:      ['noun_class'],
      promptLabel: 'Noun',
    },
  },
  {
    id: 'lexical_verb',
    label: 'Lexical verb',
    group: 'Verbs',
    description: 'Main meaning-carrying verb.',
    examples: ['want', 'go', 'have', 'like', 'eat'],
    defaults: {
      category:    'verb',
      pioneer:     'want',
      groups:      ['verb_lexical'],
      promptLabel: 'Verb',
    },
  },
  {
    id: 'copula',
    label: 'Copula',
    group: 'Verbs',
    description: 'The verb "be" — always classify "be" as copula, never as lexical_verb. Links subject to adjective, noun, or location. Inflected forms: am, is, are, was, were.',
    examples: ['be', 'am', 'is', 'are'],
    defaults: {
      category:    'verb',
      pioneer:     'be',
      groups:      ['verb_copula'],
      promptLabel: 'Be',
    },
  },
  {
    id: 'auxiliary',
    label: 'Auxiliary (do-support)',
    group: 'Verbs',
    description: 'Do-support helper verb used in questions and negatives. Contracted negative forms (don\'t, doesn\'t) are inflected forms of do/does.',
    examples: ['do', 'does'],
    defaults: {
      category:    'verb',
      pioneer:     'do',
      groups:      ['verb_auxiliary'],
      promptLabel: 'Do',
    },
  },
  {
    id: 'perfect_auxiliary',
    label: 'Perfect auxiliary',
    group: 'Verbs',
    description: 'Used ONLY in alternateAtoms, never as a primary grammaticalAtom. Marks "have" as a perfect aspect auxiliary. "have" primary atom is lexical_verb — perfect_auxiliary is its secondary function. e.g. "I have eaten". No other English word takes this atom — not "get", not "do", not "be".',
    examples: ['have', 'has'],
    defaults: {
      category: 'verb',
      pioneer:  null,            // alternate-only; no pioneer
      groups:   ['verb_auxiliary'],
    },
  },
  {
    id: 'progressive_auxiliary',
    label: 'Progressive auxiliary',
    group: 'Verbs',
    description: 'Used ONLY in alternateAtoms, never as a primary grammaticalAtom. Marks "be" as a progressive aspect auxiliary. "be" primary atom is copula — progressive_auxiliary is its secondary function. e.g. "I am eating". No other English word takes this atom — not "get", not "have", not "do".',
    examples: ['am', 'is', 'are'],
    defaults: {
      category: 'verb',
      pioneer:  null,            // alternate-only; no pioneer
      groups:   ['verb_auxiliary'],
    },
  },
  {
    id: 'modal_auxiliary',
    label: 'Modal auxiliary',
    group: 'Verbs',
    description: 'Auxiliary verb expressing ability, possibility, permission, or intention. Always followed by a bare infinitive. Does not inflect for person.',
    examples: ['can', 'will', 'would', 'could', 'should', 'must'],
    defaults: {
      category:    'verb',
      pioneer:     'can',
      groups:      ['verb_auxiliary'],
      promptLabel: 'Modal',
    },
  },
  {
    id: 'adjective',
    label: 'Adjective',
    group: 'Modifiers',
    description: 'A word describing a noun.',
    examples: ['good', 'big', 'small', 'happy'],
    defaults: {
      category:    'adjective',
      pioneer:     'good',
      groups:      ['adjective_class'],
      promptLabel: 'Adjective',
    },
  },
  {
    id: 'determiner',
    label: 'Determiner (umbrella)',
    group: 'Modifiers',
    description: 'Umbrella atom shared by every determiner-class word as an alternate atom. Use for cross-cutting patterns that fire on "any determiner-class word" without caring about article subtype. Never the primary atom — every determiner has a more specific primary class (indefinite_article, definite_article, quantifier_determiner, demonstrative, possessive_determiner). Legacy data may have it as primary; words migrate during re-enrichment.',
    examples: ['(used as alternateAtom on all determiner-class words)'],
    defaults: {
      category:    'determiner',
      pioneer:     null,         // umbrella; no pioneer
      groups:      ['determiner_class', 'determiner_all'],
      promptLabel: 'Determiner',
    },
  },
  {
    id: 'indefinite_article',
    label: 'Indefinite article',
    group: 'Modifiers',
    description: 'The articles "a" and "an". Marks a noun as indefinite (not previously specified). Requires a singular count noun complement — does not combine with mass nouns ("a water" wrong), plurals ("a apples" wrong), or proper nouns ("a Mary" wrong) in standard usage.',
    examples: ['a', 'an'],
    defaults: {
      category: 'determiner',
      pioneer:  'a',
      groups:   ['determiner_class', 'determiner_articles'],
    },
  },
  {
    id: 'definite_article',
    label: 'Definite article',
    group: 'Modifiers',
    description: 'The article "the". Marks a noun as identifiable from context. Combines with any noun count — singular, plural, mass — without restriction.',
    examples: ['the'],
    defaults: {
      category: 'determiner',
      pioneer:  'the',
      groups:   ['determiner_class', 'determiner_articles'],
    },
  },
  {
    id: 'quantifier_determiner',
    label: 'Quantifier determiner',
    group: 'Modifiers',
    description: 'Determiner expressing quantity rather than identity. Includes some, any, much, many, few, several, all, no, every, each. Each has its own count/mass constraints (e.g., "much" pairs with mass nouns; "many" with count plurals).',
    examples: ['some', 'any', 'much', 'many', 'few', 'all', 'no', 'every'],
    defaults: {
      category: 'determiner',
      pioneer:  'some',
      groups:   ['determiner_class', 'determiner_quantifiers'],
    },
  },
  {
    id: 'numeral',
    label: 'Numeral',
    group: 'Nominals',
    description: 'Number word used to count or quantify. Can precede a noun or stand alone.',
    examples: ['one', 'two', 'three', 'four', 'five'],
    defaults: {
      category:    'determiner',
      pioneer:     'one',
      groups:      ['numeral_class'],
      promptLabel: 'Number',
    },
  },
  {
    id: 'demonstrative',
    label: 'Demonstrative',
    group: 'Nominals',
    description: 'Pointing words that identify specific people or things by proximity.',
    examples: ['this', 'that', 'these', 'those'],
    defaults: {
      category:    'demonstrative',
      pioneer:     'this',
      groups:      ['pronoun_demonstrative', 'determiner_class'],
      promptLabel: 'Demonstrative',
    },
  },
  {
    id: 'possessive_determiner',
    label: 'Possessive determiner',
    group: 'Pronouns',
    description: 'Ownership word placed before a noun.',
    examples: ['my', 'your', 'his', 'her', 'our', 'their'],
    defaults: {
      category:    'pronoun',
      pioneer:     'my',
      groups:      ['pronoun_possessive', 'determiner_class'],
      promptLabel: 'Possessive',
    },
    // DESIGN NOTE: possessive pronouns (mine, yours, hers, ours, theirs) are forms
    // of these words but fill different slot positions ("this is mine" vs "this is my book").
    // Same case-selection problem as personal_pronoun subject/object.
    // Must be resolved when slot roles are designed — slot role must signal which form to use.
  },
  {
    id: 'preposition',
    label: 'Preposition',
    group: 'Function words',
    description: 'Relation, place, or time word.',
    examples: ['in', 'on', 'at', 'to', 'from', 'with'],
    defaults: {
      category:    'preposition',
      pioneer:     'in',
      groups:      ['preposition_class'],
      promptLabel: 'Preposition',
    },
    // DESIGN NOTE: "to" serves dual function — preposition ("I go to school") and
    // infinitive marker ("I want to go"). Currently classified as preposition.
    // When verb+infinitive structures are added, slot mismatches will occur unless
    // "to" is handled separately or a dedicated infinitive_marker atom is introduced.
  },
  {
    id: 'interrogative',
    label: 'Interrogative',
    group: 'Function words',
    description: 'Question word.',
    examples: ['what', 'where', 'who', 'when', 'why', 'how'],
    defaults: {
      category:    'interrogative',
      pioneer:     'what',
      groups:      ['pronoun_interrogative'],
      promptLabel: 'Question word',
    },
  },
  {
    id: 'negation_marker',
    label: 'Negation marker',
    group: 'Function words',
    description: 'Word that negates a clause.',
    examples: ['not'],
    defaults: {
      category:    'adverb',
      pioneer:     'not',
      groups:      ['negation'],
      promptLabel: 'Negation',
    },
  },
  {
    id: 'conjunction',
    label: 'Conjunction (umbrella)',
    group: 'Function words',
    description: 'Umbrella atom shared by every conjunction-class word as an alternate atom. Use for cross-cutting patterns that fire on "any conjunction" without caring about coordinating vs subordinating. Never the primary atom — every conjunction has a more specific primary class (coordinating_conjunction or subordinating_conjunction). Legacy data may have it as primary; words will migrate during re-enrichment.',
    examples: ['(used as alternateAtom on all conjunctions)'],
    defaults: {
      category:    'conjunction',
      pioneer:     null,         // umbrella; no pioneer
      groups:      ['conjunction_all'],
      promptLabel: 'Conjunction',
    },
  },
  {
    id: 'adverb',
    label: 'Adverb',
    group: 'Modifiers',
    description: 'Time, place, manner, or frequency word.',
    examples: ['now', 'here', 'there', 'soon', 'always'],
    defaults: {
      category:    'adverb',
      pioneer:     'here',
      groups:      ['adverb_class'],
      promptLabel: 'Adverb',
    },
  },
  {
    id: 'interjection',
    label: 'Interjection',
    group: 'Function words',
    description: 'Standalone expression used for greeting, response, courtesy, or feeling. Does not fill a grammatical slot in a sentence structure.',
    examples: ['yes', 'no', 'please', 'sorry', 'hello', 'okay'],
    defaults: {
      category:    'interjection',
      pioneer:     'hello',
      groups:      ['interjection_class'],
      promptLabel: 'Interjection',
    },
  },

  // ─── Pronoun atoms (additions) ───────────────────────────────────────────
  {
    id: 'possessive_pronoun',
    label: 'Possessive pronoun',
    group: 'Pronouns',
    description: 'Standalone possessive form that fills a noun-phrase position (not before a noun). Mine, yours, his, hers, ours, theirs. Compare to possessive_determiner (my, your) which sits before a noun.',
    examples: ['mine', 'yours', 'hers', 'ours', 'theirs'],
    defaults: {
      category: 'pronoun',
      pioneer:  'mine',
      groups:   ['pronoun_possessive'],
    },
  },
  {
    id: 'reflexive_pronoun',
    label: 'Reflexive pronoun',
    group: 'Pronouns',
    description: 'Pronoun that refers back to the subject of the same clause. Fills the object slot when subject and object are the same entity. Myself, yourself, himself, herself, itself, ourselves, yourselves, themselves.',
    examples: ['myself', 'yourself', 'himself', 'herself', 'themselves'],
    defaults: {
      category: 'pronoun',
      pioneer:  'myself',
      groups:   ['pronoun_reflexive'],
    },
  },
  {
    id: 'indefinite_pronoun',
    label: 'Indefinite pronoun',
    group: 'Pronouns',
    description: 'Pronoun referring to a non-specific entity. Includes someone/anyone/no one/everyone, something/anything/nothing/everything, plus quantifier-pronouns when used pronominally (some, any, none, all, many, few).',
    examples: ['someone', 'anyone', 'nothing', 'everyone', 'something'],
    defaults: {
      category: 'pronoun',
      pioneer:  'something',
      groups:   ['pronoun_indefinite'],
    },
  },
  {
    id: 'relative_pronoun',
    label: 'Relative pronoun',
    group: 'Pronouns',
    description: 'Pronoun introducing a relative clause that modifies a noun. Who (people-subject), whom (people-object), which (things), that (general), whose (possessive). B1+ structure.',
    examples: ['who', 'whom', 'which', 'whose'],
    defaults: {
      category: 'pronoun',
      pioneer:  'who',
      groups:   ['pronoun_relative'],
    },
  },
  {
    id: 'reciprocal_pronoun',
    label: 'Reciprocal pronoun',
    group: 'Pronouns',
    description: 'Pronoun expressing a mutual relationship between two or more parties. Each other, one another. B1+ structure.',
    examples: ['each other', 'one another'],
    defaults: {
      category: 'pronoun',
      pioneer:  'each other',
      groups:   ['pronoun_reciprocal'],
    },
  },
  {
    id: 'pronoun',
    label: 'Pronoun (umbrella)',
    group: 'Pronouns',
    description: 'Umbrella atom shared by every pronoun-class word as an alternate atom. Use for cross-cutting patterns that fire on "any pronoun" without caring about case. Never the primary atom — every pronoun has a more specific primary class.',
    examples: ['(used as alternateAtom on all pronouns)'],
    defaults: {
      category: 'pronoun',
      pioneer:  null,            // umbrella; no pioneer
      groups:   ['pronoun_all'],
    },
  },

  // ─── Conjunction atoms (split + umbrella) ────────────────────────────────
  {
    id: 'coordinating_conjunction',
    label: 'Coordinating conjunction',
    group: 'Function words',
    description: 'Conjunction that joins two equal grammatical units (words, phrases, or independent clauses). And, but, or, so, yet, nor, for. Does not introduce a dependent clause.',
    examples: ['and', 'but', 'or', 'so', 'yet'],
    defaults: {
      category: 'conjunction',
      pioneer:  'and',
      groups:   ['conjunction_coordinating'],
    },
  },
  {
    id: 'subordinating_conjunction',
    label: 'Subordinating conjunction',
    group: 'Function words',
    description: 'Conjunction that introduces a dependent (subordinate) clause and connects it to the main clause. Because, if, when, although, while, since, unless, until.',
    examples: ['because', 'if', 'when', 'although', 'while'],
    defaults: {
      category: 'conjunction',
      pioneer:  'because',
      groups:   ['conjunction_subordinating'],
    },
  },

  // ─── Infinitive marker ───────────────────────────────────────────────────
  {
    id: 'infinitive_marker',
    label: 'Infinitive marker',
    group: 'Function words',
    description: 'The word "to" when used to license a bare-infinitive verb ("I want TO go"). Distinct from preposition "to" ("I go TO school"). Always set as alternateAtom on the word "to"; never as primary (primary stays preposition).',
    examples: ['to (only as alternateAtom on the word "to")'],
    defaults: {
      category: 'preposition',   // primary stays preposition; alternateAtom only
      pioneer:  null,            // alternate-only; no pioneer
      groups:   ['infinitive_marker_class'],
    },
  },

  // ─── Verb umbrella ───────────────────────────────────────────────────────
  {
    id: 'verb',
    label: 'Verb (umbrella)',
    group: 'Verbs',
    description: 'Umbrella atom shared by every verb-class word as an alternate atom. Use for cross-cutting patterns that fire on "any verb-class word" without caring about subtype (lexical / copula / auxiliary / modal). Never the primary atom — every verb has a more specific primary class. Same shape as the determiner / conjunction / pronoun umbrellas.',
    examples: ['(used as alternateAtom on all verb-class words)'],
    defaults: {
      category: 'verb',
      pioneer:  null,            // umbrella; no pioneer
      groups:   ['verb_all'],
    },
  },

  // ─── Construction atomClasses (structure tokens) ─────────────────────────
  // These atoms are NEVER primary on a single word. They appear ONLY on
  // collapsed multi-word construction tokens emitted by the multi-word-aware
  // tokenizer in src/circuitCheck.js. Defined here so the atom-wiring sanity
  // check covers them and typos surface at app load. See verbConstructions.en.js.
  {
    id: 'modal_construction',
    label: 'Modal construction (structure)',
    group: 'Verbs',
    description: 'STRUCTURE-ONLY atom. Stamped on collapsed multi-word tokens from VERB_CONSTRUCTIONS where the leading verb is a modal — e.g. "will go", "will have eaten", "will be drinking". Never the primary atom on a single word.',
    examples: ['(used only on collapsed construction tokens)'],
    defaults: {
      category: 'verb',
      pioneer:  null,            // structure-only; no pioneer
      groups:   ['verb_constructions'],
    },
  },
  {
    id: 'perfect_construction',
    label: 'Perfect construction (structure)',
    group: 'Verbs',
    description: 'STRUCTURE-ONLY atom. Stamped on collapsed multi-word tokens for perfect aspect — e.g. "have eaten", "have been drinking". Never the primary atom on a single word.',
    examples: ['(used only on collapsed construction tokens)'],
    defaults: {
      category: 'verb',
      pioneer:  null,            // structure-only; no pioneer
      groups:   ['verb_constructions'],
    },
  },
  {
    id: 'progressive_construction',
    label: 'Progressive construction (structure)',
    group: 'Verbs',
    description: 'STRUCTURE-ONLY atom. Stamped on collapsed multi-word tokens for progressive aspect — e.g. "is drinking", "was eating". Never the primary atom on a single word.',
    examples: ['(used only on collapsed construction tokens)'],
    defaults: {
      category: 'verb',
      pioneer:  null,            // structure-only; no pioneer
      groups:   ['verb_constructions'],
    },
  },
]
