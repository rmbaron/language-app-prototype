// Verb Internal Chain — language router
//
// Public API:
//   getVerbInternalChain(lang)       → all chain entries (positions + decoration + mechanism)
//   getVerbChainPositions(lang)      → only the canonical chain positions, in order
//   getVerbChainEntry(id, lang)      → single entry by id, or null

import { VERB_INTERNAL_CHAIN as EN_VERB_INTERNAL_CHAIN } from './verbInternalChain.en.js'

const REGISTRIES = {
  en: EN_VERB_INTERNAL_CHAIN,
}

export function getVerbInternalChain(lang = 'en') {
  return REGISTRIES[lang] ?? REGISTRIES.en
}

export function getVerbChainPositions(lang = 'en') {
  return getVerbInternalChain(lang)
    .filter(e => e.kind === 'chain_position')
    .sort((a, b) => a.order - b.order)
}

export function getVerbChainEntry(id, lang = 'en') {
  return getVerbInternalChain(lang).find(e => e.id === id) ?? null
}
