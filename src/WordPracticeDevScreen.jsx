import { useState, useMemo } from 'react'
import { getWordBank } from './userStore'
import { getBankedWords } from './wordRegistry'
import { getActiveLanguage, getInterfaceLanguage } from './learnerProfile'
import { getStrings } from './uiStrings'
import { LANES } from './lanes'
import { MECHANICS_REGISTRY, getAvailableMechanics } from './wordPracticeMechanics'
import WordPractice from './WordPractice'

const MECHANIC_IDS = Object.keys(MECHANICS_REGISTRY)

export default function WordPracticeDevScreen({ onClose }) {
  const lang = getActiveLanguage()
  const s = getStrings(getInterfaceLanguage())
  const bankWords = useMemo(() => getBankedWords(getWordBank(), lang), [lang])

  const [selectedWordId, setSelectedWordId] = useState(bankWords[0]?.id ?? null)
  const [previewWord, setPreviewWord] = useState(null)

  const word = bankWords.find(w => w.id === selectedWordId) ?? null

  if (previewWord) {
    return <WordPractice word={previewWord} onBack={() => setPreviewWord(null)} />
  }

  return (
    <div className="wl-screen">
      <button className="profile-back" onClick={onClose}>← Close</button>
      <h2 className="wl-title">Word Practice — Dev Test</h2>

      <div className="wl-section">
        <p className="wl-section-label">Word</p>
        <select
          className="practice-sublevel-select"
          value={selectedWordId ?? ''}
          onChange={e => setSelectedWordId(e.target.value)}
        >
          {bankWords.map(w => (
            <option key={w.id} value={w.id}>{w.baseForm}</option>
          ))}
        </select>
        {word && (
          <button
            className="wl-generate-btn"
            style={{ marginTop: 8 }}
            onClick={() => setPreviewWord(word)}
          >
            Open full practice screen →
          </button>
        )}
      </div>

      {word && (
        <>
          <div className="wl-section">
            <p className="wl-section-label">Mechanics by lane</p>
            {LANES.map(lane => {
              const available = getAvailableMechanics(word, lane.id, bankWords)
              const availableIds = new Set(available.map(m => m.id))
              const laneIds = Object.entries(
                Object.fromEntries(
                  MECHANIC_IDS.map(id => [id, availableIds.has(id)])
                )
              )

              return (
                <div key={lane.id} style={{ marginBottom: 12 }}>
                  <p className="wl-cluster-section-name" style={{ marginBottom: 4 }}>
                    {s.common.lanes[lane.id]}
                    {available.length === 0 && (
                      <span className="wl-empty"> — none available</span>
                    )}
                  </p>
                  {MECHANIC_IDS.map(id => {
                    const isAvail = availableIds.has(id)
                    return (
                      <div
                        key={id}
                        className="wl-atom-row"
                        style={{ opacity: isAvail ? 1 : 0.3 }}
                      >
                        <span className="wl-atom-check">{isAvail ? '✓' : '○'}</span>
                        <span className="wl-atom-label">{id}</span>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>

          <ExercisePreview word={word} bankWords={bankWords} />
        </>
      )}
    </div>
  )
}

function ExercisePreview({ word, bankWords }) {
  const [mechId, setMechId] = useState(MECHANIC_IDS[0])
  const [exerciseData, setExerciseData] = useState(null)
  const [error, setError] = useState(null)

  function build() {
    const def = MECHANICS_REGISTRY[mechId]
    if (!def) return
    try {
      const data = def.build(word, bankWords)
      setExerciseData(data)
      setError(data ? null : 'build() returned null — mechanic not available for this word')
    } catch (e) {
      setExerciseData(null)
      setError(e.message)
    }
  }

  return (
    <div className="wl-section">
      <p className="wl-section-label">Exercise preview</p>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <select
          className="practice-sublevel-select"
          value={mechId}
          onChange={e => { setMechId(e.target.value); setExerciseData(null); setError(null) }}
        >
          {MECHANIC_IDS.map(id => (
            <option key={id} value={id}>{id}</option>
          ))}
        </select>
        <button className="wl-generate-btn" onClick={build}>Build</button>
      </div>

      {error && <p className="wl-error">{error}</p>}

      {exerciseData && (
        <pre style={{ color: '#aaa', fontSize: 11, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {JSON.stringify(exerciseData, null, 2)}
        </pre>
      )}
    </div>
  )
}
