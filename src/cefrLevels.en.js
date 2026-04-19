// CEFR Level definitions for English.
//
// The fundamental structure is THREE bands, each split into two stages:
//   A — Beginner       A1 = entering beginner,     A2 = established beginner
//   B — Intermediate   B1 = entering intermediate, B2 = established intermediate
//   C — Advanced       C1 = entering advanced,     C2 = established advanced / mastery
//
// The band (A/B/C) is the major grouping — crossing from A→B or B→C is a significant
// leap. The number (1→2) reflects deepening within the same band.
//
// Each level can optionally be subdivided (A1.1, A1.2, etc).
// Subdivisions are listed in the `subdivisions` array — empty until needed.
//
// Each level has:
//   id            — canonical identifier used everywhere in the system
//   tier          — 'A' | 'B' | 'C'
//   tierName      — human-readable tier label
//   order         — numeric sort position (1 = lowest, 6 = highest)
//   goal          — one-sentence summary of what the learner can do at this level
//   subdivisions  — optional finer-grained sub-levels (stub array for now)
//   grammarBand   — grammar function IDs that define this level's territory (fill in later)
//   sentenceStructures — sentence patterns available at this level (fill in later)
//
// grammarBand and sentenceStructures are intentionally empty stubs.
// They will be filled in as the app's grammar tree and structure system mature.
// Nothing breaks if they are empty — they are a slot for future logic.

