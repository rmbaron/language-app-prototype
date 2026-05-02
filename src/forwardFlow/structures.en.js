// Shared Structure Registry — English
//
// The factorial-reducing layer. Where Subject and Object today each have
// their own shape catalogs (parallel and largely redundant), this is the
// single registry of the structures themselves — the things that fill
// slots. A "slot" is a role (S, V, O, C, A); a "structure" is what fills
// it. Each structure is defined ONCE here; slots reference structures via
// their unit's acceptance declaration.
//
// Complement is the first unit built against this registry — it has no
// parallel catalog of its own. Subject and Object will eventually migrate
// here too (separate session), at which point S and O's per-unit catalogs
// collapse and operations (coordination, partitive, post-modifier) move
// out of those catalogs into a real operations layer.
//
// ── Record shape ──────────────────────────────────────────────────────────
//   id          — string, machine-readable id
//   family      — id from SHAPE_FAMILIES (shapeFamilies.en.js)
//   label       — human-readable name
//   description — what the structure is + when it shows up
//   pattern     — schematic (composition, not enumeration)
//   examples    — array of { sentence, highlight }
//   detected    — boolean: does any detector currently emit this id?
//                 false ⇒ catalog-only until detection grows.
//   functions   — Wire G: array of grammatical functions this phrase can
//                 serve (subset of ['S','O','C','A']). The per-unit
//                 acceptance.en.js files (subject/object/complement/
//                 adverbial) are now downstream views of this — they should
//                 be rewritten as derivations: pick phrases whose `functions`
//                 includes the unit's slot id. For now both sources coexist
//                 during the Floor 2 alignment; the acceptance files will
//                 collapse to one-line derivations in a follow-on move.
//
// Operations (coordination, partitive, possessive 's, post-modifier) are
// orthogonal to structures — they wrap or extend a structure. Not listed
// here; they live in their own catalog when the operations layer lands.
// Forward-flow signals like the next-token "and" can announce coordination
// without restructuring this registry.

