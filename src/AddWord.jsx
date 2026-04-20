import { useState } from 'react'
import { getWordBank, loadState, recordAttempt, THRESHOLD } from './userStore'
import { getActiveLanguage, getInterfaceLanguage } from './learnerProfile'
import { getStrings } from './uiStrings'
import { LANES, LANE_DISPLAY } from './lanes'
import allWords from './wordData'

// AddWord — lets the user manually bank a word by producing it.
// Only productive lanes (writing, speaking) are offered — the user must
// demonstrate they know the word, not just recognise it.
//
// Four views:
//   Search     — find a word from wordData not already in bank
//   Lane pick  — choose writing or speaking
//   Practice   — flashcard trial (THRESHOLD correct → auto-banks)
//   Success    — confirmation with option to add another

const PRODUCTIVE_LANES = LANES.filter(l => l.modality === 'productive')

export default function AddWord({ onBack, onWordAdded }) {
  const s = getStrings(getInterfaceLanguage())

  const [search, setSearch]           = useState('')
  const [selectedWord, setSelectedWord] = useState(null)
  const [selectedLane, setSelectedLane] = useState(null)
  const [cardFlipped, setCardFlipped] = useState(false)
  const [trialCount, setTrialCount]   = useState(0)
  const [trialDone, setTrialDone]     = useState(false)

  const bankIds    = new Set(getWordBank())
  const activeLang = getActiveLanguage()
  const q          = search.trim().toLowerCase()

  const searchResults = q.length < 1 ? [] : allWords
    .filter(w =>
      w.language === activeLang &&
      !bankIds.has(w.id) &&
      (w.baseForm.toLowerCase().includes(q) || w.meaning.toLowerCase().includes(q))
    )
    .sort((a, b) => {
      const aExact = a.baseForm.toLowerCase() === q
      const bExact = b.baseForm.toLowerCase() === q
      if (aExact !== bExact) return aExact ? -1 : 1
      const aBase = a.baseForm.toLowerCase().includes(q)
      const bBase = b.baseForm.toLowerCase().includes(q)
      if (aBase !== bBase) return aBase ? -1 : 1
      return 0
    })
    .slice(0, 12)

  function selectWord(word) {
    setSelectedWord(word)
    setSearch('')
    setSelectedLane(null)
    setCardFlipped(false)
    setTrialDone(false)
    setTrialCount(0)
  }

  function selectLane(laneId) {
    const existing = loadState().attempts[selectedWord.id]?.[laneId] ?? 0
    setSelectedLane(laneId)
    setTrialCount(existing)
    setCardFlipped(false)
    setTrialDone(false)
  }

  function handleCorrect() {
    const result = recordAttempt(selectedWord.id, selectedLane)
    setTrialCount(result.count)
    if (result.graduated) {
      setTrialDone(true)
      if (onWordAdded) onWordAdded()
    } else {
      setCardFlipped(false)
    }
  }

  function handleIncorrect() {
    setCardFlipped(false)
  }

  function handleBack() {
    if (selectedLane && !trialDone) { setSelectedLane(null); setCardFlipped(false); return }
    if (selectedWord)               { setSelectedWord(null); return }
    onBack()
  }

  function resetForAnother() {
    setSelectedWord(null)
    setSelectedLane(null)
    setCardFlipped(false)
    setTrialDone(false)
    setTrialCount(0)
  }

  // ── Success ───────────────────────────────────────────────────

  if (trialDone) {
    return (
      <div className="discover">
        <div className="trial-success">
          <div className="trial-success-check">✓</div>
          <p className="trial-success-word">{selectedWord.baseForm}</p>
          <p className="trial-success-msg">{s.addWord.success}</p>
          <button className="trial-back-btn" onClick={resetForAnother}>
            {s.addWord.addAnother}
          </button>
          <button className="profile-back" style={{ marginTop: '12px' }} onClick={onBack}>
            {s.common.back}
          </button>
        </div>
      </div>
    )
  }

  // ── Flashcard practice ────────────────────────────────────────

  if (selectedWord && selectedLane) {
    const lane      = LANES.find(l => l.id === selectedLane)
    const laneColor = LANE_DISPLAY[selectedLane].color
    const remaining = THRESHOLD - trialCount
    return (
      <div className="discover">
        <button className="profile-back" onClick={handleBack}>{s.common.back}</button>

        <div className="trial-lane-header">
          <span className="trial-lane-badge" style={{ background: laneColor }}>
            {s.common.lanes[lane.id]}
          </span>
          <span className="trial-lane-progress">{trialCount} / {THRESHOLD}</span>
        </div>

        <div
          className="trial-card"
          onClick={() => !cardFlipped && setCardFlipped(true)}
          style={{ cursor: cardFlipped ? 'default' : 'pointer' }}
        >
          {!cardFlipped ? (
            <div className="trial-card-front">
              <p className="trial-card-word">{selectedWord.baseForm}</p>
              <p className="trial-card-hint">{s.discover.tapToReveal}</p>
            </div>
          ) : (
            <div className="trial-card-back">
              <p className="trial-card-word">{selectedWord.baseForm}</p>
              <p className="trial-card-category">{s.common.categories[selectedWord.classifications.grammaticalCategory]}</p>
              <p className="trial-card-meaning">{selectedWord.meaning}</p>
            </div>
          )}
        </div>

        {cardFlipped && (
          <div className="trial-actions">
            <button className="trial-btn trial-btn--correct" onClick={handleCorrect}>
              {s.discover.correct}
            </button>
            <button className="trial-btn trial-btn--incorrect" onClick={handleIncorrect}>
              {s.discover.incorrect}
            </button>
          </div>
        )}

        {trialCount > 0 && remaining > 0 && (
          <p className="trial-remaining">{s.discover.moreCorrect(remaining)}</p>
        )}
      </div>
    )
  }

  // ── Lane picker ───────────────────────────────────────────────

  if (selectedWord) {
    return (
      <div className="discover">
        <button className="profile-back" onClick={handleBack}>{s.common.back}</button>

        <div className="trial-detail">
          <div className="trial-detail-top">
            <span className="trial-detail-word">{selectedWord.baseForm}</span>
            <span className="trial-detail-category">
              {s.common.categories[selectedWord.classifications.grammaticalCategory]}
            </span>
          </div>
          <p className="trial-detail-meaning">{selectedWord.meaning}</p>
        </div>

        <p className="trial-lane-prompt">{s.addWord.lanePrompt}</p>
        <div className="trial-lane-grid">
          {PRODUCTIVE_LANES.map(lane => (
            <button
              key={lane.id}
              className="trial-lane-btn"
              style={{ '--lane-color': LANE_DISPLAY[lane.id].color }}
              onClick={() => selectLane(lane.id)}
            >
              <span className="trial-lane-btn-name">{s.common.lanes[lane.id]}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ── Search ────────────────────────────────────────────────────

  return (
    <div className="discover">
      <button className="profile-back" onClick={onBack}>{s.common.back}</button>

      <div className="discover-header">
        <h2 className="discover-title">{s.addWord.title}</h2>
        <p className="discover-subtitle">{s.addWord.subtitle}</p>
      </div>

      <input
        className="discover-search"
        type="text"
        placeholder={s.addWord.searchPlaceholder}
        value={search}
        onChange={e => setSearch(e.target.value)}
        autoFocus
      />

      {q.length > 0 && searchResults.length === 0 && (
        <p className="discover-empty">{s.addWord.noResults(q)}</p>
      )}

      {searchResults.length > 0 && (
        <div className="discover-list">
          {searchResults.map(word => (
            <div key={word.id} className="discover-item" onClick={() => selectWord(word)}>
              <div className="discover-item-body">
                <div className="discover-item-top">
                  <span className="discover-item-word">{word.baseForm}</span>
                  <span className="discover-item-category">
                    {s.common.categories[word.classifications.grammaticalCategory]}
                  </span>
                </div>
                <p className="discover-item-meaning">{word.meaning}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
