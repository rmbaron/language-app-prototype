import { useState } from 'react'
import { getActiveLanguage, getCefrLevel } from './learnerProfile'
import { getLevel, getCurrentSubLevel, getCumulativeSlots, getPhaseSlots } from './cefrLevels'
import { getWordBank } from './userStore'
import allWords from './wordData'

export default function PracticeHub({ onBack, onNavigate }) {
  const activeLang   = getActiveLanguage()
  const cefrLevel    = getCefrLevel() ?? 'A1'
  const level        = getLevel(cefrLevel)
  const subdivisions = level?.subdivisions ?? []
  const allSlots     = level?.grammarSlots ?? []

  const bankIds      = getWordBank()
  const calcSubLevel = getCurrentSubLevel(cefrLevel, bankIds, allWords, activeLang)

  const [selectedSub, setSelectedSub] = useState(calcSubLevel ?? subdivisions[0]?.id ?? null)

  const activeSlotIds = new Set(getCumulativeSlots(cefrLevel, selectedSub))
  const newSlotIds    = new Set(getPhaseSlots(cefrLevel, selectedSub))

  return (
    <div className="practice-hub">
      <button className="profile-back" onClick={onBack}>← Back</button>
      <p className="practice-hub-title">Practice</p>

      <div className="practice-hub-grid">
        <button className="practice-hub-btn" onClick={() => onNavigate('sentenceLab')}>
          <span className="practice-hub-btn-label">Sentence Lab</span>
          <span className="practice-hub-btn-desc">Generate sentences from grammar structure tiers.</span>
        </button>
      </div>

      {/* ── Dev: A1 sub-level slot viewer ── */}
      {subdivisions.length > 0 && (
        <div className="practice-sublevel-panel">
          <div className="practice-sublevel-header">
            <span className="practice-sublevel-title">Grammar slots</span>
            <select
              className="practice-sublevel-select"
              value={selectedSub ?? ''}
              onChange={e => setSelectedSub(e.target.value)}
            >
              {subdivisions.map(s => (
                <option key={s.id} value={s.id}>
                  {s.id} — {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="practice-sublevel-slots">
            {allSlots
              .filter(slot => activeSlotIds.has(slot.id))
              .map(slot => (
                <span
                  key={slot.id}
                  className={[
                    'practice-sublevel-slot',
                    newSlotIds.has(slot.id) ? 'practice-sublevel-slot--new' : '',
                  ].join(' ').trim()}
                >
                  {slot.userLabel ?? slot.label}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
