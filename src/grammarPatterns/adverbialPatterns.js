// Adverbial patterns — adverb position by type, plus prepositional phrases.
// Both fill the adverbial slot at the clause level.

import { hasAtom, hasDeterminerClass } from './_helpers'

// ── Adverb position dispatch table ─────────────────────────────────────────
// Each adverbType (an L2-enriched field on the adverb token) declares its
// expected position. The unified adverb_position pattern walks adverbs in
// the sentence and checks each against this table — one rule, four shapes.
//
// Adding a new positioned adverb type = add one row here. No new pattern.
//
// kind:
//   'sentence_end' — adverb is the final non-punctuation token
//   'pre_atom'     — adverb directly precedes a token bearing { atom }
const ADVERB_POSITION_RULES = {
  time:      { kind: 'sentence_end' },
  place:     { kind: 'sentence_end' },
  frequency: { kind: 'pre_atom', atom: 'lexical_verb' },
  degree:    { kind: 'pre_atom', atom: 'adjective' },
}

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

  // ─── Adverb position (slot-style, single data-driven rule) ──────────────
  // ONE pattern that licenses every adverbType-specific position via the
  // ADVERB_POSITION_RULES table above. Each match carries its own license
  // (per-match license override, see grammarBreaker.js):
  //   sentence_end variant → span [i, i],   requires [adverb]
  //   pre_atom variant     → span [i, i+1], requires [adverb, target_atom]
  //
  // Replaces time_adverb_at_end, place_adverb_at_end,
  // frequency_adverb_pre_verb, and degree_adverb_pre_adjective.
  // Same coverage semantics: pre_atom span covers both the adverb and the
  // licensed target token, matching the original two-token spans.
  {
    id:          'adverb_position',
    group:       'adverbial',
    description: 'Adverb in its valid position by adverbType — data-driven dispatch over an inline table. time/place at sentence end ("I eat now", "She works there"), frequency directly before the verb ("I always eat"), degree directly before the adjective ("very good"). New positioned adverb types add one row to the dispatch table; no new pattern.',
    type:        'morphology',
    detector(tokens) {
      const out = []

      // Locate the last non-punctuation token (used by sentence_end variants).
      let lastContentIdx = -1
      for (let k = tokens.length - 1; k >= 0; k--) {
        if (!tokens[k].isPunctuation) { lastContentIdx = k; break }
      }

      for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i]
        if (!hasAtom(t, 'adverb')) continue
        const aType = t.adverbType
        if (!aType) continue
        const rule = ADVERB_POSITION_RULES[aType]
        if (!rule) continue

        if (rule.kind === 'sentence_end') {
          if (i === lastContentIdx) {
            out.push({
              span:    [i, i],
              license: { requiresAtoms: ['adverb'] },
              info:    { adverbType: aType, position: 'sentence_end' },
            })
          }
        } else if (rule.kind === 'pre_atom') {
          if (i + 1 < tokens.length && hasAtom(tokens[i + 1], rule.atom)) {
            out.push({
              span:    [i, i + 1],
              license: { requiresAtoms: ['adverb', rule.atom] },
              info:    { adverbType: aType, position: 'pre_atom', target: rule.atom },
            })
          }
        }
      }
      return out
    },
    // Pattern-level license is a fallback. Real licenses come from per-match
    // overrides above (since coverage requirements depend on adverbType).
    license: { requiresAtoms: ['adverb'] },
    coupling: 'adverbial_position',
    consumesL2Fields: ['adverbType'],
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
            hasDeterminerClass(tokens[i + 1]) &&
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
