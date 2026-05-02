// Complement Acceptance — English
//
// What structures the C slot accepts. The cross-unit structure registry
// (src/forwardFlow/structures.en.js) is the single source of truth for the
// structures themselves; this file is a thin filter declaring which apply
// to C and (eventually) per-frame restrictions.
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

export const COMPLEMENT_ACCEPTS = [
  // Bare/atomic — informal "It's me", proper-noun copular ("This is John")
  'bare_pronominal',
  'proper_noun',
  // NP — "She is a teacher", "She called him a fool"
  'np_basic',
  // AdjP — "She is happy", "She makes him happy" (most common Cs/Co)
  'adjp_basic',
  // PP — "She is in the garden"
  'pp_basic',
  // Gerund — "Her job is reading manuscripts" (catalog-only in v1)
  'gerund_phrase',
  // Infinitive — "Her plan is to leave" (catalog-only)
  'infinitive_phrase',
  // Clausal — "The truth is that she left" (catalog-only)
  'clausal',
]

// Per-frame role assignment. The verb's frame supplies SVC or SVOC; this
// map labels the resulting complement.
export const COMPLEMENT_ROLE_BY_FRAME = {
  SVC:  'Cs',  // Subject Complement
  SVOC: 'Co',  // Object Complement
}