export const LEVELS = [
  {
    id: 'A1',
    tier: 'A',
    tierName: 'Beginner',
    order: 1,
    goal: 'Can handle very basic words, phrases, introductions, and immediate needs.',
    fullGoal: 'Build the first usable engine of language for immediate needs, simple personal information, and very basic everyday interaction. The learner can refer to self and others, point and name things, make very simple statements, ask a few basic questions, negate simple sentences, and handle immediate practical needs.',
    // Sub-levels define which grammar slots phase in at each step within A1.
    // Each sub-level introduces new slots — earlier slots remain active.
    // This is the escalatory structure within the A1 band.
    subdivisions: [
      { id: 'A1.1', label: 'First steps' },
      { id: 'A1.2', label: 'First sentences' },
      { id: 'A1.3', label: 'Say no, ask why' },
      { id: 'A1.4', label: 'Place and belong' },
      { id: 'A1.5', label: 'The full picture' },
    ],

    // Which grammar slots phase in at each sub-level.
    // Separate from subdivisions so escalation order can be adjusted freely
    // without touching slot definitions or sub-level labels.
    slotProgression: [
      { phase: 'A1.1', slots: ['personal_pronoun', 'copular_be', 'present_simple_verbal', 'noun_person', 'noun_place', 'noun_thing', 'noun_abstract'] },
      { phase: 'A1.2', slots: ['basic_clause', 'adjectival_description', 'demonstrative'] },
      { phase: 'A1.3', slots: ['negation', 'interrogative'] },
      { phase: 'A1.4', slots: ['possession', 'locative_prepositional'] },
      { phase: 'A1.5', slots: ['determiner_article'] },
    ],

    // ── Grammar slot categories ───────────────────────────────
    // These are the internal logic pools for A1.
    // NOT UI test categories — these are the system's reasoning layer:
    //   - is this slot unlocked for this learner?
    //   - how populated is its carrier band?
    //   - what should the recommender surface next?
    //
    // Each slot has:
    //   id           — internal identifier
    //   label        — human-readable name
    //   grammarNodes — node IDs from grammarProgression.en.js that cover this slot
    //   carrierBand  — the words that carry this slot's function
    //                  (word IDs where they exist in wordData; forms noted where relevant)
    //   openEnded    — true if vocabulary can expand indefinitely inside this slot
    //                  once unlocked (verbs, nouns, adjectives, location words all are)
    //
    // NOTE: slot 11 (basic determiner/article) has no grammar node yet — gap to fill.
    grammarSlots: [
      {
        id: 'personal_pronoun',
        label: 'Personal pronoun system',
        userLabel: 'People words',
        grammarNodes: ['first_person', 'second_person', 'third_person_neutral', 'third_person_gendered'],
        carrierBand: ['i', 'you', 'he', 'she', 'it', 'we', 'they'],
        openEnded: false,
        coverageCheck: { type: 'category', grammaticalCategory: 'pronoun' },
      },
      {
        id: 'demonstrative',
        label: 'Demonstrative system',
        userLabel: 'Pointing words',
        grammarNodes: ['pointing'],
        carrierBand: ['this', 'that'],
        openEnded: false,
        coverageCheck: { type: 'specificWords', wordIds: ['this', 'that'] },
      },
      {
        id: 'copular_be',
        label: 'Copular / be system',
        userLabel: 'Is / are words',
        grammarNodes: ['state_being'],
        carrierBand: ['be'],
        openEnded: false,
        coverageCheck: { type: 'specificWords', wordIds: ['be'] },
      },
      {
        id: 'present_simple_verbal',
        label: 'Present simple verbal system',
        userLabel: 'Action words',
        grammarNodes: ['action_verb'],
        carrierBand: ['want', 'go', 'like', 'eat', 'see', 'have'],
        openEnded: true,
        // minDepth inherited from CATEGORY_MIN_DEPTH.verb in cefrLevels.js
        coverageCheck: { type: 'category', grammaticalCategory: 'verb', excludeIds: ['be'] },
      },
      // Noun vocabulary is split by semantic sub-type, keyed by the AI-filled
      // `semanticSubtype` attribute (see ATTRIBUTE_SCHEMA in wordAttributes.js).
      // At A1 the four active values are: person, place, thing, abstract.
      // At higher levels, new values and slots can be added without touching
      // existing word entries — the AI re-fills semanticSubtype at whatever
      // granularity the new level needs.
      {
        id: 'noun_person',
        label: 'Person nouns',
        userLabel: 'Person words',
        grammarNodes: [],
        carrierBand: ['friend', 'person', 'man', 'woman'],
        openEnded: true,
        coverageCheck: { type: 'attribute', key: 'semanticSubtype', value: 'person' },
      },
      {
        id: 'noun_place',
        label: 'Place nouns',
        userLabel: 'Location words',
        grammarNodes: [],
        carrierBand: ['house'],
        openEnded: true,
        coverageCheck: { type: 'attribute', key: 'semanticSubtype', value: 'place' },
      },
      {
        id: 'noun_thing',
        label: 'Thing nouns',
        userLabel: 'Thing words',
        grammarNodes: [],
        carrierBand: ['food', 'water'],
        openEnded: true,
        coverageCheck: { type: 'attribute', key: 'semanticSubtype', value: 'thing' },
      },
      {
        id: 'noun_abstract',
        label: 'Abstract nouns',
        userLabel: 'Idea words',
        grammarNodes: [],
        carrierBand: ['day', 'time'],
        openEnded: true,
        coverageCheck: { type: 'attribute', key: 'semanticSubtype', value: 'abstract' },
      },
      {
        id: 'basic_clause',
        label: 'Basic clause structure',
        userLabel: 'Sentence shape',
        grammarNodes: ['action_verb', 'state_being'],
        carrierBand: [],
        openEnded: false,
        coverageCheck: { type: 'structural' },
        note: 'Structural slot — S+V, S+V+O, S+be+Adj/Noun. Enabled by verbal and copular slots.',
      },
      {
        id: 'adjectival_description',
        label: 'Adjectival description',
        userLabel: 'Describing words',
        grammarNodes: ['basic_adjective'],
        carrierBand: ['good', 'big', 'small', 'hot', 'cold', 'happy'],
        openEnded: true,
        // minDepth inherited from CATEGORY_MIN_DEPTH.adjective in cefrLevels.js
        coverageCheck: { type: 'category', grammaticalCategory: 'adjective' },
      },
      {
        id: 'negation',
        label: 'Negation',
        userLabel: 'No / not words',
        grammarNodes: ['negation'],
        carrierBand: ['not'],
        openEnded: false,
        coverageCheck: { type: 'specificWords', wordIds: ['not'] },
      },
      {
        id: 'interrogative',
        label: 'Interrogative structure',
        userLabel: 'Question words',
        grammarNodes: ['question_function'],
        carrierBand: ['what', 'where', 'who', 'how'],
        openEnded: false,
        coverageCheck: { type: 'specificWords', wordIds: ['what', 'where', 'who', 'how'] },
      },
      {
        id: 'possession',
        label: 'Possession',
        userLabel: 'Ownership words',
        grammarNodes: ['possession'],
        carrierBand: ['i', 'you', 'he', 'she'],
        openEnded: false,
        coverageCheck: { type: 'specificWords', wordIds: ['i', 'you', 'he', 'she'] },
        note: 'Possessive forms (my, your, his, her) live on these pronouns.',
      },
      {
        id: 'locative_prepositional',
        label: 'Locative / prepositional structure',
        userLabel: 'Place words',
        grammarNodes: ['basic_prepositions'],
        carrierBand: ['in', 'on', 'at', 'here', 'there'],
        openEnded: true,
        // minDepth inherited from CATEGORY_MIN_DEPTH.preposition in cefrLevels.js
        coverageCheck: { type: 'category', grammaticalCategory: 'preposition' },
      },
      {
        id: 'determiner_article',
        label: 'Basic determiner / article structure',
        userLabel: 'A / the words',
        grammarNodes: [],
        carrierBand: ['a', 'an', 'the', 'some', 'any'],
        openEnded: false,
        coverageCheck: { type: 'category', grammaticalCategory: 'determiner' },
        note: 'No grammar node yet. No words in wordData yet. Gap to fill.',
      },
    ],

    // Grammar node IDs from grammarProgression.en.js that fall within A1 territory.
    // Flat list for quick system lookups — derived from grammarSlots above.
    grammarBand: [
      'first_person', 'second_person', 'third_person_neutral', 'third_person_gendered',
      'pointing', 'state_being', 'action_verb', 'basic_adjective',
      'negation', 'question_function', 'possession', 'basic_prepositions',
    ],

    // Sentence patterns the learner should be able to handle at A1.
    sentenceStructures: [
      { id: 'labeling',    pattern: '[demonstrative] + [noun]',                       example: 'this water' },
      { id: 'state',       pattern: '[subject] + [be] + [adjective]',                 example: 'it is big' },
      { id: 'sv',          pattern: '[subject] + [verb]',                              example: 'I go' },
      { id: 'svo',         pattern: '[subject] + [verb] + [noun]',                    example: 'I want water' },
      { id: 'negation',    pattern: '[subject] + [don\'t] + [verb] + [noun]',         example: 'I don\'t want water' },
      { id: 'question',    pattern: '[question word] + [be] + [subject/noun]',        example: 'where is the house?' },
      { id: 'possession',  pattern: '[possessive] + [noun] + [be] + [location/adj]',  example: 'my book is here' },
    ],

    // What the recommender should optimise for at this level.
    // Two distinct modes:
    //   function_unlock — a slot category is missing → recommend its carrier words
    //   vocab_depth     — all slots covered → widen carrier bands in open-ended slots
    recommenderGoal: 'Build the first sentence engine. Cover missing slot categories before widening vocabulary. Prevent vocab-heavy, function-poor word banks.',
    recommenderPriority: [
      'personal_pronoun',
      'copular_be',
      'present_simple_verbal',
      'noun_person',
      'noun_thing',
      'noun_place',
      'noun_abstract',
      'basic_clause',
      'adjectival_description',
      'negation',
      'interrogative',
      'possession',
      'locative_prepositional',
      'demonstrative',
      'determiner_article',
    ],
  },
  {
    id: 'A2',
    tier: 'A',
    tierName: 'Beginner',
    order: 2,
    goal: 'Can do simple everyday communication, routine tasks, and simple descriptions.',
    subdivisions: [],
    grammarBand: [],
    sentenceStructures: [],
  },
  {
    id: 'B1',
    tier: 'B',
    tierName: 'Intermediate',
    order: 3,
    goal: 'Can manage more independent everyday language, talk about experiences, plans, and opinions simply.',
    subdivisions: [],
    grammarBand: [],
    sentenceStructures: [],
  },
  {
    id: 'B2',
    tier: 'B',
    tierName: 'Intermediate',
    order: 4,
    goal: 'Can communicate fairly comfortably, understand more complex material, argue and explain with nuance.',
    subdivisions: [],
    grammarBand: [],
    sentenceStructures: [],
  },
  {
    id: 'C1',
    tier: 'C',
    tierName: 'Advanced',
    order: 5,
    goal: 'Can use language flexibly and effectively in work, study, and complex discussion.',
    subdivisions: [],
    grammarBand: [],
    sentenceStructures: [],
  },
  {
    id: 'C2',
    tier: 'C',
    tierName: 'Advanced',
    order: 6,
    goal: 'Can understand and express almost everything with high precision and ease.',
    subdivisions: [],
    grammarBand: [],
    sentenceStructures: [],
  },
]
