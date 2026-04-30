// Clause-internal patterns — Subject-Verb, Verb-Object, and Copula-Complement
// relationships. The bulk of micro-patterns live here because the clause is
// where most A1 grammar action happens.

import { hasAtom, hasAnyAtom, hasFormType, hasDeterminerClass } from './_helpers'

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
    consumesL2Fields: ['properNoun'],
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
    consumesL2Fields: ['countability'],
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
        if (!hasDeterminerClass(tokens[i])) continue
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

  // (`bare_singular_count_noun_verb` retired here — subsumed by
  // `bare_singular_count_noun_unlicensed` in nounPhrasePatterns.js, which
  // catches the same shape but is position-agnostic. Same rule fires whether
  // the bare noun is in subject, object, or complement position.)

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
    consumesL2Fields: ['properNoun'],
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
    consumesL2Fields: ['countability'],
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
        if (!hasDeterminerClass(tokens[i + 1])) continue
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

  // (`verb_object_bare_singular_count_noun` retired here — subsumed by
  // `bare_singular_count_noun_unlicensed` in nounPhrasePatterns.js. Same rule,
  // position-agnostic.)

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
    consumesL2Fields: ['transitivity'],
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

  // ─── Copula + Complement (slot-style, single rule) ───────────────────────
  // ONE pattern that licenses every valid copula complement:
  //   adjective                    "is happy"
  //   bare proper noun             "is Mary"
  //   bare mass / both noun        "is water"
  //   bare plural noun             "are friends"
  //   determined NP (det+noun)     "is a teacher" / "is my friend"
  //   determined NP with adj       "is the good one" / "is a happy dog"
  //   possessive pronoun standalone "is mine" / "is yours"
  //
  // The complement is the slot. Each shape above is a valid filler. Bare
  // singular common count nouns are NOT licensed here — they're caught by
  // `bare_singular_count_noun_unlicensed` (in nounPhrasePatterns.js).
  //
  // Replaces six per-complement-type bigram/trigram patterns with one
  // compositional slot rule. New complement shapes (e.g. infinitive when A1
  // expands) become small additions to the inline shape table, not new
  // top-level patterns.
  {
    id:          'copula_complement',
    group:       'copula',
    description: 'Copula taking a valid complement: adjective ("is happy"), bare noun (proper / mass / plural — "is Mary", "is water", "are friends"), determined noun phrase ("is a teacher", "is the good one"), or possessive pronoun standalone ("is mine"). One slot rule covering every valid copula-complement shape at A1.',
    type:        'trigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 1; i++) {
        if (!hasAtom(tokens[i], 'copula')) continue
        const endIdx = matchCopulaComplement(tokens, i + 1)
        if (endIdx !== null) out.push({ span: [i, endIdx] })
      }
      return out
    },
    license: { requiresAtoms: ['copula'] },
    coupling: 'copula_complement',
    consumesL2Fields: ['countability', 'properNoun'],
  },
]

// Helper: starting at `start`, return the index of the last token of a valid
// copula complement, or null if no valid complement begins at `start`.
//
// Inline rather than in _helpers because it's specific to this pattern's
// shape. If verb_object_slot adopts a similar shape later, the noun-phrase
// portion here can be promoted to a shared helper.
function matchCopulaComplement(tokens, start) {
  if (start >= tokens.length) return null
  const t = tokens[start]

  // Adjective alone (predicative)
  if (hasAtom(t, 'adjective')) return start

  // Possessive pronoun standalone
  if (hasAtom(t, 'possessive_pronoun')) return start

  // Bare noun: proper, mass/both, or plural. Bare singular count nouns are
  // intentionally NOT licensed here — `bare_singular_count_noun_unlicensed`
  // flags them as broken.
  if (hasAtom(t, 'noun')) {
    if (t.properNoun) return start
    if (t.countability === 'mass' || t.countability === 'both') return start
    if (hasFormType(t, 'plural')) return start
    return null
  }

  // Determined noun phrase: det + noun, or det + adj + noun
  if (hasDeterminerClass(t)) {
    if (start + 1 < tokens.length && hasAtom(tokens[start + 1], 'noun')) {
      return start + 1
    }
    if (start + 2 < tokens.length &&
        hasAtom(tokens[start + 1], 'adjective') &&
        hasAtom(tokens[start + 2], 'noun')) {
      return start + 2
    }
  }

  return null
}
