// Connector patterns — coordination, subordination, and sentence-boundary
// patterns that link or open clauses.

import { hasAtom, hasAnyAtom } from './_helpers'

export default [
  // ─── Coordination ────────────────────────────────────────────────────────
  {
    id:          'noun_coord_noun',
    group:       'coordination',
    description: 'Two nouns joined by a coordinating conjunction. e.g. "apples and oranges", "cats or dogs", "tea and coffee".',
    type:        'trigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 2; i++) {
        if (hasAtom(tokens[i], 'noun') &&
            hasAtom(tokens[i + 1], 'coordinating_conjunction') &&
            hasAtom(tokens[i + 2], 'noun')) {
          out.push({ span: [i, i + 2] })
        }
      }
      return out
    },
    license: { requiresAtoms: ['noun', 'coordinating_conjunction'] },
    coupling: 'coordination',
  },

  {
    id:          'clause_coord_clause',
    group:       'coordination',
    description: 'Coordinating conjunction between two simple clauses. Detected on (verb, coord_conj, pronoun) which marks the clause boundary. e.g. "I eat AND you sleep".',
    type:        'trigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 2; i++) {
        if (hasAtom(tokens[i], 'lexical_verb') &&
            hasAtom(tokens[i + 1], 'coordinating_conjunction') &&
            hasAtom(tokens[i + 2], 'personal_pronoun')) {
          out.push({ span: [i, i + 2] })
        }
      }
      return out
    },
    license: { requiresAtoms: ['lexical_verb', 'coordinating_conjunction', 'personal_pronoun'] },
    coupling: 'coordination',
  },

  // ─── Subordination ───────────────────────────────────────────────────────
  {
    id:          'subordinating_conjunction_clause_start',
    group:       'subordination',
    description: 'Sentence-initial subordinating conjunction introducing a dependent clause. e.g. "Because I am hungry, I eat", "If you want, we go".',
    type:        'boundary',
    detector(tokens) {
      const first = tokens.find(t => !t.isPunctuation)
      if (!first) return []
      if (hasAtom(first, 'subordinating_conjunction')) {
        return [{ span: [first.position, first.position] }]
      }
      return []
    },
    license: { requiresAtoms: ['subordinating_conjunction'] },
    coupling: 'subordination',
  },

  // ─── Boundary: sentence-initial auxiliary signals a yes/no question ──────
  {
    id:          'sentence_initial_auxiliary',
    group:       'questions',
    description: 'Sentence starts with an auxiliary or modal (yes/no question shape). e.g. "Do you want food?".',
    type:        'boundary',
    detector(tokens) {
      const first = tokens.find(t => !t.isPunctuation)
      if (!first) return []
      if (hasAnyAtom(first, ['auxiliary', 'modal_auxiliary'])) {
        return [{ span: [first.position, first.position] }]
      }
      return []
    },
    license: { requiresAtoms: ['interrogative'] },
    coupling: 'sentence_boundary',
  },
]
