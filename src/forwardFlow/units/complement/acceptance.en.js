// Complement Acceptance — English
//
// What structures the C slot accepts. Now a one-line derivation from the
// shared registry's Wire G — `structuresForFunction('C')` returns every
// phrase whose `functions` array includes 'C'. Single source of truth lives
// in src/forwardFlow/structures.en.js.
//
// Two C subtypes, frame-driven:
//   • Cs (Subject Complement) — after copular verbs (SVC frame)
//   • Co (Object Complement)  — after complex transitive verbs (SVOC frame)
// Both subtypes accept the same structure set; they differ in what the
// complement predicates over (the Subject vs the Object), not in its form.
//
// Quirk's complex-intransitive (SVC) and complex-transitive (SVOC)
// terminology maps directly onto this — Cs and Co are the same role
// realized differently.

import { structuresForFunction } from '../../structures.en.js'

export const COMPLEMENT_ACCEPTS = structuresForFunction('C').map(s => s.id)

// Per-frame role assignment. The verb's frame supplies SVC or SVOC; this
// map labels the resulting complement.
export const COMPLEMENT_ROLE_BY_FRAME = {
  SVC:  'Cs',  // Subject Complement
  SVOC: 'Co',  // Object Complement
}
