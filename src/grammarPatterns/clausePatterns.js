// Clause-internal patterns — Subject-Verb, Verb-Object, and Copula-Complement
// relationships. The bulk of micro-patterns live here because the clause is
// where most A1 grammar action happens.

import { hasAtom, hasAnyAtom, hasFormType } from './_helpers'

export default [
  // ─── Subject + Verb (pronoun-led) ────────────────────────────────────────
  {
    id:          'pronoun_verb',
    group:       'core_clause',
    description: 'Pronoun subject directly followed by a lexical verb. e.g. "I eat", "she runs".',
    type:        'bigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 1; i++) {
        if (hasAtom(tokens[i], 'personal_pronoun') && hasAtom(tokens[i + 1], 'lexical_verb')) {
          out.push({ span: [i, i + 1] })
        }
      }
      return out
    },
    license: { requiresAtoms: ['personal_pronoun', 'lexical_verb'] },
    coupling: 'subject_verb',
  },

  // ─── Subject + Verb (bare-noun-led) ──────────────────────────────────────
  {
    id:          'noun_verb_proper',
    group:       'core_clause',
    description: 'Proper noun subject + lexical verb. e.g. "Mary runs", "John eats".',
    type:        'bigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 1; i++) {
        if (hasAtom(tokens[i], 'noun') && tokens[i].properNoun &&
            hasAtom(tokens[i + 1], 'lexical_verb')) {
          out.push({ span: [i, i + 1] })
        }
      }
      return out
    },
    license: { requiresAtoms: ['noun', 'lexical_verb'] },
    coupling: 'subject_verb',
  },

  {
    id:          'noun_verb_mass',
    group:       'core_clause',
    description: 'Mass noun subject + lexical verb. e.g. "Water flows", "Music plays".',
    type:        'bigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 1; i++) {
        if (hasAtom(tokens[i], 'noun') &&
            (tokens[i].countability === 'mass' || tokens[i].countability === 'both') &&
            hasAtom(tokens[i + 1], 'lexical_verb')) {
          out.push({ span: [i, i + 1] })
        }
      }
      return out
    },
    license: { requiresAtoms: ['noun', 'lexical_verb'] },
    coupling: 'subject_verb',
  },

  {
    id:          'noun_verb_plural',
    group:       'core_clause',
    description: 'Plural noun subject + lexical verb. e.g. "Dogs run", "Cats sleep".',
    type:        'bigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 1; i++) {
        if (hasAtom(tokens[i], 'noun') && hasFormType(tokens[i], 'plural') &&
            hasAtom(tokens[i + 1], 'lexical_verb')) {
          out.push({ span: [i, i + 1] })
        }
      }
      return out
    },
    license: { requiresAtoms: ['noun', 'lexical_verb'] },
    coupling: 'subject_verb',
  },

  {
    id:          'det_noun_verb',
    group:       'core_clause',
    description: 'Determined noun phrase as subject + lexical verb. e.g. "The cat runs", "My friend eats", "This dog sleeps", "The good cat sleeps".',
    type:        'trigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 2; i++) {
        if (!hasAnyAtom(tokens[i], ['determiner', 'demonstrative', 'possessive_determiner'])) continue
        if (hasAtom(tokens[i + 1], 'noun') && hasAtom(tokens[i + 2], 'lexical_verb')) {
          out.push({ span: [i, i + 2] })
          continue
        }
        if (i + 3 < tokens.length &&
            hasAtom(tokens[i + 1], 'adjective') &&
            hasAtom(tokens[i + 2], 'noun') &&
            hasAtom(tokens[i + 3], 'lexical_verb')) {
          out.push({ span: [i, i + 3] })
        }
      }
      return out
    },
    license: { requiresAtoms: ['noun', 'lexical_verb'] },
    coupling: 'subject_verb',
  },

  {
    id:          'bare_singular_count_noun_verb',
    group:       'core_clause',
    description: 'Bare singular count noun in subject position + verb — broken English. e.g. "Cat runs" (should be "The cat runs"), "Dog sleeps" (should be "A dog sleeps"). Singular count nouns as subjects require a determiner.',
    type:        'bigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 1; i++) {
        const t = tokens[i]
        if (!hasAtom(t, 'noun')) continue
        if (t.countability !== 'count') continue
        if (t.properNoun) continue
        if (hasFormType(t, 'plural')) continue
        if (!hasAtom(tokens[i + 1], 'lexical_verb')) continue
        if (i > 0 && hasAnyAtom(tokens[i - 1], ['determiner', 'demonstrative', 'possessive_determiner', 'adjective'])) continue
        out.push({ span: [i, i + 1] })
      }
      return out
    },
    license: { alwaysForbidden: true },
    coupling: 'subject_verb',
    detectsAtoms: ['noun', 'lexical_verb'],
  },

  // ─── Verb + Object ───────────────────────────────────────────────────────
  {
    id:          'verb_object_proper_noun',
    group:       'core_clause',
    description: 'Lexical verb directly followed by a proper noun (named entity). e.g. "I see Mary", "She likes London". Proper nouns do not require a determiner.',
    type:        'bigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 1; i++) {
        if (hasAtom(tokens[i], 'lexical_verb') &&
            hasAtom(tokens[i + 1], 'noun') &&
            tokens[i + 1].properNoun) {
          out.push({ span: [i, i + 1] })
        }
      }
      return out
    },
    license: { requiresAtoms: ['lexical_verb', 'noun'] },
    coupling: 'verb_object',
  },

  {
    id:          'verb_object_mass_noun',
    group:       'core_clause',
    description: 'Lexical verb directly followed by a mass noun (no determiner needed). e.g. "I drink water", "She loves music", "We need help".',
    type:        'bigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 1; i++) {
        if (hasAtom(tokens[i], 'lexical_verb') &&
            hasAtom(tokens[i + 1], 'noun') &&
            (tokens[i + 1].countability === 'mass' || tokens[i + 1].countability === 'both')) {
          out.push({ span: [i, i + 1] })
        }
      }
      return out
    },
    license: { requiresAtoms: ['lexical_verb', 'noun'] },
    coupling: 'verb_object',
  },

  {
    id:          'verb_object_plural_noun',
    group:       'core_clause',
    description: 'Lexical verb directly followed by a plural-form noun (no determiner needed). e.g. "I want apples", "She likes cats".',
    type:        'bigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 1; i++) {
        if (hasAtom(tokens[i], 'lexical_verb') &&
            hasAtom(tokens[i + 1], 'noun') &&
            hasFormType(tokens[i + 1], 'plural')) {
          out.push({ span: [i, i + 1] })
        }
      }
      return out
    },
    license: { requiresAtoms: ['lexical_verb', 'noun'] },
    coupling: 'verb_object',
  },

  {
    id:          'verb_object_determined_noun',
    group:       'core_clause',
    description: 'Lexical verb followed by a determined noun phrase: verb + (det/dem/poss) + (adjective?) + noun. e.g. "I want a book", "She likes the cat", "We see my friend", "I want a good book".',
    type:        'trigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 2; i++) {
        if (!hasAtom(tokens[i], 'lexical_verb')) continue
        if (!hasAnyAtom(tokens[i + 1], ['determiner', 'demonstrative', 'possessive_determiner'])) continue
        if (hasAtom(tokens[i + 2], 'noun')) {
          out.push({ span: [i, i + 2] })
          continue
        }
        if (i + 3 < tokens.length &&
            hasAtom(tokens[i + 2], 'adjective') &&
            hasAtom(tokens[i + 3], 'noun')) {
          out.push({ span: [i, i + 3] })
        }
      }
      return out
    },
    license: { requiresAtoms: ['lexical_verb', 'noun'] },
    coupling: 'verb_object',
  },

  {
    id:          'verb_object_bare_singular_count_noun',
    group:       'core_clause',
    description: 'Bare singular common count noun in object position — broken English. e.g. "I want apple" (should be "an apple"), "I see cat" (should be "the cat" or "a cat"). Singular common count nouns require a determiner.',
    type:        'bigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 1; i++) {
        if (!hasAtom(tokens[i], 'lexical_verb')) continue
        const t = tokens[i + 1]
        if (!hasAtom(t, 'noun')) continue
        if (t.countability !== 'count') continue
        if (t.properNoun) continue
        if (hasFormType(t, 'plural')) continue
        out.push({ span: [i, i + 1] })
      }
      return out
    },
    license: { alwaysForbidden: true },
    coupling: 'verb_object',
    detectsAtoms: ['lexical_verb', 'noun'],
  },

  {
    id:          'verb_object_pronoun',
    group:       'core_clause',
    description: 'Lexical verb directly followed by an object pronoun. e.g. "see her", "help me".',
    type:        'bigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 1; i++) {
        if (hasAtom(tokens[i], 'lexical_verb') && hasAtom(tokens[i + 1], 'object_pronoun')) {
          out.push({ span: [i, i + 1] })
        }
      }
      return out
    },
    license: { requiresAtoms: ['lexical_verb', 'object_pronoun'] },
    coupling: 'verb_object',
  },

  {
    id:          'intransitive_verb_with_direct_object',
    group:       'core_clause',
    description: 'An intransitive verb followed by what looks like a direct object — broken English. e.g. "I sleep food", "She arrives the city". Intransitive verbs (sleep, arrive, cry) cannot take a direct object.',
    type:        'bigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 1; i++) {
        if (!hasAtom(tokens[i], 'lexical_verb')) continue
        if (tokens[i].transitivity !== 'intransitive') continue
        const next = tokens[i + 1]
        if (hasAtom(next, 'noun') || hasAtom(next, 'object_pronoun')) {
          out.push({ span: [i, i + 1] })
        }
      }
      return out
    },
    license: { alwaysForbidden: true },
    coupling: 'verb_object',
    detectsAtoms: ['lexical_verb', 'noun', 'object_pronoun'],
  },

  // ─── Subject + Copula ────────────────────────────────────────────────────
  {
    id:          'pronoun_copula',
    group:       'copula',
    description: 'Pronoun subject directly followed by a copula. e.g. "I am", "she is".',
    type:        'bigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 1; i++) {
        if (hasAtom(tokens[i], 'personal_pronoun') && hasAtom(tokens[i + 1], 'copula')) {
          out.push({ span: [i, i + 1] })
        }
      }
      return out
    },
    license: { requiresAtoms: ['personal_pronoun', 'copula'] },
    coupling: 'subject_copula',
  },

  // ─── Copula + Complement ─────────────────────────────────────────────────
  {
    id:          'copula_adjective',
    group:       'copula',
    description: 'Copula directly followed by an adjective complement. e.g. "am happy", "is tired".',
    type:        'bigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 1; i++) {
        if (hasAtom(tokens[i], 'copula') && hasAtom(tokens[i + 1], 'adjective')) {
          out.push({ span: [i, i + 1] })
        }
      }
      return out
    },
    license: { requiresAtoms: ['copula', 'adjective'] },
    coupling: 'copula_complement',
  },

  {
    id:          'copula_proper_noun',
    group:       'copula',
    description: 'Copula directly followed by a proper noun. e.g. "I am Mary", "She is John". Proper nouns don\'t require a determiner.',
    type:        'bigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 1; i++) {
        if (hasAtom(tokens[i], 'copula') &&
            hasAtom(tokens[i + 1], 'noun') &&
            tokens[i + 1].properNoun) {
          out.push({ span: [i, i + 1] })
        }
      }
      return out
    },
    license: { requiresAtoms: ['copula', 'noun'] },
    coupling: 'copula_complement',
  },

  {
    id:          'copula_mass_noun',
    group:       'copula',
    description: 'Copula directly followed by a mass noun. e.g. "It is water", "This is music". Mass nouns don\'t require a determiner.',
    type:        'bigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 1; i++) {
        if (hasAtom(tokens[i], 'copula') &&
            hasAtom(tokens[i + 1], 'noun') &&
            (tokens[i + 1].countability === 'mass' || tokens[i + 1].countability === 'both')) {
          out.push({ span: [i, i + 1] })
        }
      }
      return out
    },
    license: { requiresAtoms: ['copula', 'noun'] },
    coupling: 'copula_complement',
  },

  {
    id:          'copula_plural_noun',
    group:       'copula',
    description: 'Copula directly followed by a plural-form noun. e.g. "We are friends", "They are teachers". Plural nouns don\'t require a determiner.',
    type:        'bigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 1; i++) {
        if (hasAtom(tokens[i], 'copula') &&
            hasAtom(tokens[i + 1], 'noun') &&
            hasFormType(tokens[i + 1], 'plural')) {
          out.push({ span: [i, i + 1] })
        }
      }
      return out
    },
    license: { requiresAtoms: ['copula', 'noun'] },
    coupling: 'copula_complement',
  },

  {
    id:          'copula_determined_noun',
    group:       'copula',
    description: 'Copula followed by a determined noun phrase: copula + (det/dem/poss) + (adjective?) + noun. e.g. "I am a teacher", "She is my friend", "It is the good one".',
    type:        'trigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 2; i++) {
        if (!hasAtom(tokens[i], 'copula')) continue
        if (!hasAnyAtom(tokens[i + 1], ['determiner', 'demonstrative', 'possessive_determiner'])) continue
        if (hasAtom(tokens[i + 2], 'noun')) {
          out.push({ span: [i, i + 2] })
          continue
        }
        if (i + 3 < tokens.length &&
            hasAtom(tokens[i + 2], 'adjective') &&
            hasAtom(tokens[i + 3], 'noun')) {
          out.push({ span: [i, i + 3] })
        }
      }
      return out
    },
    license: { requiresAtoms: ['copula', 'noun'] },
    coupling: 'copula_complement',
  },

  {
    id:          'copula_bare_singular_count_noun',
    group:       'copula',
    description: 'Copula directly followed by a bare singular common count noun — broken English. e.g. "She is teacher" (should be "a teacher"), "He is friend" (should be "my friend" / "a friend"). Singular common count nouns as complements require a determiner.',
    type:        'bigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 1; i++) {
        if (!hasAtom(tokens[i], 'copula')) continue
        const t = tokens[i + 1]
        if (!hasAtom(t, 'noun')) continue
        if (t.countability !== 'count') continue
        if (t.properNoun) continue
        if (hasFormType(t, 'plural')) continue
        out.push({ span: [i, i + 1] })
      }
      return out
    },
    license: { alwaysForbidden: true },
    coupling: 'copula_complement',
    detectsAtoms: ['copula', 'noun'],
  },

  {
    id:          'copula_possessive_pronoun',
    group:       'copula',
    description: 'Copula directly followed by a possessive pronoun standing alone. e.g. "This is mine", "It is yours". The possessive pronoun fills the complement slot itself, not as a modifier.',
    type:        'bigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 1; i++) {
        if (hasAtom(tokens[i], 'copula') &&
            hasAtom(tokens[i + 1], 'possessive_pronoun')) {
          out.push({ span: [i, i + 1] })
        }
      }
      return out
    },
    license: { requiresAtoms: ['copula', 'possessive_pronoun'] },
    coupling: 'copula_complement',
  },
]
