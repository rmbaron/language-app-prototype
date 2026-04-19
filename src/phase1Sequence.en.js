// Phase 1 word sequence — English target language.
//
// This is the authored, designed early experience. Every entry here is a
// deliberate design decision: which word comes next, in what lane order,
// and what sentence frames carry it.
//
// Sentences are in the target language (English). The gap marker is '___'.
// Hints shown to the user during practice come from word.meaning in wordData
// (which routes through getSupportLanguage) — do not store hints here.
//
// functionUnlocked keys into uiStrings.phase1.functions for the celebration
// moment shown when a new communicative capability is earned.
//
// laneOrder: the order lanes are surfaced for this word in the Phase 1 UI.
// The user still picks — this is the suggested/default ordering.
//
// sentences: authored gap-fill sentences per lane. '___ ' marks the gap.
// Keep sentences short and use only words that appear earlier in this sequence
// or are extremely common function words (articles, prepositions) the learner
// can infer from context. No word should appear in a sentence before it has
// been introduced.

export const PHASE1_SEQUENCE = [

  {
    wordId: 'i',
    laneOrder: ['reading', 'writing', 'listening', 'speaking'],
    functionUnlocked: 'refer_to_self',
    sentences: {
      reading:   [
        { text: '___ am here.' },
      ],
      listening: [
        { text: '___ am here.' },
      ],
      speaking:  [
        { text: '___ am here.' },
      ],
      writing:   [
        { text: '___ am here.' },
      ],
    },
  },

  {
    wordId: 'want',
    laneOrder: ['reading', 'listening', 'writing', 'speaking'],
    functionUnlocked: 'express_desire',
    sentences: {
      reading:   [
        { text: 'I ___ to go.' },
        { text: 'I ___ food.' },
      ],
      listening: [
        { text: 'I ___ to go.' },
      ],
      writing:   [
        { text: 'I ___ to go.' },
        { text: 'I ___ food.' },
      ],
      speaking:  [
        { text: 'I ___ to go.' },
      ],
    },
  },

  // ── Words 3–10: placeholders — sentences and functions are drafts ─
  //
  // This sequence is a data file — reorder or replace entries here
  // without touching any screen or editor code. All entries follow
  // the same shape as words 1–2 above.

  {
    wordId: 'food',
    laneOrder: ['reading', 'listening', 'writing', 'speaking'],
    functionUnlocked: 'name_food',
    sentences: {
      reading:   [{ text: 'I want ___.' }],
      listening: [{ text: 'I want ___.' }],
      writing:   [{ text: 'I want ___.' }],
      speaking:  [{ text: 'I want ___.' }],
    },
  },

  {
    wordId: 'have',
    laneOrder: ['reading', 'listening', 'writing', 'speaking'],
    functionUnlocked: 'express_possession',
    sentences: {
      reading:   [{ text: 'I ___ food.' }, { text: 'I ___ it.' }],
      listening: [{ text: 'I ___ food.' }],
      writing:   [{ text: 'I ___ food.' }],
      speaking:  [{ text: 'I ___ food.' }],
    },
  },

  {
    wordId: 'you',
    laneOrder: ['reading', 'listening', 'writing', 'speaking'],
    functionUnlocked: 'address_others',
    sentences: {
      reading:   [{ text: '___ want food.' }, { text: 'I have it for ___.' }],
      listening: [{ text: '___ want food.' }],
      writing:   [{ text: '___ want food.' }],
      speaking:  [{ text: '___ want food.' }],
    },
  },

  {
    wordId: 'hello',
    laneOrder: ['reading', 'listening', 'writing', 'speaking'],
    functionUnlocked: 'greet_others',
    sentences: {
      reading:   [{ text: '___.' }, { text: '___, I want food.' }],
      listening: [{ text: '___.' }],
      writing:   [{ text: '___.' }],
      speaking:  [{ text: '___.' }],
    },
  },

  {
    wordId: 'more',
    laneOrder: ['reading', 'listening', 'writing', 'speaking'],
    functionUnlocked: 'ask_for_more',
    sentences: {
      reading:   [{ text: 'I want ___ food.' }, { text: '___.' }],
      listening: [{ text: 'I want ___ food.' }],
      writing:   [{ text: 'I want ___ food.' }],
      speaking:  [{ text: 'I want ___ food.' }],
    },
  },

  {
    wordId: 'no',
    laneOrder: ['reading', 'listening', 'writing', 'speaking'],
    functionUnlocked: 'decline_refuse',
    sentences: {
      reading:   [{ text: '___.' }, { text: '___ food.' }],
      listening: [{ text: '___.' }],
      writing:   [{ text: '___.' }],
      speaking:  [{ text: '___.' }],
    },
  },

  {
    wordId: 'and',
    laneOrder: ['reading', 'listening', 'writing', 'speaking'],
    functionUnlocked: 'connect_ideas',
    sentences: {
      reading:   [{ text: 'You ___ I want food.' }, { text: 'I want food ___ more.' }],
      listening: [{ text: 'You ___ I want food.' }],
      writing:   [{ text: 'I want food ___ more.' }],
      speaking:  [{ text: 'You ___ I want food.' }],
    },
  },

  {
    wordId: 'water',
    laneOrder: ['reading', 'listening', 'writing', 'speaking'],
    functionUnlocked: 'name_water',
    sentences: {
      reading:   [{ text: 'I want ___.' }, { text: 'I want food and ___.' }],
      listening: [{ text: 'I want ___.' }],
      writing:   [{ text: 'I want ___.' }],
      speaking:  [{ text: 'I want ___.' }],
    },
  },

]
