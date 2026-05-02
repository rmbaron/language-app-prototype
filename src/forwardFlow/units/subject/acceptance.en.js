// Subject Acceptance — English
//
// What structures the S slot accepts. The cross-unit structure registry
// (src/forwardFlow/structures.en.js) is the single source of truth; this
// file is a thin filter declaring which apply to S.
//
// Pronoun case (subject I/he/she vs object me/him/her) is an atom-level
// concern — same shape (bare_pronominal) for both, with case validation
// happening separately when atoms are wired up. The detector currently
// accepts both because learners sometimes type either at first.

export const SUBJECT_ACCEPTS = [
  'bare_pronominal',
  'proper_noun',
  'np_basic',
  'np_with_postmodifier',
  'coordinated',
  'partitive',
  'gerund_phrase',
  'infinitive_phrase',
  'for_to_infinitive',
  'clausal',
]
