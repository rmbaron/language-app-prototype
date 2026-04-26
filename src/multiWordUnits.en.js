// Hardcoded test set for modal triggers — used in Circuit Test "test mode" only
export const TEST_MODAL_TRIGGERS = ['will', 'can', 'could', 'should', 'must', 'may', 'might', 'shall', 'would']

// Multi-word units — English
// These are recognized as single tokens before space-splitting.
// Sorted longest-first so longest match always wins.

export const FIXED_UNITS = [
  // 3-word prepositional phrases
  { id: 'in_front_of',  text: 'in front of',  atomClass: 'preposition' },
  { id: 'on_top_of',    text: 'on top of',    atomClass: 'preposition' },
  { id: 'on_behalf_of', text: 'on behalf of', atomClass: 'preposition' },
  { id: 'in_spite_of',  text: 'in spite of',  atomClass: 'preposition' },
  { id: 'a_lot_of',     text: 'a lot of',     atomClass: 'determiner'  },
  // 3-word conjunctions
  { id: 'as_soon_as',   text: 'as soon as',   atomClass: 'conjunction' },
  { id: 'as_long_as',   text: 'as long as',   atomClass: 'conjunction' },
  { id: 'as_well_as',   text: 'as well as',   atomClass: 'conjunction' },
  // 2-word prepositional phrases
  { id: 'next_to',      text: 'next to',      atomClass: 'preposition' },
  { id: 'because_of',   text: 'because of',   atomClass: 'preposition' },
  { id: 'out_of',       text: 'out of',       atomClass: 'preposition' },
  { id: 'instead_of',   text: 'instead of',   atomClass: 'preposition' },
  { id: 'in_front',     text: 'in front',     atomClass: 'preposition' },
  // 2-word conjunctions
  { id: 'even_though',  text: 'even though',  atomClass: 'conjunction' },
  { id: 'so_that',      text: 'so that',      atomClass: 'conjunction' },
  { id: 'as_if',        text: 'as if',        atomClass: 'conjunction' },
]
