// Adverbial Acceptance — English
//
// What structures the A slot accepts. Now a one-line derivation from the
// shared registry's Wire G — `structuresForFunction('A')` returns every
// phrase whose `functions` array includes 'A'. Single source of truth lives
// in src/forwardFlow/structures.en.js.
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

import { structuresForFunction } from '../../structures.en.js'

export const ADVERBIAL_ACCEPTS = structuresForFunction('A').map(s => s.id)

// Role label by frame. SVA / SVOA mean A is an ARGUMENT (in the frame);
// any other frame with leftover tokens means A is an ADJUNCT (free).
export const ADVERBIAL_ARGUMENT_FRAMES = new Set(['SVA', 'SVOA'])
