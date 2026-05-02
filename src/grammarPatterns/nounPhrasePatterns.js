// Noun-phrase internal patterns — modifiers attaching to a head noun within
// a noun phrase: determiners, demonstratives, possessive determiners,
// attributive adjectives.
//
// Wire P into Floor 2: every pattern here licenses some flavor of NP
// composition. The `phrase` field on each pattern points at the Floor 2
// phrase id it licenses (np_basic). The legacy `coupling: 'noun_phrase_internal'`
// tag is retained while the validator still requires it; once the grammar
// circuit is rebuilt, the coupling tag can retire and `phrase` becomes the
// canonical Wire P link.

import { hasAtom, hasFormType, hasDeterminerClass } from './_helpers'

export default [
  {
    id:          'determiner_noun',
    group:       'noun_phrase',
    description: 'Article-style determiner followed by a noun. e.g. "the cat", "a book". Optional adjective in between licensed by attributive_adjective.',
    type:        'bigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 1; i++) {
        if (hasAtom(tokens[i], 'determiner') && hasAtom(tokens[i + 1], 'noun')) {
          out.push({ span: [i, i + 1] })
        }
      }
      return out
    },
    license: { requiresAtoms: ['determiner', 'noun'] },
    phrase:   'np_basic',
    coupling: 'noun_phrase_internal',
  },

  {
    id:          'demonstrative_noun',
    group:       'noun_phrase',
    description: 'Demonstrative followed by a noun. e.g. "this cat", "those books".',
    type:        'bigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 1; i++) {
        if (hasAtom(tokens[i], 'demonstrative') && hasAtom(tokens[i + 1], 'noun')) {
          out.push({ span: [i, i + 1] })
        }
      }
      return out
    },
    license: { requiresAtoms: ['demonstrative', 'noun'] },
    phrase:   'np_basic',
    coupling: 'noun_phrase_internal',
  },

  {
    id:          'possessive_determiner_noun',
    group:       'noun_phrase',
    description: 'Possessive determiner followed by a noun. e.g. "my cat", "her book".',
    type:        'bigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 1; i++) {
        if (hasAtom(tokens[i], 'possessive_determiner') && hasAtom(tokens[i + 1], 'noun')) {
          out.push({ span: [i, i + 1] })
        }
      }
      return out
    },
    license: { requiresAtoms: ['possessive_determiner', 'noun'] },
    phrase:   'np_basic',
    coupling: 'noun_phrase_internal',
  },

  {
    id:          'attributive_adjective',
    group:       'noun_phrase',
    description: 'Adjective directly before a noun (attributive position). e.g. "good food", "the tired teacher".',
    type:        'bigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 1; i++) {
        if (hasAtom(tokens[i], 'adjective') && hasAtom(tokens[i + 1], 'noun')) {
          out.push({ span: [i, i + 1] })
        }
      }
      return out
    },
    license: { requiresAtoms: ['adjective', 'noun'] },
    phrase:   'np_basic',
    coupling: 'noun_phrase_internal',
  },

  {
    id:          'indefinite_article_with_plural_noun',
    group:       'noun_phrase',
    description: 'Indefinite article "a" or "an" followed (with optional adjective) by a plural noun — broken English. e.g. "a apples", "a good waters", "an oranges". The indefinite article requires a singular count noun.',
    type:        'trigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 1; i++) {
        if (!hasAtom(tokens[i], 'indefinite_article')) continue
        for (let j = i + 1; j < tokens.length && j <= i + 3; j++) {
          if (hasAtom(tokens[j], 'adjective')) continue
          if (hasAtom(tokens[j], 'noun') && hasFormType(tokens[j], 'plural')) {
            out.push({ span: [i, j] })
          }
          break
        }
      }
      return out
    },
    license: { alwaysForbidden: true },
    phrase:   'np_basic',
    coupling: 'noun_phrase_internal',
    detectsAtoms: ['indefinite_article', 'noun', 'adjective'],
  },

  {
    id:          'indefinite_article_with_mass_noun',
    group:       'noun_phrase',
    description: 'Indefinite article "a" or "an" followed (with optional adjective) by a mass noun — broken English in standard usage. e.g. "a water", "a good music", "an information". Mass nouns combine with "the", "some", or no determiner — not with "a/an". (Restaurant-style "a water" / "a coffee" is a special countable use; A1 enforces the strict rule.)',
    type:        'trigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 1; i++) {
        if (!hasAtom(tokens[i], 'indefinite_article')) continue
        for (let j = i + 1; j < tokens.length && j <= i + 3; j++) {
          if (hasAtom(tokens[j], 'adjective')) continue
          if (hasAtom(tokens[j], 'noun') && tokens[j].countability === 'mass') {
            out.push({ span: [i, j] })
          }
          break
        }
      }
      return out
    },
    license: { alwaysForbidden: true },
    phrase:   'np_basic',
    coupling: 'noun_phrase_internal',
    detectsAtoms: ['indefinite_article', 'noun', 'adjective'],
    consumesL2Fields: ['countability'],
  },

  // (`indefinite_article_with_proper_noun` retired here — subsumed by
  // `determiner_with_proper_noun` below, which uses the `determiner` umbrella
  // and catches every determiner-class word including `a/an`. Single slot rule
  // replaced what would have been five per-determiner-subtype patterns.)

  {
    id:          'determiner_with_proper_noun',
    group:       'noun_phrase',
    description: 'Any determiner-class word followed (with optional adjective) by a proper noun — broken English at A1. e.g. "the Mary", "this London", "my Mary", "some Mary". Proper nouns are inherently specific and don\'t take determiners. Includes the indefinite-article case but covers definite, demonstrative, possessive, and quantifier determiners too via the `determiner` umbrella.',
    type:        'trigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 1; i++) {
        if (!hasAtom(tokens[i], 'determiner')) continue
        for (let j = i + 1; j < tokens.length && j <= i + 3; j++) {
          if (hasAtom(tokens[j], 'adjective')) continue
          if (hasAtom(tokens[j], 'noun') && tokens[j].properNoun) {
            out.push({ span: [i, j] })
          }
          break
        }
      }
      return out
    },
    license: { alwaysForbidden: true },
    phrase:   'np_basic',
    coupling: 'noun_phrase_internal',
    detectsAtoms: ['determiner', 'noun', 'adjective'],
    consumesL2Fields: ['properNoun'],
  },

  // ─── Bare singular count noun without a determiner (slot-style, single rule)
  // ONE position-agnostic forbidden pattern. Catches:
  //   "Cat runs" (subject)         "I see cat" (object)         "She is teacher" (copula complement)
  //   "Good cat runs"              "I see good cat"              "She is happy dog"
  // Walks left from any singular common count noun through an optional adjective
  // stack — if no determiner-class word licenses the NP, fire. Replaces what
  // were three separate position-specific bigram/trigram patterns
  // (bare_singular_count_noun_verb, verb_object_bare_singular_count_noun,
  // copula_bare_singular_count_noun). Each had the same underlying rule;
  // position was an enumeration artifact, not a real grammatical distinction.
  {
    id:          'bare_singular_count_noun_unlicensed',
    group:       'noun_phrase',
    description: 'Singular common count noun appearing without a determiner anywhere in its noun phrase. e.g. "cat runs" (should be "the cat"), "I see cat" (should be "the cat" or "a cat"), "She is happy dog" (still missing the determiner), "Good cat runs". Singular common count nouns require a determiner; an adjective alone does not license them. Position-agnostic — fires wherever the bare noun appears.',
    type:        'morphology',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i]
        if (!hasAtom(t, 'noun')) continue
        if (t.countability !== 'count') continue
        if (t.properNoun) continue
        if (hasFormType(t, 'plural')) continue
        // Walk left through any adjective stack — only a determiner-class word licenses
        let k = i - 1
        while (k >= 0 && hasAtom(tokens[k], 'adjective')) k--
        if (k >= 0 && hasDeterminerClass(tokens[k])) continue
        out.push({ span: [i, i] })
      }
      return out
    },
    license: { alwaysForbidden: true },
    phrase:   'np_basic',
    coupling: 'noun_phrase_internal',
    detectsAtoms: ['noun', 'adjective'],
    consumesL2Fields: ['countability', 'properNoun'],
  },

  // ─── Demonstrative number agreement (slot-style, single rule) ────────────
  // ONE forbidden pattern that catches both directions of the agreement
  // mismatch: "this dogs" (singular dem + plural noun) and "these dog"
  // (plural dem + singular noun). Reads `number` from the demonstrative's L2
  // enrichment; if not enriched yet, the pattern stays silent (no false
  // positives). Replaces what would have been four bigram patterns.
  {
    id:          'demonstrative_number_mismatch',
    group:       'noun_phrase',
    description: 'Demonstrative + noun where the demonstrative\'s number doesn\'t match the noun\'s number. e.g. "this dogs" (singular dem + plural noun), "these dog" (plural dem + singular noun). Use this/that for singular nouns; these/those for plural.',
    type:        'bigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 1; i++) {
        const dem = tokens[i]
        if (!hasAtom(dem, 'demonstrative')) continue
        if (dem.number == null) continue
        const noun = tokens[i + 1]
        if (!hasAtom(noun, 'noun')) continue
        const nounIsPlural = Array.isArray(noun.formType)
          ? noun.formType.includes('plural')
          : noun.formType === 'plural'
        const demIsPlural  = dem.number === 'plural'
        if (nounIsPlural !== demIsPlural) {
          out.push({ span: [i, i + 1] })
        }
      }
      return out
    },
    license: { alwaysForbidden: true },
    phrase:   'np_basic',
    coupling: 'noun_phrase_internal',
    detectsAtoms: ['demonstrative', 'noun'],
    consumesL2Fields: ['number'],
  },
]
