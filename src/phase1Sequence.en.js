// Phase 1 word sequence — English target language.
// Managed by the Celestial Editor. Manual edits are safe.
// Field reference: wordId, laneOrder, functionUnlocked, sentences, grammarSlots.
//
// sentences: authored gap-fill sentences per lane. '___' marks the gap.
//   Use only words that appear earlier in this sequence or common function words.
//
// grammarSlots: positioned slots that appear when the learner has 2+ words
//   of that grammatical category. Editor places and positions these.
//   { id, category, x, y } — x/y are percent of celestial space (0–100).

export const PHASE1_SEQUENCE = [
  {
    "wordId": "i",
    "laneOrder": ["reading", "writing", "listening", "speaking"],
    "functionUnlocked": "refer_to_self",
    "sentences": {
      "reading":   [{ "text": "___ am here." }],
      "listening": [{ "text": "___ am here." }],
      "writing":   [{ "text": "___ am here." }],
      "speaking":  [{ "text": "___ am here." }]
    },
    "sentenceStructure": [
      { "role": "subject", "category": "pronoun", "wordId": "i" }
    ],
    "requiredWordId": "i",
    "grammarSlots": []
  },
  {
    "wordId": "want",
    "laneOrder": ["reading", "listening", "writing", "speaking"],
    "functionUnlocked": "express_desire",
    "sentences": {
      "reading":   [{ "text": "I ___ to go." }, { "text": "I ___ food." }],
      "listening": [{ "text": "I ___ to go." }],
      "writing":   [{ "text": "I ___ to go." }, { "text": "I ___ food." }],
      "speaking":  [{ "text": "I ___ to go." }]
    },
    "sentenceStructure": [
      { "role": "subject", "category": "pronoun", "wordId": "i"    },
      { "role": "verb",    "category": "verb",    "wordId": "want" }
    ],
    "requiredWordId": "want",
    "grammarSlots": []
  },
  {
    "wordId": "food",
    "laneOrder": ["reading", "listening", "writing", "speaking"],
    "functionUnlocked": "name_food",
    "sentences": {
      "reading":   [{ "text": "I want ___." }],
      "listening": [{ "text": "I want ___." }],
      "writing":   [{ "text": "I want ___." }],
      "speaking":  [{ "text": "I want ___." }]
    },
    "sentenceStructure": [
      { "role": "subject", "category": "pronoun", "wordId": "i"    },
      { "role": "verb",    "category": "verb",    "wordId": "want" },
      { "role": "object",  "category": "noun",    "wordId": "food" }
    ],
    "requiredWordId": "food",
    "grammarSlots": []
  },
  {
    "wordId": "have",
    "laneOrder": ["reading", "listening", "writing", "speaking"],
    "functionUnlocked": "express_possession",
    "sentences": {
      "reading":   [{ "text": "I ___ food." }, { "text": "I ___ it." }],
      "listening": [{ "text": "I ___ food." }],
      "writing":   [{ "text": "I ___ food." }],
      "speaking":  [{ "text": "I ___ food." }]
    },
    "sentenceStructure": [
      { "role": "subject", "category": "pronoun", "wordId": "i"    },
      { "role": "verb",    "category": "verb",    "wordId": "want" },
      { "role": "object",  "category": "noun",    "wordId": "food" }
    ],
    "requiredWordId": "have",
    "grammarSlots": []
  },
  {
    "wordId": "you",
    "laneOrder": ["reading", "listening", "writing", "speaking"],
    "functionUnlocked": "address_others",
    "sentences": {
      "reading":   [{ "text": "___ want food." }, { "text": "I have it for ___." }],
      "listening": [{ "text": "___ want food." }],
      "writing":   [{ "text": "___ want food." }],
      "speaking":  [{ "text": "___ want food." }]
    },
    "sentenceStructure": [
      { "role": "subject", "category": "pronoun", "wordId": "i"    },
      { "role": "verb",    "category": "verb",    "wordId": "want" },
      { "role": "object",  "category": "noun",    "wordId": "food" }
    ],
    "requiredWordId": "you",
    "grammarSlots": []
  },
  {
    "wordId": "hello",
    "laneOrder": ["reading", "listening", "writing", "speaking"],
    "functionUnlocked": "greet_others",
    "sentences": {
      "reading":   [{ "text": "___." }, { "text": "___, I want food." }],
      "listening": [{ "text": "___." }],
      "writing":   [{ "text": "___." }],
      "speaking":  [{ "text": "___." }]
    },
    "sentenceStructure": [
      { "role": "greeting", "category": "interjection", "wordId": "hello" }
    ],
    "requiredWordId": "hello",
    "grammarSlots": []
  },
  {
    "wordId": "more",
    "laneOrder": ["reading", "listening", "writing", "speaking"],
    "functionUnlocked": "ask_for_more",
    "sentences": {
      "reading":   [{ "text": "I want ___ food." }, { "text": "___." }],
      "listening": [{ "text": "I want ___ food." }],
      "writing":   [{ "text": "I want ___ food." }],
      "speaking":  [{ "text": "I want ___ food." }]
    },
    "sentenceStructure": [
      { "role": "subject",   "category": "pronoun", "wordId": "i"    },
      { "role": "verb",      "category": "verb",    "wordId": "want" },
      { "role": "modifier",  "category": "adverb",  "wordId": "more" },
      { "role": "object",    "category": "noun",    "wordId": "food" }
    ],
    "requiredWordId": "more",
    "grammarSlots": []
  },
  {
    "wordId": "no",
    "laneOrder": ["reading", "listening", "writing", "speaking"],
    "functionUnlocked": "decline_refuse",
    "sentences": {
      "reading":   [{ "text": "___." }, { "text": "___ food." }],
      "listening": [{ "text": "___." }],
      "writing":   [{ "text": "___." }],
      "speaking":  [{ "text": "___." }]
    },
    "sentenceStructure": [
      { "role": "response", "category": "interjection", "wordId": "no" }
    ],
    "requiredWordId": "no",
    "grammarSlots": []
  },
  {
    "wordId": "and",
    "laneOrder": ["reading", "listening", "writing", "speaking"],
    "functionUnlocked": "connect_ideas",
    "sentences": {
      "reading":   [{ "text": "You ___ I want food." }, { "text": "I want food ___ more." }],
      "listening": [{ "text": "You ___ I want food." }],
      "writing":   [{ "text": "I want food ___ more." }],
      "speaking":  [{ "text": "You ___ I want food." }]
    },
    "sentenceStructure": [
      { "role": "subject",   "category": "pronoun",     "wordId": "i"    },
      { "role": "verb",      "category": "verb",        "wordId": "want" },
      { "role": "object",    "category": "noun",        "wordId": "food" },
      { "role": "connector", "category": "conjunction", "wordId": "and"  },
      { "role": "object",    "category": "noun",        "wordId": "food" }
    ],
    "requiredWordId": "and",
    "grammarSlots": []
  },
  {
    "wordId": "water",
    "laneOrder": ["reading", "listening", "writing", "speaking"],
    "functionUnlocked": "name_water",
    "sentences": {
      "reading":   [{ "text": "I want ___." }, { "text": "I want food and ___." }],
      "listening": [{ "text": "I want ___." }],
      "writing":   [{ "text": "I want ___." }],
      "speaking":  [{ "text": "I want ___." }]
    },
    "sentenceStructure": [
      { "role": "subject",   "category": "pronoun",     "wordId": "i"     },
      { "role": "verb",      "category": "verb",        "wordId": "want"  },
      { "role": "object",    "category": "noun",        "wordId": "food"  },
      { "role": "connector", "category": "conjunction", "wordId": "and"   },
      { "role": "object",    "category": "noun",        "wordId": "water" }
    ],
    "requiredWordId": "water",
    "grammarSlots": []
  }
]
