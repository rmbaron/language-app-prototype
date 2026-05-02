// Grammar Breaker — Couplings (transitional shim — pending Floor 2 alignment)
//
// ── Status: Floor 2 alignment in progress ────────────────────────────────
// This file is being collapsed under the canonical 4-floor + 3-wire
// architecture. The old "Levels 1-5" mental model is retired.
//
// Already moved out:
//   • COMPOSITES → src/forwardFlow/clauseShapes.en.js (CLAUSE_SHAPES)
//   • Floor-3 clause-internal relations → src/forwardFlow/clauseShapes.en.js
//     (CLAUSE_RELATIONS) — spread back into COUPLINGS below as a derivation
//     shim, so consumers (grammarBreakerPatterns.js validator, the dev tab)
//     keep working without per-pattern coupling-id rewrites.
//
// Pending moves (each remaining inline entry below has a true home):
//   • adverbial_position, sentence_boundary → Wire P metadata
//   • modal_verb_chain, negation_chain, prepositional_phrase, infinitive →
//     duplicates of System B entries (auxConfigurations, pp_basic,
//     infinitive_phrase) — retire after consumer migration
//   • coordination → operations layer (deferred)
//   • subordination → Floor 4 (deferred)
//   • morphology_inflection → Floor 1 / atom system (likely already covered)
//   • noun_phrase_internal → Floor 2 / Wire P (NP composition rule)
//
// See memory/project_unified_system_alignment.md for the full alignment recipe.
//
// COUPLINGS remains as a flat array (CLAUSE_RELATIONS spread + remaining
// inline entries). Consumers that import COUPLINGS / COUPLINGS_BY_ID don't
// change. Once all inline entries are relocated/retired, this file shrinks
// to a pure re-export of CLAUSE_RELATIONS or is deleted.

// ── Couplings (transitional shim) ────────────────────────────────────────
// Source-of-truth for the 6 clause-internal relations is CLAUSE_RELATIONS in
// forwardFlow/clauseShapes.en.js. Spread back in here so existing consumers
// (grammarBreakerPatterns.js validator, GrammarBreakerFlowTab) keep working.

import { CLAUSE_RELATIONS } from './forwardFlow/clauseShapes.en.js'

const REMAINING_INLINE_COUPLINGS = [
  // ─── Floor 2 / Wire P (NP composition) — pending retag ─────────────────
  {
    id:          'noun_phrase_internal',
    label:       'Noun Phrase Internal',
    description: 'Modifiers attaching to a head noun within a noun phrase: determiners, demonstratives, possessive determiners, attributive adjectives.',
  },

  // ─── Verb chains — duplicates of System B; pending retirement ──────────
  {
    id:          'modal_verb_chain',
    label:       'Modal + Verb Chain',
    description: 'A modal auxiliary licensing a bare verb (lexical or copula). Includes the subject when the chain is full (subject + modal + verb). DUPLICATE of auxConfigurations.modal_led — retire after consumer migration.',
  },
  {
    id:          'negation_chain',
    label:       'Negation Chain',
    description: 'Do-support auxiliary + negation marker + lexical verb. The construction English uses to negate present and past simple lexical verbs. DUPLICATE of do-support config + negation operation — retire after consumer migration.',
  },

  // ─── Wire P metadata — pending retag ───────────────────────────────────
  {
    id:          'adverbial_position',
    label:       'Adverbial Position',
    description: 'Adverbs in their licit positions — sentence-final for time/place, pre-verb for frequency, pre-adjective for degree. Wire P (placement rule), not a clause-internal relation.',
  },
  {
    id:          'prepositional_phrase',
    label:       'Prepositional Phrase',
    description: 'Preposition + (determiner) + noun. A self-contained chunk that can fill an adverbial slot or modify a noun. DUPLICATE of pp_basic in structures.en.js — retire after consumer migration.',
  },

  // ─── Higher-order — duplicates / deferred ──────────────────────────────
  {
    id:          'infinitive',
    label:       'Infinitive Construction',
    description: 'Verb + "to" + bare verb (e.g., "want to go"). The infinitive marker bridges a main verb and an embedded action. DUPLICATE of infinitive_phrase in structures.en.js — retire after consumer migration.',
  },
  {
    id:          'coordination',
    label:       'Coordination',
    description: 'A coordinating conjunction joining equal grammatical units — nouns, verbs, or whole clauses. DEFERRED → operations layer (not yet built). Marker only.',
  },
  {
    id:          'subordination',
    label:       'Subordination',
    description: 'A subordinating conjunction introducing a dependent clause attached to the main clause. DEFERRED → Floor 4 (Sentence — not yet built). Marker only.',
  },

  // ─── Boundary / morphology — Wire P / Floor 1 ──────────────────────────
  {
    id:          'sentence_boundary',
    label:       'Sentence Boundary',
    description: 'Patterns sensitive to where in the sentence a token sits — sentence-initial or sentence-final. Wire P (cross-cutting position constraint), not a clause-internal relation.',
  },
  {
    id:          'morphology_inflection',
    label:       'Morphological Inflection',
    description: 'Patterns flagging the form of a single word — past tense, progressive (-ing), perfect (past participle), possessive clitic. Floor 1 (atom morphology) / Wire P. Likely already covered by atom system — retire after audit.',
  },
]

export const COUPLINGS = [...CLAUSE_RELATIONS, ...REMAINING_INLINE_COUPLINGS]

export const COUPLINGS_BY_ID = Object.fromEntries(COUPLINGS.map(c => [c.id, c]))

// COMPOSITES + COMPOSITES_BY_ID + compositesContainingCoupling +
// allCompositesValid relocated to src/forwardFlow/clauseShapes.en.js as
// CLAUSE_SHAPES + CLAUSE_SHAPES_BY_ID + clauseShapesContainingCoupling +
// allClauseShapesValid. The "composite" name is retired.
