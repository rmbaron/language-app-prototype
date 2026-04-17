import { useState, useEffect } from 'react'
import { setStable, setPreference } from './learnerProfile'

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'he', label: 'עברית' },
]

const LEVELS = [
  {
    id: 'beginner',
    label: "I'm just starting out",
    tooltip: "Choose this if you've never studied this language, or only recognize a handful of words.",
  },
  {
    id: 'elementary',
    label: "I know a little",
    tooltip: "Choose this if you know some common words and basic phrases but can't yet form sentences on your own.",
  },
  {
    id: 'intermediate',
    label: "I know a fair amount",
    tooltip: "Choose this if you can handle simple everyday conversations with some effort and occasional gaps.",
  },
  {
    id: 'upper_intermediate',
    label: "I know a good amount",
    tooltip: "Choose this if you're comfortable in most everyday situations but still actively building vocabulary.",
  },
]

const GOALS = [
  { id: 'fluency',  label: 'Full fluency' },
  { id: 'trip',     label: 'A short trip' },
  { id: 'work',     label: 'Work or professional use' },
  { id: 'phrases',  label: 'Just a few useful phrases' },
  { id: 'course',   label: "Match a course I'm already taking" },
]

const PERSONALIZATION = [
  {
    id: 'general',
    label: 'Keep it general',
    description: 'Standard practice content — not tailored to you personally.',
  },
  {
    id: 'blended',
    label: 'Mix it in',
    description: 'Occasionally weave your interests and context into practice.',
  },
  {
    id: 'personal',
    label: 'Make it mine',
    description: 'Everything reflects your world — topics, style, and context.',
  },
]

const TOTAL_STEPS = 5

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(1)
  const [targetLanguage, setTargetLanguage] = useState(null)
  const [level, setLevel] = useState(null)
  const [goal, setGoal] = useState(null)
  const [goalNote, setGoalNote] = useState('')
  const [personalization, setPersonalization] = useState(null)
  const [openTooltip, setOpenTooltip] = useState(null)

  useEffect(() => {
    // Silently detect and save native language from device/browser
    const raw = navigator.language || navigator.languages?.[0] || 'en'
    const code = raw.split('-')[0].toLowerCase()
    setStable({ nativeLanguage: code })
  }, [])

  function canAdvance() {
    if (step === 2) return targetLanguage !== null
    if (step === 3) return level !== null
    if (step === 4) return goal !== null
    if (step === 5) return personalization !== null
    return true
  }

  function handleContinue() {
    if (step === 2) setStable({ targetLanguage })
    if (step === 3) setStable({ selfReportedLevel: level })
    if (step === 4) setStable({ learningGoal: goal, learningGoalNote: goalNote.trim() || null })
    if (step === 5) {
      setPreference('personalizationLevel', personalization)
      onComplete()
      return
    }
    setStep(s => s + 1)
    setOpenTooltip(null)
  }

  function handleBack() {
    setStep(s => s - 1)
    setOpenTooltip(null)
  }

  return (
    <div className="onboarding">
      <div className="onboarding-inner">

        <button className="onboarding-back" onClick={step === 1 ? onComplete : handleBack}>← Back</button>

        <div className="onboarding-progress">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`onboarding-dot ${i + 1 === step ? 'onboarding-dot--active' : ''} ${i + 1 < step ? 'onboarding-dot--done' : ''}`}
            />
          ))}
        </div>

        {/* ── Step 1: Welcome ── */}
        {step === 1 && (
          <div className="onboarding-screen">
            <h1 className="onboarding-title">Welcome.</h1>
            <p className="onboarding-body">
              This app helps you build a real working vocabulary — one word at a time,
              practiced across reading, listening, writing, and speaking.
            </p>
            <p className="onboarding-body">
              It'll take about a minute to set things up.
            </p>
          </div>
        )}

        {/* ── Step 2: Target language ── */}
        {step === 2 && (
          <div className="onboarding-screen">
            <h2 className="onboarding-title">What language are you learning?</h2>
            <div className="onboarding-options">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  className={`onboarding-option ${targetLanguage === lang.code ? 'onboarding-option--selected' : ''}`}
                  onClick={() => setTargetLanguage(lang.code)}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 3: Level ── */}
        {step === 3 && (
          <div className="onboarding-screen">
            <h2 className="onboarding-title">How much do you already know?</h2>
            <div className="onboarding-options">
              {LEVELS.map(l => (
                <div key={l.id} className="onboarding-level-row">
                  <button
                    className={`onboarding-option onboarding-option--level ${level === l.id ? 'onboarding-option--selected' : ''}`}
                    onClick={() => setLevel(l.id)}
                  >
                    {l.label}
                  </button>
                  <button
                    className={`onboarding-tooltip-btn ${openTooltip === l.id ? 'onboarding-tooltip-btn--open' : ''}`}
                    onClick={() => setOpenTooltip(openTooltip === l.id ? null : l.id)}
                    aria-label="More info"
                  >
                    ?
                  </button>
                  {openTooltip === l.id && (
                    <p className="onboarding-tooltip-text">{l.tooltip}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 4: Goal ── */}
        {step === 4 && (
          <div className="onboarding-screen">
            <h2 className="onboarding-title">What's your goal?</h2>
            <div className="onboarding-options">
              {GOALS.map(g => (
                <button
                  key={g.id}
                  className={`onboarding-option ${goal === g.id ? 'onboarding-option--selected' : ''}`}
                  onClick={() => setGoal(g.id)}
                >
                  {g.label}
                </button>
              ))}
            </div>
            <div className="onboarding-note-wrap">
              <label className="onboarding-note-label">
                Want to say more? (optional)
              </label>
              <textarea
                className="onboarding-note-input"
                placeholder="In your own words, why are you learning..."
                value={goalNote}
                onChange={e => setGoalNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )}

        {/* ── Step 5: Personalization ── */}
        {step === 5 && (
          <div className="onboarding-screen">
            <h2 className="onboarding-title">How personal do you want it?</h2>
            <p className="onboarding-subtitle">
              This shapes how practice content is tailored to you.
            </p>
            <div className="onboarding-options">
              {PERSONALIZATION.map(p => (
                <button
                  key={p.id}
                  className={`onboarding-option onboarding-option--card ${personalization === p.id ? 'onboarding-option--selected' : ''}`}
                  onClick={() => setPersonalization(p.id)}
                >
                  <span className="onboarding-card-label">{p.label}</span>
                  <span className="onboarding-card-desc">{p.description}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          className="onboarding-continue"
          onClick={handleContinue}
          disabled={!canAdvance()}
        >
          {step === TOTAL_STEPS ? 'Get started' : 'Continue'}
        </button>

      </div>
    </div>
  )
}