export const STRUCTURES = [
  // ── Bare / atomic family ───────────────────────────────────────────────
  {
    id:          'bare_pronominal',
    family:      'bare_atomic',
    label:       'Bare pronominal',
    description: 'A single pronominal element: personal pronoun, demonstrative used pronominally, indefinite. Slot closes immediately. Case (subject I/he/she vs object me/him/her) is an atom-level concern, not a structure concern.',
    pattern:     '[pronominal]',
    functions:   ['S', 'O', 'C'],
    examples: [
      { sentence: 'I run.',                  highlight: 'I' },
      { sentence: 'She loves me.',           highlight: 'me' },
      { sentence: "It's me.",                highlight: 'me' },
      { sentence: 'This works.',             highlight: 'This' },
    ],
    detected:    true,
  },
  {
    id:          'proper_noun',
    family:      'bare_atomic',
    label:       'Proper noun',
    description: 'A name (John, Mary, Tokyo). No determiner needed because the name uniquely identifies its referent.',
    pattern:     '[proper_noun]',
    functions:   ['S', 'O', 'C'],
    examples: [
      { sentence: 'John runs.',              highlight: 'John' },
      { sentence: 'She loves John.',         highlight: 'John' },
    ],
    detected:    true,
  },

  // ── NP family ──────────────────────────────────────────────────────────
  {
    id:          'np_basic',
    family:      'np',
    label:       'Basic noun phrase',
    description: 'A noun-headed phrase: optional opener (determiner or quantifier), optional adjective(s), then a noun.',
    pattern:     '[determiner|quantifier]? [adjective(s)]? [noun]',
    functions:   ['S', 'O', 'C', 'A'],
    examples: [
      { sentence: 'The dog runs.',           highlight: 'The dog' },
      { sentence: 'She is a teacher.',       highlight: 'a teacher' },
      { sentence: 'A small red car arrives.',highlight: 'A small red car' },
      { sentence: 'Water is wet.',           highlight: 'Water' },
    ],
    detected:    true,
  },
  {
    id:          'np_with_postmodifier',
    family:      'np',
    label:       'NP with post-modifier',
    description: "A noun phrase extended by a post-modifier: PP (\"the man on the corner\"), relative clause (\"the woman who left\"), appositive, or participle (\"the dog barking outside\"). Possessive 's structures live here pending the operations layer.",
    pattern:     '[np] [PP | relative-clause | appositive | participle]',
    functions:   ['S', 'O'],
    examples: [
      { sentence: 'The man on the corner waved.',     highlight: 'The man on the corner' },
      { sentence: 'I met the woman who left.',        highlight: 'the woman who left' },
      { sentence: 'The dog barking outside is loud.', highlight: 'The dog barking outside' },
    ],
    detected:    true,
  },

  // ── Cross-family operations (pending operations layer) ────────────────
  {
    id:          'coordinated',
    family:      'cross_family',
    label:       'Coordinated',
    description: 'Two or more constituents joined by "and" or "or" (n-way: A, B, and C). Cuts across families — coordination wraps any structure. Will move out of cross_family when the operations layer lands.',
    pattern:     '[X] (, [X])* (and|or) [X]',
    functions:   ['S', 'O'],
    examples: [
      { sentence: 'John and Mary arrived.',        highlight: 'John and Mary' },
      { sentence: 'She eats apples and bread.',    highlight: 'apples and bread' },
      { sentence: 'Tea or coffee is fine.',        highlight: 'Tea or coffee' },
    ],
    detected:    true,
  },
  {
    id:          'partitive',
    family:      'cross_family',
    label:       'Partitive (some of …)',
    description: 'Quantifier or measure phrase + "of" + NP: "some of the water", "three of the boys". Agreement follows the NP after "of".',
    pattern:     '[quantifier|measure] of [np]',
    functions:   ['S', 'O'],
    examples: [
      { sentence: 'Some of the water is gone.',    highlight: 'Some of the water' },
      { sentence: 'She drank some of the water.',  highlight: 'some of the water' },
    ],
    detected:    true,
  },

  // ── AdjP family ────────────────────────────────────────────────────────
  {
    id:          'adjp_basic',
    family:      'adjp',
    label:       'Adjective phrase',
    description: 'Adjective-headed phrase. Optional degree modifier (very, quite, extremely, so) + head adjective. PP complement ("happy with the result") is a future extension.',
    pattern:     '[degree]? [adjective]',
    functions:   ['C'],
    examples: [
      { sentence: 'She is happy.',           highlight: 'happy' },
      { sentence: 'She is very happy.',      highlight: 'very happy' },
      { sentence: 'She seems tired.',        highlight: 'tired' },
      { sentence: 'She makes him happy.',    highlight: 'happy' },
    ],
    detected:    true,
  },

  // ── PP family ──────────────────────────────────────────────────────────
  {
    id:          'pp_basic',
    family:      'pp',
    label:       'Prepositional phrase',
    description: 'Preposition + NP. The same structure fills predicative complement slots ("She is in the garden") and adverbial slots ("She lives in London").',
    pattern:     '[preposition] [np]',
    functions:   ['C', 'A'],
    examples: [
      { sentence: 'She is in the garden.',   highlight: 'in the garden' },
      { sentence: 'He is at home.',          highlight: 'at home' },
      { sentence: 'She lives in London.',    highlight: 'in London' },
    ],
    detected:    true,
  },

  // ── AdvP family ────────────────────────────────────────────────────────
  {
    id:          'advp_basic',
    family:      'advp',
    label:       'Adverb phrase',
    description: 'Adverb-headed phrase. Optional degree modifier + head adverb. Fills adverbial slots — manner ("quickly"), time ("yesterday"), place ("here"), frequency ("often").',
    pattern:     '[degree]? [adverb]',
    functions:   ['A'],
    examples: [
      { sentence: 'She runs quickly.',       highlight: 'quickly' },
      { sentence: 'She runs very quickly.',  highlight: 'very quickly' },
      { sentence: 'She arrived yesterday.',  highlight: 'yesterday' },
      { sentence: 'She lives here.',         highlight: 'here' },
    ],
    detected:    true,
  },

  // ── Gerund family ──────────────────────────────────────────────────────
  {
    id:          'gerund_phrase',
    family:      'gerund',
    label:       'Gerund phrase',
    description: 'An -ing form acting as a noun, optionally with internal arguments. Fills S, O, and C slots.',
    pattern:     '[verb-ing] [internal-args]?',
    functions:   ['S', 'O', 'C'],
    examples: [
      { sentence: 'Swimming is fun.',                   highlight: 'Swimming' },
      { sentence: 'Her job is reading manuscripts.',    highlight: 'reading manuscripts' },
      { sentence: 'I enjoy swimming.',                  highlight: 'swimming' },
    ],
    detected:    false,
  },

  // ── Infinitive family ──────────────────────────────────────────────────
  {
    id:          'infinitive_phrase',
    family:      'infinitive',
    label:       'Infinitive phrase',
    description: 'A "to" + bare-verb form, optionally with internal arguments. Fills S, O, C, and A slots (purpose adverbial).',
    pattern:     'to [verb-base] [internal-args]?',
    functions:   ['S', 'O', 'C', 'A'],
    examples: [
      { sentence: 'To err is human.',                   highlight: 'To err' },
      { sentence: 'I want to leave.',                   highlight: 'to leave' },
      { sentence: 'Her plan is to leave.',              highlight: 'to leave' },
    ],
    detected:    false,
  },
  {
    id:          'for_to_infinitive',
    family:      'infinitive',
    label:       'For-to infinitive',
    description: 'A "for [NP] to [verb]" construction acting as the subject: "For her to leave now would be a mistake". The for-NP supplies the implicit subject of the infinitive.',
    pattern:     'for [np] to [verb-base] (...)',
    functions:   ['S'],
    examples: [
      { sentence: 'For her to leave now would be a mistake.', highlight: 'For her to leave now' },
      { sentence: 'For us to win seems unlikely.',            highlight: 'For us to win' },
    ],
    detected:    true,
  },

  // ── Clausal family ─────────────────────────────────────────────────────
  {
    id:          'clausal',
    family:      'clausal',
    label:       'Clausal',
    description: 'A whole clause: that-clause, wh-clause, or free-relative. Slot-specific names (clausal_subject, clausal_object) appear in S/O catalogs; the structure itself is one thing. Note: this is a Floor-3 (Clause) thing surfacing as a Floor-2 phrase entry; treat as a holding pen pending an "embedded clause" framing.',
    pattern:     '[that|wh-word] [S V ...]',
    functions:   ['S', 'O', 'C', 'A'],
    examples: [
      { sentence: 'That she left surprised us.',        highlight: 'That she left' },
      { sentence: 'I think that she is happy.',         highlight: 'that she is happy' },
      { sentence: 'The truth is that she left.',        highlight: 'that she left' },
    ],
    detected:    true,
  },
]

// ── Wire G + Wire F derivation helper ──────────────────────────────────
// Wire G: per-unit acceptance.en.js files SHOULD use this instead of
//         maintaining their own list. Migration deferred to a follow-on
//         move to keep the Floor 2 alignment commit focused.
// Wire F: frame templates declare slots (e.g. ['S','V','O']). To resolve
//         "what phrases can fill this frame's slot[i]?", call
//         structuresForFunction(slot[i]). Wire F is therefore Wire G +
//         this helper — no separate field is needed on phrase entries.
//         The verb-side (frames live on verbs, Floor 1 atom data) and
//         the phrase-side (this registry) bridge through the function
//         label that both reference.
export function structuresForFunction(fn) {
  return STRUCTURES.filter(s => s.functions?.includes(fn))
}

export function getStructure(id) {
  return STRUCTURES.find(s => s.id === id) ?? null
}
