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
// Router: grammarAtoms.js

export const ATOMS = [
  {
    id: 'personal_pronoun',
    label: 'Personal pronoun',
    description: 'Pronoun referring to a person or thing. Base forms are nominative (I, he, she, we, they); object forms (me, him, her, us, them) are inflected forms of the same words. The slot role determines which form is used — not the atom.',
    examples: ['I', 'you', 'he', 'she', 'it', 'we', 'they'],
  },
  {
    id: 'noun',
    label: 'Noun',
    description: 'A word naming a person, place, thing, or concept.',
    examples: ['food', 'water', 'house', 'book', 'teacher'],
  },
  {
    id: 'lexical_verb',
    label: 'Lexical verb',
    description: 'Main meaning-carrying verb.',
    examples: ['want', 'go', 'have', 'like', 'eat'],
  },
  {
    id: 'copula',
    label: 'Copula',
    description: 'The "be" verb linking subject to adjective, noun, or location.',
    examples: ['am', 'is', 'are'],
  },
  {
    id: 'auxiliary',
    label: 'Auxiliary',
    description: 'Do-support helper verb used in questions and negatives. Contracted negative forms (don\'t, doesn\'t) are inflected forms of do/does.',
    examples: ['do', 'does'],
  },
  {
    id: 'modal_auxiliary',
    label: 'Modal auxiliary',
    description: 'Auxiliary verb expressing ability, possibility, permission, or intention. Always followed by a bare infinitive. Does not inflect for person.',
    examples: ['can', 'will', 'would', 'could', 'should', 'must'],
  },
  {
    id: 'adjective',
    label: 'Adjective',
    description: 'A word describing a noun.',
    examples: ['good', 'big', 'small', 'happy'],
  },
  {
    id: 'determiner',
    label: 'Determiner',
    description: 'Word that introduces a noun, specifying reference or quantity. Includes articles (a, an, the) and general quantifiers (some).',
    examples: ['a', 'an', 'the', 'some'],
  },
  {
    id: 'numeral',
    label: 'Numeral',
    description: 'Number word used to count or quantify. Can precede a noun or stand alone.',
    examples: ['one', 'two', 'three', 'four', 'five'],
  },
  {
    id: 'demonstrative',
    label: 'Demonstrative',
    description: 'Pointing words that identify specific people or things by proximity.',
    examples: ['this', 'that', 'these', 'those'],
  },
  {
    id: 'possessive_determiner',
    label: 'Possessive determiner',
    description: 'Ownership word placed before a noun.',
    examples: ['my', 'your', 'his', 'her', 'our', 'their'],
    // DESIGN NOTE: possessive pronouns (mine, yours, hers, ours, theirs) are forms
    // of these words but fill different slot positions ("this is mine" vs "this is my book").
    // Same case-selection problem as personal_pronoun subject/object.
    // Must be resolved when slot roles are designed — slot role must signal which form to use.
  },
  {
    id: 'preposition',
    label: 'Preposition',
    description: 'Relation, place, or time word.',
    examples: ['in', 'on', 'at', 'to', 'from', 'with'],
    // DESIGN NOTE: "to" serves dual function — preposition ("I go to school") and
    // infinitive marker ("I want to go"). Currently classified as preposition.
    // When verb+infinitive structures are added, slot mismatches will occur unless
    // "to" is handled separately or a dedicated infinitive_marker atom is introduced.
  },
  {
    id: 'interrogative',
    label: 'Interrogative',
    description: 'Question word.',
    examples: ['what', 'where', 'who', 'when', 'why', 'how'],
  },
  {
    id: 'negation_marker',
    label: 'Negation marker',
    description: 'Word that negates a clause.',
    examples: ['not'],
  },
  {
    id: 'conjunction',
    label: 'Conjunction',
    description: 'Linking word. Coordinating conjunctions join equals (and, but, or). Subordinating conjunctions introduce a dependent clause (because, if, when).',
    examples: ['and', 'but', 'or', 'because'],
  },
  {
    id: 'adverb',
    label: 'Adverb',
    description: 'Time, place, manner, or frequency word.',
    examples: ['now', 'here', 'there', 'soon', 'always'],
  },
  {
    id: 'interjection',
    label: 'Interjection',
    description: 'Standalone expression used for greeting, response, courtesy, or feeling. Does not fill a grammatical slot in a sentence structure.',
    examples: ['yes', 'no', 'please', 'sorry', 'hello', 'okay'],
  },
]
