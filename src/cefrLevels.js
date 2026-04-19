// CEFR Level router — single source of truth for level definitions across languages.
//
// Pattern mirrors grammarProgression.js:
//   - Each language has its own level definition file (cefrLevels.en.js, etc.)
//   - This file registers them and exposes a clean API
//   - All other systems import from here, never from language files directly
//
// Adding a new language: import its LEVELS array and add it to REGISTRY.

import { LEVELS as EN_LEVELS } from './cefrLevels.en.js'
import { getActiveLanguage } from './learnerProfile'
import { getWordAttributes } from './wordAttributes'

// ── Consolidation depth defaults ──────────────────────────────
//
// Before a learner advances to the next sub-level phase, each slot must
// reach depth >= its minDepth threshold. These are the category-level defaults.
//
// How the lookup works (in priority order):
//   1. Explicit minDepth on the slot definition (override for unusual slots)
//   2. This map, keyed by grammaticalCategory from the slot's coverageCheck
//   3. 1 (covered = one word = phase-complete — the closed-set default)
//
// Tuning note: these numbers apply to ALL levels across ALL languages that use
// category-type coverage checks. If a particular level needs different behaviour,
// add an explicit minDepth to that slot definition instead.

export const CATEGORY_MIN_DEPTH = {
  verb:        3,   // need a few action words before "verb system" is established
  noun:        4,   // highest-volume open slot — consolidate before advancing
  adjective:   2,   // two describing words is the floor
  preposition: 2,   // two location words is the floor
  // All others default to 1 (closed sets, function words, etc.)
}

const REGISTRY = {
  en: EN_LEVELS,
}

// ── Public API ────────────────────────────────────────────────

// All defined levels for the active language, in order.
export function getLevels() {
  return REGISTRY[getActiveLanguage()] ?? []
}

// A single level by ID (e.g. 'A1'). Returns null if not found.
export function getLevel(levelId) {
  return getLevels().find(l => l.id === levelId) ?? null
}

// All distinct tiers for the active language, in order.
// Returns e.g. [{ id: 'A', name: 'Beginner' }, { id: 'B', name: 'Intermediate' }, ...]
export function getTiers() {
  const seen = new Set()
  const tiers = []
  for (const level of getLevels()) {
    if (!seen.has(level.tier)) {
      seen.add(level.tier)
      tiers.push({ id: level.tier, name: level.tierName })
    }
  }
  return tiers
}

// Given a level ID, return all levels in the same tier.
export function getLevelsInTier(tierId) {
  return getLevels().filter(l => l.tier === tierId)
}

// ── Slot coverage ─────────────────────────────────────────────
//
// For a given level and word bank, returns which grammar slots are covered
// and which are missing. Used by the recommender to decide what to surface.
//
// A slot is "covered" when the bank contains at least one word that fills it.
// Coverage is determined by:
//   specificWords — one of these word IDs is in the bank
//   category      — at least one bank word has this grammaticalCategory
//   structural    — always covered (enabled by other slots, not vocabulary)
//
// Returns an array of slot objects annotated with:
//   covered  — boolean
//   depth    — count of bank words filling this slot (for open-ended depth check)

export function getSlotCoverage(levelId, wordBankIds, allWords, activeLang) {
  const level = getLevel(levelId)
  if (!level?.grammarSlots) return []

  const bankSet = new Set(wordBankIds)
  const bankWords = allWords.filter(w => w.language === activeLang && bankSet.has(w.id))

  return level.grammarSlots.map(slot => {
    if (slot.coverageCheck?.type === 'structural') {
      return { ...slot, covered: true, depth: 0 }
    }
    if (slot.coverageCheck?.type === 'specificWords') {
      const depth = slot.coverageCheck.wordIds.filter(id => bankSet.has(id)).length
      return { ...slot, covered: depth > 0, depth }
    }
    if (slot.coverageCheck?.type === 'category') {
      const cat = slot.coverageCheck.grammaticalCategory
      const exclude = new Set(slot.coverageCheck.excludeIds ?? [])
      const depth = bankWords.filter(
        w => w.classifications.grammaticalCategory === cat && !exclude.has(w.id)
      ).length
      return { ...slot, covered: depth > 0, depth }
    }
    if (slot.coverageCheck?.type === 'attribute') {
      const { key, value } = slot.coverageCheck
      const depth = bankWords.filter(
        w => getWordAttributes(w.id)?.[key] === value
      ).length
      return { ...slot, covered: depth > 0, depth }
    }
    // No coverageCheck defined — treat as uncovered
    return { ...slot, covered: false, depth: 0 }
  })
}

// ── Slot progression helpers ──────────────────────────────────

// Slots introduced at exactly one sub-level phase (not cumulative).
export function getPhaseSlots(levelId, subLevelId) {
  const level = getLevel(levelId)
  return level?.slotProgression?.find(p => p.phase === subLevelId)?.slots ?? []
}

