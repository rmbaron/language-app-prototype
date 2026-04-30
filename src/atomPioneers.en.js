// Atom Pioneers — English
//
// Designates the first word to introduce each grammar atom class.
// The recommender enforces this: if an atom class has no banked words yet,
// only the designated pioneer for that atom can be surfaced.
//
// null = undesignated. The recommender will not surface ANY word of that
// atom class until a pioneer is set. This is a forcing function — every
// atom's first appearance in the learner's world is a conscious design decision.
//
// For umbrella atoms (pronoun, conjunction) and alternate-atom-only atoms
// (infinitive_marker), null is correct — these atoms never appear as a
// primary classification on any word, so no word can serve as their pioneer.

export const ATOM_PIONEERS = {
  // ── Existing atoms ───────────────────────────────────────────────────────
  personal_pronoun:      'i',       // I
  object_pronoun:        'me',      // me
  noun:                  'food',    // food
  lexical_verb:          'want',    // want
  copula:                'be',      // be (am / is / are)
  auxiliary:             'do',      // do (do you / I don't)
  modal_auxiliary:       'can',     // can (ability, permission, possibility)
  adjective:             'good',    // good
  numeral:               'one',     // one
  demonstrative:         'this',    // this
  possessive_determiner: 'my',      // my
  preposition:           'in',      // in (location first; avoids the "to" dual-function problem)
  interrogative:         'what',    // what
  negation_marker:       'not',     // not
  adverb:                'here',    // here
  interjection:          'hello',   // hello

  // ── New pronoun atoms ────────────────────────────────────────────────────
  possessive_pronoun:    'mine',         // mine ("this is mine") — 1st person, simplest
  reflexive_pronoun:     'myself',       // myself — 1st person, easiest reflexive
  indefinite_pronoun:    'something',    // something — most flexible at A1/A2
  relative_pronoun:      'who',          // who (people first; B1+ when relatives surface)
  reciprocal_pronoun:    'each other',   // each other (only 2 reciprocals; B1+)

  // ── New conjunction atoms ────────────────────────────────────────────────
  coordinating_conjunction:  'and',       // and (replaces the legacy "conjunction" pioneer)
  subordinating_conjunction: 'because',   // because (most natural A1.2/A2 subordinating)

  // ── Determiner subtypes ──────────────────────────────────────────────────
  indefinite_article:    'a',     // a (an is allomorph of same atom)
  definite_article:      'the',   // the
  quantifier_determiner: 'some',  // some — most flexible quantifier at A1

  // ── Umbrella atoms — never primary, no pioneer needed ────────────────────
  pronoun:               null,    // umbrella; every pronoun's alternateAtom
  conjunction:           null,    // umbrella; every conjunction's alternateAtom
  determiner:            null,    // umbrella; every determiner-class word's alternateAtom

  // ── Alternate-atom-only atoms — never primary, no pioneer needed ────────
  infinitive_marker:     null,    // alternateAtom on the word "to" (primary stays preposition)
}
