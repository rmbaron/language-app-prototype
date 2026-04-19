import { getStrings } from './uiStrings'
import { getInterfaceLanguage } from './learnerProfile'

export default function FunctionUnlock({ functionKey }) {
  const s    = getStrings(getInterfaceLanguage())
  const text = s.celestial.functions[functionKey]
  if (!text) return null
  return (
    <p className="function-unlock">{text}</p>
  )
}
