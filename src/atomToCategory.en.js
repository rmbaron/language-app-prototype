// Atom → grammaticalCategory map
//
// Maps each atom ID to the broader grammaticalCategory string used by display
// surfaces (uiStrings.common.categories[]). This file lives alongside
// grammarAtoms.en.js so it's easy to keep in sync when atoms are added.
//
// Every atom defined in grammarAtoms.en.js MUST have an entry here. The
// atom-wiring sanity check (atomWiring.js) will report missing entries at
// app load.

export const ATOM_TO_CATEGORY = {
  // Verbs
  lexical_verb:              'verb',
  copula:                    'verb',
  auxiliary:                 'verb',
  modal_auxiliary:           'verb',
  progressive_auxiliary:     'verb',
  perfect_auxiliary:         'verb',
  verb:                      'verb',  // umbrella

  // Verb construction structure tokens (never primary on a single word)
  modal_construction:        'verb',
  perfect_construction:      'verb',
  progressive_construction:  'verb',

  // Pronouns
  personal_pronoun:          'pronoun',
  object_pronoun:            'pronoun',
  possessive_determiner:     'pronoun',
  possessive_pronoun:        'pronoun',
  reflexive_pronoun:         'pronoun',
  indefinite_pronoun:        'pronoun',
  relative_pronoun:          'pronoun',
  reciprocal_pronoun:        'pronoun',
  pronoun:                   'pronoun',         // umbrella

  // Nominals
  noun:                      'noun',
  numeral:                   'determiner',
  demonstrative:             'demonstrative',

  // Modifiers
  adjective:                 'adjective',
  adverb:                    'adverb',

  // Function words
  determiner:                'determiner',
  indefinite_article:        'determiner',
  definite_article:          'determiner',
  quantifier_determiner:     'determiner',
  preposition:               'preposition',
  infinitive_marker:         'preposition',     // primary stays preposition; alternateAtom only
  interrogative:             'interrogative',
  negation_marker:           'adverb',
  coordinating_conjunction:  'conjunction',
  subordinating_conjunction: 'conjunction',
  conjunction:               'conjunction',     // umbrella
  interjection:              'interjection',
}
