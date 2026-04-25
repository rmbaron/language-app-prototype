import { ALL_SLOTS_BY_ID } from './sentenceStructure.en.js'
import { getEligibleWords } from './constructorEngine'

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

// Fills all slots in a tier with words from the bank.
// Returns { slotId: baseForm } or null if a required slot can't be filled.
export function assembleFrame(tier, bankWords, lang = 'en') {
  const frame = {}

  for (const slotId of tier.slotIds) {
    if (tier.forceWords?.[slotId]) {
      frame[slotId] = pick(tier.forceWords[slotId])
      continue
    }

    const baseSlot = ALL_SLOTS_BY_ID[slotId]
    if (!baseSlot) continue

    const slot = tier.slotOverrides?.[slotId]
      ? { ...baseSlot, ...tier.slotOverrides[slotId] }
      : baseSlot

    const candidates = getEligibleWords(slot, bankWords, lang)
    if (!candidates.length) {
      if (!slot.optional) return null
      continue
    }

    frame[slotId] = pick(candidates).baseForm
  }

  return frame
}

// Picks a random eligible tier, assembles a frame, retries if required slots can't be filled.
export function assembleRandomFrame(eligibleTiers, bankWords, lang = 'en') {
  const shuffled = [...eligibleTiers].sort(() => Math.random() - 0.5)
  for (const tier of shuffled) {
    const frame = assembleFrame(tier, bankWords, lang)
    if (frame) return { tier, frame }
  }
  return null
}
