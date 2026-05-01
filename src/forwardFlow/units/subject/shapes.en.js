// Subject Shapes — English
//
// The catalog of shapes a Subject slot can take. The Subject slot itself is
// a single primitive (S in the slot-roles registry), but it can be filled
// by several distinct shapes. This file enumerates them.
//
// The shapes form the "core group" — the fundamental, regular ways an
// English clause opens. Detection of which shape a typed Subject matches
// happens in subjectShapeDetector.js.
//
// ── Record shape ──────────────────────────────────────────────────────────
//   id          — string, machine-readable id
//   label       — string, human-readable name
//   description — string, what this shape is and when it's used
//   pattern     — string, schematic of the shape using category names in brackets
//   examples    — array of { sentence, highlight } showing the shape fronting a clause
//   testWords   — array of words needed in the seed (or hardcoded) to test this shape
//
// Source of truth for the macro-layer architecture: notes/macro-layer-sketch.md
//
// Router: subjectShapes.js

export const SUBJECT_SHAPES = [
  {
    id:          'pronoun',
    label:       'Pronoun',
    description: 'A single pronoun in subject case (I, you, he, she, we, they, it). Most common Subject shape in everyday speech.',
    pattern:     '[pronoun]',
    examples: [
      { sentence: 'I run.',                     highlight: 'I' },
      { sentence: 'She is happy.',              highlight: 'She' },
      { sentence: 'They are coming.',           highlight: 'They' },
    ],
    testWords:   ['I', 'you', 'he', 'she', 'we', 'they', 'it'],
  },
  {
    id:          'proper_noun',
    label:       'Proper noun',
    description: 'A name (John, Mary, Tokyo). No determiner needed because the name uniquely identifies its referent.',
    pattern:     '[proper_noun]',
    examples: [
      { sentence: 'John runs.',                 highlight: 'John' },
      { sentence: 'Mary is happy.',             highlight: 'Mary' },
    ],
    testWords:   ['John', 'Mary'],
  },
  {
    id:          'det_noun',
    label:       'Determiner + noun',
    description: 'A determiner (the, a, an, my, your, this) followed by a common noun (singular or plural). The determiner specifies which one.',
    pattern:     '[determiner] [noun]',
    examples: [
      { sentence: 'The dog runs.',              highlight: 'The dog' },
      { sentence: 'A cat sleeps.',              highlight: 'A cat' },
      { sentence: 'The dogs run.',              highlight: 'The dogs' },
      { sentence: 'My brother arrives.',        highlight: 'My brother' },
    ],
    testWords:   ['the', 'a', 'my', 'dog', 'cat'],
  },
  {
    id:          'det_adj_noun',
    label:       'Determiner + adjective + noun',
    description: 'A determiner followed by one or more adjectives and a noun (singular or plural). Adjectives modify the noun.',
    pattern:     '[determiner] [adjective(s)] [noun]',
    examples: [
      { sentence: 'The happy dog runs.',        highlight: 'The happy dog' },
      { sentence: 'The happy dogs run.',        highlight: 'The happy dogs' },
      { sentence: 'A small red car arrives.',   highlight: 'A small red car' },
    ],
    testWords:   ['the', 'happy', 'dog', 'small', 'red', 'car'],
  },
  {
    id:          'quantifier_led',
    label:       'Quantifier + noun',
    description: 'A quantifier (some, every, each, all, no, any, many, few) followed by a noun (singular or plural). Adjectives can sit between the quantifier and the noun ("some happy dogs").',
    pattern:     '[quantifier] [adjective(s)?] [noun]',
    examples: [
      { sentence: 'Some people are tired.',     highlight: 'Some people' },
      { sentence: 'Some happy dogs barked.',    highlight: 'Some happy dogs' },
      { sentence: 'Every child smiles.',        highlight: 'Every child' },
      { sentence: 'All dogs bark.',             highlight: 'All dogs' },
      { sentence: 'Many small fish swim.',      highlight: 'Many small fish' },
    ],
    testWords:   ['some', 'every', 'each', 'all', 'many', 'people', 'child', 'happy'],
  },
  {
    id:          'bare_noun',
    label:       'Bare noun',
    description: 'A noun (singular or plural) without any determiner or quantifier. Common with mass nouns ("Water heals") and generic plurals ("Dogs bark"). Adjectives can sit before the noun ("Cold water refreshes", "Tired children sleep").',
    pattern:     '[adjective(s)?] [noun]',
    examples: [
      { sentence: 'Water is wet.',          highlight: 'Water' },
      { sentence: 'Dogs bark.',             highlight: 'Dogs' },
      { sentence: 'Music heals.',           highlight: 'Music' },
      { sentence: 'Cold water refreshes.',  highlight: 'Cold water' },
      { sentence: 'Tired children sleep.',  highlight: 'Tired children' },
    ],
    testWords:   ['water', 'music', 'dogs', 'children', 'cold', 'tired'],
  },
  {
    id:          'coordinated',
    label:       'Coordinated subjects',
    description: 'Two or more subjects joined by "and" or "or". Triggers plural verb agreement when joined with "and"; agreement with the nearer subject when joined with "or".',
    pattern:     '[subject] and/or [subject]',
    examples: [
      { sentence: 'John and Mary arrived.',     highlight: 'John and Mary' },
      { sentence: 'The dog and the cat slept.', highlight: 'The dog and the cat' },
      { sentence: 'Tea or coffee is fine.',     highlight: 'Tea or coffee' },
    ],
    testWords:   ['John', 'Mary', 'and', 'or'],
  },
  {
    id:          'gerund',
    label:       'Gerund',
    description: 'An -ing form of a verb used as a noun. Acts like a singular subject.',
    pattern:     '[verb-ing]',
    examples: [
      { sentence: 'Swimming is fun.',           highlight: 'Swimming' },
      { sentence: 'Reading helps.',             highlight: 'Reading' },
    ],
    testWords:   ['(any verb in -ing form via L2 enrichment)'],
  },
  {
    id:          'infinitive',
    label:       'Infinitive',
    description: 'A "to" + bare-verb form used as a noun. Acts like a singular subject. Less common as a Subject in everyday speech; more common in formal writing.',
    pattern:     '[to] [verb-base]',
    examples: [
      { sentence: 'To err is human.',           highlight: 'To err' },
      { sentence: 'To leave is to surrender.',  highlight: 'To leave' },
    ],
    testWords:   ['to', '(any verb base form)'],
  },
]
