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
import { FIXED_UNITS } from './multiWordUnits.en.js'
import { PROMPT_LABEL } from './systemVocabulary.js'
import {
  deriveAtomToCategory,
  deriveAtomPioneers,
  deriveAtomGroups,
  derivePromptLabels,
} from './atomMetadataDerivations.js'

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

  // ── 8. Multi-word fixed units must reference defined atoms ────────────────
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

// ── Atom-metadata parity check (Phase 3 of metadata consolidation) ─────────
// Compares the four legacy lookup maps against derived projections from each
// atom's `defaults` block. While both shapes coexist, this confirms the
// per-atom defaults are an exact replica of the legacy maps. After consumer
// migration retires the legacy files (Phase 5), this check becomes obsolete.

function deepEqualMap(legacy, derived, name) {
  const legacyKeys  = Object.keys(legacy).sort()
  const derivedKeys = Object.keys(derived).sort()
  const issues      = []

  if (legacyKeys.length !== derivedKeys.length) {
    issues.push(`key count mismatch: legacy=${legacyKeys.length} derived=${derivedKeys.length}`)
  }

  const allKeys = new Set([...legacyKeys, ...derivedKeys])
  for (const k of allKeys) {
    if (!(k in legacy))  { issues.push(`only in derived: "${k}" → ${JSON.stringify(derived[k])}`); continue }
    if (!(k in derived)) { issues.push(`only in legacy:  "${k}" → ${JSON.stringify(legacy[k])}`);  continue }
    if (JSON.stringify(legacy[k]) !== JSON.stringify(derived[k])) {
      issues.push(`mismatch at "${k}": legacy=${JSON.stringify(legacy[k])} derived=${JSON.stringify(derived[k])}`)
    }
  }

  return { name, ok: issues.length === 0, issues }
}

// Derived ATOM_GROUPS values are arrays — sort each before compare so order
// in the per-atom defaults.groups field doesn't matter.
function normalizeGroupsForCompare(groupsMap) {
  const out = {}
  for (const [k, v] of Object.entries(groupsMap)) {
    out[k] = Array.isArray(v) ? [...v].sort() : v
  }
  return out
}

const _parityResults = [
  deepEqualMap(ATOM_TO_CATEGORY, deriveAtomToCategory(ATOMS), 'category'),
  deepEqualMap(ATOM_PIONEERS,    deriveAtomPioneers(ATOMS),   'pioneers'),
  deepEqualMap(
    normalizeGroupsForCompare(ATOM_GROUPS),
    normalizeGroupsForCompare(deriveAtomGroups(ATOMS)),
    'groups',
  ),
  deepEqualMap(PROMPT_LABEL,     derivePromptLabels(ATOMS),   'promptLabels'),
]

const _parityOk = _parityResults.every(r => r.ok)
if (_parityOk) {
  console.log(`[atomMetadata] parity OK — 4/4 maps match (category, pioneers, groups, promptLabels)`)
} else {
  console.error(`[atomMetadata] DATA PARITY FAILED — derived projections do not match legacy maps. Do not switch consumers until this is resolved.`)
  for (const r of _parityResults) {
    if (!r.ok) {
      console.error(`  [${r.name}] ${r.issues.length} issue(s):`)
      for (const msg of r.issues) console.error(`    ${msg}`)
    }
  }
}
