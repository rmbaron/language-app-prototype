// Object Acceptance — English
//
// What structures the O slot accepts. Now a one-line derivation from the
// shared registry's Wire G — `structuresForFunction('O')` returns every
// phrase whose `functions` array includes 'O'. Single source of truth lives
// in src/forwardFlow/structures.en.js.
//
// O-specific consideration: bare_infinitive_clause (small clauses like
// "made him cry") is a research-blocked redesign per the o_unit memory.
// For now, treat the small-clause material as an O-Co frame (handled by
// the verb's frame system) rather than a separate structure here.

import { structuresForFunction } from '../../structures.en.js'

export const OBJECT_ACCEPTS = structuresForFunction('O').map(s => s.id)
