import { useState, useEffect } from 'react'
import { getAllWords } from './wordRegistry'
import { LANES } from './lanes'
import { THRESHOLD, loadState, resetWord, resetAllProgress, resetAll, getWordBank } from './userStore'
import { getContentIndex } from './contentStore'
import { loadProfile, resetProfile, getActiveLanguage, getCefrLevel } from './learnerProfile'
import { getSlotCoverage, getCurrentSubLevel } from './cefrLevels'
import { buildCandidatePool } from './wordCandidatePool'

export default function DevPanel({ onReset }) {
  const [, forceUpdate]   = useState(0)
  const [candidates, setCandidates] = useState([])
  const [tab, setTab]     = useState('general')
  const [collapsed, setCollapsed] = useState({
    contentStore:   true,
    attemptCounts:  true,
    candidatePool:  true,
    slotCoverage:   false,
  })

  const storeData    = loadState()
  const contentStore = getContentIndex()
  const profile      = loadProfile()

  useEffect(() => {
    const state = loadState()
    const prof  = loadProfile()
    buildCandidatePool(state, prof, false).then(setCandidates)
  }, [])

  function toggle(key) {
    setCollapsed(c => ({ ...c, [key]: !c[key] }))
  }

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

  const wordBankIds   = getWordBank()
  const activeLang    = getActiveLanguage()
  const allWords      = getAllWords(activeLang)

  return (
    <div className="dev-panel">
      <p className="dev-heading">Dev Panel</p>

      {/* ── Tabs ── */}
      <div className="dev-tabs">
        <button
          className={`dev-tab ${tab === 'general' ? 'dev-tab--active' : ''}`}
          onClick={() => setTab('general')}
        >
          General
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════
          GENERAL TAB
      ══════════════════════════════════════════════════════════ */}
      {tab === 'general' && <>

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
            <span className="dev-profile-key">cefr level</span>
            <span className="dev-profile-val">{getCefrLevel() ?? '—'}</span>
            <span className="dev-profile-key">sub-level</span>
            <span className="dev-profile-val">
              {getCurrentSubLevel(getCefrLevel() ?? 'A1', wordBankIds, allWords, activeLang) ?? '—'}
            </span>
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
          <button className="dev-reset-btn" onClick={handleResetProfile}>Clear profile</button>
        </div>

        {/* Collapsible: CEFR Slot Coverage */}
        {(() => {
          const cefrLevel = getCefrLevel() ?? 'A1'
          const slotCov   = getSlotCoverage(cefrLevel, wordBankIds, allWords, activeLang)
          const covered   = slotCov.filter(s => s.covered).length
          return (
            <div className="dev-section">
              <button className="dev-collapse-title" onClick={() => toggle('slotCoverage')}>
                — CEFR Slot Coverage ({covered}/{slotCov.length} covered) — {collapsed.slotCoverage ? '▸' : '▾'}
              </button>
              {!collapsed.slotCoverage && (
                slotCov.length === 0
                  ? <p className="dev-empty">No slots defined for this level.</p>
                  : slotCov.map(slot => (
                    <div key={slot.id} className="dev-word-row">
                      <span className="dev-word-id">{slot.userLabel ?? slot.label}</span>
                      <span className={`dev-lane-count ${slot.covered ? 'dev-lane-count--done' : ''}`}>
                        {slot.covered ? `✓ depth ${slot.depth}` : '✗ missing'}
                      </span>
                      {!slot.covered && slot.coverageCheck?.type === 'specificWords' && (
                        <span className="dev-pool-words">
                          needs: {slot.coverageCheck.wordIds.filter(id => !wordBankIds.includes(id)).join(', ')}
                        </span>
                      )}
                      {!slot.covered && slot.coverageCheck?.type === 'category' && (
                        <span className="dev-pool-words">
                          needs: any {slot.coverageCheck.grammaticalCategory}
                          {slot.coverageCheck.excludeIds?.length ? ` (excl. ${slot.coverageCheck.excludeIds.join(', ')})` : ''}
                        </span>
                      )}
                    </div>
                  ))
              )}
            </div>
          )
        })()}

        {/* Collapsible: Content Store */}
        <div className="dev-section">
          <button className="dev-collapse-title" onClick={() => toggle('contentStore')}>
            — System: Content Store — {collapsed.contentStore ? '▸' : '▾'}
          </button>
          {!collapsed.contentStore && allWords.map(word => (
            <div key={word.id} className="dev-word-row">
              <span className="dev-word-id">{word.id}</span>
              <div className="dev-word-lanes">
                {LANES.map(({ id, label }) => {
                  const count = contentStore[word.id]?.[id] ?? 0
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

        {/* Collapsible: Attempt Counts */}
        <div className="dev-section">
          <button className="dev-collapse-title" onClick={() => toggle('attemptCounts')}>
            — User: Attempt Counts (/{THRESHOLD}) — {collapsed.attemptCounts ? '▸' : '▾'}
          </button>
          {!collapsed.attemptCounts && allWords.map(word => {
            const attempts = storeData.attempts[word.id]
            return (
              <div key={word.id} className="dev-word-row">
                <span className="dev-word-id">{word.id}</span>
                <div className="dev-word-lanes">
                  {LANES.map(({ id, label }) => {
                    const count    = attempts?.[id] ?? 0
                    const unlocked = (storeData.worldPools[id] ?? []).includes(word.id)
                    return (
                      <span key={id} className={`dev-lane-count ${unlocked ? 'dev-lane-count--done' : ''}`}>
                        {label[0]}: {count}/{THRESHOLD}{unlocked ? ' ✓' : ''}
                      </span>
                    )
                  })}
                </div>
                <button className="dev-reset-word-btn" onClick={() => handleResetWord(word.id)}>
                  reset
                </button>
              </div>
            )
          })}
        </div>

        {/* Collapsible: Candidate Pool */}
        <div className="dev-section">
          <button className="dev-collapse-title" onClick={() => toggle('candidatePool')}>
            — Recommender: Candidate Pool — {collapsed.candidatePool ? '▸' : '▾'}
          </button>
          {!collapsed.candidatePool && <>
            {candidates.length === 0 ? (
              <p className="dev-empty">No candidates — all words already in Word Bank.</p>
            ) : (
              <table className="dev-candidate-table">
                <thead>
                  <tr>
                    <th>#</th><th>word</th><th>score</th><th>src</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((c, i) => (
                    <tr key={c.word.id} className={i < 10 ? 'dev-candidate--selected' : ''}>
                      <td className="dev-candidate-rank">{i + 1}</td>
                      <td className="dev-candidate-word">{c.word.baseForm}</td>
                      <td className="dev-candidate-score">{c.score.toFixed(1)}</td>
                      <td className="dev-candidate-source">{c.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>}
        </div>

      </>}

    </div>
  )
}
