// Word Metadata — scoring properties for each word in the word bank.
//
// Separate from wordData (what a word IS) — this is what a word is WORTH
// for recommendation purposes. Scores here are judgments that can be revised
// and reweighted over time without touching word identity or user data.
//
// All scores are on a 1–5 scale unless noted:
//   1 = lowest / least
//   5 = highest / most
//
// Fields:
//   frequencyTier       — how common is this word in everyday language?
//   functionalWeight    — how useful for basic human function vs literary/academic?
//   combinabilityScore  — how much does knowing this word unlock other usable language?
//   cognitiveComplexity — how structurally simple is this word? (5 = very simple)
//   unlockValue         — does this word give the learner a meaningful new capability?
//
// These scores feed the recommendation engine (wordRecommender.js).
// They are static system judgments, not per-user.

const wordMeta = {
  want: {
    frequencyTier: 5,
    functionalWeight: 5,       // express desire, make requests
    combinabilityScore: 5,     // "I want", "do you want", "what do you want" — extremely combinable
    cognitiveComplexity: 5,    // simple and regular
    unlockValue: 5,            // unlocks the ability to express desire and make requests
  },
  need: {
    frequencyTier: 5,
    functionalWeight: 5,       // express necessity
    combinabilityScore: 5,     // pairs with almost everything
    cognitiveComplexity: 5,
    unlockValue: 4,            // slightly less unlock power than "want" but essential
  },
  good: {
    frequencyTier: 5,
    functionalWeight: 4,       // describe, evaluate, respond
    combinabilityScore: 4,     // "good morning", "good job", "sounds good"
    cognitiveComplexity: 5,
    unlockValue: 4,            // unlocks basic positive responses and descriptions
  },
  house: {
    frequencyTier: 4,
    functionalWeight: 3,       // concrete noun — useful but narrower
    combinabilityScore: 2,     // less combinable than core verbs/adjectives
    cognitiveComplexity: 5,
    unlockValue: 3,
  },
  you: {
    frequencyTier: 5,
    functionalWeight: 5,       // cannot address anyone without this
    combinabilityScore: 5,     // pairs with every verb
    cognitiveComplexity: 5,
    unlockValue: 5,            // unlocks all second-person interaction
  },
  go: {
    frequencyTier: 5,
    functionalWeight: 5,       // movement, departure, future constructions ("going to")
    combinabilityScore: 5,     // "go to", "go home", "going to do", "let's go" — extremely combinable
    cognitiveComplexity: 3,    // irregular (went/gone) adds some complexity
    unlockValue: 5,            // unlocks travel, plans, future tense constructions
  },
  come: {
    frequencyTier: 5,
    functionalWeight: 5,       // arrivals, invitations, direction
    combinabilityScore: 5,     // "come here", "come back", "come with me"
    cognitiveComplexity: 3,    // irregular (came/come)
    unlockValue: 4,
  },
  see: {
    frequencyTier: 5,
    functionalWeight: 5,       // visual perception + comprehension ("I see")
    combinabilityScore: 5,     // "see you", "let's see", "I see what you mean"
    cognitiveComplexity: 3,    // irregular (saw/seen)
    unlockValue: 4,
  },
  know: {
    frequencyTier: 5,
    functionalWeight: 5,       // express knowledge, uncertainty, recognition
    combinabilityScore: 5,     // "I know", "you know", "I don't know" — conversational bedrock
    cognitiveComplexity: 3,    // irregular (knew/known)
    unlockValue: 5,            // unlocks expressing certainty, uncertainty, and understanding
  },
  think: {
    frequencyTier: 5,
    functionalWeight: 5,       // opinions, beliefs, hedging — "I think" is one of the most useful phrases
    combinabilityScore: 5,     // "I think so", "think about", "I don't think"
    cognitiveComplexity: 3,    // irregular (thought)
    unlockValue: 5,            // unlocks softened opinion-giving, a massive social function
  },
  day: {
    frequencyTier: 5,
    functionalWeight: 4,       // time reference, greetings, planning
    combinabilityScore: 4,     // "every day", "one day", "good day", "what day"
    cognitiveComplexity: 5,
    unlockValue: 3,
  },
  friend: {
    frequencyTier: 4,
    functionalWeight: 4,       // social identity, introductions, stories
    combinabilityScore: 3,     // "my friend", "a friend of mine"
    cognitiveComplexity: 5,
    unlockValue: 4,            // unlocks social language and relational descriptions
  },
  food: {
    frequencyTier: 4,
    functionalWeight: 5,       // survival necessity, cultural touchstone, constant topic
    combinabilityScore: 3,     // "good food", "food and drink", "local food"
    cognitiveComplexity: 5,
    unlockValue: 4,            // unlocks a huge domain of practical daily conversation
  },
  happy: {
    frequencyTier: 4,
    functionalWeight: 4,       // emotional vocabulary, greetings, responses
    combinabilityScore: 3,     // "happy birthday", "I'm happy to", "happy with"
    cognitiveComplexity: 5,
    unlockValue: 4,            // the baseline positive emotion word
  },
  please: {
    frequencyTier: 4,
    functionalWeight: 5,       // without this, all requests sound rude
    combinabilityScore: 5,     // attaches to any request instantly
    cognitiveComplexity: 5,
    unlockValue: 5,            // unlocks all polite request-making
  },
  sorry: {
    frequencyTier: 4,
    functionalWeight: 5,       // apology, sympathy, social repair — no substitute word
    combinabilityScore: 4,     // "I'm sorry", "sorry about", "sorry to hear"
    cognitiveComplexity: 5,
    unlockValue: 5,            // unlocks apology and social friction navigation
  },
  help: {
    frequencyTier: 4,
    functionalWeight: 5,       // ask for and offer assistance — survival in real-world situations
    combinabilityScore: 5,     // "can you help me", "help with", "need help"
    cognitiveComplexity: 5,
    unlockValue: 5,            // unlocks the ability to ask for assistance in any situation
  },
  time: {
    frequencyTier: 5,
    functionalWeight: 4,       // scheduling, questions, storytelling
    combinabilityScore: 4,     // "what time", "last time", "at the same time", "have time"
    cognitiveComplexity: 5,
    unlockValue: 3,
  },
  big: {
    frequencyTier: 4,
    functionalWeight: 3,       // basic size descriptor — useful but narrower functional range
    combinabilityScore: 3,     // "big deal", "big day", "big problem"
    cognitiveComplexity: 5,
    unlockValue: 3,
  },
  now: {
    frequencyTier: 5,
    functionalWeight: 5,       // immediacy, contrast, spoken discourse structuring
    combinabilityScore: 5,     // attaches to almost any utterance to ground it in the present
    cognitiveComplexity: 5,
    unlockValue: 4,            // unlocks time grounding and urgency expression
  },
}

export function getWordMeta(wordId) {
  return wordMeta[wordId] ?? null
}

export function getAllWordMeta() {
  return wordMeta
}
