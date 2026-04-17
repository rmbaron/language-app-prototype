// grammarProgression.js — language router for grammar progression trees.
//
// Mirrors the pattern of progressionConfig.js — routes to the right
// language-specific file, keeping the recommender and other consumers
// language-agnostic.
//
// To add a new language: import its nodes + limit, add an entry to REGISTRY.

import { GRAMMAR_NODES as EN_NODES, OPEN_ENDED_LIMIT as EN_LIMIT } from './grammarProgression.en.js'
import { getActiveLanguage } from './learnerProfile'

const REGISTRY = {
  en: { nodes: EN_NODES, openEndedLimit: EN_LIMIT },
}

export function getGrammarNodes() {
  const lang = getActiveLanguage()
  return REGISTRY[lang]?.nodes ?? []
}

export function getOpenEndedLimit() {
  const lang = getActiveLanguage()
  return REGISTRY[lang]?.openEndedLimit ?? 10
}
