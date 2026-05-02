// Adverbial Acceptance — English
//
// Adverbial is the first slot whose role label depends on the verb's frame
// rather than just on filling. There are two flavors:
//
//   • argument adverbial — verb's frame requires it (live → SVA, put → SVOA).
//     "She lives in London." "She put the book on the table."
//   • adjunct adverbial  — verb's frame doesn't require it; it's free-attaching.
//     "She runs in the park." "She arrived yesterday." "She speaks quickly."
//
// Same structure detector either way — the role label comes from comparing
// the detected A region to the frame.
//
// v1 scope: end-position A only (after V/O/C). Medial ("She often runs")
// and initial ("Yesterday she arrived") A are deferred — they require
// shifting forward-flow's left-to-right consumption order.

export const ADVERBIAL_ACCEPTS = [
  // PP — most common A form. "in the garden", "on Monday", "with care"
  'pp_basic',
  // AdvP — "quickly", "yesterday", "very carefully", "here", "often"
  'advp_basic',
  // NP — "yesterday" alone is treated as advp; "every day", "next Monday"
  // would surface as np_basic with the frame saying "this NP is acting as A"
  'np_basic',
  // Infinitive purpose ("to stay healthy") — catalog-only in v1
  'infinitive_phrase',
  // Subordinate clause ("because she was tired") — catalog-only in v1
  'clausal',
]

// Role label by frame. SVA / SVOA mean A is an ARGUMENT (in the frame);
// any other frame with leftover tokens means A is an ADJUNCT (free).
export const ADVERBIAL_ARGUMENT_FRAMES = new Set(['SVA', 'SVOA'])
