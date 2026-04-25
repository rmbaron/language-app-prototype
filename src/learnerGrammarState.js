// Learner Grammar State
//
// Computes where a learner is in the grammar progression.
// Pure derived state — reads from atom unlock store + word bank + cluster lens.
// Nothing is stored here; call this whenever you need the current state.
//
// Grammar state (which atoms are unlocked) comes from atomUnlockStore.
// Vocabulary state (which words fill each atom's slot) comes from the word bank.
// These are two separate things and must not be conflated.
//
// "Sentence structures define slot shapes. Atoms define what can fill them.
//  The word bank fills the slots."

import { getWordBank } from './userStore'
import { findWordInIndex } from './atomIndex'
import { getGrammarClusters } from './grammarClustering'
import { getAtomPioneers } from './atomPioneers'
import { getAtomUnlocks } from './atomUnlockStore'

// progressive_auxiliary has no pioneer word — it is derived automatically
// when copula is unlocked (same word, new construction). Not stored in the
// unlock store; derived here so lockAtom('copula') also collapses progressive.
const STRUCTURE_UNLOCKS = {
  progressive_auxiliary: 'copula',
}

// Returns the full grammar state for the active learner.
// {
//   clusters: { [clusterId]: { complete, atoms: { [atomId]: wordId[] } } }
//   currentCluster: number   — furthest reachable cluster (all prior complete)
//   activeAtoms: string[]    — all unlocked atom classes (flags + structure-unlocks)
//   pioneerGaps: { atomId, wordId }[]  — atoms with a pioneer but not yet unlocked
// }
export function getLearnerGrammarState(lang = 'en') {
  const unlocks  = getAtomUnlocks()
  const pioneers = getAtomPioneers(lang)
  const clusters = getGrammarClusters(lang)
  const wordBank = getWordBank()

  // Active atoms: explicitly unlocked flags + structure-unlock derivations
  const activeAtomSet = new Set(Object.keys(unlocks))
  for (const [atom, triggerAtom] of Object.entries(STRUCTURE_UNLOCKS)) {
    if (activeAtomSet.has(triggerAtom)) activeAtomSet.add(atom)
  }
  const activeAtoms = [...activeAtomSet]

  // Build atom → [wordIds] map from the word bank (vocabulary, not grammar state).
  // Uses the atom index as the runtime atom layer — no L2 reads at runtime.
  const atomWords = {}
  for (const wordId of wordBank) {
    const found = findWordInIndex(wordId, lang)
    if (!found) continue
    const { atomId } = found
    if (!atomWords[atomId]) atomWords[atomId] = []
    atomWords[atomId].push(wordId)
  }
  // Structure-unlock atoms share the trigger atom's words
  for (const [atom, triggerAtom] of Object.entries(STRUCTURE_UNLOCKS)) {
    if (atomWords[triggerAtom]?.length && !atomWords[atom]) {
      atomWords[atom] = atomWords[triggerAtom]
    }
  }

  // Build per-cluster state
  const clusterState = {}
  for (const cluster of clusters) {
    const atoms = {}
    for (const atomId of cluster.atoms) {
      atoms[atomId] = atomWords[atomId] ?? []
    }
    // Complete = all atoms in cluster are unlocked (flag-based, not word-based)
    const complete = cluster.atoms.every(atomId => activeAtomSet.has(atomId))
    clusterState[cluster.id] = { complete, atoms }
  }

  // Current cluster: furthest reachable (all prior complete), stops at first incomplete
  let currentCluster = clusters[0]?.id ?? 1
  for (const cluster of clusters) {
    const allPriorComplete = clusters
      .filter(c => c.id < cluster.id)
      .every(c => clusterState[c.id].complete)
    if (!allPriorComplete) break
    currentCluster = cluster.id
    if (!clusterState[cluster.id].complete) break
  }

  // Pioneer gaps: atoms with a designated pioneer but not yet unlocked
  const pioneerGaps = Object.entries(pioneers)
    .filter(([atomId]) => !activeAtomSet.has(atomId))
    .map(([atomId, wordId]) => ({ atomId, wordId }))

  return {
    clusters:       clusterState,
    currentCluster,
    activeAtoms,
    pioneerGaps,
    atomWords,
  }
}
