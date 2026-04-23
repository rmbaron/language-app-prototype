// Atom Pioneers — English
//
// Designates the first word to introduce each grammar atom class.
// The recommender enforces this: if an atom class has no banked words yet,
// only the designated pioneer for that atom can be surfaced.
//
// null = undesignated. The recommender will not surface ANY word of that
// atom class until a pioneer is set. This is a forcing function — every
// atom's first appearance in the learner's world is a conscious design decision.

export const ATOM_PIONEERS = {
  personal_pronoun:      'i',       // I
  noun:                  'food',    // food
  lexical_verb:          'want',    // want
  copula:                'be',      // be (am / is / are)
  auxiliary:             'do',      // do (do you / I don't)
  modal_auxiliary:       'can',     // can (ability, permission, possibility)
  adjective:             'good',    // good
  determiner:            'a',       // a
  numeral:               'one',     // one
  demonstrative:         'this',    // this
  possessive_determiner: 'my',      // my
  preposition:           'in',      // in (location first; avoids the "to" dual-function problem)
  interrogative:         'what',    // what
  negation_marker:       'not',     // not
  conjunction:           'and',     // and
  adverb:                'here',    // here
  interjection:          'hello',   // hello
}