// All slots active at a given sub-level, including all prior phases.
export function getCumulativeSlots(levelId, subLevelId) {
  const level = getLevel(levelId)
  if (!level?.slotProgression) return []
  const result = []
  for (const entry of level.slotProgression) {
    result.push(...entry.slots)
    if (entry.phase === subLevelId) break
  }
  return result
}

// ── Sub-level auto-detection ──────────────────────────────────
//
// Returns the highest sub-level the learner has reached based on
// cumulative slot coverage. If no slots are covered yet, returns
// the first sub-level (where the learner starts).
//
// A slot counts as "phase-complete" when:
//   depth >= (slot.minDepth ?? 1)
//
// minDepth is optional per-slot. It defaults to 1 (covered = 1 word).
// Open-ended slots (nouns, verbs, adjectives) can set a higher minDepth
// to require consolidation before the learner advances to the next phase.
// This prevents the recommender from racing through grammar slots.

export function getCurrentSubLevel(levelId, wordBankIds, allWords, activeLang) {
  const level = getLevel(levelId)
  if (!level?.subdivisions?.length || !level?.slotProgression?.length) return null

  const slotCoverage   = getSlotCoverage(levelId, wordBankIds, allWords, activeLang)
  const coverageById   = new Map(slotCoverage.map(s => [s.id, s]))

  // A slot is phase-complete when depth >= minDepth.
  // Priority: explicit slot override → category default → 1.
  function isPhaseComplete(slotId) {
    const coverage = coverageById.get(slotId)
    if (!coverage) return false
    const categoryDefault = CATEGORY_MIN_DEPTH[coverage.coverageCheck?.grammaticalCategory] ?? 1
    const minDepth = coverage.minDepth ?? categoryDefault
    return coverage.depth >= minDepth
  }

  let reached = level.subdivisions[0]?.id ?? null
  for (const entry of level.slotProgression) {
    const cumulative = getCumulativeSlots(levelId, entry.phase)
    if (cumulative.every(id => isPhaseComplete(id))) {
      reached = entry.phase
    } else {
      break
    }
  }
  return reached
}

// ── Per-word slot info ────────────────────────────────────────
//
// For a given word, returns which slot it fills (if any) and whether
// it fills a missing slot or deepens an already-covered one.
// Used by DiscoverWords to show "why" a word is recommended.
//
// Returns { slotLabel, status: 'fills_missing' | 'deepens' } or null.

export function getWordSlotInfo(wordId, grammaticalCategory, levelId, wordBankIds, allWords, activeLang) {
  const level = getLevel(levelId)
  if (!level?.grammarSlots) return null

  const slotCoverage = getSlotCoverage(levelId, wordBankIds, allWords, activeLang)

  // Three-pass: specificWords → attribute → category.
  // More specific always wins over more general, regardless of slot array order.
  //   specificWords — exact word ID match (most specific)
  //   attribute     — AI-filled semantic property match (e.g. nounType: 'person')
  //   category      — grammaticalCategory match (most general fallback)

  for (const slot of slotCoverage) {
    if (slot.coverageCheck?.type !== 'specificWords') continue
    if (slot.coverageCheck.wordIds.includes(wordId)) {
      return { slotLabel: slot.userLabel ?? slot.label, status: slot.covered ? 'deepens' : 'fills_missing' }
    }
  }

  const attrs = getWordAttributes(wordId)
  if (attrs) {
    for (const slot of slotCoverage) {
      if (slot.coverageCheck?.type !== 'attribute') continue
      const { key, value } = slot.coverageCheck
      if (attrs[key] === value) {
        return { slotLabel: slot.userLabel ?? slot.label, status: slot.covered ? 'deepens' : 'fills_missing' }
      }
    }
  }

  for (const slot of slotCoverage) {
    if (slot.coverageCheck?.type !== 'category') continue
    const cat     = slot.coverageCheck.grammaticalCategory
    const exclude = new Set(slot.coverageCheck.excludeIds ?? [])
    if (cat === grammaticalCategory && !exclude.has(wordId)) {
      return { slotLabel: slot.userLabel ?? slot.label, status: slot.covered ? 'deepens' : 'fills_missing' }
    }
  }

  return null
}

// Returns true if levelA is lower than levelB (by order).
export function isLevelBelow(levelIdA, levelIdB) {
  const a = getLevel(levelIdA)
  const b = getLevel(levelIdB)
  if (!a || !b) return false
  return a.order < b.order
}

// Returns the next level above the given one, or null if already at the top.
export function getNextLevel(levelId) {
  const current = getLevel(levelId)
  if (!current) return null
  return getLevels().find(l => l.order === current.order + 1) ?? null
}
