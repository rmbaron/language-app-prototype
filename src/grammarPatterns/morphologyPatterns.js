// Morphology patterns — single-word inflections forbidden at A1.
// Past tense, progressive (-ing), perfect (past_participle), possessive 's.
// All license: alwaysForbidden — these flag features above A1 regardless
// of which atoms are unlocked.

import { hasAtom, hasFormType, hasVerbClass } from './_helpers'

// ── Forbidden verb-form dispatch table ─────────────────────────────────────
// Each row maps a forbidden formType to its detection rule. The unified
// forbidden_verb_morphology pattern walks tokens and emits a match for any
// token matching one of the rules.
//
// Adding another above-A1 verb form = add one row here. No new pattern.
//
//   formType:        the inflected form to flag
//   requireVerbClass: also require the token to carry a verb-class atom
//                    (guards against non-verb words that share a tag)
//   excludeFormTypes: skip if the token is also tagged with any of these
//                    (e.g. past_participle is skipped when also 'past'
//                    or 'base' — overloaded surfaces aren't a morphology
//                    signal on their own)
const FORBIDDEN_VERB_FORMS = [
  { formType: 'past',                requireVerbClass: true,  excludeFormTypes: [] },
  { formType: 'present_participle',  requireVerbClass: false, excludeFormTypes: [] },
  { formType: 'past_participle',     requireVerbClass: false, excludeFormTypes: ['past', 'base'] },
]

export default [
  // ─── Above-A1 verb morphology (slot-style, single data-driven rule) ─────
  // Replaces past_simple_morphology, present_participle_morphology, and
  // past_participle_morphology with one pattern that walks the dispatch table.
  {
    id:          'forbidden_verb_morphology',
    group:       'morphology',
    description: 'Above-A1 verb inflection: past simple (-ed / irregular), present participle (-ing), past participle. Data-driven dispatch over the FORBIDDEN_VERB_FORMS table at the top of the file. Adding a new above-A1 verb form = one row in the table; no new pattern.',
    type:        'morphology',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i]
        for (const rule of FORBIDDEN_VERB_FORMS) {
          if (!hasFormType(t, rule.formType)) continue
          if (rule.requireVerbClass && !hasVerbClass(t)) continue
          if (rule.excludeFormTypes.some(ex => hasFormType(t, ex))) continue
          out.push({ span: [i, i], info: { formType: rule.formType } })
          break
        }
      }
      return out
    },
    license: { alwaysForbidden: true },
    coupling: 'morphology_inflection',
    detectsAtoms: ['lexical_verb', 'copula', 'auxiliary'],
  },

  // ─── Possessive clitic — kept separate (surface-regex, not formType) ────
  {
    id:          'possessive_clitic',
    group:       'morphology',
    description: "Possessive 's clitic on a noun. e.g. \"the dog's\". Above A1.",
    type:        'morphology',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length; i++) {
        const surface = tokens[i].surface
        // Only count "X's" when X is a noun (or pronoun acting as one).
        // Common contractions: it's, he's, she's, that's — those are subject+copula
        // contractions and not possessive. Excluded by atom check.
        if (/[a-zA-Z]'s$/i.test(surface) && !surface.toLowerCase().endsWith("it's") &&
            (hasAtom(tokens[i], 'noun') || /^[A-Z]/.test(surface))) {
          out.push({ span: [i, i], info: { surface } })
        }
      }
      return out
    },
    license: { alwaysForbidden: true },
    coupling: 'morphology_inflection',
    detectsAtoms: ['noun', 'personal_pronoun'],
  },
]
