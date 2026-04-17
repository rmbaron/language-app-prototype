// English word data.
// All words here must have language: 'en'.
// This file is imported by wordData.js (the combined registry) — do not import directly.

// Form types — broad categories, intentionally simple at this stage.
// These will become more specific as the learner progresses.
//
// Current broad types:
//   third_person_present  — "runs", "wants"
//   past                  — covers simple past and past participle at this stage
//   present_participle    — "-ing" form
//   future                — "will run" (construction, not inflection — shown on profile)
//   comparative           — adjective comparative ("better")
//   superlative           — adjective superlative ("best")
//   adverb                — adverb form of an adjective ("well")
//   plural                — noun plural ("houses")
//   possessive            — possessive form ("your", "yours")
//   reflexive             — reflexive pronoun form ("yourself")

const words = [
  {
    id: "i",
    baseForm: "I",
    language: "en",
    classifications: { grammaticalCategory: "pronoun" },
    meaning: "The person speaking — yourself.",
    fullMeaning: "I is the first-person singular subject pronoun. It is always the subject of a sentence — the one doing the action. In English, I is always capitalized. It is the starting point of almost every sentence a learner will ever produce.",
    forms: [
      { form: "me",     type: "object" },
      { form: "my",     type: "possessive" },
      { form: "mine",   type: "possessive" },
      { form: "myself", type: "reflexive" },
    ],
  },
  {
    id: "it",
    baseForm: "it",
    language: "en",
    classifications: { grammaticalCategory: "pronoun" },
    meaning: "A thing, animal, or idea being referred to.",
    fullMeaning: "It is the third-person singular neutral pronoun. It refers to objects, animals, ideas, or anything that is not a specific person. It is one of the most-used words in English and unlocks the ability to talk about the entire world of things.",
    forms: [
      { form: "its",    type: "possessive" },
      { form: "itself", type: "reflexive" },
    ],
  },
  {
    id: "want",
    baseForm: "want",
    language: "en",
    classifications: { grammaticalCategory: "verb" },
    meaning: "To feel a desire or wish for something.",
    fullMeaning: "To want something means to feel a desire, wish, or longing for it. It can express a personal preference (\"I want coffee\"), a request (\"I want you to stay\"), or a need that feels emotionally driven rather than strictly necessary.",
    forms: [
      { form: "wants",     type: "third_person_present" },
      { form: "wanted",    type: "past" },
      { form: "wanting",   type: "present_participle" },
      { form: "will want", type: "future" },
    ],
  },
  {
    id: "need",
    baseForm: "need",
    language: "en",
    classifications: { grammaticalCategory: "verb" },
    meaning: "To require something as necessary or essential.",
    fullMeaning: "To need something means it is required or essential — not just desired. It implies a stronger sense of necessity than \"want\". It can describe physical requirements (\"I need water\"), logical requirements (\"You need a ticket\"), or obligations (\"We need to talk\").",
    forms: [
      { form: "needs",     type: "third_person_present" },
      { form: "needed",    type: "past" },
      { form: "needing",   type: "present_participle" },
      { form: "will need", type: "future" },
    ],
  },
  {
    id: "good",
    baseForm: "good",
    language: "en",
    classifications: { grammaticalCategory: "adjective" },
    meaning: "Having positive qualities; better than average.",
    fullMeaning: "Good describes something that has positive qualities, meets expectations, or is morally sound. It's one of the most flexible words in English and shifts meaning depending on context: quality (\"a good meal\"), character (\"a good person\"), suitability (\"a good fit\"), or skill (\"good at chess\").",
    forms: [
      { form: "better", type: "comparative" },
      { form: "best",   type: "superlative" },
      { form: "well",   type: "adverb" },
    ],
  },
  {
    id: "house",
    baseForm: "house",
    language: "en",
    classifications: { grammaticalCategory: "noun" },
    meaning: "A building where people live.",
    fullMeaning: "A house is a structure built for people to live in, typically a standalone building. It differs from \"home\", which carries emotional meaning, and \"apartment\" or \"flat\", which are units within larger buildings. House can also be used as a verb meaning to provide shelter or contain something.",
    forms: [
      { form: "houses", type: "plural" },
    ],
  },
  {
    id: "you",
    baseForm: "you",
    language: "en",
    classifications: { grammaticalCategory: "pronoun" },
    meaning: "The person or people being spoken to.",
    fullMeaning: "You is the second-person pronoun in English, used to address one or more people directly. Unlike many languages, English uses \"you\" for both singular and plural. It can be a subject (\"You are right\") or an object (\"I see you\"), and is one of the most common words in the language.",
    forms: [
      { form: "your",       type: "possessive" },
      { form: "yours",      type: "possessive" },
      { form: "yourself",   type: "reflexive" },
      { form: "yourselves", type: "reflexive" },
    ],
  },
  {
    id: "go",
    baseForm: "go",
    language: "en",
    classifications: { grammaticalCategory: "verb" },
    meaning: "To move or travel from one place to another.",
    fullMeaning: "Go is one of the most fundamental verbs in English. It describes movement away from the current position, travel, departure, or general movement. It also appears in countless fixed phrases and is used to indicate future action (\"going to\"), making it one of the most versatile words in the language.",
    forms: [
      { form: "goes",    type: "third_person_present" },
      { form: "went",    type: "past" },
      { form: "gone",    type: "past" },
      { form: "going",   type: "present_participle" },
      { form: "will go", type: "future" },
    ],
  },
  {
    id: "come",
    baseForm: "come",
    language: "en",
    classifications: { grammaticalCategory: "verb" },
    meaning: "To move toward the speaker or a specified place.",
    fullMeaning: "Come is the directional counterpart to \"go\" — it implies movement toward the speaker's current position, or toward a place already established as the reference point. It is used in invitations (\"come here\"), arrivals (\"she came\"), and is the basis for many idioms and phrasal verbs.",
    forms: [
      { form: "comes",      type: "third_person_present" },
      { form: "came",       type: "past" },
      { form: "coming",     type: "present_participle" },
      { form: "will come",  type: "future" },
    ],
  },
  {
    id: "see",
    baseForm: "see",
    language: "en",
    classifications: { grammaticalCategory: "verb" },
    meaning: "To perceive with the eyes; to understand.",
    fullMeaning: "See covers both literal vision and cognitive understanding. In conversation it is used to describe what you observe (\"I can see the house\") and to signal comprehension (\"I see\"). It appears in many everyday expressions: \"see you later\", \"let's see\", \"I see what you mean\".",
    forms: [
      { form: "sees",     type: "third_person_present" },
      { form: "saw",      type: "past" },
      { form: "seen",     type: "past" },
      { form: "seeing",   type: "present_participle" },
      { form: "will see", type: "future" },
    ],
  },
  {
    id: "know",
    baseForm: "know",
    language: "en",
    classifications: { grammaticalCategory: "verb" },
    meaning: "To be aware of or have information about something.",
    fullMeaning: "Know expresses certainty and awareness. It can mean having factual information (\"I know the answer\"), recognizing something (\"I know that song\"), or being familiar with a person or place (\"I know her well\"). It is also used in conversational stalling and hedging: \"I don't know\", \"you know\".",
    forms: [
      { form: "knows",      type: "third_person_present" },
      { form: "knew",       type: "past" },
      { form: "known",      type: "past" },
      { form: "knowing",    type: "present_participle" },
      { form: "will know",  type: "future" },
    ],
  },
  {
    id: "think",
    baseForm: "think",
    language: "en",
    classifications: { grammaticalCategory: "verb" },
    meaning: "To have an opinion or belief; to use the mind.",
    fullMeaning: "Think is used to express opinions (\"I think it's good\"), beliefs (\"I think so\"), and internal mental processes. It softens statements and opens discussion — \"I think\" is one of the most natural sentence starters in English for expressing personal views without coming across as overly assertive.",
    forms: [
      { form: "thinks",     type: "third_person_present" },
      { form: "thought",    type: "past" },
      { form: "thinking",   type: "present_participle" },
      { form: "will think", type: "future" },
    ],
  },
  {
    id: "day",
    baseForm: "day",
    language: "en",
    classifications: { grammaticalCategory: "noun" },
    meaning: "A 24-hour period; the time between sunrise and sunset.",
    fullMeaning: "Day is one of the most basic units of time in everyday language. It is used in greetings (\"good day\"), planning (\"what day is it?\"), habits (\"every day\"), and storytelling (\"one day...\"). It appears in hundreds of fixed phrases and collocates with almost every time-related expression.",
    forms: [
      { form: "days", type: "plural" },
    ],
  },
  {
    id: "friend",
    baseForm: "friend",
    language: "en",
    classifications: { grammaticalCategory: "noun" },
    meaning: "A person you know and like and enjoy spending time with.",
    fullMeaning: "Friend describes a person with whom you have a bond of mutual affection, trust, and enjoyment — distinct from family or acquaintances. It is one of the most emotionally significant common words and appears constantly in social language: introductions, stories, making plans, and casual conversation.",
    forms: [
      { form: "friends", type: "plural" },
    ],
  },
  {
    id: "food",
    baseForm: "food",
    language: "en",
    classifications: { grammaticalCategory: "noun" },
    meaning: "Any substance eaten for nourishment.",
    fullMeaning: "Food is a foundational concrete noun covering anything eaten or consumed for energy and nourishment. It appears in daily conversation about meals, preferences, culture, and survival. Knowing \"food\" unlocks an enormous amount of practical everyday vocabulary and situational language.",
    forms: [
      { form: "foods", type: "plural" },
    ],
  },
  {
    id: "happy",
    baseForm: "happy",
    language: "en",
    classifications: { grammaticalCategory: "adjective" },
    meaning: "Feeling pleasure, joy, or contentment.",
    fullMeaning: "Happy describes a positive emotional state — feeling pleased, satisfied, or content. It is one of the first emotional words a learner needs because it appears in greetings (\"happy birthday\"), responses (\"I'm happy to help\"), and is the baseline word for expressing positive feelings before learning more specific emotional vocabulary.",
    forms: [
      { form: "happier",   type: "comparative" },
      { form: "happiest",  type: "superlative" },
      { form: "happily",   type: "adverb" },
    ],
  },
  {
    id: "please",
    baseForm: "please",
    language: "en",
    classifications: { grammaticalCategory: "adverb" },
    meaning: "Used to make a request more polite.",
    fullMeaning: "Please is the core politeness word in English. Added to any request, it signals courtesy and respect. It also functions as a verb (\"please someone\") and appears in formal writing. Without \"please\", even grammatically correct requests can come across as rude — making it one of the most functionally important words for real-world interaction.",
    forms: [],
  },
  {
    id: "sorry",
    baseForm: "sorry",
    language: "en",
    classifications: { grammaticalCategory: "adjective" },
    meaning: "Feeling regret or sadness about something.",
    fullMeaning: "Sorry expresses apology, sympathy, or regret. It is indispensable for real-world social interaction — for apologizing, expressing condolences, or politely getting someone's attention (\"sorry, excuse me\"). Without it, a learner has no natural way to acknowledge mistakes or navigate everyday social friction.",
    forms: [],
  },
  {
    id: "help",
    baseForm: "help",
    language: "en",
    classifications: { grammaticalCategory: "verb" },
    meaning: "To assist or support someone.",
    fullMeaning: "Help is one of the most essential interaction words. It is used to ask for assistance (\"can you help me?\"), offer support (\"let me help you\"), and discuss aid in general. As a noun it means assistance itself. Knowing \"help\" immediately enables a learner to navigate situations where they are lost or confused.",
    forms: [
      { form: "helps",     type: "third_person_present" },
      { form: "helped",    type: "past" },
      { form: "helping",   type: "present_participle" },
      { form: "will help", type: "future" },
    ],
  },
  {
    id: "time",
    baseForm: "time",
    language: "en",
    classifications: { grammaticalCategory: "noun" },
    meaning: "The indefinite continued progress of existence; a point or period.",
    fullMeaning: "Time is among the most frequent nouns in English. It refers to the general concept of time (\"time flies\"), a specific moment (\"what time is it?\"), or a period (\"last time\"). It collocates with nearly every verb and appears in countless phrases essential for scheduling, storytelling, and everyday conversation.",
    forms: [
      { form: "times", type: "plural" },
    ],
  },
  {
    id: "big",
    baseForm: "big",
    language: "en",
    classifications: { grammaticalCategory: "adjective" },
    meaning: "Large in size, extent, or intensity.",
    fullMeaning: "Big is one of the most basic and versatile descriptors in English. It describes physical size (\"a big house\"), importance (\"a big deal\"), and is used in countless common expressions. It is typically learned before more specific synonyms like \"large\", \"enormous\", or \"huge\" because of its everyday frequency and simplicity.",
    forms: [
      { form: "bigger",  type: "comparative" },
      { form: "biggest", type: "superlative" },
    ],
  },
  {
    id: "now",
    baseForm: "now",
    language: "en",
    classifications: { grammaticalCategory: "adverb" },
    meaning: "At the present time; immediately.",
    fullMeaning: "Now grounds speech in the present moment. It is used to indicate immediacy (\"do it now\"), contrast with the past (\"then vs now\"), and structure spoken discourse (\"now, let me explain\"). It is one of the first time words a learner needs and appears heavily in both casual conversation and instructions.",
    forms: [],
  },
]

export default words

