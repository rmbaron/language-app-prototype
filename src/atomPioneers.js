// Atom Pioneers — language router
//
// Public API:
//   getAtomPioneer(atomId, lang)  → wordId string or null
//   getAtomPioneers(lang)         → full pioneer map for a language

import { ATOM_PIONEERS as EN_PIONEERS } from './atomPioneers.en.js'

const REGISTRIES = {
  en: EN_PIONEERS,
}

export function getAtomPioneer(atomId, lang = 'en') {
  const map = REGISTRIES[lang] ?? REGISTRIES.en
  return map[atomId] ?? null
}

export function getAtomPioneers(lang = 'en') {
  return REGISTRIES[lang] ?? REGISTRIES.en
}
