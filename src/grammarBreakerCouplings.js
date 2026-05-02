// Grammar Breaker — Couplings (transitional shim — Floor 2 alignment)
//
// ── Status: Floor 2 alignment landed; full retirement blocked on circuit rebuild
// This file is being collapsed under the canonical 4-floor + 3-wire architecture.
// The old "Levels 1-5" mental model is retired.
//
// Already moved out:
//   • COMPOSITES → src/forwardFlow/clauseShapes.en.js (CLAUSE_SHAPES)
//   • Floor-3 clause-internal relations → src/forwardFlow/clauseShapes.en.js
//     (CLAUSE_RELATIONS) — spread back into COUPLINGS below as a derivation
//     shim so consumers keep working without per-pattern coupling-id rewrites.
//
// Floor 2 finish (Wire P pass) landed:
//   • Noun-phrase patterns now carry `phrase: 'np_basic'` (Wire P into Floor 2).
//   • The 4 duplicate inline COUPLINGS entries (modal_verb_chain, negation_chain,
//     prepositional_phrase, infinitive) were RETIRED. The corresponding
//     6 patterns were deleted from grammarPatterns/{verbChain,adverbial}Patterns.
//     The validator's coverage check on those constructions is now a known gap
//     pending the grammar-circuit rebuild.
//
// Remaining inline COUPLINGS (still load-bearing for the validator):
//   • noun_phrase_internal — Wire P metadata; coexists with `phrase` field on
//     NP patterns. Will retire when validator no longer requires `coupling`.
//   • adverbial_position, sentence_boundary, morphology_inflection — Wire P
//     metadata mistagged as relations. Kept until the new grammar circuit
//     replaces this validator.
//   • coordination, subordination — DEFERRED markers (operations layer / Floor 4).
//
// Full retirement of this file is blocked on either:
//   (a) the grammar circuit rebuild (replaces the validator entirely), or
//   (b) refactoring grammarBreakerPatterns.js so `coupling` is no longer a
//       required field. Both are out of scope for the Floor 2 finish.
//
// See memory/project_unified_system_alignment.md for the full alignment recipe.

import { CLAUSE_RELATIONS } from './forwardFlow/clauseShapes.en.js'

const REMAINING_INLINE_COUPLINGS = [
  // ─── Floor 2 / Wire P metadata (still referenced by patterns) ───────────
  {
    id:          'noun_phrase_internal',
    label:       'Noun Phrase Internal',
    description: 'Wire P metadata: NP composition rule. Coexists with `phrase: "np_basic"` on the patterns themselves; this entry kept while the validator still requires patterns to declare a coupling id.',
  },
  {
    id:          'adverbial_position',
    label:       'Adverbial Position',
    description: 'Wire P metadata: placement rule for where adverbs sit by adverbType (time/place sentence-final, frequency pre-verb, degree pre-adjective). Not a clause-internal relation; mistagged in the legacy taxonomy.',
  },
  {
    id:          'sentence_boundary',
    label:       'Sentence Boundary',
    description: 'Wire P metadata: cross-cutting position constraint (sentence-initial / sentence-final). Not a clause-internal relation; mistagged in the legacy taxonomy.',
  },
  {
    id:          'morphology_inflection',
    label:       'Morphological Inflection',
    description: 'Wire P metadata at Floor 1 (atom morphology): single-word inflection flags (past, progressive -ing, perfect past_participle, possessive clitic). Likely already covered by the atom system; retire after audit.',
  },

  // ─── Higher-order — DEFERRED markers ────────────────────────────────────
  {
    id:          'coordination',
    label:       'Coordination',
    description: 'A coordinating conjunction joining equal grammatical units. DEFERRED → operations layer (not yet built). Marker only.',
  },
  {
    id:          'subordination',
    label:       'Subordination',
    description: 'A subordinating conjunction introducing a dependent clause. DEFERRED → Floor 4 (Sentence — not yet built). Marker only.',
  },
]

export const COUPLINGS = [...CLAUSE_RELATIONS, ...REMAINING_INLINE_COUPLINGS]

export const COUPLINGS_BY_ID = Object.fromEntries(COUPLINGS.map(c => [c.id, c]))

// COMPOSITES + COMPOSITES_BY_ID + compositesContainingCoupling +
// allCompositesValid relocated to src/forwardFlow/clauseShapes.en.js as
// CLAUSE_SHAPES + CLAUSE_SHAPES_BY_ID + clauseShapesContainingCoupling +
// allClauseShapesValid. The "composite" name is retired.
