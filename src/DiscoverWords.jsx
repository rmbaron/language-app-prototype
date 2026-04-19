import { useState, useEffect } from 'react'
import { getRecommendations, getAIRecommendedCount } from './wordRecommender'
import { getWordBank, loadState, recordAttempt, THRESHOLD } from './userStore'
import { loadProfile, getActiveLanguage, getCefrLevel, addTopic, getInterfaceLanguage } from './learnerProfile'
import { getStrings } from './uiStrings'
import { getWordSlotInfo } from './cefrLevels'
import { LANES, LANE_DISPLAY } from './lanes'
import allWords from './wordData'
import { speak, getLangCode } from './speak'
import { transcribe, isSupported as isSpeechRecognitionSupported } from './transcribe'
import { evaluateWriting, evaluateSpeaking } from './evaluate'

// DiscoverWords — the word intake UI.
// Self-contained component with no opinion about where it lives.
//
// Three views:
//   List     — browse recommended / search results (default)
//   Detail   — word info + lane picker (after tapping a word)
//   Practice — flashcard in a selected lane (THRESHOLD correct → auto-banks)

const DISCOVER_PREFS_KEY = 'discover_prefs'

function loadDiscoverPrefs() {
  try { return JSON.parse(localStorage.getItem(DISCOVER_PREFS_KEY) ?? '{}') }
  catch { return {} }
}

function saveDiscoverPrefs(patch) {
  try {
    localStorage.setItem(DISCOVER_PREFS_KEY, JSON.stringify({ ...loadDiscoverPrefs(), ...patch }))
  } catch {}
}

