// Word practice system — lane config.
// Maps each lane to an ordered list of mechanic IDs.
// Order matters: first available mechanic in the list runs first.
// This is a developer decision — does not change per word or per learner.

export const LANE_MECHANICS = {
  reading:   ['blank_distractor', 'correct_or_not', 'slot_identification', 'slot_game'],
  writing:   ['form_selection', 'what_comes_next', 'chip_assembly', 'slot_game'],
  listening: ['presence_detection', 'form_discrimination', 'slot_game'],
  speaking:  ['prompted_production', 'slot_game'],
}
