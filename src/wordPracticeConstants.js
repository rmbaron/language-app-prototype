// Word practice system — shared constants.
// All tuning values live here; never inline them in mechanics or scoring code.

// Practice mode can bring mastery up to this fraction at most.
// (Cannot replace world-sphere lane completion — only supplements it.)
export const CEILING_CAP = 0.75

// Attempts through practice count at this multiplier vs. lane completion attempts.
export const WEIGHT_MULTIPLIER = 0.5

// Atoms that require a complement word to follow them in a sentence.
// Used by what_comes_next mechanic to know which atoms are eligible.
export const COMPLEMENT_REQUIRING_ATOMS = ['modal_auxiliary', 'auxiliary']
