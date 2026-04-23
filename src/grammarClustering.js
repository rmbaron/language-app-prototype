// Grammar Clustering — router
// Dispatches to the language-specific cluster definition.

import { GRAMMAR_CLUSTERS as GRAMMAR_CLUSTERS_EN } from './grammarClustering.en.js'

const CLUSTERS_BY_LANG = {
  en: GRAMMAR_CLUSTERS_EN,
}

export function getGrammarClusters(lang = 'en') {
  return CLUSTERS_BY_LANG[lang] ?? GRAMMAR_CLUSTERS_EN
}

// Returns the cluster definition for a given cluster id.
export function getCluster(clusterId, lang = 'en') {
  return getGrammarClusters(lang).find(c => c.id === clusterId) ?? null
}
