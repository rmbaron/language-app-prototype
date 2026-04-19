// progressionConfig.js — language router for slot practice progression.
//
// Returns the stage config for the active language.
// To add a new language: create progressionConfig.xx.js and add it to the map.

import { STAGES as enStages } from './progressionConfig.en'
import { getGrammarNodes } from './grammarProgression'

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

// Returns which stages are currently unlocked given the set of unlocked grammar node IDs.
// Gate: all requiresNodes must be in unlockedNodeIds.
export function getUnlockedStages(stages, unlockedNodeIds) {
  const unlockedSet = new Set(unlockedNodeIds)
  return stages
    .filter(s => (s.gate.requiresNodes ?? []).every(id => unlockedSet.has(id)))
    .map(s => s.id)
}

// Returns what is needed to unlock the next locked stage, for the locked-state display.
// Shows grammar function names (from the grammar tree) rather than raw word IDs.
export function getNextGate(stages, unlockedStageIds, unlockedNodeIds) {
  const unlockedSet = new Set(unlockedNodeIds)
  const nextStage = stages.find(s => !unlockedStageIds.includes(s.id))
  if (!nextStage) return null

  const grammarNodes = getGrammarNodes()
  const missingNodes = (nextStage.gate.requiresNodes ?? [])
    .filter(id => !unlockedSet.has(id))
    .map(id => {
      const node = grammarNodes.find(n => n.id === id)
      return node ? { id, name: node.name, description: node.description } : { id, name: id, description: '' }
    })

  return { stageName: nextStage.name, missingNodes }
}
