import { WORLD_SPHERE_DESTINATIONS } from './worldSphereConfig'

export default function WorldSphere({ onBack, onNavigate }) {
  return (
    <div className="world-sphere">
      <button className="profile-back" onClick={onBack}>← Back</button>

      <div className="world-sphere-header">
        <h1 className="world-sphere-title">World Sphere</h1>
      </div>

      <div className="world-sphere-grid">
        {WORLD_SPHERE_DESTINATIONS.map(dest => (
          <button
            key={dest.id}
            className={[
              'world-sphere-btn',
              !dest.available ? 'world-sphere-btn--locked' : '',
            ].join(' ').trim()}
            onClick={() => dest.available && onNavigate(dest.id)}
            disabled={!dest.available}
          >
            <span className="world-sphere-btn-label">{dest.label}</span>
            {dest.description && (
              <span className="world-sphere-btn-description">{dest.description}</span>
            )}
            {!dest.available && (
              <span className="world-sphere-btn-soon">Coming soon</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
