// Pronominal patterns — reflexive objects and indefinite-pronoun positions.
// Both depend on pronoun atoms beyond the basic personal/object pair.

import { hasAtom, hasVerbClass } from './_helpers'

export default [
  // ─── Reflexive (Tier 3, structural only — no coreference enforcement) ────
  {
    id:          'verb_reflexive_pronoun',
    group:       'reflexive',
    description: 'Lexical verb directly followed by a reflexive pronoun. e.g. "I see myself", "She likes herself". This pattern detects the structural shape; it does not enforce that the reflexive\'s person/number/gender matches the subject — coreference enforcement is deferred.',
    type:        'bigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 1; i++) {
        if (hasAtom(tokens[i], 'lexical_verb') &&
            hasAtom(tokens[i + 1], 'reflexive_pronoun')) {
          out.push({ span: [i, i + 1] })
        }
      }
      return out
    },
    license: { requiresAtoms: ['lexical_verb', 'reflexive_pronoun'] },
    coupling: 'reflexive_object',
  },

  // ─── Indefinite pronouns ─────────────────────────────────────────────────
  {
    id:          'indefinite_pronoun_subject_verb',
    group:       'indefinite',
    description: 'Indefinite pronoun as subject + verb. e.g. "Someone is here", "Something works", "Nobody knows".',
    type:        'bigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 1; i++) {
        if (hasAtom(tokens[i], 'indefinite_pronoun') &&
            hasVerbClass(tokens[i + 1])) {
          out.push({ span: [i, i + 1] })
        }
      }
      return out
    },
    license: { requiresAtoms: ['indefinite_pronoun'] },
    coupling: 'indefinite_subject_object',
  },

  {
    id:          'verb_indefinite_pronoun_object',
    group:       'indefinite',
    description: 'Lexical verb directly followed by an indefinite pronoun as object. e.g. "I want something", "She sees someone", "We need anything".',
    type:        'bigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 1; i++) {
        if (hasAtom(tokens[i], 'lexical_verb') &&
            hasAtom(tokens[i + 1], 'indefinite_pronoun')) {
          out.push({ span: [i, i + 1] })
        }
      }
      return out
    },
    license: { requiresAtoms: ['lexical_verb', 'indefinite_pronoun'] },
    coupling: 'indefinite_subject_object',
  },
]
