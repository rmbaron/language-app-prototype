import { useState } from 'react'
import { markKnown, removeFromWordBank, THRESHOLD } from './userStore'
import { LANES, LANE } from './lanes'
import { getWordProgress } from './wordProgress'
import LaneLock from './LaneLock'

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
  const [open, setOpen] = useState({})

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
      <button className="profile-back" onClick={onBack}>← Back</button>

      <div className="profile-header">
        <span className="profile-category-bubble">
          {word.classifications.grammaticalCategory}
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
        <div className="mastery-label">
          <span>Word mastery</span>
          <span className="mastery-pct">{progress.mastery}%</span>
        </div>
        <div className="mastery-track">
          <div className="mastery-fill" style={{ width: `${progress.mastery}%` }} />
        </div>
      </div>

      <div className="profile-sections">
        <Section label="Fuller meaning" isOpen={open.fuller} onToggle={() => toggle('fuller')}>
          <p className="section-text">{word.fullMeaning}</p>
        </Section>

        <Section label="Other forms" isOpen={open.forms} onToggle={() => toggle('forms')}>
          <div className="forms-list">
            {word.forms.map(f => (
              <span key={f.form} className="form-chip">
                {f.form} <span className="form-type">{f.type.replace(/_/g, ' ')}</span>
              </span>
            ))}
          </div>
        </Section>

        <Section label="Stats" isOpen={open.stats} onToggle={() => toggle('stats')}>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">24</span>
              <span className="stat-label">Times seen</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">7</span>
              <span className="stat-label">Day streak</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">2d</span>
              <span className="stat-label">Last practiced</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">B1</span>
              <span className="stat-label">Level</span>
            </div>
          </div>
        </Section>
      </div>

      <button className="practice-btn" onClick={onPractice}>
        Practice It
      </button>

      <button className="remove-word-btn" onClick={handleRemove}>
        Remove from Word Bank
      </button>
    </div>
  )
}
