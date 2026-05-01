// Shared detector helpers — used by every pattern file.
//
// Tokens come from the validator's tokenize() with this shape:
//   { surface, position, atoms: string[], formType: string|string[]|null,
//     countability, properNoun, concreteness, animate,
//     transitivity, verbAspectClass, commonCollocations,
//     adjectivePosition, adverbType, numeralType,
//     person, number, gender, colloquial, lemmaFamily,
//     isPunctuation, isFunctionWord, isUnknown }

// Atom-membership helper — checks if a token has any of the given atoms in its
// possible-atom list. Tokens carry an array because a surface form may be
// polysemous (e.g. 'run' = lexical_verb or noun).
export function hasAtom(token, atom) {
  return token?.atoms?.includes(atom) ?? false
}

export function hasAnyAtom(token, atoms) {
  return atoms.some(a => hasAtom(token, a))
}

// Form-type membership helper — formType may be a string or an array.
export function hasFormType(token, type) {
  if (token?.formType == null) return false
  return Array.isArray(token.formType) ? token.formType.includes(type) : token.formType === type
}

// Determiner-class membership — articles, demonstratives, and possessive
// determiners all license the head noun of an NP. Single source of truth so
// patterns don't repeat the three-element atom list. When every determiner-
// class word reliably carries the `determiner` umbrella alternateAtom, this
// helper can collapse to `hasAtom(token, 'determiner')` in one place.
export function hasDeterminerClass(token) {
  return hasAnyAtom(token, ['determiner', 'demonstrative', 'possessive_determiner'])
}

// Verb-class membership — lexical verbs, copula, do-support auxiliary, modals.
// Single source of truth so patterns don't repeat the verb-class atom list.
// When every verb-class word reliably carries the `verb` umbrella alternateAtom
// (after L2 re-enrichment), this helper can collapse to `hasAtom(token, 'verb')`.
export function hasVerbClass(token) {
  return hasAnyAtom(token, ['verb', 'lexical_verb', 'copula', 'auxiliary', 'modal_auxiliary'])
}

// Match a noun-phrase shape starting at `start`. Returns the index of the
// last token of the matched NP, or null if no NP begins at `start`.
//
// Recognized NP shapes:
//   • Possessive pronoun standalone ("mine", "yours")
//   • Bare proper noun ("Mary", "London")
//   • Bare mass / both-count noun ("water", "music")
//   • Bare plural noun ("dogs", "apples")
//   • Determined NP: det + noun ("the cat") or det + adj + noun ("the good cat")
//
// Bare singular common count nouns are intentionally NOT matched here — they're
// caught by `bare_singular_count_noun_unlicensed` (in nounPhrasePatterns.js).
//
// Used as the shared NP-slot detector for any pattern that needs to license an
// NP filler — currently copula_complement and verb_object_complement, plus
// noun_phrase_subject_verb.
export function matchNounPhrase(tokens, start) {
  if (start >= tokens.length) return null
  const t = tokens[start]

  // Possessive pronoun standalone ("mine", "yours")
  if (hasAtom(t, 'possessive_pronoun')) return start

  // Bare noun: proper, mass/both, or plural
  if (hasAtom(t, 'noun')) {
    if (t.properNoun) return start
    if (t.countability === 'mass' || t.countability === 'both') return start
    if (hasFormType(t, 'plural')) return start
    return null
  }

  // Determined NP: det + noun, or det + adj + noun
  if (hasDeterminerClass(t)) {
    if (start + 1 < tokens.length && hasAtom(tokens[start + 1], 'noun')) {
      return start + 1
    }
    if (start + 2 < tokens.length &&
        hasAtom(tokens[start + 1], 'adjective') &&
        hasAtom(tokens[start + 2], 'noun')) {
      return start + 2
    }
  }

  return null
}
