// Verb Frames — Bootstrap (TEMPORARY layer)
//
// Compact frame assignments for verbs whose L2 enrichment hasn't supplied
// frames yet. The reader in frames.en.js prefers the verb's L2 frames when
// present and falls back to this map otherwise. As verbs get L2-enriched
// (via API or manual setup), they drop off this list — bootstrap should
// shrink toward zero, never grow.
//
// Format: { [baseForm]: [ { id, example, notes? }, ... ] }
//   id      — frame template id from FRAME_TEMPLATES in frames.en.js
//   example — verb-specific example sentence
//   notes   — verb-specific notes (optional; defaults to template description)
//
// Add a verb here ONLY if it can't yet receive L2 enrichment. The proper
// home for frames is each verb's L2 record on the word registry, not this
// file. Treat additions as a debt: every entry here is a verb the API
// will eventually need to cover.

export const VERB_FRAMES_BOOTSTRAP = {
  run: [
    { id: 'intransitive', example: 'She runs.',
      notes: 'Pure motion verb with no object. A directional adverbial ("to the store") attaches as a free adjunct, not as an argument.' },
  ],

  eat: [
    { id: 'intransitive', example: 'She eats.',
      notes: 'Eat can be used without an object — implies eating in general or eating a meal.' },
    { id: 'transitive',   example: 'She eats food.',
      notes: 'Object specifies what is eaten. Most common frame.' },
  ],

  give: [
    { id: 'ditransitive',  example: 'He gave me a book.',
      notes: 'Two objects: indirect (recipient) before direct (theme).' },
    { id: 'dative-shift',  example: 'He gave a book to me.',
      notes: 'Dative shift: direct object precedes a to-PP encoding the recipient. Same meaning as ditransitive, different surface arrangement.' },
  ],

  live: [
    { id: 'locative-required', example: 'He lives in London.',
      notes: '"He lives." alone is ungrammatical. Live demands a locative adverbial as an obligatory argument, not a free adjunct.' },
  ],

  put: [
    { id: 'svoa-required', example: 'She put the book on the table.',
      notes: '"She put the book." alone is ungrammatical. Put demands both an object and a locative adverbial as obligatory arguments.' },
  ],

  make: [
    { id: 'transitive',       example: 'She makes bread.',
      notes: 'Most basic creation sense. Object is what is created.' },
    { id: 'svoc-attributive', example: 'She makes him happy.',
      notes: 'Object Complement attributes a property to the object. The complement predicates over the object, not the subject.' },
  ],

  be: [
    { id: 'copular', example: 'She is happy.',
      notes: 'Be links the subject to a Subject Complement (AdjP, NP, or PP). The most common copular verb; others (seem, become, appear) follow the same frame.' },
  ],

  seem: [
    { id: 'copular', example: 'She seems tired.',
      notes: 'Seem is a copular verb of inference/perception. Takes Cs (typically AdjP). Cannot stand alone — "She seems." is ungrammatical.' },
  ],

  become: [
    { id: 'copular', example: 'She became a doctor.',
      notes: 'Become is a copular verb of change-of-state. Takes Cs (NP or AdjP).' },
  ],

  appear: [
    { id: 'copular', example: 'She appears tired.',
      notes: 'Appear used as copular (perception). Other senses (intransitive "She appeared on stage") aren\'t covered by this frame.' },
  ],
}
