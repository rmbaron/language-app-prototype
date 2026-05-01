// Verb Argument Structures — English
//
// Per-verb declaration of which slot patterns the verb permits.
// This is the central engine of the macro layer: once a verb is identified
// in a sentence, its argument structure announces what slots come next.
//
// Truth: argument structure is an intrinsic linguistic property of the verb,
// not a curatorial choice. "Eat" objectively can be intransitive or transitive;
// "give" objectively requires three arguments; "live" objectively requires a
// locative complement.
//
// ── Record shape ──────────────────────────────────────────────────────────
//   verbId      — string, matches the word's id in wordSeed.en.json
//   baseForm    — string, the verb's base form (for display)
//   inSeed      — boolean, whether this verb has a record in wordSeed.en.json
//                 (declared anyway for verbs not yet seeded — architecture demo)
//   frames      — array of one or more frames the verb permits
//
// ── Frame shape ───────────────────────────────────────────────────────────
//   id          — string, frame identifier (intransitive, transitive, etc.)
//   label       — string, human-readable frame name
//   slots       — array of slot-role short labels in canonical order: ['S','V','O',...]
//                 NOTE: a slot can appear twice (e.g. SVOO has slots ['S','V','O','O'])
//   example     — string, sentence demonstrating the frame
//   notes       — string, explanatory note (one or two sentences)
//   slotNotes   — optional map { slotIndex: string } for per-slot notes
//                 (used to mark obligatory adverbials, complement types, etc.)
//
// All slots in the frame are obligatory by default. Optionality is encoded
// by separate frames (e.g. "intransitive" + "transitive" frames for verbs
// whose object is optional), not by marking individual slots optional.
//
// Free adjuncts (yesterday, in the kitchen, quickly, etc.) attach to any
// clause without being declared here. This file enumerates ARGUMENT structure
// only — the slots a verb selects — not adjunct positions.
//
// Source of truth for the macro-layer architecture: notes/macro-layer-sketch.md
//
// Router: argumentStructures.js

export const VERB_ARGUMENT_STRUCTURES = [
  {
    verbId:   'run',
    baseForm: 'run',
    inSeed:   true,
    frames: [
      {
        id:      'intransitive',
        label:   'Intransitive',
        slots:   ['S', 'V'],
        example: 'She runs.',
        notes:   'Pure motion verb with no object. A directional adverbial ("to the store") attaches as a free adjunct, not as an argument.',
      },
    ],
  },
  {
    verbId:   'eat',
    baseForm: 'eat',
    inSeed:   true,
    frames: [
      {
        id:      'intransitive',
        label:   'Intransitive',
        slots:   ['S', 'V'],
        example: 'She eats.',
        notes:   'Eat can be used without an object — implies eating in general or eating a meal.',
      },
      {
        id:      'transitive',
        label:   'Transitive',
        slots:   ['S', 'V', 'O'],
        example: 'She eats food.',
        notes:   'Object specifies what is eaten. Most common frame.',
      },
    ],
  },
  {
    verbId:   'give',
    baseForm: 'give',
    inSeed:   true,
    frames: [
      {
        id:      'ditransitive',
        label:   'Ditransitive (SVOO)',
        slots:   ['S', 'V', 'O', 'O'],
        example: 'He gave me a book.',
        notes:   'Two objects: indirect (recipient) before direct (theme).',
        slotNotes: { 2: 'Indirect Object (recipient)', 3: 'Direct Object (theme)' },
      },
      {
        id:      'dative-shift',
        label:   'Dative shift (SVOA)',
        slots:   ['S', 'V', 'O', 'A'],
        example: 'He gave a book to me.',
        notes:   'Dative shift: direct object precedes a to-PP encoding the recipient. Same meaning as ditransitive, different surface arrangement.',
        slotNotes: { 2: 'Direct Object (theme)', 3: 'Obligatory adverbial — to-PP (recipient)' },
      },
    ],
  },
  {
    verbId:   'live',
    baseForm: 'live',
    inSeed:   true,
    frames: [
      {
        id:      'locative-required',
        label:   'Locative-required (SVA)',
        slots:   ['S', 'V', 'A'],
        example: 'He lives in London.',
        notes:   '"He lives." alone is ungrammatical. Live demands a locative adverbial as an obligatory argument, not a free adjunct.',
        slotNotes: { 2: 'Obligatory locative adverbial' },
      },
    ],
  },
  {
    verbId:   'put',
    baseForm: 'put',
    inSeed:   true,
    frames: [
      {
        id:      'svoa-required',
        label:   'Required-SVOA',
        slots:   ['S', 'V', 'O', 'A'],
        example: 'She put the book on the table.',
        notes:   '"She put the book." alone is ungrammatical. Put demands both an object and a locative adverbial as obligatory arguments.',
        slotNotes: { 3: 'Obligatory locative adverbial — destination of placement' },
      },
    ],
  },
  {
    verbId:   'make',
    baseForm: 'make',
    inSeed:   true,
    frames: [
      {
        id:      'transitive',
        label:   'Transitive (create)',
        slots:   ['S', 'V', 'O'],
        example: 'She makes bread.',
        notes:   'Most basic creation sense. Object is what is created.',
      },
      {
        id:      'svoc-attributive',
        label:   'Attributive (SVOC)',
        slots:   ['S', 'V', 'O', 'C'],
        example: 'She makes him happy.',
        notes:   'Object Complement attributes a property to the object. The complement predicates over the object, not the subject.',
        slotNotes: { 3: 'Object Complement (Co) — predicates over the Object' },
      },
    ],
  },
  {
    verbId:   'be',
    baseForm: 'be',
    inSeed:   true,
    frames: [
      {
        id:      'copular',
        label:   'Copular (SVC)',
        slots:   ['S', 'V', 'C'],
        example: 'She is happy.',
        notes:   'Be links the subject to a Subject Complement (AdjP, NP, or PP). The most common copular verb; others (seem, become, appear) follow the same frame.',
        slotNotes: { 2: 'Subject Complement (Cs) — predicates over the Subject. Can be AdjP ("happy"), NP ("a teacher"), or PP ("in the garden")' },
      },
    ],
  },
]
