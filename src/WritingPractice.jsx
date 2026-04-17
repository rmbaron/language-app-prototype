import { useState, useMemo } from 'react'
import { evaluateWriting } from './evaluate'
import { recordAttempt, THRESHOLD } from './userStore'
import { selectContent } from './wbSelector'

export default function WritingPractice({ word, onBack, onStoreChange, depthLevel }) {
  const [response, setResponse] = useState('')
  const [step, setStep] = useState('write')
  const [evaluation, setEvaluation] = useState(null)
  const [attemptResult, setAttemptResult] = useState(null)

  const prompt = useMemo(() => {
    const item = selectContent(word.id, 'writing', depthLevel)
    return item?.text ?? null
  }, [word.id, depthLevel])

  async function handleSubmit() {
    if (!response.trim()) return
    setStep('evaluating')
    const ev = await evaluateWriting(word.baseForm, response)
    setEvaluation(ev)
    if (ev.pass) {
      const result = recordAttempt(word.id, 'writing')
      onStoreChange(result)
      setAttemptResult(result)
      setStep('passed')
    } else {
      setStep('failed')
    }
  }

  if (step === 'evaluating') {
    return (
      <div className="practice">
        <div className="practice-evaluating">
          <p className="evaluating-text">Evaluating...</p>
        </div>
      </div>
    )
  }

  if (step === 'passed') {
    return (
      <div className="practice">
        <button className="profile-back" onClick={onBack}>← Done</button>
        <div className="practice-result">
          {attemptResult.graduated ? (
            <>
              <p className="result-unlocked">Graduated</p>
              <p className="result-detail">
                "{word.baseForm}" has moved to your World Sphere Writing pool.
              </p>
            </>
          ) : (
            <>
              <p className="result-count">{attemptResult.count} / {THRESHOLD}</p>
              <p className="result-detail">Writing — "{word.baseForm}"</p>
            </>
          )}
          <p className="result-feedback">{evaluation.feedback}</p>
        </div>
      </div>
    )
  }

  if (step === 'failed') {
    return (
      <div className="practice">
        <button className="profile-back" onClick={onBack}>← Back</button>
        <div className="practice-result">
          <p className="result-fail">Try again</p>
          <p className="result-feedback">{evaluation.feedback}</p>
        </div>
        <button
          className="practice-confirm-btn"
          onClick={() => { setResponse(''); setStep('write') }}
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="practice">
      <button className="profile-back" onClick={onBack}>← Back</button>
      <div className="practice-header">
        <p className="practice-prompt">Writing</p>
        <h2 className="practice-word">{word.baseForm}</h2>
      </div>
      <p className="writing-instruction">
        {prompt ?? <>Write a sentence using the word <em>{word.baseForm}</em>.</>}
      </p>
      <textarea
        className="writing-input"
        value={response}
        onChange={e => setResponse(e.target.value)}
        placeholder="Type your sentence here..."
        rows={4}
      />
      <button
        className="practice-confirm-btn"
        onClick={handleSubmit}
        disabled={!response.trim()}
      >
        Submit
      </button>
    </div>
  )
}
