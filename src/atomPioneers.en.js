// Atom Pioneers — English
//
// DERIVED FILE. Source of truth is each atom's `defaults.pioneer` field in
// src/grammarAtoms.en.js. This file exists as a backward-compat shim so that
// existing consumers can keep importing { ATOM_PIONEERS } unchanged.
//
// To change the pioneer for an atom (or override per cohort/L1 in the
// future), edit defaults.pioneer on the atom record — not this file.
//
// Designates the first word to introduce each grammar atom class.
// The recommender enforces this: if an atom class has no banked words yet,
// only the designated pioneer for that atom can be surfaced.
//
// null = undesignated. The recommender will not surface ANY word of that
// atom class until a pioneer is set. This is a forcing function — every
// atom's first appearance in the learner's world is a conscious design decision.
//
// For umbrella atoms (pronoun, conjunction, determiner, verb), alternate-only
// atoms (infinitive_marker, perfect_auxiliary, progressive_auxiliary), and
// structure-only atoms (modal/perfect/progressive_construction), null is
// correct — these atoms never appear as a primary classification on any
// word, so no word can serve as their pioneer.

import { ATOMS } from './grammarAtoms.en.js'
import { deriveAtomPioneers } from './atomMetadataDerivations.js'

export const ATOM_PIONEERS = deriveAtomPioneers(ATOMS)
