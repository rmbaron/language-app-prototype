// Slot Roles — language router
//
// Public API:
//   getSlotRoles(lang)                       → all slot role records for a language
//   getSlotRole(id, lang)                    → single slot role by id, or null
//   getSlotRoleByShortLabel(shortLabel, lang) → single slot role by short label (S, V, O, C, A), or null

import { SLOT_ROLES as EN_SLOT_ROLES } from './slotRoles.en.js'

const REGISTRIES = {
  en: EN_SLOT_ROLES,
}

export function getSlotRoles(lang = 'en') {
  return REGISTRIES[lang] ?? REGISTRIES.en
}

export function getSlotRole(id, lang = 'en') {
  return getSlotRoles(lang).find(r => r.id === id) ?? null
}

export function getSlotRoleByShortLabel(shortLabel, lang = 'en') {
  return getSlotRoles(lang).find(r => r.shortLabel === shortLabel) ?? null
}
