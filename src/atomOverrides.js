// Atom design-defaults override layer
//
// Each atom record (src/grammarAtoms.en.js) carries a `defaults` block — the
// curatorial / pedagogical / UX choices we ship with. Overrides are how those
// defaults vary per context (learner L1, cohort, experiment) WITHOUT editing
// atom records.
//
// ── Why this file exists today (with no entries) ────────────────────────────
//
// The first per-context override that lands needs an obvious home. If "home"
// isn't decided in advance, it gets embedded in an atom record
// (e.g. `defaults.pioneerByL1 = { es: 'me' }`). That decision sets a precedent:
// the second override does the same, the third does too, and within a year
// every atom record has a `xByContext` map embedded in it. The truth/design
// split breaks down because design fields start carrying context-grids inside
// the canonical record.
//
// Decided in advance: design overrides live HERE, keyed by context. Atom
// records stay clean. Adding a new override is a one-line addition to
// ATOM_OVERRIDES below — never an edit to an atom record.
//
// ── Key shape ───────────────────────────────────────────────────────────────
//
// ATOM_OVERRIDES is keyed by a colon-namespaced contextKey, then by atomId,
// then by the field(s) being overridden:
//
//   ATOM_OVERRIDES = {
//     'l1:es':       { personal_pronoun: { pioneer: 'me' } },
//     'cohort:beta': { demonstrative:    { pioneer: 'that' } },
//   }
//
// Single-dimension keys (one context axis per key) are intentional — composite
// keys ('l1:es+cohort:beta') would invite combinatorial explosion. Multi-axis
// resolution comes from passing an array of contextKeys to resolveAtomDefaults;
// later keys take precedence.
//
// ── Context discovery ──────────────────────────────────────────────────────
//
// currentAtomContext() centralizes "which contextKeys apply to this learner."
// Today it returns null (no overrides active). When per-L1 / per-cohort
// overrides come online, derive the context array from learner profile here,
// in one place — not scattered across consumers.

export const ATOM_OVERRIDES = {
  // Example shape (not active — left as a comment so the first real entry
  // has an obvious template):
  //
  // 'l1:es': {
  //   personal_pronoun: { pioneer: 'me' },          // Spanish: object form may onboard better
  // },
  // 'cohort:beta-pioneer-test': {
  //   demonstrative: { pioneer: 'that' },           // A/B test against default 'this'
  // },
}

// Returns the effective defaults for an atom under the given context.
// Context is null (use defaults as shipped) or a string / array of contextKeys
// to apply in order. Later keys override earlier ones for the same field.
//
// Returns a NEW object — never mutates atom.defaults. Safe to call repeatedly.
export function resolveAtomDefaults(atom, context = null) {
  const base = atom?.defaults ?? {}
  if (!context) return { ...base }
  const keys = Array.isArray(context) ? context : [context]
  const result = { ...base }
  for (const key of keys) {
    const overrides = ATOM_OVERRIDES[key]?.[atom.id]
    if (overrides) Object.assign(result, overrides)
  }
  return result
}

// Returns the active context array for the current learner — or null if no
// overrides apply. Today null. When per-L1 / per-cohort overrides come online,
// build the context from learner profile here so consumers stay agnostic.
//
// Example future implementation:
//   const profile = getLearnerProfile()
//   const ctx = []
//   if (profile.nativeLang) ctx.push(`l1:${profile.nativeLang}`)
//   if (profile.cohort)     ctx.push(`cohort:${profile.cohort}`)
//   return ctx.length ? ctx : null
export function currentAtomContext() {
  return null
}
