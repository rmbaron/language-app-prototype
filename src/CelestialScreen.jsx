import { useState, useEffect, useRef } from 'react'
import { LANE_DISPLAY } from './lanes'
import { recordAttempt } from './userStore'
import { getPhase1Sequence } from './phase1Sequence'
import { getActiveLanguage, getInterfaceLanguage } from './learnerProfile'
import { getStrings } from './uiStrings'
import { speak, getLangCode } from './speak'
import { transcribe, isSupported as isSpeechRecognitionSupported } from './transcribe'
import allWords from './wordData'
import LaneStamp from './LaneStamp'
import FunctionUnlock from './FunctionUnlock'
import MomentBanner from './MomentBanner'
import GrammarSlot from './GrammarSlot'
import celestialDesign from './celestialDesign'
import { applyDesignToDOM } from './applyDesign'

function generateStars(count) {
  return Array.from({ length: count }, (_, i) => ({
    id:      i,
    x:       Math.random() * 100,
    y:       Math.random() * 100,
    size:    Math.random() * 1.5 + 0.5,
    opacity: Math.random() * 0.6 + 0.2,
  }))
}
const STARS = generateStars(180)

// Phase sequence for a single word:
//   arriving    — word animates in
//   reading_ack — reading auto-recorded; sets stamp + unlock, brief pause
//   writing     — user types the word
//   listening   — user taps the word to hear it
//   speaking    — mic materializes; user speaks
//   sentence    — assembled sentence shown in context; tap to continue
//   transition  — brief pause between words (placeholder for arrival elements)
//   done        — final word complete (last word only)
const PHASES = ['arriving', 'reading_ack', 'writing', 'listening', 'speaking', 'transition', 'done']

const LANE_DOTS = ['reading', 'writing', 'listening', 'speaking']

// Font sizes for the ghost row — scales down as word count grows
function ghostRowFontSize(totalWords, isCurrent) {
  const bases = [64, 52, 42, 34, 28]
  const base  = bases[Math.min(totalWords - 1, bases.length - 1)]
  return isCurrent ? Math.round(base * 1.18) : base
}

