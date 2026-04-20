// Sentence Structures — language router
//
// Public API:
//   getStructures(lang)
//     → all structure definitions for a language
//
//   getStructure(id, lang)
//     → single structure by id, or null
//
//   getUnlockedStructures(unlockedBlockIds, currentSubLevel, lang)
//     → structures whose requiredBlocks are all present in unlockedBlockIds
//       AND whose subLevel is at or before currentSubLevel.
//       This is the pool eligibility computation — no AI involved.
//       unlockedBlockIds: string[] — atom ids present in the learner's word bank
//       currentSubLevel:  string  — e.g. 'A1.2'

import { STRUCTURES as EN_STRUCTURES, SUB_LEVEL_ORDER } from './sentenceStructures.en.js'

export { SUB_LEVEL_ORDER }

const REGISTRIES = {
  en: EN_STRUCTURES,
}

export function getStructures(lang = 'en') {
  return REGISTRIES[lang] ?? REGISTRIES.en
}

export function getStructure(id, lang = 'en') {
  return getStructures(lang).find(s => s.id === id) ?? null
}

export function getUnlockedStructures(unlockedBlockIds, currentSubLevel, lang = 'en') {
  const all       = getStructures(lang)
  const ceiling   = SUB_LEVEL_ORDER.indexOf(currentSubLevel)
  if (ceiling < 0) return []

  return all.filter(s => {
    // Sub-level gate: structure must be available at or before current sub-level
    const structureLevel = SUB_LEVEL_ORDER.indexOf(s.subLevel)
    if (structureLevel < 0 || structureLevel > ceiling) return false

    // Block gate: every required atom must be represented in the word bank
    return s.requiredBlocks.every(b => unlockedBlockIds.includes(b))
  })
}
