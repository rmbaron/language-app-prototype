// Atom Groups — pedagogical clustering of atoms.
//
// DERIVED FILE for ATOM_GROUPS. Source of truth is each atom's
// `defaults.groups` field in src/grammarAtoms.en.js. To put an atom in a
// new group (or change which groups it belongs to), edit defaults.groups on
// the atom record — not this file.
//
// This is the layer ABOVE atoms used for tier presets, bulk-toggle UX in the
// grammar breaker dev panel, and curriculum sequencing. Atoms themselves stay
// linguistic and stable; group membership is curatorial.
//
// Each entry: groupLabel → array of atom IDs that belong to that group.
// (Inverted from the per-atom defaults.groups arrays.)

import { ATOMS } from './grammarAtoms.en.js'
import { deriveAtomGroups } from './atomMetadataDerivations.js'

export const ATOM_GROUPS = deriveAtomGroups(ATOMS)

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
