// Shape Families — cross-unit registry
//
// Five families ≈ phrasal categories from linguistics. Each unit (S, O, C, …)
// declares which families its shapes belong to via shape.family. Family is
// the organizing layer between unit and individual shape.
//
// "cross_family" is a holding pen for operations (coordination, partitive,
// possessive, post-modifier) that are listed as shapes pending the operations
// layer. When the operations layer lands, those shapes migrate out.
//
// Source: notes/macro-layer-sketch.md and session 48 design work.

export const SHAPE_FAMILIES = [
  {
    id:          'bare_atomic',
    label:       'Bare / atomic',
    description: 'Single token, slot closes immediately. Pronouns, proper nouns, bare numerals.',
  },
  {
    id:          'np',
    label:       'Noun phrase',
    description: 'Noun-headed phrase, extensible by operations (post-modifiers, possessive, partitive).',
  },
  {
    id:          'cross_family',
    label:       'Cross-family (operations)',
    description: 'Operations elevated to listed shapes pending the operations layer. Cuts across families.',
  },
  {
    id:          'gerund',
    label:       'Gerund',
    description: 'Nominalized verb phrase (DP-like in distribution; verbal internally).',
  },
  {
    id:          'infinitive',
    label:       'Infinitive',
    description: 'Clausal verb form (CP-like). Includes for-to variant.',
  },
  {
    id:          'clausal',
    label:       'Clausal',
    description: 'Whole-CP filler: that-clause, wh-clause, free-relative.',
  },
  {
    id:          'adjp',
    label:       'Adjective phrase',
    description: 'Adjective-headed phrase. Optional degree modifier (very/quite/extremely) + head adjective + optional PP complement.',
  },
  {
    id:          'pp',
    label:       'Prepositional phrase',
    description: 'Preposition + NP. Used in complement and adverbial slots.',
  },
  {
    id:          'advp',
    label:       'Adverb phrase',
    description: 'Adverb-headed phrase. Optional degree modifier + head adverb. Fills adverbial slots (manner/time/place/frequency).',
  },
]

export function getShapeFamily(id) {
  return SHAPE_FAMILIES.find(f => f.id === id) ?? null
}
