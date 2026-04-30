// Atom Wiring — sanity check
//
// When an atom is added to grammarAtoms.en.js, it must be wired into several
// other places: the function-word table, atom pioneers, atom groups, the
// atom→category map, and (for new closed-class atoms) the open/closed list.
// Forgetting any one produces silent degraded behavior — words don't surface
// in the recommender, displays render no category, etc.
//
// This module runs a wiring check against the canonical ATOMS list and
// reports any gaps. Call checkAtomWiring() from anywhere; it returns
// { ok, issues } where each issue has { atomId, kind, message }.
//
// Issues are also logged to console at module load, so a missing wiring
// surfaces immediately on app start without anyone needing to remember to
// run the check.

import { ATOMS } from './grammarAtoms.en.js'
import { ATOM_PIONEERS } from './atomPioneers.en.js'
import { ATOM_GROUPS } from './atomGroups.en.js'
import { ATOM_TO_CATEGORY } from './atomToCategory.en.js'
import { ALWAYS_PASS_WORDS } from './circuitCheck.js'

export function checkAtomWiring() {
  const atomIds = new Set(ATOMS.map(a => a.id))
  const issues  = []

  // ── 1. Every atom should appear in ATOM_PIONEERS ──────────────────────────
  // Even umbrella / alternate-only atoms should have an entry (set to null
  // explicitly) so the file documents the curatorial decision.
  for (const atom of ATOMS) {
    if (!(atom.id in ATOM_PIONEERS)) {
      issues.push({
        atomId:  atom.id,
        kind:    'pioneer_missing',
        message: `atom "${atom.id}" has no entry in ATOM_PIONEERS — add one (use null for umbrella / alternate-only atoms)`,
      })
    }
  }

  // ── 2. Every atom should appear in some atomGroup ─────────────────────────
  const atomsInGroups = new Set(Object.values(ATOM_GROUPS).flat())
  for (const atom of ATOMS) {
    if (!atomsInGroups.has(atom.id)) {
      issues.push({
        atomId:  atom.id,
        kind:    'group_missing',
        message: `atom "${atom.id}" is not in any atomGroup — bulk-toggle UX won't include it`,
      })
    }
  }

  // ── 3. Every atom should appear in ATOM_TO_CATEGORY ───────────────────────
  for (const atom of ATOMS) {
    if (!(atom.id in ATOM_TO_CATEGORY)) {
      issues.push({
        atomId:  atom.id,
        kind:    'category_missing',
        message: `atom "${atom.id}" has no entry in ATOM_TO_CATEGORY — display surfaces will render with no category`,
      })
    }
  }

  // ── 4. Function words must reference defined atoms ────────────────────────
  for (const fw of ALWAYS_PASS_WORDS) {
    if (!atomIds.has(fw.atomClass)) {
      issues.push({
        atomId:  fw.atomClass,
        kind:    'function_word_orphan_atom',
        message: `function word "${fw.word}" has atomClass "${fw.atomClass}" — no such atom is defined in ATOMS`,
      })
    }
  }

  // ── 5. ATOM_PIONEERS keys must reference defined atoms ────────────────────
  for (const pioneerKey of Object.keys(ATOM_PIONEERS)) {
    if (!atomIds.has(pioneerKey)) {
      issues.push({
        atomId:  pioneerKey,
        kind:    'pioneer_orphan',
        message: `ATOM_PIONEERS has entry for "${pioneerKey}" but no such atom is defined`,
      })
    }
  }

  // ── 6. ATOM_GROUPS members must reference defined atoms ───────────────────
  for (const [group, atomList] of Object.entries(ATOM_GROUPS)) {
    for (const aid of atomList) {
      if (!atomIds.has(aid)) {
        issues.push({
          atomId:  aid,
          kind:    'group_orphan',
          message: `atomGroup "${group}" references "${aid}" but no such atom is defined`,
        })
      }
    }
  }

  // ── 7. ATOM_TO_CATEGORY keys must reference defined atoms ─────────────────
  for (const key of Object.keys(ATOM_TO_CATEGORY)) {
    if (!atomIds.has(key)) {
      issues.push({
        atomId:  key,
        kind:    'category_orphan',
        message: `ATOM_TO_CATEGORY has entry for "${key}" but no such atom is defined`,
      })
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
