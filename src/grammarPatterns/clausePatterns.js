// Clause-internal patterns — Subject-Verb, Verb-Object, and Copula-Complement
// relationships. The bulk of micro-patterns live here because the clause is
// where most A1 grammar action happens.
//
// ── Wire P into Floor 3 ───────────────────────────────────────────────────
// Each pattern declares the clause shape it licenses via `clauseShape:`.
// 'svo_clause' covers the SV-spine and V-O patterns; 'copular_clause' covers
// S-Cop and Cop-C. The forbidden intransitive_verb_with_direct_object pattern
// targets the same svo_clause shape — it's the unlicensed variant. Source of
// truth for clauseShape ids: src/forwardFlow/clauseShapes.en.js.

import { hasAtom, hasAnyAtom, hasFormType, hasDeterminerClass, matchNounPhrase } from './_helpers'

export default [
  // ─── Subject + Verb (pronoun-led) ────────────────────────────────────────
  {
    id:          'pronoun_verb',
    group:       'core_clause',
    description: 'Pronoun subject directly followed by a lexical verb. e.g. "I eat", "she runs".',
    type:        'bigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 1; i++) {
        if (hasAtom(tokens[i], 'personal_pronoun') && hasAtom(tokens[i + 1], 'lexical_verb')) {
          out.push({ span: [i, i + 1] })
        }
      }
      return out
    },
    license: { requiresAtoms: ['personal_pronoun', 'lexical_verb'] },
    clauseShape: 'svo_clause',
    coupling: 'subject_verb',
  },

  // ─── Subject + Verb (NP-led, slot-style, single rule) ────────────────────
  // ONE pattern that licenses every valid noun-phrase subject + lexical verb:
  //   bare proper noun                 "Mary runs"
  //   bare mass / both noun            "Water flows"
  //   bare plural noun                 "Dogs run"
  //   determined NP (det + noun)       "The cat runs"
  //   determined NP with adjective     "The good cat sleeps"
  //   possessive pronoun standalone    "Mine wins"
  //
  // The subject NP is the slot, fed by the shared matchNounPhrase helper in
  // _helpers.js. Bare singular common count nouns are NOT licensed here —
  // they're caught by bare_singular_count_noun_unlicensed.
  //
  // Replaces noun_verb_proper / noun_verb_mass / noun_verb_plural / det_noun_verb
  // with one compositional slot rule.
  {
    id:          'noun_phrase_subject_verb',
    group:       'core_clause',
    description: 'Noun-phrase subject + lexical verb: bare proper noun ("Mary runs"), bare mass noun ("Water flows"), bare plural noun ("Dogs run"), determined NP ("The good cat sleeps"), or possessive pronoun standalone ("Mine wins"). One slot rule covering every valid NP-subject + verb shape at A1.',
    type:        'trigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 1; i++) {
        const npEnd = matchNounPhrase(tokens, i)
        if (npEnd === null) continue
        const verbIdx = npEnd + 1
        if (verbIdx < tokens.length && hasAtom(tokens[verbIdx], 'lexical_verb')) {
          out.push({ span: [i, verbIdx] })
        }
      }
      return out
    },
    license: { requiresAtoms: ['lexical_verb'] },
    clauseShape: 'svo_clause',
    coupling: 'subject_verb',
    consumesL2Fields: ['countability', 'properNoun'],
  },

  // (`bare_singular_count_noun_verb` retired here — subsumed by
  // `bare_singular_count_noun_unlicensed` in nounPhrasePatterns.js, which
  // catches the same shape but is position-agnostic. Same rule fires whether
  // the bare noun is in subject, object, or complement position.)

  // ─── Verb + Object (slot-style, single rule) ─────────────────────────────
  // ONE pattern that licenses every valid verb object:
  //   object pronoun                   "see her", "help me"
  //   bare proper noun                 "see Mary", "like London"
  //   bare mass / both noun            "drink water", "love music"
  //   bare plural noun                 "want apples", "like cats"
  //   determined NP (det + noun)       "see the cat", "want my book"
  //   determined NP with adjective     "want a good book"
  //   possessive pronoun standalone    "want mine"
  //
  // The object is the slot. Object-pronoun is a head-specific extension; the
  // remaining shapes come from the shared matchNounPhrase helper.
  //
  // Replaces verb_object_proper_noun / verb_object_mass_noun /
  // verb_object_plural_noun / verb_object_determined_noun / verb_object_pronoun
  // with one compositional slot rule.
  {
    id:          'verb_object_complement',
    group:       'core_clause',
    description: 'Lexical verb taking a valid object: object pronoun ("see her"), bare noun (proper / mass / plural — "see Mary", "drink water", "want apples"), determined noun phrase ("want a good book"), or possessive pronoun standalone ("want mine"). One slot rule covering every valid verb-object shape at A1.',
    type:        'trigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 1; i++) {
        if (!hasAtom(tokens[i], 'lexical_verb')) continue
        const endIdx = matchVerbObject(tokens, i + 1)
        if (endIdx !== null) out.push({ span: [i, endIdx] })
      }
      return out
    },
    license: { requiresAtoms: ['lexical_verb'] },
    clauseShape: 'svo_clause',
    coupling: 'verb_object',
    consumesL2Fields: ['countability', 'properNoun'],
  },

  // (`verb_object_bare_singular_count_noun` retired here — subsumed by
  // `bare_singular_count_noun_unlicensed` in nounPhrasePatterns.js.)

  {
    id:          'intransitive_verb_with_direct_object',
    group:       'core_clause',
    description: 'An intransitive verb followed by what looks like a direct object — broken English. e.g. "I sleep food", "She arrives the city". Intransitive verbs (sleep, arrive, cry) cannot take a direct object.',
    type:        'bigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 1; i++) {
        if (!hasAtom(tokens[i], 'lexical_verb')) continue
        if (tokens[i].transitivity !== 'intransitive') continue
        const next = tokens[i + 1]
        if (hasAtom(next, 'noun') || hasAtom(next, 'object_pronoun')) {
          out.push({ span: [i, i + 1] })
        }
      }
      return out
    },
    license: { alwaysForbidden: true },
    clauseShape: 'svo_clause',
    coupling: 'verb_object',
    detectsAtoms: ['lexical_verb', 'noun', 'object_pronoun'],
    consumesL2Fields: ['transitivity'],
  },

  // ─── Subject + Copula ────────────────────────────────────────────────────
  {
    id:          'pronoun_copula',
    group:       'copula',
    description: 'Pronoun subject directly followed by a copula. e.g. "I am", "she is".',
    type:        'bigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 1; i++) {
        if (hasAtom(tokens[i], 'personal_pronoun') && hasAtom(tokens[i + 1], 'copula')) {
          out.push({ span: [i, i + 1] })
        }
      }
      return out
    },
    license: { requiresAtoms: ['personal_pronoun', 'copula'] },
    clauseShape: 'copular_clause',
    coupling: 'subject_copula',
  },

  // ─── Copula + Complement (slot-style, single rule) ───────────────────────
  // ONE pattern that licenses every valid copula complement:
  //   adjective                    "is happy"
  //   bare proper noun             "is Mary"
  //   bare mass / both noun        "is water"
  //   bare plural noun             "are friends"
  //   determined NP (det+noun)     "is a teacher" / "is my friend"
  //   determined NP with adj       "is the good one" / "is a happy dog"
  //   possessive pronoun standalone "is mine" / "is yours"
  //
  // The complement is the slot. Adjective alone is a head-specific extension
  // (predicative adjectives are only legal after a copula); NP shapes come
  // from the shared matchNounPhrase helper. Bare singular common count nouns
  // are NOT licensed here — they're caught by bare_singular_count_noun_unlicensed.
  {
    id:          'copula_complement',
    group:       'copula',
    description: 'Copula taking a valid complement: adjective ("is happy"), bare noun (proper / mass / plural — "is Mary", "is water", "are friends"), determined noun phrase ("is a teacher", "is the good one"), or possessive pronoun standalone ("is mine"). One slot rule covering every valid copula-complement shape at A1.',
    type:        'trigram',
    detector(tokens) {
      const out = []
      for (let i = 0; i < tokens.length - 1; i++) {
        if (!hasAtom(tokens[i], 'copula')) continue
        const endIdx = matchCopulaComplement(tokens, i + 1)
        if (endIdx !== null) out.push({ span: [i, endIdx] })
      }
      return out
    },
    license: { requiresAtoms: ['copula'] },
    clauseShape: 'copular_clause',
    coupling: 'copula_complement',
    consumesL2Fields: ['countability', 'properNoun'],
  },
]

// Head-specific extensions of matchNounPhrase. Each adds the slot fillers
// that are legal after the head but not for general NP positions.

// matchCopulaComplement adds predicative adjective.
function matchCopulaComplement(tokens, start) {
  if (start >= tokens.length) return null
  const t = tokens[start]
  // Adjective alone (predicative — only after copula)
  if (hasAtom(t, 'adjective')) return start
  return matchNounPhrase(tokens, start)
}

// matchVerbObject adds object pronoun (case-marked accusative).
function matchVerbObject(tokens, start) {
  if (start >= tokens.length) return null
  const t = tokens[start]
  // Object pronoun ("him", "her", "me", "us", "them") — only as object
  if (hasAtom(t, 'object_pronoun')) return start
  return matchNounPhrase(tokens, start)
}
