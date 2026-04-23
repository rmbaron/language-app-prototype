// Constructor Test Seed — English
//
// Representative words for each grammar slot category, used to populate
// the word bank when testing the Constructor. Three words per category
// gives enough variety to see the slot system behave correctly.
//
// All words must exist in wordSeed.en.js so Layer 2 data is available.

export const CONSTRUCTOR_TEST_SEED = {
  personal_pronoun:      ['i', 'you', 'she'],
  object_pronoun:        ['me', 'him', 'her'],
  noun:                  ['food', 'friend', 'book'],
  lexical_verb:          ['want', 'eat', 'like'],
  copula:                ['be'],               // only one copula in English
  auxiliary:             ['do'],               // do-support only
  perfect_auxiliary:     ['have'],             // perfect: "I have eaten"
  progressive_auxiliary: ['be'],              // progressive: "I am eating"
  modal_auxiliary:       ['can', 'will', 'should'],
  adjective:             ['good', 'happy', 'tired'],
  determiner:            ['a', 'the'],
  possessive_determiner: ['my', 'your'],
  demonstrative:         ['this', 'that'],
  negation_marker:       ['not'],              // only one negation marker
  adverb:                ['here', 'now', 'there'],
  preposition:           ['in', 'at', 'on'],
}
