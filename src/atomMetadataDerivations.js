// Atom metadata derivations
//
// Pure projections from the ATOMS list (src/grammarAtoms.en.js) into the
// shapes that legacy lookup files used to provide. Each function takes the
// atom list and returns the same shape as one of the legacy maps:
//
//   deriveAtomToCategory(ATOMS)  ↔ legacy ATOM_TO_CATEGORY
//   deriveAtomPioneers(ATOMS)    ↔ legacy ATOM_PIONEERS
//   deriveAtomGroups(ATOMS)      ↔ legacy ATOM_GROUPS  (inverted)
//   derivePromptLabels(ATOMS)    ↔ legacy PROMPT_LABEL
//
// Source of truth is each atom's `defaults` block. Atoms without a particular
// field are handled gracefully:
//   • category — required; missing means a malformed atom (parity check fails)
//   • pioneer  — explicit `null` is a valid curatorial choice for umbrellas
//                and alternate-only atoms; treated identically to legacy maps
//   • groups   — defaults to [] when omitted
//   • promptLabel — only emitted for atoms that declare one (legacy behavior)
//
// These functions are pure — no side effects, no IO, no caching. Callers
// memoize at the import site if needed.

export function deriveAtomToCategory(atoms) {
  const out = {}
  for (const atom of atoms) {
    if (atom.defaults?.category !== undefined) {
      out[atom.id] = atom.defaults.category
    }
  }
  return out
}

export function deriveAtomPioneers(atoms) {
  const out = {}
  for (const atom of atoms) {
    // pioneer is in defaults; explicit null is intentional (umbrella / alt-only)
    if (atom.defaults && 'pioneer' in atom.defaults) {
      out[atom.id] = atom.defaults.pioneer
    }
  }
  return out
}

// Atom records carry per-atom group memberships in defaults.groups.
// The legacy ATOM_GROUPS shape is the inverse: groupName → [atomIds].
// This function rebuilds that inverted map.
export function deriveAtomGroups(atoms) {
  const out = {}
  for (const atom of atoms) {
    const groups = atom.defaults?.groups ?? []
    for (const g of groups) {
      if (!out[g]) out[g] = []
      out[g].push(atom.id)
    }
  }
  return out
}

export function derivePromptLabels(atoms) {
  const out = {}
  for (const atom of atoms) {
    const label = atom.defaults?.promptLabel
    if (label) out[atom.id] = label
  }
  return out
}