export default function CelestialScreen({ onExit, framed = false, jumpTo = null, onJumpConsumed, sequence: sequenceProp = null, ghostSettings = null }) {
  const s          = getStrings(getInterfaceLanguage())
  const activeLang = getActiveLanguage()
  const sequence   = sequenceProp ?? getPhase1Sequence(activeLang)

  const [wordIndex,    setWordIndex]    = useState(0)
  const [wordArrived,  setWordArrived]  = useState(false)
  const [phaseIndex,   setPhaseIndex]   = useState(0)
  const [writingInput, setWritingInput] = useState('')
  const [writingMatch, setWritingMatch] = useState(false)
  const [isPlaying,    setIsPlaying]    = useState(false)
  const [isRecording,  setIsRecording]  = useState(false)
  const [speakError,   setSpeakError]   = useState(null)

  // ── Independent display systems ─────────────────────────────
  const [stampLane,    setStampLane]    = useState(null)
  const [unlockKey,    setUnlockKey]    = useState(null)
  const [bannerPayload, setBannerPayload] = useState({ title: s.celestial.firstWord })

  const writingRef        = useRef(null)
  const skipArrivalRef    = useRef(false)  // set true when jumping to skip arrival timer
  const currentPhase      = PHASES[phaseIndex]
  const timing            = celestialDesign.timing

  const entry  = sequence[wordIndex]
  const word   = allWords.find(w => w.id === entry?.wordId)

  // All words revealed so far (used for grammar slots + ghost row)
  const revealedWords = sequence
    .slice(0, wordIndex + 1)
    .map(e => allWords.find(w => w.id === e.wordId))
    .filter(Boolean)

  function advancePhase() {
    setPhaseIndex(i => Math.min(i + 1, PHASES.length - 1))
  }

  function advanceToNextWord() {
    setWordArrived(false)
    setWritingInput('')
    setWritingMatch(false)
    setIsPlaying(false)
    setIsRecording(false)
    setSpeakError(null)
    setStampLane(null)
    setUnlockKey(null)
    setBannerPayload(null)
    setPhaseIndex(0)
    setWordIndex(i => i + 1)
  }

  // Apply saved design to DOM on mount
  useEffect(() => { applyDesignToDOM(celestialDesign) }, [])

  // ── Jump-to (editor stage navigator) ────────────────────────
  useEffect(() => {
    if (!jumpTo) return
    const targetPhaseIndex = Math.max(0, PHASES.indexOf(jumpTo.phase))
    const arriving = jumpTo.phase === 'arriving'
    // If jumping to a non-arriving phase, skip the arrival animation
    skipArrivalRef.current = !arriving
    setWordArrived(!arriving)
    setWritingInput('')
    setWritingMatch(false)
    setIsPlaying(false)
    setIsRecording(false)
    setSpeakError(null)
    setStampLane(null)
    setUnlockKey(null)
    setBannerPayload(jumpTo.wordIndex === 0 ? { title: s.celestial.firstWord } : null)
    setWordIndex(jumpTo.wordIndex)
    setPhaseIndex(targetPhaseIndex)
    onJumpConsumed?.()
  }, [jumpTo])

  // ── Word arrival animation timer — resets per word ───────────
  useEffect(() => {
    if (skipArrivalRef.current) {
      skipArrivalRef.current = false
      return
    }
    setWordArrived(false)
    const t = setTimeout(() => setWordArrived(true), timing.wordArrivesMs)
    return () => clearTimeout(t)
  }, [wordIndex])

  // ── Arriving: word animates in ───────────────────────────────
  useEffect(() => {
    if (!wordArrived || currentPhase !== 'arriving') return
    const t1 = setTimeout(() => word && recordAttempt(word.id, 'reading'), 800)
    const t2 = setTimeout(() => advancePhase(), timing.arrivingDurationMs)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [wordArrived, currentPhase])

  // ── Reading ack: set stamp + unlock, then surface writing ────
  useEffect(() => {
    if (currentPhase !== 'reading_ack') return
    setStampLane('reading')
    if (entry?.functionUnlocked) setUnlockKey(entry.functionUnlocked)
    const t = setTimeout(() => advancePhase(), timing.readingAckDurationMs)
    return () => clearTimeout(t)
  }, [currentPhase, wordIndex])

  // ── Writing: focus input ─────────────────────────────────────
  useEffect(() => {
    if (currentPhase !== 'writing') return
    const t = setTimeout(() => writingRef.current?.focus(), 350)
    return () => clearTimeout(t)
  }, [currentPhase, wordIndex])

  // ── Sentence: tap to advance ─────────────────────────────────
  // (no auto-advance — the learner controls when to move on)

  // ── Transition: brief pause, then advance to next word ───────
  useEffect(() => {
    if (currentPhase !== 'transition') return
    const t = setTimeout(() => {
      if (wordIndex < sequence.length - 1) {
        advanceToNextWord()
      } else {
        advancePhase() // → 'done'
      }
    }, timing.transitionDurationMs)
    return () => clearTimeout(t)
  }, [currentPhase, wordIndex])

  // ── Writing: detect match ────────────────────────────────────
  function handleWritingChange(e) {
    const val = e.target.value
    setWritingInput(val)
    setWritingMatch(word && val.trim().toLowerCase() === word.baseForm.toLowerCase())
  }

  // ── Writing: Enter submits ───────────────────────────────────
  function handleWritingKeyDown(e) {
    if (e.key !== 'Enter') return
    if (word && writingInput.trim().toLowerCase() === word.baseForm.toLowerCase()) {
      recordAttempt(word.id, 'writing')
      setStampLane('writing')
      setWritingMatch(true)
      setTimeout(() => {
        setWritingInput('')
        setWritingMatch(false)
        advancePhase()
      }, 400)
    }
  }

  // ── Listening: tap the word ──────────────────────────────────
  async function handleWordTap() {
    if (currentPhase !== 'listening' || isPlaying) return
    setIsPlaying(true)
    try {
      await speak(word.baseForm, activeLang)
      recordAttempt(word.id, 'listening')
      setStampLane('listening')
      setTimeout(() => advancePhase(), timing.listeningAdvanceMs)
    } catch {}
    setIsPlaying(false)
  }

  // ── Speaking: mic tap ────────────────────────────────────────
  async function handleSpeak() {
    if (!isSpeechRecognitionSupported()) {
      setSpeakError(s.practice.speaking.notSupported)
      return
    }
    setSpeakError(null)
    setIsRecording(true)
    try {
      const transcript = await transcribe({ lang: getLangCode(activeLang) })
      if (transcript.toLowerCase().includes(word.baseForm.toLowerCase())) {
        recordAttempt(word.id, 'speaking')
        setStampLane('speaking')
        setTimeout(() => advancePhase(), 400)
      } else {
        setSpeakError(s.practice.speaking.micLabel)
      }
    } catch (err) {
      setSpeakError(err.message)
    } finally {
      setIsRecording(false)
    }
  }

  if (!word) return null

  function laneStatus(lane) {
    const lanePhase = lane === 'reading' ? 'reading_ack' : lane
    const laneIndex = PHASES.indexOf(lanePhase)
    if (phaseIndex > laneIndex)  return 'done'
    if (phaseIndex === laneIndex) return 'active'
    return 'pending'
  }

  return (
    <div className={framed ? 'celestial celestial--framed' : 'celestial'}>

      {/* Stars */}
      <div className="celestial-starfield" aria-hidden="true">
        {STARS.map(star => (
          <div
            key={star.id}
            className="celestial-star"
            style={{
              left:    `${star.x}%`,
              top:     `${star.y}%`,
              width:   `${star.size}px`,
              height:  `${star.size}px`,
              opacity: star.opacity,
            }}
          />
        ))}
      </div>

      {/* Dev exit */}
      <button className="celestial-exit" onClick={onExit}>exit</button>

      {/* Moment banner — contextual, persistent, dismissible */}
      {bannerPayload && (
        <MomentBanner
          title={bannerPayload.title}
          subtitle={bannerPayload.subtitle}
          onDismiss={() => setBannerPayload(null)}
        />
      )}

      {/* Grammar slots — positioned absolutely in celestial space */}
      {(() => {
        const slots = entry?.grammarSlots ?? []
        if (!slots.length) return null
        return slots.map(slot => {
          const available = revealedWords.filter(w => w.classifications?.grammaticalCategory === slot.category)
          return (
            <GrammarSlot
              key={slot.id}
              category={slot.category}
              words={available}
              x={slot.x}
              y={slot.y}
              scale={slot.scale ?? 1}
            />
          )
        })
      })()}

      <div className="celestial-content">

        {/* Word — centered. Ghost mode shows all revealed words in a row. */}
        {currentPhase !== 'transition' && (
          <div className="ced-word-positioner">
            {ghostSettings?.enabled ? (
              // Ghost row: all revealed words at once so you can see accumulation
              <div className={`celestial-ghost-row${ghostSettings.wrap ? ' celestial-ghost-row--wrap' : ''}`}>
                {revealedWords.map((rw, ri) => {
                  const isCurrent = ri === wordIndex
                  const fs = ghostRowFontSize(revealedWords.length, isCurrent)
                  return (
                    <div
                      key={rw.id}
                      className={[
                        'celestial-ghost-item',
                        isCurrent ? 'celestial-ghost-item--current' : 'celestial-ghost-item--past',
                        isCurrent && currentPhase === 'listening' ? 'celestial-word-wrap--tappable' : '',
                        isCurrent && isPlaying   ? 'celestial-word-wrap--playing'  : '',
                        isCurrent && writingMatch ? 'celestial-word-wrap--matched'  : '',
                      ].filter(Boolean).join(' ')}
                      style={{ '--ghost-opacity': isCurrent ? 1 : ghostSettings.opacity }}
                      onClick={isCurrent ? handleWordTap : undefined}
                    >
                      <p className="celestial-ghost-word" style={{ fontSize: `${fs}px` }}>
                        {rw.baseForm}
                      </p>
                      {isCurrent && currentPhase === 'arriving' && wordArrived && (
                        <p className="celestial-meaning">{rw.meaning}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              // Normal: single word centered
              <div
                className={[
                  'celestial-word-wrap',
                  wordArrived                  ? 'celestial-word-wrap--arrived'  : '',
                  currentPhase === 'listening' ? 'celestial-word-wrap--tappable' : '',
                  isPlaying                    ? 'celestial-word-wrap--playing'  : '',
                  writingMatch                 ? 'celestial-word-wrap--matched'  : '',
                ].filter(Boolean).join(' ')}
                onClick={handleWordTap}
              >
                <p className="celestial-word">{word.baseForm}</p>
                {currentPhase === 'arriving' && wordArrived && (
                  <p className="celestial-meaning">{word.meaning}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Lane progress dots — appear from writing onward, hide in transition/done */}
        {phaseIndex >= 2 && currentPhase !== 'transition' && currentPhase !== 'done' && (
          <div className="celestial-dots">
            {LANE_DOTS.map(lane => (
              <div
                key={lane}
                className={`celestial-dot celestial-dot--${laneStatus(lane)}`}
                style={{ '--lane-color': LANE_DISPLAY[lane].color }}
              />
            ))}
          </div>
        )}

        {/* Writing */}
        {currentPhase === 'writing' && (
          <input
            ref={writingRef}
            className={`celestial-writing-input${writingMatch ? ' celestial-writing-input--match' : ''}`}
            value={writingInput}
            onChange={handleWritingChange}
            onKeyDown={handleWritingKeyDown}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
        )}

        {/* Listening hint */}
        {currentPhase === 'listening' && (
          <p className="celestial-phase-hint">
            {isPlaying ? '·  ·  ·' : s.celestial.tapToHear}
          </p>
        )}

        {/* Speaking */}
        {currentPhase === 'speaking' && (
          <div className="ced-mic-positioner"><div className="celestial-mic-wrap">
            <button
              className={`celestial-mic${isRecording ? ' celestial-mic--active' : ''}`}
              onClick={handleSpeak}
              disabled={isRecording}
              aria-label={s.practice.speaking.micLabel}
            />
            <button
              className="celestial-dev-bypass"
              onClick={() => {
                recordAttempt(word.id, 'speaking')
                setStampLane('speaking')
                setTimeout(() => advancePhase(), 400)
              }}
              disabled={isRecording}
            >
              {s.celestial.devSpeakDone}
            </button>
            {speakError && (
              <p className="celestial-speak-error">{speakError}</p>
            )}
          </div></div>
        )}

        {/* Transition — placeholder for inter-word arrival elements */}
        {currentPhase === 'transition' && (
          <p className="celestial-phase-hint">·  ·  ·</p>
        )}

        {/* Done */}
        {currentPhase === 'done' && (
          <p className="celestial-done-word">{word.baseForm}</p>
        )}

        {/* Lane stamp — set independently by sequencer, persists */}
        {stampLane && (
          <div className="ced-lane-stamp-positioner">
            <LaneStamp lane={stampLane} />
          </div>
        )}

        {/* Function unlock — set independently by sequencer, persists */}
        {unlockKey && (
          <div className="ced-fn-unlock-positioner">
            <FunctionUnlock functionKey={unlockKey} />
          </div>
        )}

      </div>
    </div>
  )
}
