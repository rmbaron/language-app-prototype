import { getInterfaceLanguage } from './learnerProfile'
import { getStrings } from './uiStrings'

const LANES = [
  { id: 'reading',   descKey: 'laneReading',   available: true  },
  { id: 'writing',   descKey: 'laneWriting',   available: true  },
  { id: 'listening', descKey: 'laneListening', available: false },
  { id: 'speaking',  descKey: 'laneSpeaking',  available: false },
]

export default function PracticeHub({ onBack, onNavigate }) {
  const s = getStrings(getInterfaceLanguage())

  return (
    <div className="practice-hub">
      <button className="profile-back" onClick={onBack}>{s.common.back}</button>
      <p className="practice-hub-title">{s.practiceHub.title}</p>

      <div className="practice-hub-grid">
        {LANES.map(lane => (
          <button
            key={lane.id}
            className={`practice-hub-btn${!lane.available ? ' practice-hub-btn--disabled' : ''}`}
            onClick={() => lane.available && onNavigate(`practice_${lane.id}`)}
            disabled={!lane.available}
          >
            <span className="practice-hub-btn-label">{s.common.lanes[lane.id]}</span>
            <span className="practice-hub-btn-desc">{s.practiceHub[lane.descKey]}</span>
            {!lane.available && (
              <span className="practice-hub-btn-soon">{s.practiceHub.comingSoon}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
