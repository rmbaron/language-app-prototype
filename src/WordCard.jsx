import LaneStatusBar from './LaneStatusBar'
import WordMasteryBar from './WordMasteryBar'
import { getStrings } from './uiStrings'
import { getInterfaceLanguage } from './learnerProfile'
import { getGrammaticalGroup } from './classifications'

export default function WordCard({ word, wordProgress, status = 'banked', onSelect }) {
  const s = getStrings(getInterfaceLanguage())
  const { fullyUnlocked, lanes } = wordProgress ?? {}

  // Category label: prefer the user-facing group from classifications (atom-aware),
  // fall back to the L1 grammaticalCategory label from the string table.
  const categoryLabel =
    getGrammaticalGroup(word) ??
    s.common.categories[word.grammaticalCategory] ??
    word.grammaticalCategory ??
    null

  return (
    <div className={`word-card word-card--${status}`} onClick={onSelect}>
      <div className="word-card-main">
        <div className="word-card-left">
          <span className="word-base">{word.baseForm}</span>
          {categoryLabel && <span className="word-category">{categoryLabel}</span>}
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
