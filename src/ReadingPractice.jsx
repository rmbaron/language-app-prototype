import { useState, useMemo } from 'react'
import { recordAttempt, THRESHOLD } from './userStore'
import { hasContent } from './contentStore'
import { selectContent, selectDistractors } from './wbSelector'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function blankSentence(text, word) {
  const formStrings = [word.baseForm, ...(word.forms ?? []).map(f => f.form)]
  let result = text
  for (const form of formStrings) {
    const regex = new RegExp(`\\b${form}\\b`, 'gi')
    result = result.replace(regex, '___')
  }
  return result
}

export default function ReadingPractice({ word, onBack, onStoreChange, depthLevel }) {
  const [step, setStep] = useState('question') // question | passed | failed
  const [selected, setSelected] = useState(null)
  const [result, setResult] = useState(null)

  const { item, choices } = useMemo(() => {
    const item = selectContent(word.id, 'reading', depthLevel)
    if (!item) return { item: null, choices: [] }
    const distractors = selectDistractors(word, 'reading')
    const choices = shuffle([
      { baseForm: word.baseForm, correct: true },
      ...distractors.map(d => ({ baseForm: d.baseForm, correct: false })),
    ])
    return { item, choices }
  }, [word.id, depthLevel])

  if (!hasContent(word.id, 'reading')) {
    return (
      <div className="practice">
        <button className="profile-back" onClick={onBack}>← Back</button>
        <div className="practice-header">
          <p className="practice-prompt">Reading</p>
          <h2 className="practice-word">{word.baseForm}</h2>
        </div>
        <p className="practice-instruction">
          No reading exercises yet for this word. Add some in the Content Manager.
        </p>
      </div>
    )
  }

  function handleSelect(choice) {
    if (step !== 'question') return
    setSelected(choice)
    if (choice.correct) {
      const r = recordAttempt(word.id, 'reading')
      onStoreChange(r)
      setResult(r)
      setStep('passed')
    } else {
      setStep('failed')
    }
  }

  function retry() {
    setSelected(null)
    setStep('question')
  }

  if (step === 'passed') {
    return (
      <div className="practice">
        <button className="profile-back" onClick={onBack}>← Done</button>
        <div className="practice-result">
          {result.graduated ? (
            <>
              <p className="result-unlocked">Graduated</p>
              <p className="result-detail">
                "{word.baseForm}" has moved to your World Sphere Reading pool.
              </p>
            </>
          ) : result.alreadyGraduated ? (
            <>
              <p className="result-count">Reading: already in World Sphere</p>
              <p className="result-detail">Attempt recorded.</p>
            </>
          ) : (
            <>
              <p className="result-count">{result.count} / {THRESHOLD}</p>
              <p className="result-detail">Reading — "{word.baseForm}"</p>
            </>
          )}
          <p className="result-feedback">Correct!</p>
        </div>
      </div>
    )
  }

  const blanked = blankSentence(item.text, word)

  return (
    <div className="practice">
      <button className="profile-back" onClick={onBack}>← Back</button>
      <div className="practice-header">
        <p className="practice-prompt">Reading</p>
        <h2 className="practice-word">{word.baseForm}</h2>
      </div>
      <p className="reading-sentence">{blanked}</p>
      {step === 'failed' && (
        <p className="reading-wrong">Not quite — try again.</p>
      )}
      <div className="reading-choices">
        {choices.map((choice, i) => (
          <button
            key={i}
            className={[
              'reading-choice-btn',
              step === 'failed' && choice === selected ? 'reading-choice-btn--wrong' : '',
            ].join(' ').trim()}
            onClick={() => handleSelect(choice)}
          >
            {choice.baseForm}
          </button>
        ))}
      </div>
      {step === 'failed' && (
        <button className="practice-confirm-btn" onClick={retry}>
          Try again
        </button>
      )}
    </div>
  )
}
