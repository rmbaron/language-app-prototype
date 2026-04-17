// Word Bank Selector — sits between the WB pool and practice components.
//
// Responsible for deciding WHICH content or words to surface during practice.
// The pool (wbPools in userStore) answers: "is this word available?"
// The selector answers: "given what's available, what should we show right now?"
//
// This separation means selection logic can evolve independently of the pool
// structure and the practice components.
//
// Selection signals (current and future):
//   depthLevel       — from learnerProfile, controls content complexity
//   personalization  — user/app-selected style or focus (not yet implemented)
//   recency          — how recently a word was last practiced (not yet implemented)
//   spaced repetition — priority based on time since last attempt (not yet implemented)
//   goal alignment   — weight words toward the learner's declared goal (not yet implemented)
//
// Pool access:
//   selectContent does not need pool access — the word has already been chosen
//   by the user before content selection runs.
//   selectDistractors reads wbPools to prefer words the learner has encountered.
//
// Two concerns:
//   selectContent     — which content item to use for a given word/lane/level
//   selectDistractors — which words to use as distractors (e.g. Reading blanks)

import { getContent } from './contentStore'
import { loadState, getWordBank, getPracticedWords } from './userStore'
import { getTierProfile, KNOWN_FOR_CONTENT, KNOWN_FOR_DISTRACTORS } from './vocabTiers'
import { getReferenceTier } from './wordReference'
import words from './wordData'

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ── Word-awareness gate ───────────────────────────────────────
//
// Core design principle: prompts (in both Word Bank and World Sphere) must
// only use words the learner already knows. A prompt with an unknown context
// word forces the learner to work on multiple unknowns at once, which defeats
// focused practice.
//
// How the gate works:
//   Content items carry a contextWords[] field (populated at generation time)
//   listing the non-trivial words used in the prompt. Before serving an item,
//   the gate checks whether those words are known by the user.
//
//   The check is governed by the user's vocab tier (from vocabTiers.js):
//     'explicit'          — every context word must be in the user's wordBank
//     'frequency_assumed' — high-frequency words (above FREQUENCY_ASSUMPTION_THRESHOLD)
//                           are assumed known; only unusual context words are checked
//
// Not yet active — content items don't carry contextWords[] until generation
// is wired. The stub below shows where and how the gate plugs in.
//
// TODO: activate once contentStore items carry contextWords[]:
//
//   function passesWordAwarenessGate(item, laneId, tierProfile, state) {
//     if (!item.contextWords?.length) return true  // no metadata → allow through
//     const { frequencyFloor } = tierProfile
//     // Lane-specific pool: practicing a word in reading makes it eligible as
//     // context in reading prompts only — not writing, not speaking, etc.
//     const knownInLane = state.wbPools?.[laneId] ?? []
//     return item.contextWords.every(wordId => {
//       // Step 1 — direct pool check (free, authoritative, always runs first)
//       if (knownInLane.includes(wordId)) return true
//       // Step 2 — frequency assumption fallback (only if not found in pool)
//       // Uses wordReference (not wordMeta) — designed to hold 10k+ words
//       if (frequencyFloor !== null) {
//         const tier = getReferenceTier(wordId)
//         if (tier !== null && tier >= frequencyFloor) return true
//       }
//       return false
//     })
//   }

// ── Content selection ─────────────────────────────────────────
//
// Returns a single content item for a word/lane at the learner's depth level.
// Prefers items whose level matches or is below the current depth level.
// Falls back to all available items if none match.
// Returns null if no content exists.
//
// Future parameters to add here:
//   personalization — filter or weight items by personalization style/focus
//   word-awareness gate — filter items whose contextWords aren't in wordBank
//                         (see stub above; activate once generation is wired)

export function selectContent(wordId, laneId, depthLevel = 1) {
  const items = getContent(wordId, laneId)
  if (items.length === 0) return null

  // Future: const tierProfile = getTierProfile(getWordBank().length)
  // Future: const wordBank = getWordBank()
  // Future: const gated = items.filter(item => passesWordAwarenessGate(item, tierProfile, wordBank))
  // Future: const pool = (gated.length > 0 ? gated : items).filter(item => (item.level ?? 1) <= depthLevel)

  const levelMatched = items.filter(item => (item.level ?? 1) <= depthLevel)
  const pool = levelMatched.length > 0 ? levelMatched : items

  return pickRandom(pool)
}

// ── Distractor selection ──────────────────────────────────────
//
// Returns an array of distractor word objects for use in exercises like
// Reading blank-and-identify.
//
// Priority:
//   1. WB active words (in pool but not yet graduated) — same grammatical category
//   2. WB active words — any category
//   3. Any other word in the word bank
//
// Prefers words the learner has already encountered so distractors feel familiar.

export function selectDistractors(targetWord, laneId, count = 3) {
  const state = loadState()
  // KNOWN_FOR_DISTRACTORS defines which pool counts as "known" for distractor purposes
  const wbActive = state[KNOWN_FOR_DISTRACTORS]?.[laneId] ?? []
  const targetCategory = targetWord.classifications?.grammaticalCategory

  const candidates = words.filter(w => w.id !== targetWord.id)

  const wbWords = candidates.filter(w => wbActive.includes(w.id))
  const nonWbWords = candidates.filter(w => !wbActive.includes(w.id))

  const sameCat = wbWords.filter(w => w.classifications?.grammaticalCategory === targetCategory)
  const diffCat = wbWords.filter(w => w.classifications?.grammaticalCategory !== targetCategory)

  const pool = shuffle([...sameCat, ...diffCat, ...nonWbWords])
  return pool.slice(0, count)
}

