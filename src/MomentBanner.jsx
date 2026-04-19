import { getStrings } from './uiStrings'
import { getInterfaceLanguage } from './learnerProfile'

export default function MomentBanner({ title, subtitle, onDismiss }) {
  const s = getStrings(getInterfaceLanguage())
  if (!title) return null
  return (
    <div className="moment-banner">
      <div className="moment-banner-body">
        <p className="moment-banner-title">{title}</p>
        {subtitle && <p className="moment-banner-subtitle">{subtitle}</p>}
      </div>
      {onDismiss && (
        <button
          className="moment-banner-dismiss"
          onClick={onDismiss}
          aria-label={s.celestial.bannerDismiss}
        >
          {s.celestial.bannerDismiss}
        </button>
      )}
    </div>
  )
}
