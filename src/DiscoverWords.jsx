import { useState, useEffect } from 'react'
import { getRecommendations, getAIRecommendedCount } from './wordRecommender'
import { getWordBank, recordAttempt, THRESHOLD } from './userStore'
import { loadProfile, getActiveLanguage, getCefrLevel, addTopic, getInterfaceLanguage } from './learnerProfile'
import { getStrings } from './uiStrings'
import { getWordSlotInfo } from './cefrLevels'
import { getAllWords } from './wordRegistry'
import WordTrial from './WordTrial'

// DiscoverWords — word intake shell.
//
// Two views:
//   List   — browse recommended / search results (default)
//   Trial  — delegates to <WordTrial> for detail + lane picker + practice

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
  const [banked, setBanked]   = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [aiDecides, setAiDecides] = useState(_prefs.aiDecides ?? false)
  const [manualCount, setManualCount] = useState(_prefs.manualCount ?? 10)
  const [aiCount, setAiCount] = useState(null)
  const [search, setSearch]   = useState('')

  // Steering filters
  const [grammarFilter, setGrammarFilter]   = useState(null)
  const [interestFilter, setInterestFilter] = useState(null)
  const [addingTopic, setAddingTopic]       = useState(false)
  const [topicDraft, setTopicDraft]         = useState('')
  const [, forceTopicUpdate]                = useState(0)

  // Intent input (freeform steering — AI routing pending)
  const [intentDraft, setIntentDraft] = useState('')

  // Trial navigation
  const [trialWord, setTrialWord] = useState(null)

  const count      = aiDecides ? (aiCount ?? 10) : manualCount
  const isSearching = search.trim().length > 0

  useEffect(() => {
    if (!aiDecides) { setAiCount(null); return }
    getAIRecommendedCount(loadProfile(), loadState()).then(setAiCount)
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

  const allWords = getAllWords(getActiveLanguage())

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

  const visiblePool = isSearching
    ? searchResults
    : recommendations.filter(w => !banked.has(w.id))

  const grammarButtons = [...new Set(visiblePool.map(w => w.classifications.grammaticalCategory))]
    .filter(cat => s.common.categoriesPlural[cat])
    .map(cat => ({ cat, label: s.common.categoriesPlural[cat] }))

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

  function handleBanked(wordId) {
    setBanked(prev => new Set([...prev, wordId]))
    if (onWordAdded) onWordAdded()
  }

  // Dev: simulate THRESHOLD correct attempts → graduation
  function devQuickBank(word, e) {
    e.stopPropagation()
    for (let i = 0; i < THRESHOLD; i++) {
      const result = recordAttempt(word.id, 'reading')
      if (result.graduated) { handleBanked(word.id); break }
    }
  }

  // ── Trial view ────────────────────────────────────────────────

  if (trialWord) {
    return (
      <WordTrial
        word={trialWord}
        onBack={() => setTrialWord(null)}
        onBanked={handleBanked}
      />
    )
  }

  // ── List view ─────────────────────────────────────────────────

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

  function renderWord(word) {
    const slotInfo = getSlotInfo(word)
    return (
      <div key={word.id} className="discover-item" onClick={() => setTrialWord(word)}>
        <div className="discover-item-body">
          <div className="discover-item-top">
            <span className="discover-item-word">{word.baseForm}</span>
            <span className="discover-item-category">{s.common.categories[word.classifications.grammaticalCategory]}</span>
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
