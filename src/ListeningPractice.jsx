import { useState, useMemo } from 'react'
import { recordAttempt, THRESHOLD } from './userStore'
import { selectContent } from './wbSelector'

export default function ListeningPractice({ word, onBack, onStoreChange, depthLevel }) {
  const item = useMemo(() => selectContent(word.id, 'listening', depthLevel), [word.id, depthLevel])

  const [step, setStep] = useState('listen')
  const [result, setResult] = useState(null)

  function confirm() {
    const r = recordAttempt(word.id, 'listening')
    onStoreChange(r)
    setResult(r)
    setStep('result')
  }

  if (!item) {
    return (
      <div className="practice">
        <button className="profile-back" onClick={onBack}>← Back</button>
        <div className="practice-header">
          <p className="practice-prompt">Listening</p>
          <h2 className="practice-word">{word.baseForm}</h2>
        </div>
        <p className="practice-instruction">No listening content yet for this word.</p>
      </div>
    )
  }

  if (step === 'result') {
    return (
      <div className="practice">
        <button className="profile-back" onClick={onBack}>← Done</button>
        <div className="practice-result">
          {result.graduated ? (
            <>
              <p className="result-unlocked">Graduated</p>
              <p className="result-detail">
                "{word.baseForm}" has moved to your World Sphere Listening pool.
              </p>
            </>
          ) : result.alreadyGraduated ? (
            <>
              <p className="result-count">Listening: already in World Sphere</p>
              <p className="result-detail">Attempt recorded.</p>
            </>
          ) : (
            <>
              <p className="result-count">{result.count} / {THRESHOLD}</p>
              <p className="result-detail">Listening — "{word.baseForm}"</p>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="practice">
      <button className="profile-back" onClick={onBack}>← Back</button>
      <div className="practice-header">
        <p className="practice-prompt">Listening</p>
        <h2 className="practice-word">{word.baseForm}</h2>
      </div>

      <div className="listening-player">
        {item.audioUrl
          ? <audio controls src={item.audioUrl} className="listening-audio" />
          : <p className="listening-text-fallback">{item.text}</p>
        }
      </div>

      <p className="practice-instruction">Listen for the word <em>{word.baseForm}</em>.</p>
      <button className="practice-confirm-btn" onClick={confirm}>
        I heard it
      </button>
    </div>
  )
}
