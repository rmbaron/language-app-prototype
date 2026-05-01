// LANES — functional properties only.
// Import this in pool logic, scoring, practice systems, and anywhere
// that has nothing to do with how lanes look.
//
// User-facing display labels are NOT here. They live in the string table
// (uiStrings.<lang>.js → common.lanes[laneId]) so they translate per
// interface language. Reach for `s.common.lanes[lane.id]` in components.
export const LANES = [
  { id: 'reading',   modality: 'receptive',  medium: 'text'  },
  { id: 'writing',   modality: 'productive', medium: 'text'  },
  { id: 'listening', modality: 'receptive',  medium: 'audio' },
  { id: 'speaking',  modality: 'productive', medium: 'audio' },
]

// LANE_DISPLAY — UI-only, language-neutral display properties.
// Initials and colors are visual identity, not text content. Swap initials
// for icon nodes, recolor, etc. without touching functional code.
export const LANE_DISPLAY = {
  reading:   { initial: 'R', color: '#3b82f6' },
  writing:   { initial: 'W', color: '#f59e0b' },
  listening: { initial: 'L', color: '#8b5cf6' },
  speaking:  { initial: 'S', color: '#f97316' },
}

// LANE — combined view.
// Import this in UI components that need both functional and display properties.
export const LANE = Object.fromEntries(LANES.map(l => [l.id, { ...l, ...LANE_DISPLAY[l.id] }]))
