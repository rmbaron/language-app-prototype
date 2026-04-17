import { useState, useEffect } from 'react'
import { getRecommendations, getAIRecommendedCount } from './wordRecommender'
import { getWordMeta } from './wordMeta'
import { addToWordBank, getWordBank, loadState } from './userStore'
import { loadProfile, getActiveLanguage } from './learnerProfile'
import allWords from './wordData'

// DiscoverWords — the word intake UI.
// Self-contained component with no opinion about where it lives.
// Routing/placement is handled by the parent — nothing here needs to change.
//
// Two modes:
//   Search mode  — user types a word, sees all matching words from the full list
//   Suggest mode — recommender surfaces scored candidates (default)

export default function DiscoverWords({ onBack, onWordAdded }) {
  const [recommendations, setRecommendations] = useState([])
  const [added, setAdded] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [aiDecides, setAiDecides] = useState(false)
  const [manualCount, setManualCount] = useState(10)
  const [aiCount, setAiCount] = useState(null)
  const [search, setSearch] = useState('')

  const count = aiDecides ? (aiCount ?? 10) : manualCount
  const isSearching = search.trim().length > 0

  useEffect(() => {
    if (!aiDecides) { setAiCount(null); return }
    const state = loadState()
    const profile = loadProfile()
    getAIRecommendedCount(profile, state).then(setAiCount)
  }, [aiDecides])

  useEffect(() => {
    if (isSearching) return
    setLoading(true)
    getRecommendations(count).then(recs => {
      setRecommendations(recs)
      setLoading(false)
    })
  }, [count, isSearching])

  // Search results: full word list, active language, not already in bank, matches query
  const searchResults = isSearching ? (() => {
    const bankIds = new Set(getWordBank())
    const activeLang = getActiveLanguage()
    const q = search.trim().toLowerCase()
    return allWords.filter(
      w =>
        w.language === activeLang &&
        !bankIds.has(w.id) &&
        !added.has(w.id) &&
        (w.baseForm.toLowerCase().includes(q) || w.meaning.toLowerCase().includes(q))
    )
  })() : []

  function handleAdd(word) {
    addToWordBank(word.id)
    setAdded(prev => new Set([...prev, word.id]))
    if (onWordAdded) onWordAdded()
  }

  function renderWord(word) {
    const meta = getWordMeta(word.id)
    const isAdded = added.has(word.id)
    return (
      <div key={word.id} className={`discover-item ${isAdded ? 'discover-item--added' : ''}`}>
        <div className="discover-item-body">
          <div className="discover-item-top">
            <span className="discover-item-word">{word.baseForm}</span>
            <span className="discover-item-category">{word.classifications.grammaticalCategory}</span>
          </div>
          <p className="discover-item-meaning">{word.meaning}</p>
          {meta && (
            <div className="discover-item-scores">
              <span className="discover-score">freq {meta.frequencyTier}</span>
              <span className="discover-score">func {meta.functionalWeight}</span>
              <span className="discover-score">comb {meta.combinabilityScore}</span>
              <span className="discover-score">unlock {meta.unlockValue}</span>
            </div>
          )}
        </div>
        <button
          className={`discover-add-btn ${isAdded ? 'discover-add-btn--added' : ''}`}
          onClick={() => handleAdd(word)}
          disabled={isAdded}
        >
          {isAdded ? 'Added' : '+ Add'}
        </button>
      </div>
    )
  }

  return (
    <div className="discover">
      <button className="profile-back" onClick={onBack}>← Back</button>

      <div className="discover-header">
        <h2 className="discover-title">Discover Words</h2>
        <p className="discover-subtitle">Add words to your Word Bank to start practicing them.</p>
      </div>

      <input
        className="discover-search"
        type="text"
        placeholder="Search for a specific word..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {!isSearching && (
        <div className="discover-controls">
          <label className="discover-ai-toggle">
            <input
              type="checkbox"
              checked={aiDecides}
              onChange={e => setAiDecides(e.target.checked)}
            />
            <span>AI decides how many</span>
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
                onChange={e => setManualCount(Number(e.target.value))}
                className="discover-slider"
              />
              <span className="discover-slider-value">{manualCount} words</span>
            </div>
          )}
        </div>
      )}

      {isSearching ? (
        searchResults.length === 0
          ? <p className="discover-empty">No words found for "{search}".</p>
          : <div className="discover-list">{searchResults.map(renderWord)}</div>
      ) : loading ? (
        <p className="discover-empty">Loading recommendations...</p>
      ) : recommendations.length === 0 ? (
        <p className="discover-empty">No recommendations right now — check back as your Word Bank grows.</p>
      ) : (
        <div className="discover-list">
          {recommendations.filter(w => !added.has(w.id)).map(renderWord)}
        </div>
      )}
    </div>
  )
}
