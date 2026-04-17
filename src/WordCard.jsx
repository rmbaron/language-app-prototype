import LaneStatusBar from './LaneStatusBar'

export default function WordCard({ word, wordProgress, status = 'banked', onSelect }) {
  const { fullyUnlocked, lanes, mastery } = wordProgress ?? {}

  return (
    <div className={`word-card word-card--${status}`} onClick={onSelect}>
      <div className="word-card-main">
        <div className="word-card-left">
          <span className="word-base">{word.baseForm}</span>
          <span className="word-category">{word.classifications.grammaticalCategory}</span>
        </div>
        <div className="word-card-right">
          {!fullyUnlocked && lanes && <LaneStatusBar laneProgress={lanes} />}
          <span className={`word-status-dot word-status-dot--${status}`} title={status} />
        </div>
      </div>
      {fullyUnlocked && (
        <div className="word-card-mastery">
          <div className="word-card-mastery-track">
            {/* Future: segment this track into 4 lane sections as mastery grows per-lane */}
            <div className="word-card-mastery-fill" style={{ width: `${mastery}%` }} />
          </div>
          <span className="word-card-mastery-pct">{mastery}%</span>
        </div>
      )}
    </div>
  )
}