export default function DiscoverWords({ onBack, onWordAdded }) {
  const _prefs = loadDiscoverPrefs()
  const [recommendations, setRecommendations] = useState([])
  const [banked, setBanked]   = useState(new Set())   // banked this session → hide from list
  const [loading, setLoading] = useState(true)
  const [aiDecides, setAiDecides] = useState(_prefs.aiDecides ?? false)
  const [manualCount, setManualCount] = useState(_prefs.manualCount ?? 10)
  const [aiCount, setAiCount] = useState(null)
  const [search, setSearch]   = useState('')

  // Steering filters
  const [grammarFilter, setGrammarFilter]   = useState(null)   // grammaticalCategory string
  const [interestFilter, setInterestFilter] = useState(null)   // topic string from profile
  const [addingTopic, setAddingTopic]       = useState(false)
  const [topicDraft, setTopicDraft]         = useState('')
  const [, forceTopicUpdate]                = useState(0)      // triggers re-read of profile topics

  // Intent input (freeform steering — wired to state, AI routing pending)
  const [intentDraft, setIntentDraft] = useState('')

  // Trial state
  const [trialWord, setTrialWord] = useState(null)
  const [trialLane, setTrialLane] = useState(null)
  const [cardFlipped, setCardFlipped] = useState(false)
  const [trialCount, setTrialCount]   = useState(0)   // correct attempts in selected lane
  const [trialDone, setTrialDone]     = useState(false)

  // Lane-specific practice state
  const [writingInput, setWritingInput]     = useState('')
  const [isRecording, setIsRecording]       = useState(false)
  const [practiceResult, setPracticeResult] = useState(null)   // { pass, feedback } | null
  const [practiceError, setPracticeError]   = useState(null)   // string | null
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [hasPlayed, setHasPlayed]           = useState(false)

  const count      = aiDecides ? (aiCount ?? 10) : manualCount
  const isSearching = search.trim().length > 0

  useEffect(() => {
    if (!aiDecides) { setAiCount(null); return }
    const state   = loadState()
    const profile = loadProfile()
    getAIRecommendedCount(profile, state).then(setAiCount)
  }, [aiDecides])

  useEffect(() => {
    if (isSearching) return
    setLoading(true)
    const steeringParams = {
      grammarCategory: grammarFilter ?? undefined,
      interestTopic:   interestFilter ?? undefined,
    }
    getRecommendations(count, false, steeringParams).then(recs => {
      setRecommendations(recs)
      setLoading(false)
    })
  }, [count, isSearching, grammarFilter, interestFilter])

  const searchResults = isSearching ? (() => {
    const bankIds    = new Set(getWordBank())
    const activeLang = getActiveLanguage()
    const q          = search.trim().toLowerCase()
    return allWords.filter(
      w =>
        w.language === activeLang &&
        !bankIds.has(w.id) &&
        !banked.has(w.id) &&
        (w.baseForm.toLowerCase().includes(q) || w.meaning.toLowerCase().includes(q))
    )
  })() : []

  const s = getStrings(getInterfaceLanguage())

  // ── Steering buttons ─────────────────────────────────────────
  //
  // Two types — both narrow the visible pool without changing the underlying
  // recommendation logic. The AI refinement layer will eventually do this
  // more intelligently; for now grammar filters are wired, interest filters are stubbed.

  // Grammar buttons: derived from categories present in the current visible pool.
  const visiblePool = isSearching
    ? searchResults
    : recommendations.filter(w => !banked.has(w.id))

  const grammarButtons = [...new Set(visiblePool.map(w => w.classifications.grammaticalCategory))]
    .filter(cat => s.common.categoriesPlural[cat])
    .map(cat => ({ cat, label: s.common.categoriesPlural[cat] }))

  // Interest buttons: from profile topics. Clicking is wired for state; AI filtering is stubbed.
  const profile      = loadProfile()
  const topicButtons = (profile.expressed.preferences.topics ?? [])
    .map(t => ({ topic: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))

  function toggleGrammar(cat) {
    setGrammarFilter(prev => prev === cat ? null : cat)
    setInterestFilter(null)
  }

  function toggleInterest(topic) {
    setInterestFilter(prev => prev === topic ? null : topic)
    setGrammarFilter(null)
    // TODO: pass interestFilter to getAICandidates once AI layer is wired
  }

  function commitTopic() {
    const t = topicDraft.trim().toLowerCase()
    if (t) {
      addTopic(t)
      setInterestFilter(t)
      setGrammarFilter(null)
    }
    setTopicDraft('')
    setAddingTopic(false)
    forceTopicUpdate(n => n + 1)
  }

  function handleTopicKeyDown(e) {
    if (e.key === 'Enter') commitTopic()
    if (e.key === 'Escape') { setAddingTopic(false); setTopicDraft('') }
  }

  // No client-side filter — steering reshapes the pool at the recommendation engine level

  // ── Dev: quick-bank ──────────────────────────────────────────
  // Simulates THRESHOLD correct attempts in the reading lane.
  // Triggers graduation through the normal recordAttempt path — no architectural bypass.

  function devQuickBank(word, e) {
    e.stopPropagation()
    for (let i = 0; i < THRESHOLD; i++) {
      const result = recordAttempt(word.id, 'reading')
      if (result.graduated) {
        setBanked(prev => new Set([...prev, word.id]))
        if (onWordAdded) onWordAdded()
        break
      }
    }
  }

  // ── Trial navigation ──────────────────────────────────────────

  function openTrial(word) {
    setTrialWord(word)
    setTrialLane(null)
    setCardFlipped(false)
    setTrialDone(false)
    setTrialCount(0)
  }

  function selectLane(laneId) {
    const state    = loadState()
    const existing = state.attempts[trialWord.id]?.[laneId] ?? 0
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
  }

  function handleTrialBack() {
    if (trialLane && !trialDone) {
      setTrialLane(null)
      setCardFlipped(false)
    } else {
      setTrialWord(null)
      setTrialLane(null)
    }
  }

  // ── Practice actions ──────────────────────────────────────────

  function handleCorrect() {
    const result = recordAttempt(trialWord.id, trialLane)
    setTrialCount(result.count)
    setWritingInput('')
    setPracticeResult(null)
    if (result.graduated) {
      setTrialDone(true)
      setBanked(prev => new Set([...prev, trialWord.id]))
      if (onWordAdded) onWordAdded()
    } else {
      setCardFlipped(false)
      setHasPlayed(false)   // listening: allow re-play on next round
    }
  }

  function handleIncorrect() {
    setCardFlipped(false)
    setPracticeResult(null)
    setHasPlayed(false)
  }

  // ── Lane-specific handlers ────────────────────────────────────

  async function handleWritingSubmit() {
    const result = await evaluateWriting(trialWord.baseForm, writingInput)
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
      const result     = await evaluateSpeaking(trialWord.baseForm, transcript)
      setPracticeResult(result)
    } catch (err) {
      setPracticeError(err.message)
    } finally {
      setIsRecording(false)
    }
  }

  async function handlePlay() {
    setIsPlayingAudio(true)
    try {
      await speak(trialWord.baseForm, getActiveLanguage())
    } catch {}
    setIsPlayingAudio(false)
    setHasPlayed(true)
  }

  // ── Slot info helper ──────────────────────────────────────────

  function getSlotInfo(word) {
    const cefrLevel  = getCefrLevel() ?? 'A1'
    const bankIds    = getWordBank()
    const activeLang = getActiveLanguage()
    return getWordSlotInfo(
      word.id,
      word.classifications.grammaticalCategory,
      cefrLevel,
      bankIds,
      allWords,
      activeLang,
    )
  }

  // ── Trial view ────────────────────────────────────────────────

  if (trialWord) {
    const slotInfo = getSlotInfo(trialWord)

    // Success screen
    if (trialDone) {
      return (
        <div className="discover">
          <div className="trial-success">
            <div className="trial-success-check">✓</div>
            <p className="trial-success-word">{trialWord.baseForm}</p>
            <p className="trial-success-msg">{s.discover.success}</p>
            <button className="trial-back-btn" onClick={() => setTrialWord(null)}>
              {s.discover.backToRecs}
            </button>
          </div>
        </div>
      )
    }

    // Lane-specific practice
    if (trialLane) {
      const laneLabel = s.common.lanes[trialLane]
      const laneColor = LANE_DISPLAY[trialLane].color
      const remaining = THRESHOLD - trialCount

      const laneHeader = (
        <>
          <button className="profile-back" onClick={handleTrialBack}>{s.common.back}</button>
          <div className="trial-lane-header">
            <span className="trial-lane-badge" style={{ background: laneColor }}>{laneLabel}</span>
            <span className="trial-lane-progress">{trialCount} / {THRESHOLD}</span>
          </div>
        </>
      )

      // ── Writing ───────────────────────────────────────────────
      if (trialLane === 'writing') {
        return (
          <div className="discover">
            {laneHeader}
            <p className="trial-practice-prompt">{trialWord.meaning}</p>
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

      // ── Speaking ──────────────────────────────────────────────
      if (trialLane === 'speaking') {
        return (
          <div className="discover">
            {laneHeader}
            <p className="trial-practice-prompt">{trialWord.meaning}</p>
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

      // ── Listening ─────────────────────────────────────────────
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

      // ── Reading (flashcard) ───────────────────────────────────
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
                <p className="trial-card-word">{trialWord.baseForm}</p>
                <p className="trial-card-hint">{s.discover.tapToReveal}</p>
              </div>
            ) : (
              <div className="trial-card-back">
                <p className="trial-card-word">{trialWord.baseForm}</p>
                <p className="trial-card-category">{trialWord.classifications.grammaticalCategory}</p>
                <p className="trial-card-meaning">{trialWord.meaning}</p>
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

    // Word detail + lane picker
    return (
      <div className="discover">
        <button className="profile-back" onClick={handleTrialBack}>← Back</button>

        <div className="trial-detail">
          <div className="trial-detail-top">
            <span className="trial-detail-word">{trialWord.baseForm}</span>
            <span className="trial-detail-category">{trialWord.classifications.grammaticalCategory}</span>
          </div>
          {slotInfo && (
            <div className={`discover-slot-reason discover-slot-reason--${slotInfo.status}`}>
              {s.discover.slotReason[slotInfo.status](slotInfo.slotLabel)}
            </div>
          )}
          <p className="trial-detail-meaning">{trialWord.meaning}</p>
        </div>

        <p className="trial-lane-prompt">{s.discover.chooseLane}</p>
        <div className="trial-lane-grid">
          {LANES.map(lane => {
            const laneProgress = loadState().attempts[trialWord.id]?.[lane.id] ?? 0
            return (
              <button
                key={lane.id}
                className="trial-lane-btn"
                style={{ '--lane-color': LANE_DISPLAY[lane.id].color }}
                onClick={() => selectLane(lane.id)}
              >
                <span className="trial-lane-btn-name">{lane.label}</span>
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

  // ── List view ─────────────────────────────────────────────────

  function renderWord(word) {
    const slotInfo = getSlotInfo(word)
    return (
      <div key={word.id} className="discover-item" onClick={() => openTrial(word)}>
        <div className="discover-item-body">
          <div className="discover-item-top">
            <span className="discover-item-word">{word.baseForm}</span>
            <span className="discover-item-category">{word.classifications.grammaticalCategory}</span>
            <button className="dev-quick-bank-btn" onClick={e => devQuickBank(word, e)} title="[DEV] Bank this word">+</button>
          </div>
          {slotInfo && (
            <div className={`discover-slot-reason discover-slot-reason--${slotInfo.status}`}>
              {s.discover.slotReason[slotInfo.status](slotInfo.slotLabel)}
            </div>
          )}
          <p className="discover-item-meaning">{word.meaning}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="discover">
      <button className="profile-back" onClick={onBack}>{s.common.back}</button>

      <div className="discover-header">
        <h2 className="discover-title">{s.discover.title}</h2>
        <p className="discover-subtitle">{s.discover.subtitle}</p>
      </div>

      <input
        className="discover-search"
        type="text"
        placeholder={s.discover.searchPlaceholder}
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {!isSearching && (
        <div className="discover-controls">
          <label className="discover-ai-toggle">
            <input
              type="checkbox"
              checked={aiDecides}
              onChange={e => { setAiDecides(e.target.checked); saveDiscoverPrefs({ aiDecides: e.target.checked }) }}
            />
            <span>{s.discover.aiToggle}</span>
            {aiDecides && aiCount !== null && (
              <span className="discover-ai-count">→ {aiCount}</span>
            )}
          </label>
          {!aiDecides && (
            <div className="discover-slider-row">
              <input
                type="range"
                min={1}
                max={20}
                value={manualCount}
                onChange={e => { const v = Number(e.target.value); setManualCount(v); saveDiscoverPrefs({ manualCount: v }) }}
                className="discover-slider"
              />
              <span className="discover-slider-value">{s.discover.words(manualCount)}</span>
            </div>
          )}
        </div>
      )}

      {/* Steering buttons — only shown in list view, not while searching */}
      {!isSearching && !loading && visiblePool.length > 0 && (
        <div className="discover-steering">
          {grammarButtons.length > 1 && (
            <div className="discover-steering-row">
              {grammarButtons.map(({ cat, label }) => (
                <button
                  key={cat}
                  className={`discover-steer-btn ${grammarFilter === cat ? 'discover-steer-btn--active' : ''}`}
                  onClick={() => toggleGrammar(cat)}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          <div className="discover-steering-row">
            {topicButtons.map(({ topic, label }) => (
              <button
                key={topic}
                className={`discover-steer-btn discover-steer-btn--interest ${interestFilter === topic ? 'discover-steer-btn--active' : ''}`}
                onClick={() => toggleInterest(topic)}
                title="Interest filtering — coming when AI is wired"
              >
                {label}
              </button>
            ))}
            {addingTopic ? (
              <input
                className="discover-topic-input"
                autoFocus
                placeholder={s.discover.topicPlaceholder}
                value={topicDraft}
                onChange={e => setTopicDraft(e.target.value)}
                onKeyDown={handleTopicKeyDown}
                onBlur={commitTopic}
              />
            ) : (
              <button
                className="discover-steer-btn discover-steer-btn--add"
                onClick={() => setAddingTopic(true)}
                title="Add a personal interest to steer recommendations"
              >
                {s.discover.addTopic}
              </button>
            )}
          </div>

          <div className="discover-intent-row">
            <input
              className="discover-intent-input"
              type="text"
              placeholder={s.discover.intentPlaceholder}
              value={intentDraft}
              onChange={e => setIntentDraft(e.target.value)}
              disabled
            />
          </div>
        </div>
      )}

      {isSearching ? (
        searchResults.length === 0
          ? <p className="discover-empty">{s.discover.empty.search(search)}</p>
          : <div className="discover-list">{searchResults.map(renderWord)}</div>
      ) : loading ? (
        <p className="discover-empty">{s.discover.loading}</p>
      ) : recommendations.length === 0 ? (
        <p className="discover-empty">{s.discover.empty.noRecs}</p>
      ) : visiblePool.length === 0 ? (
        <p className="discover-empty">{s.discover.empty.noSteering}</p>
      ) : (
        <div className="discover-list">
          {visiblePool.map(renderWord)}
        </div>
      )}
    </div>
  )
}
