// Atom Wiring — sanity check
//
// Validates atom records are well-formed and that external references to
// atoms (function words, fixed units) point at atoms that exist.
//
// After the metadata consolidation (Phases 1-4), the legacy lookup files
// (atomToCategory, atomPioneers, atomGroups, PROMPT_LABEL) are derived from
// each atom's `defaults` block, so the cross-file consistency checks of the
// old wiring system are now structural impossibilities. The remaining checks
// validate:
//   1. Each atom has a well-formed defaults block
//   2. Function words and multi-word fixed units reference defined atoms
//
// This module runs at app load. Call checkAtomWiring() from anywhere; it
// returns { ok, issues } where each issue has { atomId, kind, message }.
// Issues are also logged to console at module load.

import { ATOMS } from './grammarAtoms.en.js'
import { ALWAYS_PASS_WORDS } from './circuitCheck.js'
import { FIXED_UNITS } from './multiWordUnits.en.js'

export function checkAtomWiring() {
  const atomIds = new Set(ATOMS.map(a => a.id))
  const issues  = []

  // ── 1. Every atom must have a well-formed defaults block ──────────────────
  for (const atom of ATOMS) {
    const d = atom.defaults
    if (!d || typeof d !== 'object') {
      issues.push({
        atomId:  atom.id,
        kind:    'defaults_missing',
        message: `atom "${atom.id}" has no defaults block — add { category, pioneer, groups, promptLabel? }`,
      })
      continue
    }
    if (typeof d.category !== 'string' || d.category.length === 0) {
      issues.push({
        atomId:  atom.id,
        kind:    'defaults_category_invalid',
        message: `atom "${atom.id}".defaults.category must be a non-empty string (got ${JSON.stringify(d.category)})`,
      })
    }
    if (!('pioneer' in d)) {
      issues.push({
        atomId:  atom.id,
        kind:    'defaults_pioneer_missing',
        message: `atom "${atom.id}".defaults.pioneer must be set explicitly (use null for umbrella / alternate-only atoms)`,
      })
    } else if (d.pioneer !== null && (typeof d.pioneer !== 'string' || d.pioneer.length === 0)) {
      issues.push({
        atomId:  atom.id,
        kind:    'defaults_pioneer_invalid',
        message: `atom "${atom.id}".defaults.pioneer must be null or a non-empty word id (got ${JSON.stringify(d.pioneer)})`,
      })
    }
    if (!Array.isArray(d.groups)) {
      issues.push({
        atomId:  atom.id,
        kind:    'defaults_groups_invalid',
        message: `atom "${atom.id}".defaults.groups must be an array of group ids (got ${JSON.stringify(d.groups)})`,
      })
    } else if (d.groups.length === 0) {
      issues.push({
        atomId:  atom.id,
        kind:    'defaults_groups_empty',
        message: `atom "${atom.id}".defaults.groups is empty — bulk-toggle UX won't include it`,
      })
    }
    if ('promptLabel' in d && d.promptLabel !== null && (typeof d.promptLabel !== 'string' || d.promptLabel.length === 0)) {
      issues.push({
        atomId:  atom.id,
        kind:    'defaults_promptLabel_invalid',
        message: `atom "${atom.id}".defaults.promptLabel must be a non-empty string or omitted (got ${JSON.stringify(d.promptLabel)})`,
      })
    }
  }

  // ── 2. Function words must reference defined atoms ────────────────────────
  for (const fw of ALWAYS_PASS_WORDS) {
    if (!atomIds.has(fw.atomClass)) {
      issues.push({
        atomId:  fw.atomClass,
        kind:    'function_word_orphan_atom',
        message: `function word "${fw.word}" has atomClass "${fw.atomClass}" — no such atom is defined in ATOMS`,
      })
    }
    for (const umb of fw.umbrellaAtoms ?? []) {
      if (!atomIds.has(umb)) {
        issues.push({
          atomId:  umb,
          kind:    'function_word_orphan_umbrella',
          message: `function word "${fw.word}" lists umbrella atom "${umb}" — no such atom is defined in ATOMS`,
        })
      }
    }
  }

  // ── 3. Multi-word fixed units must reference defined atoms ────────────────
  for (const unit of FIXED_UNITS) {
    if (!atomIds.has(unit.atomClass)) {
      issues.push({
        atomId:  unit.atomClass,
        kind:    'fixed_unit_orphan_atom',
        message: `fixed unit "${unit.text}" has atomClass "${unit.atomClass}" — no such atom is defined in ATOMS`,
      })
    }
    for (const umb of unit.umbrellaAtoms ?? []) {
      if (!atomIds.has(umb)) {
        issues.push({
          atomId:  umb,
          kind:    'fixed_unit_orphan_umbrella',
          message: `fixed unit "${unit.text}" lists umbrella atom "${umb}" — no such atom is defined in ATOMS`,
        })
      }
    }
  }

  return { ok: issues.length === 0, issues }
}

// Run at module load. Console-warn any issues so they surface on app start.
const _result = checkAtomWiring()
if (!_result.ok) {
  console.warn(`[atomWiring] ${_result.issues.length} wiring issue(s) detected on load:`)
  for (const i of _result.issues) {
    console.warn(`  [${i.kind}] ${i.message}`)
  }
}
