// Verb Aux Cluster Configurations — language router
//
// Public API:
//   getAuxConfigurations(lang)     → all configuration records
//   getAuxConfiguration(id, lang)  → single configuration by id, or null

import { AUX_CONFIGURATIONS as EN_AUX_CONFIGURATIONS } from './auxConfigurations.en.js'

const REGISTRIES = {
  en: EN_AUX_CONFIGURATIONS,
}

export function getAuxConfigurations(lang = 'en') {
  return REGISTRIES[lang] ?? REGISTRIES.en
}

export function getAuxConfiguration(id, lang = 'en') {
  return getAuxConfigurations(lang).find(c => c.id === id) ?? null
}
