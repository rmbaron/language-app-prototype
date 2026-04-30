// Noun-phrase internal patterns — modifiers attaching to a head noun within
// a noun phrase: determiners, demonstratives, possessive determiners,
// attributive adjectives.

import { hasAtom, hasFormType } from './_helpers'

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
    coupling: 'noun_phrase_internal',
    detectsAtoms: ['indefinite_article', 'noun', 'adjective'],
  },

  {
    id:          'indefinite_article_with_proper_noun',
    group:       'noun_phrase',
    description: 'Indefinite article "a" or "an" followed (with optional adjective) by a proper noun — broken English in standard usage. e.g. "a Mary", "an London", "a good John". Proper nouns name a specific entity and don\'t combine with the indefinite article.',
    type:        'trigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 1; i++) {
        if (!hasAtom(tokens[i], 'indefinite_article')) continue
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
    coupling: 'noun_phrase_internal',
    detectsAtoms: ['indefinite_article', 'noun', 'adjective'],
  },
]
