// Verb-chain patterns — RETIRED.
//
// All patterns in this file (modal_verb, subject_modal_verb_chain,
// subject_auxiliary, do_support_negation, verb_infinitive_verb) were
// retired during the Floor 2 alignment. They duplicated System B detection
// already done by the verb unit:
//
//   • modal_verb / subject_modal_verb_chain → covered by
//     auxConfigurations.modal_led + the verb unit's chain detector
//     (src/forwardFlow/units/verb/detector.js).
//   • subject_auxiliary / do_support_negation → covered by the do-support
//     auxConfiguration + the verb unit's chain detector.
//   • verb_infinitive_verb → covered by the frame system (verb takes
//     infinitive complement is a frame property, not a separate pattern).
//
// Result: this file exports an empty array. The validator's coverage check
// on modal/negation/infinitive constructions is intentionally a known gap
// pending the grammar-circuit rebuild — see project_unified_system_alignment
// memory and the next-Claude letter for the path forward.
//
// File kept (rather than deleted) so that the import in grammarBreakerPatterns.js
// continues to work without a same-session edit to that aggregator file.
// When the grammar circuit is rebuilt, delete this file and remove the import.

export default []
