// Subject Acceptance — English
//
// What structures the S slot accepts. Now a one-line derivation from the
// shared registry's Wire G — `structuresForFunction('S')` returns every
// phrase whose `functions` array includes 'S'. Single source of truth lives
// in src/forwardFlow/structures.en.js.
//
// Pronoun case (subject I/he/she vs object me/him/her) is an atom-level
// concern — same shape (bare_pronominal) for both, with case validation
// happening separately when atoms are wired up. The detector currently
// accepts both because learners sometimes type either at first.

import { structuresForFunction } from '../../structures.en.js'

export const SUBJECT_ACCEPTS = structuresForFunction('S').map(s => s.id)
