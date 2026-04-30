// Atom Groups — pedagogical clustering of atoms.
//
// This is the layer ABOVE atoms used for tier presets, bulk-toggle UX in the
// grammar breaker dev panel, and curriculum sequencing. Atoms themselves stay
// linguistic and stable; this file is your curricular slicing of them.
//
// Labels are arbitrary — pick whatever names work for the curriculum. They
// don't need to match linguistic terms. Future redesign just changes the
// labels and / or the atom membership; nothing in the validator or pattern
// library breaks.
//
// Each entry: groupLabel → array of atom IDs that belong to that group.

import { ATOMS } from './grammarAtoms.en.js'

export const ATOM_GROUPS = {
  // ─── Pronouns ───────────────────────────────────────────────────────────
  pronoun_subject:        ['personal_pronoun'],
  pronoun_object:          ['object_pronoun'],
  pronoun_possessive:      ['possessive_determiner', 'possessive_pronoun'],
  pronoun_demonstrative:   ['demonstrative'],
  pronoun_reflexive:       ['reflexive_pronoun'],
  pronoun_indefinite:      ['indefinite_pronoun'],
  pronoun_relative:        ['relative_pronoun'],
  pronoun_reciprocal:      ['reciprocal_pronoun'],
  pronoun_interrogative:   ['interrogative'],
  pronoun_all:             ['pronoun'],  // umbrella

  // ─── Verbs ──────────────────────────────────────────────────────────────
  verb_lexical:            ['lexical_verb'],
  verb_copula:             ['copula'],
  verb_auxiliary:          ['auxiliary', 'modal_auxiliary', 'perfect_auxiliary', 'progressive_auxiliary'],
  verb_all:                ['verb'],  // umbrella
  verb_constructions:      ['modal_construction', 'perfect_construction', 'progressive_construction'],

  // ─── Nominal modifiers ──────────────────────────────────────────────────
  determiner_class:        ['determiner', 'indefinite_article', 'definite_article', 'quantifier_determiner', 'demonstrative', 'possessive_determiner'],
  determiner_articles:     ['indefinite_article', 'definite_article'],
  determiner_quantifiers:  ['quantifier_determiner'],
  determiner_all:          ['determiner'],  // umbrella
  numeral_class:           ['numeral'],
  adjective_class:         ['adjective'],

  // ─── Adverbials ─────────────────────────────────────────────────────────
  adverb_class:            ['adverb'],
  preposition_class:       ['preposition'],

  // ─── Connectors ─────────────────────────────────────────────────────────
  conjunction_coordinating:    ['coordinating_conjunction'],
  conjunction_subordinating:   ['subordinating_conjunction'],
  conjunction_all:             ['conjunction'],  // umbrella

  // ─── Standalone / other ─────────────────────────────────────────────────
  negation:                ['negation_marker'],
  interjection_class:      ['interjection'],
  infinitive_marker_class: ['infinitive_marker'],
  noun_class:              ['noun'],
}

// ── Open vs closed class ────────────────────────────────────────────────────
// Linguistic distinction. Open class atoms accumulate vocabulary indefinitely;
// closed class atoms have small finite inventories. Used by UI to decide how
// to present the toggle (open atoms: structural, always-on after introduction;
// closed atoms: tier-gated, the atom IS the unlock).

export const OPEN_CLASS_ATOMS = new Set(['noun', 'lexical_verb', 'adjective', 'adverb'])

export function isOpenClass(atomId) {
  return OPEN_CLASS_ATOMS.has(atomId)
}

// ── Lookup helpers ─────────────────────────────────────────────────────────

// Returns all atom IDs in a group, or [] if the group doesn't exist.
export function atomsInGroup(groupId) {
  return ATOM_GROUPS[groupId] ?? []
}

// Returns the group ID(s) that contain a given atom. An atom may appear in
// multiple groups (e.g., 'demonstrative' appears in both pronoun_demonstrative
// and determiner_class). Returns [] if the atom isn't in any group.
export function groupsContainingAtom(atomId) {
  const out = []
  for (const [groupId, members] of Object.entries(ATOM_GROUPS)) {
    if (members.includes(atomId)) out.push(groupId)
  }
  return out
}

// Returns true if every defined atom in grammarAtoms.en.js appears in at
// least one group. Used as a development sanity check.
export function allAtomsInSomeGroup() {
  const grouped = new Set(Object.values(ATOM_GROUPS).flat())
  const missing = ATOMS.map(a => a.id).filter(id => !grouped.has(id))
  return { ok: missing.length === 0, missing }
}
