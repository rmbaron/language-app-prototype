import { useState, useEffect } from 'react'
import { setStable, setPreference, applyCefrFromSelfReport, getInterfaceLanguage } from './learnerProfile'
import { getStrings } from './uiStrings'

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'he', label: 'עברית' },
]

const LEVEL_IDS         = ['beginner', 'elementary', 'intermediate', 'upper_intermediate']
const GOAL_IDS          = ['fluency', 'trip', 'work', 'phrases', 'course']
const PERSONALIZATION_IDS = ['general', 'blended', 'personal']

const TOTAL_STEPS = 5

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(1)
  const [targetLanguage, setTargetLanguage] = useState(null)
  const [level, setLevel] = useState(null)
  const [goal, setGoal] = useState(null)
  const [goalNote, setGoalNote] = useState('')
  const [personalization, setPersonalization] = useState(null)
  const [openTooltip, setOpenTooltip] = useState(null)

  const s = getStrings(getInterfaceLanguage())

  useEffect(() => {
    // Silently detect and save native language from device/browser.
    // interfaceLanguage and supportLanguage derive from nativeLanguage
    // automatically via their getters — no need to set them explicitly here.
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
    if (step === 3) { setStable({ selfReportedLevel: level }); applyCefrFromSelfReport(level) }
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

        <button className="onboarding-back" onClick={step === 1 ? onComplete : handleBack}>
          {s.common.back}
        </button>

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
            <h1 className="onboarding-title">{s.onboarding.welcome.title}</h1>
            <p className="onboarding-body">{s.onboarding.welcome.body1}</p>
            <p className="onboarding-body">{s.onboarding.welcome.body2}</p>
          </div>
        )}

        {/* ── Step 2: Target language ── */}
        {step === 2 && (
          <div className="onboarding-screen">
            <h2 className="onboarding-title">{s.onboarding.targetLanguage.title}</h2>
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
            <h2 className="onboarding-title">{s.onboarding.level.title}</h2>
            <div className="onboarding-options">
              {LEVEL_IDS.map(id => {
                const opt = s.onboarding.level.options[id]
                return (
                  <div key={id} className="onboarding-level-row">
                    <button
                      className={`onboarding-option onboarding-option--level ${level === id ? 'onboarding-option--selected' : ''}`}
                      onClick={() => setLevel(id)}
                    >
                      {opt.label}
                    </button>
                    <button
                      className={`onboarding-tooltip-btn ${openTooltip === id ? 'onboarding-tooltip-btn--open' : ''}`}
                      onClick={() => setOpenTooltip(openTooltip === id ? null : id)}
                      aria-label="More info"
                    >
                      ?
                    </button>
                    {openTooltip === id && (
                      <p className="onboarding-tooltip-text">{opt.tooltip}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Step 4: Goal ── */}
        {step === 4 && (
          <div className="onboarding-screen">
            <h2 className="onboarding-title">{s.onboarding.goal.title}</h2>
            <div className="onboarding-options">
              {GOAL_IDS.map(id => (
                <button
                  key={id}
                  className={`onboarding-option ${goal === id ? 'onboarding-option--selected' : ''}`}
                  onClick={() => setGoal(id)}
                >
                  {s.onboarding.goal.options[id]}
                </button>
              ))}
            </div>
            <div className="onboarding-note-wrap">
              <label className="onboarding-note-label">
                {s.onboarding.goal.noteLabel}
              </label>
              <textarea
                className="onboarding-note-input"
                placeholder={s.onboarding.goal.notePlaceholder}
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
            <h2 className="onboarding-title">{s.onboarding.personalization.title}</h2>
            <p className="onboarding-subtitle">{s.onboarding.personalization.subtitle}</p>
            <div className="onboarding-options">
              {PERSONALIZATION_IDS.map(id => {
                const opt = s.onboarding.personalization.options[id]
                return (
                  <button
                    key={id}
                    className={`onboarding-option onboarding-option--card ${personalization === id ? 'onboarding-option--selected' : ''}`}
                    onClick={() => setPersonalization(id)}
                  >
                    <span className="onboarding-card-label">{opt.label}</span>
                    <span className="onboarding-card-desc">{opt.description}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <button
          className="onboarding-continue"
          onClick={handleContinue}
          disabled={!canAdvance()}
        >
          {step === TOTAL_STEPS ? s.onboarding.getStarted : s.onboarding.continue}
        </button>

      </div>
    </div>
  )
}
