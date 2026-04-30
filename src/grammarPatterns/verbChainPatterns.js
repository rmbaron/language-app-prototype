// Verb-chain patterns — modal + verb chains, do-support negation, and
// infinitive constructions. All involve multiple verb-class tokens.

import { hasAtom, hasAnyAtom } from './_helpers'

export default [
  // ─── Modal patterns ───────────────────────────────────────────────────────
  {
    id:          'modal_verb',
    group:       'modal',
    description: 'Modal followed by a bare verb (lexical or copula). e.g. "I can help", "she will be".',
    type:        'bigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 1; i++) {
        // modal + bare lexical-verb-or-copula. NOT a verb-umbrella case —
        // modal + auxiliary ("can do") is a real shape but a different pattern,
        // and modal + modal isn't licensed. Keep the explicit list here.
        if (hasAtom(tokens[i], 'modal_auxiliary') &&
            hasAnyAtom(tokens[i + 1], ['lexical_verb', 'copula'])) {
          out.push({ span: [i, i + 1] })
        }
      }
      return out
    },
    license: { requiresAtoms: ['modal_auxiliary'] },
    coupling: 'modal_verb_chain',
  },

  {
    id:          'subject_modal_verb',
    group:       'modal',
    description: 'Pronoun subject + modal + lexical verb. e.g. "I can help", "she will eat".',
    type:        'trigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 2; i++) {
        if (hasAtom(tokens[i], 'personal_pronoun') &&
            hasAtom(tokens[i + 1], 'modal_auxiliary') &&
            hasAtom(tokens[i + 2], 'lexical_verb')) {
          out.push({ span: [i, i + 2] })
        }
      }
      return out
    },
    license: { requiresAtoms: ['personal_pronoun', 'modal_auxiliary', 'lexical_verb'] },
    coupling: 'modal_verb_chain',
  },

  {
    id:          'subject_modal_copula',
    group:       'modal',
    description: 'Pronoun subject + modal + copula. e.g. "I can be", "she will be".',
    type:        'trigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 2; i++) {
        if (hasAtom(tokens[i], 'personal_pronoun') &&
            hasAtom(tokens[i + 1], 'modal_auxiliary') &&
            hasAtom(tokens[i + 2], 'copula')) {
          out.push({ span: [i, i + 2] })
        }
      }
      return out
    },
    license: { requiresAtoms: ['personal_pronoun', 'modal_auxiliary', 'copula'] },
    coupling: 'modal_verb_chain',
  },

  // ─── Negation patterns ────────────────────────────────────────────────────
  {
    id:          'subject_auxiliary',
    group:       'negation',
    description: 'Pronoun subject directly followed by a do-support auxiliary. e.g. "I do", "she does".',
    type:        'bigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 1; i++) {
        if (hasAtom(tokens[i], 'personal_pronoun') && hasAtom(tokens[i + 1], 'auxiliary')) {
          out.push({ span: [i, i + 1] })
        }
      }
      return out
    },
    license: { requiresAtoms: ['personal_pronoun', 'auxiliary'] },
    coupling: 'negation_chain',
  },

  {
    id:          'do_support_negation',
    group:       'negation',
    description: 'Do-support auxiliary + negation marker + lexical verb. e.g. "do not eat", "does not like".',
    type:        'trigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 2; i++) {
        if (hasAtom(tokens[i], 'auxiliary') &&
            hasAtom(tokens[i + 1], 'negation_marker') &&
            hasAtom(tokens[i + 2], 'lexical_verb')) {
          out.push({ span: [i, i + 2] })
        }
      }
      return out
    },
    license: { requiresAtoms: ['auxiliary', 'negation_marker', 'lexical_verb'] },
    coupling: 'negation_chain',
  },

  // ─── Infinitive ──────────────────────────────────────────────────────────
  {
    id:          'verb_infinitive_verb',
    group:       'infinitive',
    description: 'Verb + "to" + bare lexical verb. e.g. "I want to go", "She likes to eat", "We need to sleep". The "to" carries the infinitive_marker atom on the word "to".',
    type:        'trigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 2; i++) {
        if (!hasAtom(tokens[i], 'lexical_verb')) continue
        if (!hasAtom(tokens[i + 1], 'infinitive_marker')) continue
        if (hasAtom(tokens[i + 2], 'lexical_verb')) {
          out.push({ span: [i, i + 2] })
        }
      }
      return out
    },
    license: { requiresAtoms: ['lexical_verb', 'infinitive_marker'] },
    coupling: 'infinitive',
  },
]
