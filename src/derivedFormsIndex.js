// Derived Forms Index
//
// Tracks the union of derivational siblings expected per lemma family,
// based on the `derivedForms` field on enriched L2 records.
//
// Companion to:
//   - atomIndex.js         — atomId × cefrLevel → wordId[]
//   - featureIndex.js      — feature × value → wordId[]
//                            (lemmaFamily lives here as an "open" feature —
//                             bucket key = family root, value = wordId list)
//   - derivedFormsIndex.js — family root → expected derived forms (this file)
//
// Pairing with featureIndex: featureIndex.lemmaFamily[familyRoot] gives the
// list of seeded family members. derivedFormsIndex[familyRoot] gives the
// list of forms ENRICHMENT thinks the family should have. The Library view
// computes "expected − present" = the gap. Each gap row is a derivational
// sibling enrichment thinks should exist but isn't seeded yet — the original
// "happily" gap.
//
// Storage key: lapp-derived-forms-index-{lang}
// Schema:      { [familyRoot]: [{ form: string, category: string }] }
//
// Coating policy:
//   - Each enriched word contributes its derivedForms array to its family's
//     expected list. Forms are deduped by (form, category) within the family.
//   - Removal is a no-op when re-enrichment changes derivedForms — the
//     family's expected set is the union; a member can't unilaterally retract
//     a form since other members may also expect it. Use rebuild instead.

function storageKey(lang) {
  return `lapp-derived-forms-index-${lang}`
}

function load(lang) {
  try {
    const raw = localStorage.getItem(storageKey(lang))
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function save(lang, index) {
  localStorage.setItem(storageKey(lang), JSON.stringify(index))
}

function dedupe(forms) {
  const seen = new Set()
  const out = []
  for (const f of forms) {
    if (!f?.form) continue
    const key = `${f.form}::${f.category ?? ''}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ form: f.form, category: f.category ?? null })
  }
  return out
}

// ── Read ──────────────────────────────────────────────────────────────────────

export function getDerivedFormsIndex(lang) {
  return load(lang)
}

export function getExpectedFormsForFamily(familyRoot, lang) {
  const index = load(lang)
  return index[familyRoot] ?? []
}

// ── Write (pipeline only) ─────────────────────────────────────────────────────

// Adds derived forms to the family's expected set, deduped.
// Family is identified by lemmaFamily root.
export function addDerivedFormsToFamily(familyRoot, derivedForms, lang) {
  if (!familyRoot || !Array.isArray(derivedForms) || derivedForms.length === 0) return
  const index = load(lang)
  const existing = index[familyRoot] ?? []
  index[familyRoot] = dedupe([...existing, ...derivedForms])
  save(lang, index)
}

// Wipes and rebuilds from a list of { familyRoot, derivedForms } records.
// Pipeline/dev tool only — never called at runtime.
export function rebuildDerivedFormsIndex(lang, allEntries) {
  const index = {}
  for (const { familyRoot, derivedForms } of allEntries) {
    if (!familyRoot || !Array.isArray(derivedForms)) continue
    if (!index[familyRoot]) index[familyRoot] = []
    index[familyRoot].push(...derivedForms)
  }
  // Dedupe each family's set after the unionizing pass.
  for (const k of Object.keys(index)) {
    index[k] = dedupe(index[k])
  }
  save(lang, index)
}

export function clearDerivedFormsIndex(lang) {
  localStorage.removeItem(storageKey(lang))
}
