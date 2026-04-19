import { useState } from 'react'
import words from './wordData'
import { loadState, getWordBank } from './userStore'
import { getActiveLanguage } from './learnerProfile'
import {
  getProgressionStages,
  getUnlockedStages,
  getAvailableFrames,
  getNextGate,
} from './progressionConfig'
import {
  getUnlockedNodeIds,
  getGraduatedNodeIds,
  graduateNode,
  recordNodeAttempt,
  GRAMMAR_PASS_THRESHOLD,
} from './grammarStore'

// Returns words (or form-augmented word objects) from the word bank that can fill a slot.
// Three slot modes:
//   specificWords  — only these word IDs (e.g. ['he', 'she'] for a subject slot)
//   fillsForm      — form-based: finds bank words of fromCategory that have the form type,
//                    returns augmented objects that display the form (e.g. "wants") not the base
//   fills          — standard: any bank word matching a grammaticalCategory
function getSlotOptions(slot, wordBankIds, allWords, activeLang) {
  const bankSet = new Set(wordBankIds)

  if (slot.specificWords) {
    return allWords.filter(
      w => w.language === activeLang && bankSet.has(w.id) && slot.specificWords.includes(w.id)
    )
  }

  if (slot.fillsForm) {
    return allWords
      .filter(w => w.language === activeLang && bankSet.has(w.id) &&
                   w.classifications.grammaticalCategory === slot.fromCategory)
      .flatMap(w => {
        const form = (w.forms ?? []).find(f => f.type === slot.fillsForm)
        if (!form) return []
        // Augmented object — displays the form but carries base word info for sentence assembly
        return [{
          id: `${w.id}__${form.form}`,
          baseForm: form.form,
          meaning: `${w.baseForm} → ${form.form}`,
          language: w.language,
          classifications: w.classifications,
        }]
      })
  }

  return allWords.filter(
    w =>
      w.language === activeLang &&
      bankSet.has(w.id) &&
      slot.fills.includes(w.classifications.grammaticalCategory)
  )
}

