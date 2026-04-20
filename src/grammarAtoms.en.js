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
    description: 'Subject or object pronouns referring to people or things.',
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
    description: 'Helper verb used in questions and negatives.',
    examples: ['do', 'does', "don't", "doesn't"],
  },
  {
    id: 'adjective',
    label: 'Adjective',
    description: 'A word describing a noun.',
    examples: ['good', 'big', 'small', 'happy'],
  },
  {
    id: 'determiner_article',
    label: 'Determiner / Article',
    description: 'Words that specify or quantify a noun.',
    examples: ['a', 'an', 'the', 'some'],
  },
  {
    id: 'demonstrative',
    label: 'Demonstrative',
    description: 'Pointing words.',
    examples: ['this', 'that', 'these', 'those'],
  },
  {
    id: 'possessive_determiner',
    label: 'Possessive determiner',
    description: 'Ownership word placed before a noun.',
    examples: ['my', 'your', 'his', 'her', 'our', 'their'],
  },
  {
    id: 'preposition',
    label: 'Preposition',
    description: 'Relation, place, or time word.',
    examples: ['in', 'on', 'at', 'to', 'from', 'with'],
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
    description: 'Word or contracted form that makes a sentence negative.',
    examples: ['not', 'no', "n't"],
  },
  {
    id: 'conjunction',
    label: 'Conjunction',
    description: 'Linking word joining words, phrases, or clauses.',
    examples: ['and', 'but', 'or', 'because'],
  },
  {
    id: 'adverb',
    label: 'Adverb',
    description: 'Time, place, manner, or frequency word.',
    examples: ['now', 'here', 'there', 'soon', 'always'],
  },
]
