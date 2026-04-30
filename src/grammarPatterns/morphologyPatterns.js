// Morphology patterns — single-word inflections forbidden at A1.
// Past tense, progressive (-ing), perfect (past_participle), possessive 's.
// All license: alwaysForbidden — these flag features above A1 regardless
// of which atoms are unlocked.

import { hasAtom, hasFormType, hasVerbClass } from './_helpers'

export default [
  {
    id:          'past_simple_morphology',
    group:       'morphology',
    description: 'Verb in past simple form (-ed for regulars, irregular past). Above A1.',
    type:        'morphology',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length; i++) {
        if (hasFormType(tokens[i], 'past') && hasVerbClass(tokens[i])) {
          out.push({ span: [i, i], info: { formType: 'past' } })
        }
      }
      return out
    },
    license: { alwaysForbidden: true },
    coupling: 'morphology_inflection',
    detectsAtoms: ['lexical_verb', 'copula', 'auxiliary'],
  },

  {
    id:          'present_participle_morphology',
    group:       'morphology',
    description: '-ing form on a verb (progressive aspect, gerund). Above A1 until progressive unlocks.',
    type:        'morphology',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length; i++) {
        if (hasFormType(tokens[i], 'present_participle')) {
          out.push({ span: [i, i], info: { formType: 'present_participle' } })
        }
      }
      return out
    },
    license: { alwaysForbidden: true },
    coupling: 'morphology_inflection',
    detectsAtoms: ['lexical_verb', 'copula', 'auxiliary'],
  },

  {
    id:          'past_participle_morphology',
    group:       'morphology',
    description: 'Past participle form on a verb (perfect aspect). Above A1.',
    type:        'morphology',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length; i++) {
        if (hasFormType(tokens[i], 'past_participle') &&
            !hasFormType(tokens[i], 'past') && !hasFormType(tokens[i], 'base')) {
          // Skip surfaces also tagged 'past' (e.g. 'had') — caught by past_simple_morphology
          // Skip surfaces also tagged 'base' (e.g. 'come', 'run') — overloaded surface, not a morphology signal
          out.push({ span: [i, i], info: { formType: 'past_participle' } })
        }
      }
      return out
    },
    license: { alwaysForbidden: true },
    coupling: 'morphology_inflection',
    detectsAtoms: ['lexical_verb', 'copula', 'auxiliary'],
  },

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
