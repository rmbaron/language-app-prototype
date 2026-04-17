import { useState } from 'react'
import { LANE, LANES } from './lanes'
import WritingPractice from './WritingPractice'
import ListeningPractice from './ListeningPractice'
import SpeakingPractice from './SpeakingPractice'
import ReadingPractice from './ReadingPractice'

export default function WordPractice({ word, onBack, onStoreChange, depthLevel }) {
  const [lane, setLane] = useState(null)

  function selectLane(selected) {
    setLane(selected)
  }

  // Lane-specific interactions
  if (lane?.id === 'reading') {
    return (
      <ReadingPractice
        word={word}
        onBack={onBack}
        onStoreChange={onStoreChange}
        depthLevel={depthLevel}
      />
    )
  }

  if (lane?.id === 'writing') {
    return (
      <WritingPractice
        word={word}
        onBack={onBack}
        onStoreChange={onStoreChange}
        depthLevel={depthLevel}
      />
    )
  }

  if (lane?.id === 'listening') {
    return (
      <ListeningPractice
        word={word}
        onBack={onBack}
        onStoreChange={onStoreChange}
        depthLevel={depthLevel}
      />
    )
  }

  if (lane?.id === 'speaking') {
    return (
      <SpeakingPractice
        word={word}
        onBack={onBack}
        onStoreChange={onStoreChange}
        depthLevel={depthLevel}
      />
    )
  }

  return (
    <div className="practice">
      <button className="profile-back" onClick={onBack}>← Back</button>
      <div className="practice-header">
        <p className="practice-prompt">Practice</p>
        <h2 className="practice-word">{word.baseForm}</h2>
      </div>
      <div className="practice-lanes">
        {LANES.map(l => (
          <button
            key={l.id}
            className="practice-lane-btn"
            style={{ '--lane-color': LANE[l.id].color }}
            onClick={() => selectLane(l)}
          >
            {l.label}
          </button>
        ))}
      </div>
    </div>
  )
}
