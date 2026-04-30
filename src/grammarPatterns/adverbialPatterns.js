// Adverbial patterns — adverb position by type, plus prepositional phrases.
// Both fill the adverbial slot at the clause level.

import { hasAtom, hasAnyAtom } from './_helpers'

export default [
  {
    id:          'verb_adverb',
    group:       'adverbial',
    description: 'Lexical verb followed by an adverb. e.g. "eat here", "work now".',
    type:        'bigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 1; i++) {
        if (hasAtom(tokens[i], 'lexical_verb') && hasAtom(tokens[i + 1], 'adverb')) {
          out.push({ span: [i, i + 1] })
        }
      }
      return out
    },
    license: { requiresAtoms: ['lexical_verb', 'adverb'] },
    coupling: 'adverbial_position',
  },

  {
    id:          'time_adverb_at_end',
    group:       'adverbial',
    description: 'Time adverb in sentence-final position. e.g. "I eat now", "She works today", "We arrive tomorrow".',
    type:        'boundary',
    detector(tokens) {
      const lastContent = [...tokens].reverse().find(t => !t.isPunctuation)
      if (!lastContent) return []
      if (hasAtom(lastContent, 'adverb') && lastContent.adverbType === 'time') {
        return [{ span: [lastContent.position, lastContent.position] }]
      }
      return []
    },
    license: { requiresAtoms: ['adverb'] },
    coupling: 'adverbial_position',
  },

  {
    id:          'place_adverb_at_end',
    group:       'adverbial',
    description: 'Place adverb in sentence-final position. e.g. "I eat here", "She works there", "We sleep outside".',
    type:        'boundary',
    detector(tokens) {
      const lastContent = [...tokens].reverse().find(t => !t.isPunctuation)
      if (!lastContent) return []
      if (hasAtom(lastContent, 'adverb') && lastContent.adverbType === 'place') {
        return [{ span: [lastContent.position, lastContent.position] }]
      }
      return []
    },
    license: { requiresAtoms: ['adverb'] },
    coupling: 'adverbial_position',
  },

  {
    id:          'frequency_adverb_pre_verb',
    group:       'adverbial',
    description: 'Frequency adverb directly before the main verb. e.g. "I always eat", "She never sleeps", "We sometimes work".',
    type:        'bigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 1; i++) {
        if (hasAtom(tokens[i], 'adverb') &&
            tokens[i].adverbType === 'frequency' &&
            hasAtom(tokens[i + 1], 'lexical_verb')) {
          out.push({ span: [i, i + 1] })
        }
      }
      return out
    },
    license: { requiresAtoms: ['adverb', 'lexical_verb'] },
    coupling: 'adverbial_position',
  },

  {
    id:          'degree_adverb_pre_adjective',
    group:       'adverbial',
    description: 'Degree adverb directly before an adjective. e.g. "very good", "really tired", "quite happy".',
    type:        'bigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 1; i++) {
        if (hasAtom(tokens[i], 'adverb') &&
            tokens[i].adverbType === 'degree' &&
            hasAtom(tokens[i + 1], 'adjective')) {
          out.push({ span: [i, i + 1] })
        }
      }
      return out
    },
    license: { requiresAtoms: ['adverb', 'adjective'] },
    coupling: 'adverbial_position',
  },

  {
    id:          'prepositional_phrase',
    group:       'pp',
    description: 'Preposition + (determiner) + noun. e.g. "in school", "at the park".',
    type:        'trigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 1; i++) {
        if (!hasAtom(tokens[i], 'preposition')) continue
        if (hasAtom(tokens[i + 1], 'noun')) {
          out.push({ span: [i, i + 1] })
          continue
        }
        if (i + 2 < tokens.length &&
            hasAnyAtom(tokens[i + 1], ['determiner', 'demonstrative', 'possessive_determiner']) &&
            hasAtom(tokens[i + 2], 'noun')) {
          out.push({ span: [i, i + 2] })
        }
      }
      return out
    },
    license: { requiresAtoms: ['preposition', 'noun'] },
    coupling: 'prepositional_phrase',
  },
]
