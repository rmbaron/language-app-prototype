// Grammar Atoms — language router
//
// Public API:
//   getAtoms(lang)       → all atom definitions for a language
//   getAtom(id, lang)    → single atom by id, or null

import { ATOMS as EN_ATOMS } from './grammarAtoms.en.js'

const REGISTRIES = {
  en: EN_ATOMS,
}

export function getAtoms(lang = 'en') {
  return REGISTRIES[lang] ?? REGISTRIES.en
}

export function getAtom(id, lang = 'en') {
  return getAtoms(lang).find(a => a.id === id) ?? null
}
