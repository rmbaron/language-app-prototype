import { useState, useEffect } from 'react'
import { LANES } from './lanes'
import { GRAMMATICAL_GROUPS, BROAD_THEMES, getThematicTier, getWordTheme } from './classifications'
import { getWordStatuses } from './userStore'

// ── Helpers ───────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildDeck(words, laneIds) {
  const cards = []
  for (const laneId of laneIds) {
    for (const word of words) {
      cards.push({ word, laneId })
    }
  }
  return shuffle(cards)
}

function speak(text) {
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  window.speechSynthesis.speak(utterance)
}

// ── Config screen ─────────────────────────────────────────────

const LIMITS = [null, 10, 20, 50]  // null = all

function FlashcardConfig({ bankWords, onStart, onExit }) {
  const [selectedLanes, setSelectedLanes] = useState(['reading'])
  const [statusFilter, setStatusFilter]   = useState('all')
  const [gramFilter, setGramFilter]       = useState('all')
  const [themeFilter, setThemeFilter]     = useState('all')
  const [limit, setLimit]                 = useState(null)

  const wordStatuses  = getWordStatuses()
  const thematicTier  = getThematicTier(bankWords.length)

  const visibleGramGroups = GRAMMATICAL_GROUPS.filter(g =>
    bankWords.some(w => g.categories.includes(w.classifications.grammaticalCategory))
  )
  const visibleThemes = BROAD_THEMES.filter(t =>
    bankWords.some(w => getWordTheme(w.id).theme === t)
  )

  const statusCounts = { all: bankWords.length }
  ;['active', 'banked', 'completed'].forEach(s => {
    statusCounts[s] = bankWords.filter(w => (wordStatuses[w.id] ?? 'banked') === s).length
  })

  // Apply filters to get the word set that will be used
  let filteredWords = bankWords
  if (statusFilter !== 'all')
    filteredWords = filteredWords.filter(w => (wordStatuses[w.id] ?? 'banked') === statusFilter)
  if (gramFilter !== 'all') {
    const group = GRAMMATICAL_GROUPS.find(g => g.label === gramFilter)
    if (group) filteredWords = filteredWords.filter(w => group.categories.includes(w.classifications.grammaticalCategory))
  }
  if (themeFilter !== 'all')
    filteredWords = filteredWords.filter(w => getWordTheme(w.id).theme === themeFilter)
  if (limit !== null)
    filteredWords = shuffle(filteredWords).slice(0, limit)

  const cardCount = filteredWords.length * selectedLanes.length

  function toggleLane(laneId) {
    setSelectedLanes(prev =>
      prev.includes(laneId)
        ? prev.filter(id => id !== laneId)
        : [...prev, laneId]
    )
  }

  return (
    <div className="fc-config">
      <button className="fc-back-btn" onClick={onExit}>← Word Bank</button>

      <h2 className="fc-title">Flashcard Mode</h2>

      <div className="fc-section">
        <p className="fc-section-label">Lanes</p>
        <div className="fc-lane-options">
          {LANES.map(({ id, label }) => (
            <button
              key={id}
              className={`fc-lane-btn ${selectedLanes.includes(id) ? 'fc-lane-btn--active' : ''}`}
              onClick={() => toggleLane(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="fc-section">
        <p className="fc-section-label">Status</p>
        <div className="fc-filter-options">
          {[['all', `all (${statusCounts.all})`], ['active', `active (${statusCounts.active})`], ['banked', `banked (${statusCounts.banked})`], ['completed', `completed (${statusCounts.completed})`]].map(([val, label]) => (
            <button key={val} className={`fc-filter-btn ${statusFilter === val ? 'fc-filter-btn--active' : ''}`} onClick={() => setStatusFilter(val)}>{label}</button>
          ))}
        </div>
      </div>

      <div className="fc-section">
        <p className="fc-section-label">Category</p>
        <div className="fc-filter-options">
          <button className={`fc-filter-btn ${gramFilter === 'all' ? 'fc-filter-btn--active' : ''}`} onClick={() => setGramFilter('all')}>all</button>
          {visibleGramGroups.map(g => (
            <button key={g.label} className={`fc-filter-btn ${gramFilter === g.label ? 'fc-filter-btn--active' : ''}`} onClick={() => setGramFilter(g.label)}>{g.label.toLowerCase()}</button>
          ))}
        </div>
      </div>

      {thematicTier !== 'none' && visibleThemes.length > 0 && (
        <div className="fc-section">
          <p className="fc-section-label">Theme</p>
          <div className="fc-filter-options">
            <button className={`fc-filter-btn ${themeFilter === 'all' ? 'fc-filter-btn--active' : ''}`} onClick={() => setThemeFilter('all')}>all</button>
            {visibleThemes.map(t => (
              <button key={t} className={`fc-filter-btn ${themeFilter === t ? 'fc-filter-btn--active' : ''}`} onClick={() => setThemeFilter(t)}>{t}</button>
            ))}
          </div>
        </div>
      )}

      <div className="fc-section">
        <p className="fc-section-label">Limit</p>
        <div className="fc-filter-options">
          {LIMITS.map(val => (
            <button key={val ?? 'all'} className={`fc-filter-btn ${limit === val ? 'fc-filter-btn--active' : ''}`} onClick={() => setLimit(val)}>
              {val === null ? 'all' : val}
            </button>
          ))}
        </div>
      </div>

      <p className="fc-card-count">
        {cardCount} card{cardCount !== 1 ? 's' : ''}
      </p>

      <button
        className="fc-start-btn"
        disabled={selectedLanes.length === 0 || bankWords.length === 0}
        onClick={() => onStart(filteredWords, selectedLanes)}
      >
        Start
      </button>
    </div>
  )
}

// ── Card display ──────────────────────────────────────────────

function CardFront({ word, laneId }) {
  if (laneId === 'reading') {
    return (
      <div className="fc-card-face">
        <span className="fc-card-word">{word.baseForm}</span>
        <span className="fc-card-lane-tag">Reading</span>
      </div>
    )
  }
  if (laneId === 'listening') {
    return (
      <div className="fc-card-face">
        <button className="fc-listen-btn" onClick={e => { e.stopPropagation(); speak(word.baseForm) }}>
          ▶ play
        </button>
        <span className="fc-card-lane-tag">Listening</span>
      </div>
    )
  }
  // writing + speaking: prompt is the meaning
  return (
    <div className="fc-card-face">
      <span className="fc-card-meaning">{word.meaning}</span>
      <span className="fc-card-lane-tag">{laneId === 'writing' ? 'Writing' : 'Speaking'}</span>
    </div>
  )
}

function CardBack({ word, laneId }) {
  // receptive lanes reveal meaning; productive lanes reveal the word
  if (laneId === 'reading' || laneId === 'listening') {
    return (
      <div className="fc-card-face fc-card-face--back">
        <span className="fc-card-meaning">{word.meaning}</span>
      </div>
    )
  }
  return (
    <div className="fc-card-face fc-card-face--back">
      <span className="fc-card-word">{word.baseForm}</span>
    </div>
  )
}

// ── Session screen ────────────────────────────────────────────

function FlashcardSession({ initialDeck, onDone }) {
  const [cards, setCards] = useState(initialDeck)
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [reviewed, setReviewed] = useState(0)

  const card = cards[index]

  useEffect(() => {
    setFlipped(false)
    if (card?.laneId === 'listening') speak(card.word.baseForm)
  }, [index, cards])

  function advance(requeue) {
    const next = cards.filter((_, i) => i !== index)
    if (requeue) next.push(card)
    const newReviewed = reviewed + 1
    setReviewed(newReviewed)
    if (next.length === 0) {
      onDone(newReviewed)
      return
    }
    setCards(next)
    setIndex(i => Math.min(i, next.length - 1))
  }

  return (
    <div className="fc-session">
      <div className="fc-session-header">
        <span className="fc-remaining">{cards.length} remaining</span>
      </div>

      <div className="fc-card" onClick={() => !flipped && setFlipped(true)}>
        {flipped
          ? <CardBack word={card.word} laneId={card.laneId} />
          : <CardFront word={card.word} laneId={card.laneId} />
        }
        {!flipped && <span className="fc-card-hint">tap to reveal</span>}
      </div>

      {flipped && (
        <div className="fc-actions">
          <button className="fc-btn fc-btn--again" onClick={() => advance(true)}>Again</button>
          <button className="fc-btn fc-btn--got" onClick={() => advance(false)}>Got it</button>
        </div>
      )}
    </div>
  )
}

// ── Done screen ───────────────────────────────────────────────

function FlashcardDone({ count, onAgain, onExit }) {
  return (
    <div className="fc-done">
      <p className="fc-done-count">{count}</p>
      <p className="fc-done-label">cards reviewed</p>
      <div className="fc-done-actions">
        <button className="fc-btn fc-btn--got" onClick={onAgain}>Go again</button>
        <button className="fc-btn fc-btn--secondary" onClick={onExit}>Back to Word Bank</button>
      </div>
    </div>
  )
}

// ── Main container ────────────────────────────────────────────

export default function FlashcardMode({ bankWords, onExit }) {
  const [phase, setPhase] = useState('config')
  const [deck, setDeck] = useState([])
  const [lastConfig, setLastConfig] = useState(null)
  const [completedCount, setCompletedCount] = useState(0)

  function handleStart(words, laneIds) {
    const d = buildDeck(words, laneIds)
    setDeck(d)
    setLastConfig({ words, laneIds })
    setPhase('session')
  }

  function handleDone(count) {
    setCompletedCount(count)
    setPhase('done')
  }

  function handleAgain() {
    const d = buildDeck(lastConfig.words, lastConfig.laneIds)
    setDeck(d)
    setPhase('session')
  }

  if (phase === 'config') return <FlashcardConfig bankWords={bankWords} onStart={handleStart} onExit={onExit} />
  if (phase === 'session') return <FlashcardSession initialDeck={deck} onDone={handleDone} />
  if (phase === 'done')    return <FlashcardDone count={completedCount} onAgain={handleAgain} onExit={onExit} />
}
