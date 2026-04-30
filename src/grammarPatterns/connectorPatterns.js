// Connector patterns — coordination, subordination, and sentence-boundary
// patterns that link or open clauses.

import { hasAtom, hasAnyAtom } from './_helpers'

// Atom types that meaningfully coordinate. Umbrella atoms (determiner, pronoun,
// conjunction) are excluded — sharing only an umbrella isn't a real
// coordination match. See `phrasal_coordination` below.
const COORDINATABLE_ATOMS = new Set([
  'noun', 'lexical_verb', 'copula', 'adjective', 'adverb',
  'personal_pronoun', 'object_pronoun', 'possessive_pronoun', 'reflexive_pronoun',
  'indefinite_pronoun', 'preposition', 'numeral',
])

export default [
  // ─── Coordination ────────────────────────────────────────────────────────
  // (`noun_coord_noun` retired here — subsumed by `phrasal_coordination` below,
  // which licenses noun+conj+noun via the same shared-atom rule that handles
  // adj+adj, verb+verb, etc. Single slot rule replaced six potential bigrams.)

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

  // ─── Phrasal coordination — slot-style ──────────────────────────────────
  // ONE compositional rule for "X conj Y where X and Y share a real atom-type."
  // Auto-licenses noun+noun, adj+adj, verb+verb, adverb+adverb, pronoun+pronoun,
  // etc. without enumerating per-category. The shared-atom check is the slot:
  // "the things on either side of the conjunction must fill the same role."
  // Function-class umbrellas (determiner, pronoun, conjunction) don't count as
  // shared since they're too broad — see COORDINATABLE_ATOMS at the top.
  // The legacy `noun_coord_noun` above is more specific; both can fire on
  // "dogs and cats" — coverage is over-satisfied, no breakage.
  {
    id:          'phrasal_coordination',
    group:       'coordination',
    description: 'Two phrases joined by a coordinating conjunction, where both sides share at least one real atom-type. Auto-licenses noun+noun ("dogs and cats"), adjective+adjective ("happy and tired"), verb+verb ("eat and drink"), adverb+adverb ("quickly and quietly"), pronoun+pronoun ("you and me"). One compositional rule, not six per-category patterns.',
    type:        'trigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 2; i++) {
        if (!hasAtom(tokens[i + 1], 'coordinating_conjunction')) continue
        const left  = tokens[i].atoms ?? []
        const right = tokens[i + 2].atoms ?? []
        const rightSet = new Set(right)
        const shared = left.filter(a => rightSet.has(a) && COORDINATABLE_ATOMS.has(a))
        if (shared.length === 0) continue
        out.push({ span: [i, i + 2], info: { sharedAtoms: shared } })
      }
      return out
    },
    license: { requiresAtoms: ['coordinating_conjunction'] },
    coupling: 'coordination',
  },

  // ─── Interjection licensing ──────────────────────────────────────────────
  // A standalone interjection is a complete utterance. "Yes." / "Hello." /
  // "Okay." should pass without tripping the coverage check.
  {
    id:          'bare_interjection',
    group:       'sentence_boundary',
    description: 'A sentence consisting of just an interjection — "Yes", "Hello", "Okay", "Please", "Sorry". Greetings, responses, or courtesies that don\'t fill a grammatical role inside a clause.',
    type:        'boundary',
    detector(tokens) {
      const content = tokens.filter(t => !t.isPunctuation)
      if (content.length === 1 && hasAtom(content[0], 'interjection')) {
        return [{ span: [content[0].position, content[0].position] }]
      }
      return []
    },
    license: { requiresAtoms: ['interjection'] },
    coupling: 'sentence_boundary',
  },

  {
    id:          'sentence_initial_interjection',
    group:       'sentence_boundary',
    description: 'Sentence-initial interjection followed by a clause. e.g. "Yes, I am" / "Okay, we go" / "Hello, I am Mary". Covers just the interjection token; the rest of the clause is licensed by its own patterns.',
    type:        'boundary',
    detector(tokens) {
      const first = tokens.find(t => !t.isPunctuation)
      if (!first) return []
      // Only fire when there's MORE content than the interjection itself —
      // otherwise bare_interjection covers it.
      const content = tokens.filter(t => !t.isPunctuation)
      if (content.length <= 1) return []
      if (hasAtom(first, 'interjection')) {
        return [{ span: [first.position, first.position] }]
      }
      return []
    },
    license: { requiresAtoms: ['interjection'] },
    coupling: 'sentence_boundary',
  },
]
