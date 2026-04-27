// World Sphere destination config — single place to define all branches.
// IDs are stable localStorage keys (lapp-gate-{id}) — do not rename without
// migrating the corresponding gate config in localStorage.

export const WORLD_SPHERE_DESTINATIONS = [
  {
    id: 'practice',
    label: 'Practice',
    description: 'Use the language freely.',
  },
  {
    id: 'friend',
    label: 'Friend',
    description: 'Your companion, always in the language.',
  },
  {
    id: 'experiences',
    label: 'Experiences',
    description: 'Situational scenarios to navigate.',
  },
  {
    id: 'outside',
    label: 'Outside',
    description: 'Real media and culture.',
  },
]
