// Verb Argument Structures — language router
//
// Public API:
//   getArgumentStructures(lang)         → all verb argument structure records
//   getArgumentStructure(verbId, lang)  → single verb's record by id, or null

import { VERB_ARGUMENT_STRUCTURES as EN_VERB_ARGUMENT_STRUCTURES } from './frames.en.js'

const REGISTRIES = {
  en: EN_VERB_ARGUMENT_STRUCTURES,
}

export function getArgumentStructures(lang = 'en') {
  return REGISTRIES[lang] ?? REGISTRIES.en
}

export function getArgumentStructure(verbId, lang = 'en') {
  return getArgumentStructures(lang).find(v => v.verbId === verbId) ?? null
}
