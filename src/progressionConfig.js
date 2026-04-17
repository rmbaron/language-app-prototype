// progressionConfig.js — language router for slot practice progression.
//
// Returns the stage config for the active language.
// To add a new language: create progressionConfig.xx.js and add it to the map.

import { STAGES as enStages } from './progressionConfig.en'

const configs = {
  en: enStages,
  // he: heStages,  — add when Hebrew progression is designed
}

export function getProgressionStages(langId) {
  return configs[langId] ?? []
}

// Returns all frames available given a set of unlocked stage IDs.
// Stages are additive — all frames from all unlocked stages are merged.
export function getAvailableFrames(stages, unlockedStageIds) {
  return stages
    .filter(s => unlockedStageIds.includes(s.id))
    .flatMap(s => s.frames)
}

// Returns which stages are currently unlocked given graduated word IDs and
// the full word list (needed to check grammatical categories).
export function getUnlockedStages(stages, graduatedIds, allWords) {
  const graduatedSet = new Set(graduatedIds)

  function gatesMet(gate) {
    const { requiredWords = [], requiredCategories = [] } = gate

    const wordsMet = requiredWords.every(id => graduatedSet.has(id))

    const categoriesMet = requiredCategories.every(({ category, min }) => {
      const count = allWords.filter(
        w => graduatedSet.has(w.id) && w.classifications.grammaticalCategory === category
      ).length
      return count >= min
    })

    return wordsMet && categoriesMet
  }

  return stages.filter(s => gatesMet(s.gate)).map(s => s.id)
}

// Returns what is needed to unlock the next locked stage, for display purposes.
export function getNextGate(stages, unlockedStageIds, graduatedIds, allWords) {
  const graduatedSet = new Set(graduatedIds)
  const nextStage = stages.find(s => !unlockedStageIds.includes(s.id))
  if (!nextStage) return null

  const { requiredWords = [], requiredCategories = [] } = nextStage.gate

  const missingWords = requiredWords
    .filter(id => !graduatedSet.has(id))
    .map(id => allWords.find(w => w.id === id)?.baseForm ?? id)

  const missingCategories = requiredCategories
    .map(({ category, min }) => {
      const have = allWords.filter(
        w => graduatedSet.has(w.id) && w.classifications.grammaticalCategory === category
      ).length
      const need = min - have
      return need > 0 ? { category, need } : null
    })
    .filter(Boolean)

  return { stageName: nextStage.name, missingWords, missingCategories }
}
