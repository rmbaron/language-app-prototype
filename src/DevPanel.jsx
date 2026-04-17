import { useState, useEffect } from 'react'
import words from './wordData'
import { LANES } from './lanes'
import { THRESHOLD, loadState, resetWord, resetAllProgress, resetAll } from './userStore'
import { getStore } from './contentStore'
import { loadProfile, resetProfile } from './learnerProfile'
import { buildCandidatePool } from './wordCandidatePool'
import { getWordMeta } from './wordMeta'

const WEIGHTS = {
  frequencyTier:       1.0,
  functionalWeight:    1.0,
  combinabilityScore:  1.0,
  cognitiveComplexity: 0.8,
  unlockValue:         1.0,
}

export default function DevPanel({ onReset }) {
  const [, forceUpdate] = useState(0)
  const [candidates, setCandidates] = useState([])
  const storeData = loadState()

  useEffect(() => {
    const state = loadState()
    const profile = loadProfile()
    buildCandidatePool(state, profile, false).then(setCandidates)
  }, [])
  const contentStore = getStore()
  const profile = loadProfile()

  function handleResetWord(wordId) {
    resetWord(wordId)
    forceUpdate(n => n + 1)
    onReset()
  }

  function handleResetAllProgress() {
    resetAllProgress()
    forceUpdate(n => n + 1)
    onReset()
  }

  function handleResetAll() {
    resetAll()
    forceUpdate(n => n + 1)
    onReset()
  }

  function handleResetProfile() {
    resetProfile()
    forceUpdate(n => n + 1)
  }

  return (
    <div className="dev-panel">
      <p className="dev-heading">Dev Panel</p>

      <div className="dev-section">
        <p className="dev-section-title">— Reset —</p>
        <div className="dev-reset-row">
          <button className="dev-reset-btn" onClick={handleResetAllProgress}>
            Reset all progress
          </button>
          <button className="dev-reset-btn dev-reset-btn--danger" onClick={handleResetAll}>
            Full wipe
          </button>
        </div>
      </div>

      <div className="dev-section">
        <p className="dev-section-title">— Learner Profile —</p>
        <div className="dev-profile-grid">
          <span className="dev-profile-key">target language</span>
          <span className="dev-profile-val">{profile.expressed.stable.targetLanguage ?? '—'}</span>

          <span className="dev-profile-key">native language</span>
          <span className="dev-profile-val">{profile.expressed.stable.nativeLanguage ?? '—'}</span>

          <span className="dev-profile-key">level</span>
          <span className="dev-profile-val">{profile.expressed.stable.selfReportedLevel ?? '—'}</span>

          <span className="dev-profile-key">goal</span>
          <span className="dev-profile-val">{profile.expressed.stable.learningGoal ?? '—'}</span>

          <span className="dev-profile-key">goal note</span>
          <span className="dev-profile-val">{profile.expressed.stable.learningGoalNote ?? '—'}</span>

          <span className="dev-profile-key">personalization</span>
          <span className="dev-profile-val">{profile.expressed.preferences.personalizationLevel ?? '—'}</span>

          <span className="dev-profile-key">sessions</span>
          <span className="dev-profile-val">{profile.observed.behavioral.totalSessions}</span>

          <span className="dev-profile-key">depth level</span>
          <span className="dev-profile-val">{profile.observed.performance.currentDepthLevel}</span>

          <span className="dev-profile-key">last active</span>
          <span className="dev-profile-val">
            {profile.observed.behavioral.lastActiveDate
              ? new Date(profile.observed.behavioral.lastActiveDate).toLocaleDateString()
              : '—'}
          </span>
        </div>
        <button className="dev-reset-btn" onClick={handleResetProfile}>
          Clear profile
        </button>
      </div>

      <div className="dev-section">
        <p className="dev-section-title">— System: Content Store —</p>
        {words.map(word => (
          <div key={word.id} className="dev-word-row">
            <span className="dev-word-id">{word.id}</span>
            <div className="dev-word-lanes">
              {LANES.map(({ id, label }) => {
                const count = contentStore[word.id]?.[id]?.length ?? 0
                return (
                  <span key={id} className={`dev-lane-count ${count > 0 ? 'dev-lane-count--done' : ''}`}>
                    {label[0]}: {count} item{count !== 1 ? 's' : ''}
                  </span>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="dev-section">
        <p className="dev-section-title">— User: Word Bank Active Pool —</p>
        {LANES.map(({ id, label }) => (
          <div key={id} className="dev-pool-row">
            <span className="dev-lane-name">{label}</span>
            <span className="dev-pool-words">
              {(storeData.wbPools[id] ?? []).filter(w => !(storeData.worldPools[id] ?? []).includes(w)).length === 0
                ? '—'
                : (storeData.wbPools[id] ?? []).filter(w => !(storeData.worldPools[id] ?? []).includes(w)).join(', ')}
            </span>
          </div>
        ))}
      </div>

      <div className="dev-section">
        <p className="dev-section-title">— User: World Sphere Pools —</p>
        {LANES.map(({ id, label }) => (
          <div key={id} className="dev-pool-row">
            <span className="dev-lane-name">{label}</span>
            <span className="dev-pool-words">
              {(storeData.worldPools[id] ?? []).length === 0
                ? '—'
                : (storeData.worldPools[id] ?? []).join(', ')}
            </span>
          </div>
        ))}
      </div>

      <div className="dev-section">
        <p className="dev-section-title">— User: Attempt Counts (/ {THRESHOLD} to graduate) —</p>
        {words.map(word => {
          const attempts = storeData.attempts[word.id]
          return (
            <div key={word.id} className="dev-word-row">
              <span className="dev-word-id">{word.id}</span>
              <div className="dev-word-lanes">
                {LANES.map(({ id, label }) => {
                  const count = attempts?.[id] ?? 0
                  const unlocked = (storeData.worldPools[id] ?? []).includes(word.id)
                  return (
                    <span key={id} className={`dev-lane-count ${unlocked ? 'dev-lane-count--done' : ''}`}>
                      {label[0]}: {count}/{THRESHOLD}{unlocked ? ' ✓' : ''}
                    </span>
                  )
                })}
              </div>
              <button
                className="dev-reset-word-btn"
                onClick={() => handleResetWord(word.id)}
              >
                reset
              </button>
            </div>
          )
        })}
      </div>

      <div className="dev-section">
        <p className="dev-section-title">— Recommender: Candidate Pool —</p>
        <div className="dev-weights-row">
          {Object.entries(WEIGHTS).map(([key, w]) => (
            <span key={key} className="dev-weight-chip">
              {key.replace(/([A-Z])/g, ' $1').toLowerCase()}: {w}
            </span>
          ))}
        </div>
        {candidates.length === 0 ? (
          <p className="dev-empty">No candidates — all words already in Word Bank.</p>
        ) : (
          <table className="dev-candidate-table">
            <thead>
              <tr>
                <th>#</th>
                <th>word</th>
                <th>score</th>
                <th>freq</th>
                <th>func</th>
                <th>comb</th>
                <th>cog</th>
                <th>unlock</th>
                <th>src</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c, i) => {
                const meta = getWordMeta(c.word.id)
                return (
                  <tr key={c.word.id} className={i < 10 ? 'dev-candidate--selected' : ''}>
                    <td className="dev-candidate-rank">{i + 1}</td>
                    <td className="dev-candidate-word">{c.word.baseForm}</td>
                    <td className="dev-candidate-score">{c.score.toFixed(1)}</td>
                    <td>{meta?.frequencyTier ?? '—'}</td>
                    <td>{meta?.functionalWeight ?? '—'}</td>
                    <td>{meta?.combinabilityScore ?? '—'}</td>
                    <td>{meta?.cognitiveComplexity ?? '—'}</td>
                    <td>{meta?.unlockValue ?? '—'}</td>
                    <td className="dev-candidate-source">{c.source}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
