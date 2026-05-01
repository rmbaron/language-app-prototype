// Atom → grammaticalCategory map
//
// DERIVED FILE. Source of truth is each atom's `defaults.category` field in
// src/grammarAtoms.en.js. This file exists as a backward-compat shim so that
// existing consumers can keep importing { ATOM_TO_CATEGORY } unchanged.
//
// To change the category for an atom, edit defaults.category on the atom
// record — not this file.
//
// Maps atom IDs to the broader grammaticalCategory string used by display
// surfaces (uiStrings.common.categories[]).

import { ATOMS } from './grammarAtoms.en.js'
import { deriveAtomToCategory } from './atomMetadataDerivations.js'

export const ATOM_TO_CATEGORY = deriveAtomToCategory(ATOMS)
