import { useState } from 'react'
import words from './wordData'
import { loadState, getGraduatedWordIds } from './userStore'
import { getActiveLanguage } from './learnerProfile'
import {
  getProgressionStages,
  getUnlockedStages,
  getAvailableFrames,
  getNextGate,
} from './progressionConfig'

// Returns words from the graduated set that can fill a given slot.
function getSlotOptions(slot, graduatedIds, allWords, activeLang) {
  const graduatedSet = new Set(graduatedIds)
  return allWords.filter(
    w =>
      w.language === activeLang &&
      graduatedSet.has(w.id) &&
      slot.fills.includes(w.classifications.grammaticalCategory)
  )
}

export default function SlotPractice({ onBack }) {
  const state = loadState()
  const activeLang = getActiveLanguage()
  const stages = getProgressionStages(activeLang)
  const graduatedIds = getGraduatedWordIds(state)
  const langWords = words.filter(w => w.language === activeLang)

  const unlockedStageIds = getUnlockedStages(stages, graduatedIds, langWords)
  const availableFrames = getAvailableFrames(stages, unlockedStageIds)
  const nextGate = getNextGate(stages, unlockedStageIds, graduatedIds, langWords)

  const [frameIndex, setFrameIndex] = useState(0)
  const [filled, setFilled] = useState({})     // slotIndex → word object
  const [activeSlot, setActiveSlot] = useState(null)
  const [confirmed, setConfirmed] = useState(false)

  const nothingUnlocked = availableFrames.length === 0
  const frame = availableFrames[frameIndex] ?? null

  function selectWord(word) {
    if (activeSlot === null) return
    setFilled(prev => ({ ...prev, [activeSlot]: word }))
    setActiveSlot(null)
  }

  function reset() {
    setFilled({})
    setActiveSlot(null)
    setConfirmed(false)
  }

  function nextFrame() {
    setFrameIndex(i => (i + 1) % availableFrames.length)
    reset()
  }

  const allFilled = frame && frame.slots.every((_, i) => filled[i])

  // ── Locked state — not enough words graduated yet ──
  if (nothingUnlocked) {
    return (
      <div className="slot-practice">
        <button className="profile-back" onClick={onBack}>← Back</button>
        <div className="slot-locked">
          <p className="slot-locked-title">Not yet unlocked</p>
          {nextGate && (
            <div className="slot-locked-needs">
              <p className="slot-locked-sub">To unlock <strong>{nextGate.stageName}</strong>, graduate:</p>
              <ul className="slot-locked-list">
                {nextGate.missingWords.map(w => (
                  <li key={w}><strong>{w}</strong></li>
                ))}
                {nextGate.missingCategories.map(({ category, need }) => (
                  <li key={category}>{need} more <strong>{category}</strong>{need > 1 ? 's' : ''}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Confirmed state — sentence assembled ──
  if (confirmed && frame) {
    const sentence = frame.slots.map((_, i) => filled[i]?.baseForm ?? '?').join(' ')
    return (
      <div className="slot-practice">
        <button className="profile-back" onClick={onBack}>← Back</button>
        <div className="slot-result">
          <p className="slot-result-sentence">{sentence}</p>
          <div className="slot-result-actions">
            <button className="slot-btn" onClick={reset}>Try again</button>
            {availableFrames.length > 1 && (
              <button className="slot-btn slot-btn--primary" onClick={nextFrame}>
                Next →
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Active state — filling slots ──
  return (
    <div className="slot-practice">
      <button className="profile-back" onClick={onBack}>← Back</button>

      <div className="slot-header">
        <p className="slot-frame-label">{frame.label}</p>
      </div>

      {/* The sentence frame */}
      <div className="slot-frame">
        {frame.slots.map((slot, i) => {
          const word = filled[i]
          const isActive = activeSlot === i
          return (
            <div
              key={i}
              className={[
                'slot',
                word ? 'slot--filled' : '',
                isActive ? 'slot--active' : '',
              ].join(' ').trim()}
              onClick={() => setActiveSlot(isActive ? null : i)}
            >
              <span className="slot-label">{slot.label}</span>
              <span className="slot-word">{word ? word.baseForm : '·'}</span>
            </div>
          )
        })}
      </div>

      {/* Word picker — only shows when a slot is active */}
      {activeSlot !== null && (
        <div className="slot-picker">
          <p className="slot-picker-label">
            Choose a {frame.slots[activeSlot].label.toLowerCase()}
          </p>
          <div className="slot-picker-options">
            {getSlotOptions(frame.slots[activeSlot], graduatedIds, langWords, activeLang).map(word => (
              <button
                key={word.id}
                className="slot-option"
                onClick={() => selectWord(word)}
              >
                {word.baseForm}
                <span className="slot-option-meaning">{word.meaning}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {allFilled && (
        <button className="slot-btn slot-btn--primary slot-confirm" onClick={() => setConfirmed(true)}>
          See it →
        </button>
      )}
    </div>
  )
}
