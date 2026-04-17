// Hub destination config — the single place to change button labels,
// descriptions, and availability. Nothing in the Hub UI is hardcoded.
//
// size:      'large' renders as a square tile | 'wide' spans the full row
// available: false = visible but locked (greyed, not clickable)

export const HUB_DESTINATIONS = [
  {
    id: 'wordBank',
    label: 'Word Bank',
    description: 'Add, study, and track your words.',
    size: 'large',
    available: true,
  },
  {
    id: 'worldSphere',
    label: 'World Sphere',
    description: 'Use the language you\'ve built.',
    size: 'large',
    available: true,
  },
  {
    id: 'quickTranslate',
    label: 'Quick Translate',
    description: null,
    size: 'wide',
    available: false,
  },
]
