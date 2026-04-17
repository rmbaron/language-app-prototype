import { useState, useEffect } from 'react'
import { getRecommendations, getAIRecommendedCount } from './wordRecommender'
import { getWordMeta } from './wordMeta'
import { loadState } from './userStore'
import { loadProfile } from './learnerProfile'

export default function RecommenderPanel() {
  const [aiDecides, setAiDecides] = useState(false)
  const [manualCount, setManualCount] = useState(5)
  const [aiCount, setAiCount] = useState(null)
  const [recommendations, setRecommendations] = useState([])

  // When AI decides mode is toggled on, ask AI for the count first
  useEffect(() => {
    if (!aiDecides) { setAiCount(null); return }
    const state = loadState()
    const profile = loadProfile()
    getAIRecommendedCount(profile, state).then(setAiCount)
  }, [aiDecides])

  const count = aiDecides ? (aiCount ?? 5) : manualCount

  useEffect(() => {
    getRecommendations(count).then(setRecommendations)
  }, [count])

  return (
    <div className="rec-panel">
      <p className="rec-heading">Word Recommender</p>
      <p className="rec-subheading">Suggested words to add to your Word Bank</p>

      <div className="rec-controls">
        <label className="rec-ai-toggle">
          <input
            type="checkbox"
            checked={aiDecides}
            onChange={e => setAiDecides(e.target.checked)}
          />
          <span>AI decides how many</span>
          {aiDecides && aiCount !== null && (
            <span className="rec-ai-count">→ {aiCount}</span>
          )}
        </label>

        {!aiDecides && (
          <div className="rec-slider-row">
            <input
              type="range"
              min={1}
              max={10}
              value={manualCount}
              onChange={e => setManualCount(Number(e.target.value))}
              className="rec-slider"
            />
            <span className="rec-slider-value">{manualCount}</span>
          </div>
        )}
      </div>

      {recommendations.length === 0 ? (
        <p className="rec-empty">No recommendations — all words already in your bank.</p>
      ) : (
        <div className="rec-list">
          {recommendations.map(word => {
            const meta = getWordMeta(word.id)
            return (
              <div key={word.id} className="rec-item">
                <div className="rec-item-top">
                  <span className="rec-item-word">{word.baseForm}</span>
                  <span className="rec-item-category">{word.classifications.grammaticalCategory}</span>
                </div>
                <p className="rec-item-meaning">{word.meaning}</p>
                {meta && (
                  <div className="rec-item-scores">
                    <span className="rec-score">freq {meta.frequencyTier}</span>
                    <span className="rec-score">func {meta.functionalWeight}</span>
                    <span className="rec-score">comb {meta.combinabilityScore}</span>
                    <span className="rec-score">unlock {meta.unlockValue}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
