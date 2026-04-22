import { useState } from 'react'
import { recordAttempt, loadState, THRESHOLD } from './userStore'
import { loadProfile as _loadProfile, getActiveLanguage, getCefrLevel, getInterfaceLanguage } from './learnerProfile'
import { getStrings } from './uiStrings'
import { getWordSlotInfo } from './cefrLevels'
import { LANES, LANE_DISPLAY } from './lanes'
import { getAllWords } from './wordRegistry'
import { speak, getLangCode } from './speak'
import { transcribe, isSupported as isSpeechRecognitionSupported } from './transcribe'
import { evaluateWriting, evaluateSpeaking } from './evaluate'
import { hasContent } from './contentStore'
import { selectContent, selectDistractors } from './wbSelector'

// WordTrial — handles the detail view, lane picker, and all practice screens
// for a single word. Extracted from DiscoverWords.
//
// Props:
//   word      — word object from wordRegistry
//   onBack    — called when user navigates back to the list
//   onBanked  — called with wordId when word graduates

export default function WordTrial({ word, onBack, onBanked }) {
  const [trialLane, setTrialLane]         = useState(null)
  const [cardFlipped, setCardFlipped]     = useState(false)
  const [trialCount, setTrialCount]       = useState(0)
  const [trialDone, setTrialDone]         = useState(false)
  const [writingInput, setWritingInput]   = useState('')
  const [isRecording, setIsRecording]     = useState(false)
  const [practiceResult, setPracticeResult] = useState(null)
  const [practiceError, setPracticeError] = useState(null)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [readingSelected, setReadingSelected] = useState(null)
  const [hasPlayed, setHasPlayed]         = useState(false)

  const s        = getStrings(getInterfaceLanguage())
  const allWords = getAllWords(getActiveLanguage())

  function getSlotInfo() {
    const cefrLevel  = getCefrLevel() ?? 'A1'
    const bankIds    = []
    return getWordSlotInfo(
      word.id,
      word.classifications.grammaticalCategory,
      cefrLevel,
      bankIds,
      allWords,
      getActiveLanguage(),
    )
  }

  function selectLane(laneId) {
    const existing = loadState().attempts[word.id]?.[laneId] ?? 0
    setTrialLane(laneId)
    setTrialCount(existing)
    setCardFlipped(false)
    setTrialDone(false)
    setWritingInput('')
    setIsRecording(false)
    setPracticeResult(null)
    setPracticeError(null)
    setIsPlayingAudio(false)
    setHasPlayed(false)
    setReadingSelected(null)
  }

  function handleBack() {
    if (trialLane && !trialDone) {
      setTrialLane(null)
      setCardFlipped(false)
    } else {
      onBack()
    }
  }

  function handleCorrect() {
    const result = recordAttempt(word.id, trialLane)
    setTrialCount(result.count)
    setWritingInput('')
    setPracticeResult(null)
    if (result.graduated) {
      setTrialDone(true)
      onBanked(word.id)
    } else {
      setCardFlipped(false)
      setHasPlayed(false)
    }
  }

  function handleIncorrect() {
    setCardFlipped(false)
    setPracticeResult(null)
    setHasPlayed(false)
  }

  async function handleWritingSubmit() {
    const result = await evaluateWriting(word.baseForm, writingInput)
    setPracticeResult(result)
  }

  async function handleSpeakingAttempt() {
    if (!isSpeechRecognitionSupported()) {
      setPracticeError(s.practice.speaking.notSupported)
      return
    }
    setIsRecording(true)
    setPracticeError(null)
    setPracticeResult(null)
    try {
      const transcript = await transcribe({ lang: getLangCode(getActiveLanguage()) })
      const result     = await evaluateSpeaking(word.baseForm, transcript)
      setPracticeResult(result)
    } catch (err) {
      setPracticeError(err.message)
    } finally {
      setIsRecording(false)
    }
  }

  async function handlePlay() {
    setIsPlayingAudio(true)
    try { await speak(word.baseForm, getActiveLanguage()) } catch {}
    setIsPlayingAudio(false)
    setHasPlayed(true)
  }

  // ── Success screen ────────────────────────────────────────────

  if (trialDone) {
    return (
      <div className="discover">
        <div className="trial-success">
          <div className="trial-success-check">✓</div>
          <p className="trial-success-word">{word.baseForm}</p>
          <p className="trial-success-msg">{s.discover.success}</p>
          <button className="trial-back-btn" onClick={onBack}>
            {s.discover.backToRecs}
          </button>
        </div>
      </div>
    )
  }

  // ── Lane-specific practice ────────────────────────────────────

  if (trialLane) {
    const laneLabel = s.common.lanes[trialLane]
    const laneColor = LANE_DISPLAY[trialLane].color
    const remaining = THRESHOLD - trialCount

    const laneHeader = (
      <>
        <button className="profile-back" onClick={handleBack}>{s.common.back}</button>
        <div className="trial-lane-header">
          <span className="trial-lane-badge" style={{ background: laneColor }}>{laneLabel}</span>
          <span className="trial-lane-progress">{trialCount} / {THRESHOLD}</span>
        </div>
      </>
    )

    if (trialLane === 'writing') {
      return (
        <div className="discover">
          {laneHeader}
          <p className="trial-practice-prompt">{word.meaning}</p>
          <p className="trial-practice-instruction">{s.practice.writing.instruction}</p>
          <textarea
            className="trial-writing-input"
            value={writingInput}
            onChange={e => { setWritingInput(e.target.value); setPracticeResult(null) }}
            placeholder={s.practice.writing.placeholder}
            rows={4}
          />
          {practiceResult && (
            <p className={`trial-feedback trial-feedback--${practiceResult.pass ? 'pass' : 'fail'}`}>
              {practiceResult.feedback}
            </p>
          )}
          <div className="trial-actions">
            {practiceResult?.pass ? (
              <button className="trial-btn trial-btn--correct" onClick={handleCorrect}>
                {s.discover.correct}
              </button>
            ) : (
              <button
                className="trial-btn trial-btn--submit"
                onClick={handleWritingSubmit}
                disabled={!writingInput.trim()}
              >
                {s.practice.writing.submit}
              </button>
            )}
          </div>
          {trialCount > 0 && remaining > 0 && (
            <p className="trial-remaining">{s.discover.moreCorrect(remaining)}</p>
          )}
        </div>
      )
    }

    if (trialLane === 'speaking') {
      return (
        <div className="discover">
          {laneHeader}
          <p className="trial-practice-prompt">{word.meaning}</p>
          <p className="trial-practice-instruction">{s.practice.speaking.instruction}</p>
          {practiceError && (
            <p className="trial-feedback trial-feedback--fail">{practiceError}</p>
          )}
          {practiceResult && (
            <p className={`trial-feedback trial-feedback--${practiceResult.pass ? 'pass' : 'fail'}`}>
              {practiceResult.feedback}
            </p>
          )}
          {practiceResult?.pass ? (
            <div className="trial-actions">
              <button className="trial-btn trial-btn--correct" onClick={handleCorrect}>
                {s.discover.correct}
              </button>
            </div>
          ) : (
            <button
              className={`trial-mic-btn${isRecording ? ' trial-mic-btn--active' : ''}`}
              onClick={handleSpeakingAttempt}
              disabled={isRecording}
            >
              {isRecording ? s.practice.speaking.listening : s.practice.speaking.micLabel}
            </button>
          )}
          {trialCount > 0 && remaining > 0 && (
            <p className="trial-remaining">{s.discover.moreCorrect(remaining)}</p>
          )}
        </div>
      )
    }

    if (trialLane === 'listening') {
      return (
        <div className="discover">
          {laneHeader}
          <p className="trial-practice-instruction">{s.practice.listening.instruction}</p>
          <button
            className={`trial-play-btn${isPlayingAudio ? ' trial-play-btn--active' : ''}`}
            onClick={handlePlay}
            disabled={isPlayingAudio}
          >
            {isPlayingAudio ? s.practice.listening.playing : s.practice.listening.play}
          </button>
          {hasPlayed && (
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

    // Reading
    const readingItem = hasContent(word.id, 'reading')
      ? selectContent(word.id, 'reading')
      : null

    if (readingItem) {
      const formStrings = [word.baseForm, ...(word.forms ?? []).map(f => f.form)]
      const blanked = formStrings.reduce((text, form) => {
        return text.replace(new RegExp(`\\b${form}\\b`, 'gi'), '___')
      }, readingItem.text)
      const distractors = selectDistractors(word, 'reading')
      const choices = [...distractors.map(d => ({ baseForm: d.baseForm, correct: false })),
                       { baseForm: word.baseForm, correct: true }]
        .sort(() => Math.random() - 0.5)

      function handleReadingChoice(choice) {
        if (readingSelected) return
        setReadingSelected(choice)
        if (choice.correct) handleCorrect()
      }

      return (
        <div className="discover">
          {laneHeader}
          <p className="reading-sentence">{blanked}</p>
          {readingSelected && !readingSelected.correct && (
            <p className="reading-wrong">{s.practice.reading.wrong}</p>
          )}
          <div className="reading-choices">
            {choices.map((choice, i) => (
              <button
                key={i}
                className={[
                  'reading-choice-btn',
                  readingSelected === choice && !choice.correct ? 'reading-choice-btn--wrong' : '',
                ].join(' ').trim()}
                onClick={() => handleReadingChoice(choice)}
              >
                {choice.baseForm}
              </button>
            ))}
          </div>
          {readingSelected && !readingSelected.correct && (
            <button className="practice-confirm-btn" onClick={() => setReadingSelected(null)}>
              {s.practice.reading.tryAgain}
            </button>
          )}
          {trialCount > 0 && remaining > 0 && (
            <p className="trial-remaining">{s.discover.moreCorrect(remaining)}</p>
          )}
        </div>
      )
    }

    // Default flashcard
    return (
      <div className="discover">
        {laneHeader}
        <div
          className="trial-card"
          onClick={() => !cardFlipped && setCardFlipped(true)}
          style={{ cursor: cardFlipped ? 'default' : 'pointer' }}
        >
          {!cardFlipped ? (
            <div className="trial-card-front">
              <p className="trial-card-word">{word.baseForm}</p>
              <p className="trial-card-hint">{s.discover.tapToReveal}</p>
            </div>
          ) : (
            <div className="trial-card-back">
              <p className="trial-card-word">{word.baseForm}</p>
              <p className="trial-card-category">{s.common.categories[word.classifications.grammaticalCategory]}</p>
              <p className="trial-card-meaning">{word.meaning}</p>
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

  // ── Detail view + lane picker ─────────────────────────────────

  const slotInfo = getSlotInfo()

  return (
    <div className="discover">
      <button className="profile-back" onClick={handleBack}>{s.common.back}</button>

      <div className="trial-detail">
        <div className="trial-detail-top">
          <span className="trial-detail-word">{word.baseForm}</span>
          <span className="trial-detail-category">{s.common.categories[word.classifications.grammaticalCategory]}</span>
        </div>
        {slotInfo && (
          <div className={`discover-slot-reason discover-slot-reason--${slotInfo.status}`}>
            {s.discover.slotReason[slotInfo.status](slotInfo.slotLabel)}
          </div>
        )}
        <p className="trial-detail-meaning">{word.meaning}</p>
      </div>

      <p className="trial-lane-prompt">{s.discover.chooseLane}</p>
      <div className="trial-lane-grid">
        {LANES.map(lane => {
          const laneProgress = loadState().attempts[word.id]?.[lane.id] ?? 0
          return (
            <button
              key={lane.id}
              className="trial-lane-btn"
              style={{ '--lane-color': LANE_DISPLAY[lane.id].color }}
              onClick={() => selectLane(lane.id)}
            >
              <span className="trial-lane-btn-name">{s.common.lanes[lane.id]}</span>
              {laneProgress > 0 && (
                <span className="trial-lane-btn-prev">{laneProgress} / {THRESHOLD}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
