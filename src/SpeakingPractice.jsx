import { useState, useMemo } from 'react'
import { transcribe, isSupported } from './transcribe'
import { evaluateSpeaking } from './evaluate'
import { recordAttempt, THRESHOLD } from './userStore'
import { selectContent } from './wbSelector'

export default function SpeakingPractice({ word, onBack, onStoreChange, depthLevel }) {
  const prompt = useMemo(() => {
    const item = selectContent(word.id, 'speaking', depthLevel)
    return item?.text ?? null
  }, [word.id, depthLevel])

  const [step, setStep] = useState('idle')
  const [transcript, setTranscript] = useState('')
  const [evaluation, setEvaluation] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  async function startRecording() {
    setError(null)
    setStep('listening')
    try {
      const text = await transcribe()
      setTranscript(text)
      setStep('review')
    } catch (err) {
      setError(err.message)
      setStep('idle')
    }
  }

  async function submit() {
    setStep('evaluating')
    const ev = await evaluateSpeaking(word.baseForm, transcript)
    setEvaluation(ev)
    if (ev.pass) {
      const r = recordAttempt(word.id, 'speaking')
      onStoreChange(r)
      setResult(r)
      setStep('passed')
    } else {
      setStep('failed')
    }
  }

  function retry() {
    setTranscript('')
    setEvaluation(null)
    setStep('idle')
  }

  if (!isSupported()) {
    return (
      <div className="practice">
        <button className="profile-back" onClick={onBack}>← Back</button>
        <div className="practice-header">
          <p className="practice-prompt">Speaking</p>
          <h2 className="practice-word">{word.baseForm}</h2>
        </div>
        <p className="practice-instruction">
          Speech recognition is not supported in this browser. Try Chrome.
        </p>
      </div>
    )
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
                "{word.baseForm}" has moved to your World Sphere Speaking pool.
              </p>
            </>
          ) : result.alreadyGraduated ? (
            <>
              <p className="result-count">Speaking: already in World Sphere</p>
              <p className="result-detail">Attempt recorded.</p>
            </>
          ) : (
            <>
              <p className="result-count">{result.count} / {THRESHOLD}</p>
              <p className="result-detail">Speaking — "{word.baseForm}"</p>
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
          <p className="speaking-transcript-label">You said:</p>
          <p className="speaking-transcript">{transcript}</p>
        </div>
        <button className="practice-confirm-btn" onClick={retry}>Try again</button>
      </div>
    )
  }

  if (step === 'review') {
    return (
      <div className="practice">
        <button className="profile-back" onClick={() => setStep('idle')}>← Back</button>
        <div className="practice-header">
          <p className="practice-prompt">Speaking</p>
          <h2 className="practice-word">{word.baseForm}</h2>
        </div>
        <p className="speaking-transcript-label">You said:</p>
        <p className="speaking-transcript">{transcript}</p>
        <p className="speaking-review-note">
          Does that look right?
        </p>
        <button className="practice-confirm-btn" onClick={submit}>
          Yes, submit
        </button>
        <button className="speaking-retry-link" onClick={retry}>
          That's not right — try again
        </button>
      </div>
    )
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

  return (
    <div className="practice">
      <button className="profile-back" onClick={onBack}>← Back</button>
      <div className="practice-header">
        <p className="practice-prompt">Speaking</p>
        <h2 className="practice-word">{word.baseForm}</h2>
      </div>
      <p className="practice-instruction">
        {prompt ?? <>Say a sentence using the word <em>{word.baseForm}</em>.</>}
      </p>
      {error && <p className="speaking-error">{error}</p>}
      <button
        className={`speaking-record-btn ${step === 'listening' ? 'speaking-record-btn--active' : ''}`}
        onClick={startRecording}
        disabled={step === 'listening'}
      >
        {step === 'listening' ? 'Listening...' : 'Start speaking'}
      </button>
    </div>
  )
}
