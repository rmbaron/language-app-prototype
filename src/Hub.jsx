import { HUB_DESTINATIONS } from './hubConfig'

export default function Hub({ onNavigate }) {
  return (
    <div className="hub">
      <div className="hub-header">
        <h1 className="hub-title">LangApp</h1>
      </div>

      <div className="hub-grid">
        {HUB_DESTINATIONS.map(dest => (
          <button
            key={dest.id}
            className={[
              'hub-btn',
              `hub-btn--${dest.size}`,
              !dest.available ? 'hub-btn--locked' : '',
            ].join(' ').trim()}
            onClick={() => dest.available && onNavigate(dest.id)}
            disabled={!dest.available}
          >
            <span className="hub-btn-label">{dest.label}</span>
            {dest.description && (
              <span className="hub-btn-description">{dest.description}</span>
            )}
            {!dest.available && (
              <span className="hub-btn-soon">Coming soon</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
