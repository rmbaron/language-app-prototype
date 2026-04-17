// World Sphere destination config — single place to change labels,
// descriptions, and availability for all four branches.
// Nothing in the WorldSphere UI is hardcoded.

export const WORLD_SPHERE_DESTINATIONS = [
  {
    id: 'practice',
    label: 'Practice',
    description: 'Use the language freely.',
    available: true,
  },
  {
    id: 'friend',
    label: 'Friend',
    description: 'Your companion, always in the language.',
    available: false,
  },
  {
    id: 'experiences',
    label: 'Experiences',
    description: 'Situational scenarios to navigate.',
    available: false,
  },
  {
    id: 'outside',
    label: 'Outside',
    description: 'Real media and culture.',
    available: false,
  },
]