export default function SlotPractice({ onBack }) {
  const state    = loadState()
  const activeLang = getActiveLanguage()
  const stages   = getProgressionStages(activeLang)
  const langWords = words.filter(w => w.language === activeLang)
  const wordBankIds = getWordBank()

  const unlockedNodeIds  = getUnlockedNodeIds(wordBankIds, words, activeLang)
  const graduatedNodeIds = getGraduatedNodeIds()
  // Union: graduated nodes count as unlocked — lets dev tier toggle open frames directly
  const availableNodeIds = [...new Set([...unlockedNodeIds, ...graduatedNodeIds])]
  const unlockedStageIds = getUnlockedStages(stages, availableNodeIds)
  const availableFrames  = getAvailableFrames(stages, unlockedStageIds)
  const nextGate         = getNextGate(stages, unlockedStageIds, availableNodeIds)

  const [frameIndex, setFrameIndex]       = useState(0)
  const [filled, setFilled]               = useState({})       // slotIndex → word object
  const [activeSlot, setActiveSlot]       = useState(null)
  const [confirmed, setConfirmed]         = useState(false)
  // sessionProgress: frameId → completion count this session
  const [sessionProgress, setSessionProgress] = useState({})
  const [justGraduated, setJustGraduated] = useState(null)    // nodeId of frame just graduated

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

  function handleConfirm() {
    if (!frame) return
    const nodeId = frame.grammarNode
    const alreadyGraduated = graduatedNodeIds.includes(nodeId)

    // Record the attempt
    recordNodeAttempt(nodeId, true)

    // Increment session progress for this frame
    const prev = sessionProgress[frame.id] ?? 0
    const next = prev + 1
    setSessionProgress(s => ({ ...s, [frame.id]: next }))

    // Graduate if threshold reached and not already graduated
    if (!alreadyGraduated && next >= GRAMMAR_PASS_THRESHOLD) {
      graduateNode(nodeId)
      setJustGraduated(nodeId)
    }

    setConfirmed(true)
  }

  const allFilled = frame && frame.slots.every((_, i) => filled[i])

  // ── Locked state — no grammar nodes unlocked yet ──────────────
  if (nothingUnlocked) {
    return (
      <div className="slot-practice">
        <button className="profile-back" onClick={onBack}>← Back</button>
        <div className="slot-locked">
          <p className="slot-locked-title">Not yet unlocked</p>
          {nextGate && (
            <div className="slot-locked-needs">
              <p className="slot-locked-sub">
                To unlock <strong>{nextGate.stageName}</strong>, you need:
              </p>
              <ul className="slot-locked-list">
                {nextGate.missingNodes.map(n => (
                  <li key={n.id}>
                    <strong>{n.name}</strong>
                    {n.description && <span className="slot-locked-desc"> — {n.description}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Graduation celebration state ──────────────────────────────
  if (justGraduated && confirmed && frame) {
    const sentence = frame.slots.map((_, i) => filled[i]?.baseForm ?? '?').join(' ')
    return (
      <div className="slot-practice">
        <button className="profile-back" onClick={onBack}>← Back</button>
        <div className="slot-graduated">
          <p className="slot-graduated-label">Structure unlocked</p>
          <p className="slot-graduated-sentence">{sentence}</p>
          <p className="slot-graduated-name">{frame.label}</p>
          <p className="slot-graduated-sub">
            You can now use this structure freely in practice.
          </p>
          <div className="slot-result-actions">
            <button className="slot-btn" onClick={() => { setJustGraduated(null); reset() }}>
              Keep practicing
            </button>
            {availableFrames.length > 1 && (
              <button className="slot-btn slot-btn--primary" onClick={() => { setJustGraduated(null); nextFrame() }}>
                Next structure →
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Confirmed state — sentence assembled ──────────────────────
  if (confirmed && frame) {
    const sentence = frame.slots.map((_, i) => filled[i]?.baseForm ?? '?').join(' ')
    const nodeId   = frame.grammarNode
    const isGrad   = graduatedNodeIds.includes(nodeId)
    const progress = sessionProgress[frame.id] ?? 0

    return (
      <div className="slot-practice">
        <button className="profile-back" onClick={onBack}>← Back</button>
        <div className="slot-result">
          <p className="slot-result-sentence">{sentence}</p>

          {!isGrad && (
            <div className="slot-pass-progress">
              <div className="slot-pass-pips">
                {Array.from({ length: GRAMMAR_PASS_THRESHOLD }).map((_, i) => (
                  <span
                    key={i}
                    className={`slot-pass-pip ${i < progress ? 'slot-pass-pip--done' : ''}`}
                  />
                ))}
              </div>
              <span className="slot-pass-label">
                {progress} / {GRAMMAR_PASS_THRESHOLD} to unlock
              </span>
            </div>
          )}

          {isGrad && (
            <p className="slot-graduated-badge">Structure unlocked ✓</p>
          )}

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

  // ── Active state — filling slots ──────────────────────────────
  const nodeId   = frame?.grammarNode
  const isGrad   = nodeId && graduatedNodeIds.includes(nodeId)
  const progress = frame ? (sessionProgress[frame.id] ?? 0) : 0

  return (
    <div className="slot-practice">
      <button className="profile-back" onClick={onBack}>← Back</button>

      <div className="slot-header">
        <p className="slot-frame-label">{frame.label}</p>
        {isGrad ? (
          <span className="slot-graduated-badge">Unlocked ✓</span>
        ) : (
          <span className="slot-pass-counter">
            {progress} / {GRAMMAR_PASS_THRESHOLD}
          </span>
        )}
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
            {getSlotOptions(frame.slots[activeSlot], wordBankIds, langWords, activeLang).map(word => (
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
        <button className="slot-btn slot-btn--primary slot-confirm" onClick={handleConfirm}>
          See it →
        </button>
      )}
    </div>
  )
}
