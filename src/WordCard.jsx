import LaneStatusBar from './LaneStatusBar'
import WordMasteryBar from './WordMasteryBar'
import { getStrings } from './uiStrings'
import { getInterfaceLanguage } from './learnerProfile'

export default function WordCard({ word, wordProgress, status = 'banked', onSelect }) {
  const s = getStrings(getInterfaceLanguage())
  const { fullyUnlocked, lanes } = wordProgress ?? {}

  return (
    <div className={`word-card word-card--${status}`} onClick={onSelect}>
      <div className="word-card-main">
        <div className="word-card-left">
          <span className="word-base">{word.baseForm}</span>
          <span className="word-category">{s.common.categories[word.classifications.grammaticalCategory] ?? word.classifications.grammaticalCategory}</span>
        </div>
        <div className="word-card-right">
          {!fullyUnlocked && lanes && <LaneStatusBar laneProgress={lanes} />}
          <span className={`word-status-dot word-status-dot--${status}`} title={status} />
        </div>
      </div>
      <div className="word-card-mastery">
        <WordMasteryBar wordId={word.id} label={s.wordBank.mastery} />
      </div>
    </div>
  )
}
