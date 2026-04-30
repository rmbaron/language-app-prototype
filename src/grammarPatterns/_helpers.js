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
