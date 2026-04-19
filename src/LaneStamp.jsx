import { getStrings } from './uiStrings'
import { getInterfaceLanguage } from './learnerProfile'

export default function LaneStamp({ lane }) {
  const s = getStrings(getInterfaceLanguage())
  return (
    <div className="lane-stamp">
      <span className="lane-stamp-name">{s.common.lanes[lane]}</span>
      <span className="lane-stamp-check">✓</span>
    </div>
  )
}
