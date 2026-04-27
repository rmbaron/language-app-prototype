import { useState } from 'react'
import { markKnown, removeFromWordBank, THRESHOLD } from './userStore'
import { LANES, LANE } from './lanes'
import { getWordProgress } from './wordProgress'
import LaneLock from './LaneLock'
import { getStrings } from './uiStrings'
import { getInterfaceLanguage } from './learnerProfile'
import { FULL_MEANINGS } from './wordFullMeanings.en'
import WordMasteryBar from './WordMasteryBar'
import { getUsage, recordUse, clearUsage } from './wordUsageStore'

const DEV = true
const LANE_IDS = ['writing', 'speaking', 'reading', 'listening']

function Section({ label, isOpen, onToggle, children }) {
  return (
    <div className="section">
      <button className="section-trigger" onClick={onToggle}>
        <span>{label}</span>
        <span className={`section-chevron ${isOpen ? 'section-chevron--open' : ''}`}>›</span>
      </button>
      {isOpen && <div className="section-body">{children}</div>}
    </div>
  )
}

export default function WordProfile({ word, onBack, onPractice, storeData, onStoreChange }) {
  const s = getStrings(getInterfaceLanguage())
  const [open, setOpen] = useState({})
  const [usageTick, setUsageTick] = useState(0)

  function refreshUsage() { setUsageTick(t => t + 1) }

  function devRecord(lane) {
    recordUse(word.id, lane)
    refreshUsage()
  }

  function devClear() {
    clearUsage(word.id)
    refreshUsage()
  }

  const devUsage = DEV ? getUsage(word.id) : null

  const progress = getWordProgress(word.id, storeData)

  function toggle(key) {
    setOpen(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function handleMarkKnown(lane) {
    markKnown(word.id, lane)
    onStoreChange()
  }

  function handleRemove() {
    removeFromWordBank(word.id)
    onStoreChange()
    onBack()
  }

  return (
    <div className="profile">
      <button className="profile-back" onClick={onBack}>{s.common.back}</button>

      <div className="profile-header">
        <span className="profile-category-bubble">
          {s.common.categories[word.classifications.grammaticalCategory] ?? word.classifications.grammaticalCategory}
        </span>
        <h1 className="profile-base">{word.baseForm}</h1>
        <p className="profile-meaning">{word.meaning}</p>
      </div>

      <div className="lane-locks">
        {LANES.map(({ id }) => (
          <LaneLock
            key={id}
            lane={LANE[id]}
            attempts={progress.lanes[id].attempts}
            threshold={THRESHOLD}
            graduated={progress.lanes[id].graduated}
            onMarkKnown={() => handleMarkKnown(id)}
          />
        ))}
      </div>

      <div className="mastery-section">
        <WordMasteryBar key={usageTick} wordId={word.id} />
      </div>

      <div className="profile-sections">
        <Section label={s.wordProfile.sections.fullerMeaning} isOpen={open.fuller} onToggle={() => toggle('fuller')}>
          <p className="section-text">{FULL_MEANINGS[word.id]}</p>
        </Section>

        <Section label={s.wordProfile.sections.otherForms} isOpen={open.forms} onToggle={() => toggle('forms')}>
          <div className="forms-list">
            {word.forms.map(f => (
              <span key={f.form} className="form-chip">
                {f.form} <span className="form-type">{f.type.replace(/_/g, ' ')}</span>
              </span>
            ))}
          </div>
        </Section>

        <Section label={s.wordProfile.sections.stats} isOpen={open.stats} onToggle={() => toggle('stats')}>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">24</span>
              <span className="stat-label">{s.wordProfile.stats.timesSeen}</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">7</span>
              <span className="stat-label">{s.wordProfile.stats.dayStreak}</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">2d</span>
              <span className="stat-label">{s.wordProfile.stats.lastPracticed}</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">B1</span>
              <span className="stat-label">{s.wordProfile.stats.level}</span>
            </div>
          </div>
        </Section>
      </div>

      <button className="practice-btn" onClick={onPractice}>
        {s.wordProfile.practice}
      </button>

      <button className="remove-word-btn" onClick={handleRemove}>
        {s.wordProfile.remove}
      </button>

      {DEV && (
        <details style={{ width: '100%', marginTop: 24 }}>
          <summary style={{ cursor: 'pointer', color: '#999', fontSize: 11, letterSpacing: '0.08em', userSelect: 'none' }}>
            DEV · usage log
          </summary>
          <div style={{ marginTop: 12, padding: '12px 14px', background: '#f7f7f7', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
              {LANE_IDS.map(lane => (
                <div key={lane} style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 5, padding: '8px 10px' }}>
                  <div style={{ fontWeight: 600, color: '#333', marginBottom: 4, textTransform: 'capitalize' }}>{lane}</div>
                  <div style={{ color: '#666', fontSize: 11 }}>
                    count: {devUsage[lane].count} &nbsp;·&nbsp;
                    sessions: {devUsage[lane].sessions} &nbsp;·&nbsp;
                    last: {devUsage[lane].lastAt ? new Date(devUsage[lane].lastAt).toLocaleTimeString() : '—'}
                  </div>
                  <button
                    onClick={() => devRecord(lane)}
                    style={{ marginTop: 6, fontSize: 11, padding: '3px 10px', border: '1px solid #ccc', borderRadius: 4, background: '#fff', cursor: 'pointer', color: '#333' }}>
                    +1 {lane}
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={devClear}
              style={{ fontSize: 11, padding: '4px 12px', border: '1px solid #e88', borderRadius: 4, background: '#fff8f8', cursor: 'pointer', color: '#a00' }}>
              clear all usage
            </button>
          </div>
        </details>
      )}
    </div>
  )
}
