// Word Candidate Pool — assembles eligible word candidates for recommendation.
//
// Answers: "what words are eligible to be recommended right now?"
// Does NOT decide what the user sees — that is wordRecommender.js.
//
// Architecture: atom-first, cluster-positioned.
//   1. Read getLearnerGrammarState() once — cluster position, active atoms, pioneer gaps
//   2. Pioneer gaps → surface designated pioneer words (flagged isPioneer: true)
//   3. Active atoms → widen vocab within each unlocked atom class via atom index
//
// Nothing here reads L2 directly. Word eligibility comes from the atom index.
// Grammar state comes from getLearnerGrammarState() which reads atomUnlockStore.
//
// Content eligibility (contentReady) will be enforced here once that system
// is redesigned around atoms. For now, all indexed words are eligible.
//
// Pioneer surfacing logic (when/how pioneers enter the stream) is TBD —
// currently all pioneer gaps are included as candidates. Pacing design pending.

import { getLearnerGrammarState } from './learnerGrammarState'
import { getWordsForAtom } from './atomIndex'
import { getWord } from './wordRegistry'
import { getCefrLevel } from './learnerProfile'
import { getAtomPioneer } from './atomPioneers'
import { getGrammarClusters } from './grammarClustering'

// ── Candidate assembly ────────────────────────────────────────────────────────

export function buildCandidatePool(lang = 'en') {
  const grammarState = getLearnerGrammarState(lang)
  const { activeAtoms, pioneerGaps, clusters } = grammarState
  const cefrLevel = getCefrLevel() ?? 'A1'

  // Build a flat set of all banked word IDs from grammar state.
  // This avoids reading the word bank directly.
  const banked = new Set(
    Object.values(clusters)
      .flatMap(c => Object.values(c.atoms).flat())
  )

  const currentClusterAtoms = new Set(
    getGrammarClusters(lang).find(c => c.id === grammarState.currentCluster)?.atoms ?? []
  )

  const candidates = []

  // ── Pioneer candidates ────────────────────────────────────────
  // Only surface pioneers for atoms in the current cluster.
  // Pioneer ordering within a cluster is TBD — pacing design pending.
  for (const { atomId, wordId } of pioneerGaps) {
    if (!currentClusterAtoms.has(atomId)) continue
    if (banked.has(wordId)) continue
    const word = getWord(wordId, lang)
    if (word) candidates.push({ word, atom: atomId, isPioneer: true })
  }

  // ── Vocab-depth candidates ────────────────────────────────────
  // For each unlocked atom, surface all level-appropriate words
  // from the atom index that aren't already banked.
  for (const atomId of activeAtoms) {
    const indexed = getWordsForAtom(atomId, lang, cefrLevel)
    for (const wordId of indexed) {
      if (banked.has(wordId)) continue
      const pioneer = getAtomPioneer(atomId, lang)
      // Skip if this is a pioneer word — already handled above if needed
      if (pioneer === wordId) continue
      const word = getWord(wordId, lang)
      if (word) candidates.push({ word, atom: atomId, isPioneer: false })
    }
  }

  return candidates
}
