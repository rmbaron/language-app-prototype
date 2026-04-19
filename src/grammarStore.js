// grammarStore.js — grammar function progression state.
//
// Separate from userStore — grammar is its own pool system, parallel to words.
//
// Two tiers (mirrors the word pool pattern):
//   unlocked  — COMPUTED. Carrier words are in the word bank → function available to practice.
//   graduated — STORED.   Learner has passed the slot practice gate → function freely usable.
//
// The unlock resolver lives here (not in wordCandidatePool) because it is the
// shared source of truth. wordCandidatePool imports getUnlockedNodeIds from here.
//
// Pass threshold: GRAMMAR_PASS_THRESHOLD completions of a frame = node graduated.

import { getGrammarNodes } from './grammarProgression'

const GRAMMAR_STORAGE_KEY = 'lapp-grammar-v1'
export const GRAMMAR_PASS_THRESHOLD = 3

// ── Storage ───────────────────────────────────────────────────

function defaults() {
  return {
    graduatedNodes: [],  // node IDs that have passed the slot practice gate
    nodeScores: {},      // nodeId → { attempts: N, correct: N } — lifetime stats
  }
}

export function loadGrammarState() {
  try {
    const raw = localStorage.getItem(GRAMMAR_STORAGE_KEY)
    if (raw) return { ...defaults(), ...JSON.parse(raw) }
    return defaults()
  } catch {
    return defaults()
  }
}

function save(state) {
  localStorage.setItem(GRAMMAR_STORAGE_KEY, JSON.stringify(state))
}

// ── Unlock resolution ─────────────────────────────────────────
//
// Computes which grammar nodes are currently unlocked given the learner's word bank.
// A node is unlocked when:
//   1. All required nodes are themselves unlocked (dependency order resolved iteratively)
//   2. Its carrier requirement is satisfied by words in the word bank
//
// Uses word bank membership (not worldPools) — adding a word enables the grammar
// function immediately. This is consistent with the grammar tree design intent.

export function getUnlockedNodeIds(wordBankIds, allWords, activeLang) {
  const grammarNodes = getGrammarNodes()
  if (!grammarNodes.length) return []

  const bankCategoryCounts = {}
  for (const id of wordBankIds) {
    const w = allWords.find(w => w.id === id && w.language === activeLang)
    if (w) {
      const cat = w.classifications.grammaticalCategory
      bankCategoryCounts[cat] = (bankCategoryCounts[cat] ?? 0) + 1
    }
  }

  // Nested — closes over wordBankIds, bankCategoryCounts, allWords, activeLang.
  // Three carrier types:
  //   specific  — all listed word IDs must be in the word bank
  //   category  — at least N words of a grammatical category in the bank
  //   formType  — at least N bank words of a category that have a specific form type
  //               (e.g. verb with third_person_present — activates conjugation)
  function resolveCarrier(node) {
    if (!node.carrier) return false
    const { type } = node.carrier
    if (type === 'specific') {
      return node.carrier.wordIds.every(id => wordBankIds.includes(id))
    }
    if (type === 'category') {
      return (bankCategoryCounts[node.carrier.category] ?? 0) >= node.carrier.min
    }
    if (type === 'formType') {
      const { formType, fromCategory, min } = node.carrier
      const count = wordBankIds.filter(id => {
        const w = allWords.find(w => w.id === id && w.language === activeLang)
        return (
          w &&
          w.classifications.grammaticalCategory === fromCategory &&
          (w.forms ?? []).some(f => f.type === formType)
        )
      }).length
      return count >= min
    }
    return false
  }

  const unlocked = new Set()
  let changed = true
  while (changed) {
    changed = false
    for (const node of grammarNodes) {
      if (unlocked.has(node.id)) continue
      if (node.requires.every(r => unlocked.has(r)) && resolveCarrier(node)) {
        unlocked.add(node.id)
        changed = true
      }
    }
  }

  return [...unlocked]
}

// ── Graduation ────────────────────────────────────────────────

export function getGraduatedNodeIds() {
  return loadGrammarState().graduatedNodes
}

export function isNodeGraduated(nodeId) {
  return loadGrammarState().graduatedNodes.includes(nodeId)
}

export function graduateNode(nodeId) {
  const state = loadGrammarState()
  if (!state.graduatedNodes.includes(nodeId)) {
    state.graduatedNodes.push(nodeId)
    save(state)
  }
}

// ── Node scoring ──────────────────────────────────────────────

export function recordNodeAttempt(nodeId, correct) {
  const state = loadGrammarState()
  if (!state.nodeScores[nodeId]) state.nodeScores[nodeId] = { attempts: 0, correct: 0 }
  state.nodeScores[nodeId].attempts += 1
  if (correct) state.nodeScores[nodeId].correct += 1
  save(state)
}

export function getNodeScore(nodeId) {
  return loadGrammarState().nodeScores[nodeId] ?? { attempts: 0, correct: 0 }
}

// ── Dev utilities ─────────────────────────────────────────────

// Graduate all non-stub nodes in a given stage number.
export function graduateNodesInStage(stageNum) {
  const grammarNodes = getGrammarNodes()
  const state = loadGrammarState()
  grammarNodes
    .filter(n => n.stage === stageNum && n.status !== 'stub')
    .forEach(n => {
      if (!state.graduatedNodes.includes(n.id)) state.graduatedNodes.push(n.id)
    })
  save(state)
}

// Remove all nodes in a given stage from graduatedNodes.
export function resetNodesInStage(stageNum) {
  const grammarNodes = getGrammarNodes()
  const stageIds = new Set(grammarNodes.filter(n => n.stage === stageNum).map(n => n.id))
  const state = loadGrammarState()
  state.graduatedNodes = state.graduatedNodes.filter(id => !stageIds.has(id))
  save(state)
}

export function resetGrammarState() {
  localStorage.removeItem(GRAMMAR_STORAGE_KEY)
}
