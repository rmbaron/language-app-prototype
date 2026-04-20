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
    forms: [
      { form: "houses", type: "plural" },
    ],
  },
  {
    id: "be",
    baseForm: "be",
    language: "en",
    classifications: { grammaticalCategory: "verb" },
    meaning: "To exist or have a quality — I am, you are, she is.",
    forms: [
      { form: "am",    type: "first_person_present" },
      { form: "is",    type: "third_person_present" },
      { form: "are",   type: "plural_present" },
      { form: "was",   type: "past" },
      { form: "were",  type: "past" },
      { form: "been",  type: "past_participle" },
      { form: "being", type: "present_participle" },
    ],
  },
  {
    id: "this",
    baseForm: "this",
    language: "en",
    classifications: { grammaticalCategory: "demonstrative" },
    meaning: "The thing close to the speaker.",
    forms: [
      { form: "these", type: "plural" },
    ],
  },
  {
    id: "that",
    baseForm: "that",
    language: "en",
    classifications: { grammaticalCategory: "demonstrative" },
    meaning: "The thing away from the speaker.",
    forms: [
      { form: "those", type: "plural" },
    ],
  },
  {
    id: "what",
    baseForm: "what",
    language: "en",
    classifications: { grammaticalCategory: "interrogative" },
    meaning: "Used to ask about things or request information.",
    forms: [],
  },
  {
    id: "where",
    baseForm: "where",
    language: "en",
    classifications: { grammaticalCategory: "adverb" },
    meaning: "Used to ask about or refer to a place.",
    forms: [],
  },
  {
    id: "he",
    baseForm: "he",
    language: "en",
    classifications: { grammaticalCategory: "pronoun" },
    meaning: "A male person being referred to.",
    forms: [
      { form: "him",     type: "object" },
      { form: "his",     type: "possessive" },
      { form: "himself", type: "reflexive" },
    ],
  },
  {
    id: "she",
    baseForm: "she",
    language: "en",
    classifications: { grammaticalCategory: "pronoun" },
    meaning: "A female person being referred to.",
    forms: [
      { form: "her",     type: "object" },
      { form: "her",     type: "possessive" },
      { form: "herself", type: "reflexive" },
    ],
  },
  {
    id: "you",
    baseForm: "you",
    language: "en",
    classifications: { grammaticalCategory: "pronoun" },
    meaning: "The person or people being spoken to.",
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
    forms: [],
  },
  {
    id: "sorry",
    baseForm: "sorry",
    language: "en",
    classifications: { grammaticalCategory: "adjective" },
    meaning: "Feeling regret or sadness about something.",
    forms: [],
  },
  {
    id: "help",
    baseForm: "help",
    language: "en",
    classifications: { grammaticalCategory: "verb" },
    meaning: "To assist or support someone.",
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
    forms: [
      { form: "bigger",  type: "comparative" },
      { form: "biggest", type: "superlative" },
    ],
  },
  {
    id: "not",
    baseForm: "not",
    language: "en",
    classifications: { grammaticalCategory: "adverb" },
    meaning: "Used to make a statement negative.",
    forms: [],
  },
  {
    id: "now",
    baseForm: "now",
    language: "en",
    classifications: { grammaticalCategory: "adverb" },
    meaning: "At the present time; immediately.",
    forms: [],
  },

  // ── Missing A1 slot carriers ──────────────────────────────────

  // Personal pronouns — we / they
  {
    id: "we",
    baseForm: "we",
    language: "en",
    classifications: { grammaticalCategory: "pronoun" },
    meaning: "The speaker and at least one other person together.",
    forms: [
      { form: "us",         type: "object" },
      { form: "our",        type: "possessive" },
      { form: "ours",       type: "possessive" },
      { form: "ourselves",  type: "reflexive" },
    ],
  },
  {
    id: "they",
    baseForm: "they",
    language: "en",
    classifications: { grammaticalCategory: "pronoun" },
    meaning: "People or things being talked about.",
    forms: [
      { form: "them",       type: "object" },
      { form: "their",      type: "possessive" },
      { form: "theirs",     type: "possessive" },
      { form: "themselves", type: "reflexive" },
    ],
  },

  // Verbs — like / eat / have
  {
    id: "like",
    baseForm: "like",
    language: "en",
    classifications: { grammaticalCategory: "verb" },
    meaning: "To find something pleasant or enjoyable.",
    forms: [
      { form: "likes",      type: "third_person_present" },
      { form: "liked",      type: "past" },
      { form: "liking",     type: "present_participle" },
      { form: "will like",  type: "future" },
    ],
  },
  {
    id: "eat",
    baseForm: "eat",
    language: "en",
    classifications: { grammaticalCategory: "verb" },
    meaning: "To put food in your mouth and swallow it.",
    forms: [
      { form: "eats",      type: "third_person_present" },
      { form: "ate",       type: "past" },
      { form: "eaten",     type: "past" },
      { form: "eating",    type: "present_participle" },
      { form: "will eat",  type: "future" },
    ],
  },
  {
    id: "have",
    baseForm: "have",
    language: "en",
    classifications: { grammaticalCategory: "verb" },
    meaning: "To own or possess something; to experience something.",
    forms: [
      { form: "has",       type: "third_person_present" },
      { form: "had",       type: "past" },
      { form: "having",    type: "present_participle" },
      { form: "will have", type: "future" },
    ],
  },

  // Adjectives — small / hot / cold
  {
    id: "small",
    baseForm: "small",
    language: "en",
    classifications: { grammaticalCategory: "adjective" },
    meaning: "Little in size; not large.",
    forms: [
      { form: "smaller",  type: "comparative" },
      { form: "smallest", type: "superlative" },
    ],
  },
  {
    id: "hot",
    baseForm: "hot",
    language: "en",
    classifications: { grammaticalCategory: "adjective" },
    meaning: "Having a high temperature; warm to the touch.",
    forms: [
      { form: "hotter",  type: "comparative" },
      { form: "hottest", type: "superlative" },
    ],
  },
  {
    id: "cold",
    baseForm: "cold",
    language: "en",
    classifications: { grammaticalCategory: "adjective" },
    meaning: "Having a low temperature; not warm.",
    forms: [
      { form: "colder",  type: "comparative" },
      { form: "coldest", type: "superlative" },
    ],
  },

  // Question words — who / how
  {
    id: "who",
    baseForm: "who",
    language: "en",
    classifications: { grammaticalCategory: "interrogative" },
    meaning: "Used to ask about a person's identity.",
    forms: [],
  },
  {
    id: "how",
    baseForm: "how",
    language: "en",
    classifications: { grammaticalCategory: "adverb" },
    meaning: "Used to ask about the way something is done or the degree of something.",
    forms: [],
  },

  // Prepositions — in / on / at
  {
    id: "in",
    baseForm: "in",
    language: "en",
    classifications: { grammaticalCategory: "preposition" },
    meaning: "Inside or enclosed by something; within a place or time.",
    forms: [],
  },
  {
    id: "on",
    baseForm: "on",
    language: "en",
    classifications: { grammaticalCategory: "preposition" },
    meaning: "Resting on or attached to a surface.",
    forms: [],
  },
  {
    id: "at",
    baseForm: "at",
    language: "en",
    classifications: { grammaticalCategory: "preposition" },
    meaning: "At a specific point or place; at a specific time.",
    forms: [],
  },

  // Location adverbs — here / there
  {
    id: "here",
    baseForm: "here",
    language: "en",
    classifications: { grammaticalCategory: "adverb" },
    meaning: "At or in this place, close to the speaker.",
    forms: [],
  },
  {
    id: "there",
    baseForm: "there",
    language: "en",
    classifications: { grammaticalCategory: "adverb" },
    meaning: "At or in that place, away from the speaker.",
    forms: [],
  },

  // Determiners/articles — a / the / some / any
  {
    id: "a",
    baseForm: "a",
    language: "en",
    classifications: { grammaticalCategory: "determiner" },
    meaning: "Used before a singular noun to refer to one of something.",
    forms: [
      { form: "an", type: "vowel_variant" },
    ],
  },
  {
    id: "the",
    baseForm: "the",
    language: "en",
    classifications: { grammaticalCategory: "determiner" },
    meaning: "Used before a noun to refer to something specific or already known.",
    forms: [],
  },
  {
    id: "some",
    baseForm: "some",
    language: "en",
    classifications: { grammaticalCategory: "determiner" },
    meaning: "An unspecified amount or number of something.",
    forms: [],
  },
  {
    id: "any",
    baseForm: "any",
    language: "en",
    classifications: { grammaticalCategory: "determiner" },
    meaning: "Used in questions and negatives to refer to an unspecified amount.",
    forms: [],
  },

  // ── A1 testing pool ───────────────────────────────────────────
  // A broad, practical set of single-word A1 items for app testing.
  // Covers all major grammatical categories with enough variety
  // to give the Sentence Lab and recommender real material to work with.

  // ── Verbs ─────────────────────────────────────────────────────

  {
    id: "love",
    baseForm: "love",
    language: "en",
    classifications: { grammaticalCategory: "verb" },
    meaning: "To feel deep affection or strong liking for someone or something.",
    forms: [
      { form: "loves",     type: "third_person_present" },
      { form: "loved",     type: "past" },
      { form: "loving",    type: "present_participle" },
      { form: "will love", type: "future" },
    ],
  },
  {
    id: "hate",
    baseForm: "hate",
    language: "en",
    classifications: { grammaticalCategory: "verb" },
    meaning: "To feel strong dislike for someone or something.",
    forms: [
      { form: "hates",     type: "third_person_present" },
      { form: "hated",     type: "past" },
      { form: "hating",    type: "present_participle" },
      { form: "will hate", type: "future" },
    ],
  },
  {
    id: "say",
    baseForm: "say",
    language: "en",
    classifications: { grammaticalCategory: "verb" },
    meaning: "To speak words; to express something in words.",
    forms: [
      { form: "says",     type: "third_person_present" },
      { form: "said",     type: "past" },
      { form: "saying",   type: "present_participle" },
      { form: "will say", type: "future" },
    ],
  },
  {
    id: "speak",
    baseForm: "speak",
    language: "en",
    classifications: { grammaticalCategory: "verb" },
    meaning: "To use spoken words; to talk or communicate verbally.",
    forms: [
      { form: "speaks",      type: "third_person_present" },
      { form: "spoke",       type: "past" },
      { form: "speaking",    type: "present_participle" },
      { form: "will speak",  type: "future" },
    ],
  },
  {
    id: "read",
    baseForm: "read",
    language: "en",
    classifications: { grammaticalCategory: "verb" },
    meaning: "To look at and understand written text.",
    forms: [
      { form: "reads",     type: "third_person_present" },
      { form: "read",      type: "past" },
      { form: "reading",   type: "present_participle" },
      { form: "will read", type: "future" },
    ],
  },
  {
    id: "write",
    baseForm: "write",
    language: "en",
    classifications: { grammaticalCategory: "verb" },
    meaning: "To put words or letters on a surface or screen.",
    forms: [
      { form: "writes",      type: "third_person_present" },
      { form: "wrote",       type: "past" },
      { form: "writing",     type: "present_participle" },
      { form: "will write",  type: "future" },
    ],
  },
  {
    id: "work",
    baseForm: "work",
    language: "en",
    classifications: { grammaticalCategory: "verb" },
    meaning: "To do a job or task; to function properly.",
    forms: [
      { form: "works",      type: "third_person_present" },
      { form: "worked",     type: "past" },
      { form: "working",    type: "present_participle" },
      { form: "will work",  type: "future" },
    ],
  },
  {
    id: "live",
    baseForm: "live",
    language: "en",
    classifications: { grammaticalCategory: "verb" },
    meaning: "To reside somewhere; to be alive.",
    forms: [
      { form: "lives",      type: "third_person_present" },
      { form: "lived",      type: "past" },
      { form: "living",     type: "present_participle" },
      { form: "will live",  type: "future" },
    ],
  },
  {
    id: "give",
    baseForm: "give",
    language: "en",
    classifications: { grammaticalCategory: "verb" },
    meaning: "To hand something to someone; to provide or offer.",
    forms: [
      { form: "gives",     type: "third_person_present" },
      { form: "gave",      type: "past" },
      { form: "giving",    type: "present_participle" },
      { form: "will give", type: "future" },
    ],
  },
  {
    id: "take",
    baseForm: "take",
    language: "en",
    classifications: { grammaticalCategory: "verb" },
    meaning: "To pick up or carry something; to accept or receive.",
    forms: [
      { form: "takes",     type: "third_person_present" },
      { form: "took",      type: "past" },
      { form: "taking",    type: "present_participle" },
      { form: "will take", type: "future" },
    ],
  },
  {
    id: "make",
    baseForm: "make",
    language: "en",
    classifications: { grammaticalCategory: "verb" },
    meaning: "To create or produce something; to cause something to happen.",
    forms: [
      { form: "makes",     type: "third_person_present" },
      { form: "made",      type: "past" },
      { form: "making",    type: "present_participle" },
      { form: "will make", type: "future" },
    ],
  },
  {
    id: "get",
    baseForm: "get",
    language: "en",
    classifications: { grammaticalCategory: "verb" },
    meaning: "To obtain or receive something; to become.",
    forms: [
      { form: "gets",     type: "third_person_present" },
      { form: "got",      type: "past" },
      { form: "getting",  type: "present_participle" },
      { form: "will get", type: "future" },
    ],
  },
  {
    id: "drink",
    baseForm: "drink",
    language: "en",
    classifications: { grammaticalCategory: "verb" },
    meaning: "To swallow liquid.",
    forms: [
      { form: "drinks",      type: "third_person_present" },
      { form: "drank",       type: "past" },
      { form: "drinking",    type: "present_participle" },
      { form: "will drink",  type: "future" },
    ],
  },
  {
    id: "sleep",
    baseForm: "sleep",
    language: "en",
    classifications: { grammaticalCategory: "verb" },
    meaning: "To rest in a state of unconsciousness.",
    forms: [
      { form: "sleeps",      type: "third_person_present" },
      { form: "slept",       type: "past" },
      { form: "sleeping",    type: "present_participle" },
      { form: "will sleep",  type: "future" },
    ],
  },
  {
    id: "look",
    baseForm: "look",
    language: "en",
    classifications: { grammaticalCategory: "verb" },
    meaning: "To direct your eyes toward something; to appear a certain way.",
    forms: [
      { form: "looks",     type: "third_person_present" },
      { form: "looked",    type: "past" },
      { form: "looking",   type: "present_participle" },
      { form: "will look", type: "future" },
    ],
  },
  {
    id: "play",
    baseForm: "play",
    language: "en",
    classifications: { grammaticalCategory: "verb" },
    meaning: "To take part in a game or recreational activity.",
    forms: [
      { form: "plays",     type: "third_person_present" },
      { form: "played",    type: "past" },
      { form: "playing",   type: "present_participle" },
      { form: "will play", type: "future" },
    ],
  },
  {
    id: "open",
    baseForm: "open",
    language: "en",
    classifications: { grammaticalCategory: "verb" },
    meaning: "To make something no longer closed or sealed.",
    forms: [
      { form: "opens",      type: "third_person_present" },
      { form: "opened",     type: "past" },
      { form: "opening",    type: "present_participle" },
      { form: "will open",  type: "future" },
    ],
  },
  {
    id: "close",
    baseForm: "close",
    language: "en",
    classifications: { grammaticalCategory: "verb" },
    meaning: "To shut something; to make something no longer open.",
    forms: [
      { form: "closes",      type: "third_person_present" },
      { form: "closed",      type: "past" },
      { form: "closing",     type: "present_participle" },
      { form: "will close",  type: "future" },
    ],
  },
  {
    id: "walk",
    baseForm: "walk",
    language: "en",
    classifications: { grammaticalCategory: "verb" },
    meaning: "To move on foot at a normal pace.",
    forms: [
      { form: "walks",      type: "third_person_present" },
      { form: "walked",     type: "past" },
      { form: "walking",    type: "present_participle" },
      { form: "will walk",  type: "future" },
    ],
  },
  {
    id: "run",
    baseForm: "run",
    language: "en",
    classifications: { grammaticalCategory: "verb" },
    meaning: "To move quickly on foot.",
    forms: [
      { form: "runs",     type: "third_person_present" },
      { form: "ran",      type: "past" },
      { form: "running",  type: "present_participle" },
      { form: "will run", type: "future" },
    ],
  },

  // ── Adjectives ────────────────────────────────────────────────

  {
    id: "bad",
    baseForm: "bad",
    language: "en",
    classifications: { grammaticalCategory: "adjective" },
    meaning: "Of poor quality; not good.",
    forms: [
      { form: "worse", type: "comparative" },
      { form: "worst", type: "superlative" },
    ],
  },
  {
    id: "long",
    baseForm: "long",
    language: "en",
    classifications: { grammaticalCategory: "adjective" },
    meaning: "Having a great length or duration.",
    forms: [
      { form: "longer",  type: "comparative" },
      { form: "longest", type: "superlative" },
    ],
  },
  {
    id: "short",
    baseForm: "short",
    language: "en",
    classifications: { grammaticalCategory: "adjective" },
    meaning: "Not long in length or time; small in height.",
    forms: [
      { form: "shorter",  type: "comparative" },
      { form: "shortest", type: "superlative" },
    ],
  },
  {
    id: "old",
    baseForm: "old",
    language: "en",
    classifications: { grammaticalCategory: "adjective" },
    meaning: "Having existed for a long time; not young or new.",
    forms: [
      { form: "older",  type: "comparative" },
      { form: "oldest", type: "superlative" },
    ],
  },
  {
    id: "young",
    baseForm: "young",
    language: "en",
    classifications: { grammaticalCategory: "adjective" },
    meaning: "Not old; in an early stage of life.",
    forms: [
      { form: "younger",  type: "comparative" },
      { form: "youngest", type: "superlative" },
    ],
  },
  {
    id: "new",
    baseForm: "new",
    language: "en",
    classifications: { grammaticalCategory: "adjective" },
    meaning: "Recently made, acquired, or discovered; not old or used.",
    forms: [
      { form: "newer",  type: "comparative" },
      { form: "newest", type: "superlative" },
    ],
  },
  {
    id: "warm",
    baseForm: "warm",
    language: "en",
    classifications: { grammaticalCategory: "adjective" },
    meaning: "Moderately hot; comfortable in temperature.",
    forms: [
      { form: "warmer",  type: "comparative" },
      { form: "warmest", type: "superlative" },
    ],
  },
  {
    id: "easy",
    baseForm: "easy",
    language: "en",
    classifications: { grammaticalCategory: "adjective" },
    meaning: "Not difficult; done or achieved without great effort.",
    forms: [
      { form: "easier",  type: "comparative" },
      { form: "easiest", type: "superlative" },
      { form: "easily",  type: "adverb" },
    ],
  },
  {
    id: "fast",
    baseForm: "fast",
    language: "en",
    classifications: { grammaticalCategory: "adjective" },
    meaning: "Moving or happening quickly; not slow.",
    forms: [
      { form: "faster",  type: "comparative" },
      { form: "fastest", type: "superlative" },
    ],
  },
  {
    id: "slow",
    baseForm: "slow",
    language: "en",
    classifications: { grammaticalCategory: "adjective" },
    meaning: "Not moving or happening quickly; taking a long time.",
    forms: [
      { form: "slower",  type: "comparative" },
      { form: "slowest", type: "superlative" },
      { form: "slowly",  type: "adverb" },
    ],
  },
  {
    id: "sad",
    baseForm: "sad",
    language: "en",
    classifications: { grammaticalCategory: "adjective" },
    meaning: "Feeling unhappy or sorrowful.",
    forms: [
      { form: "sadder",  type: "comparative" },
      { form: "saddest", type: "superlative" },
      { form: "sadly",   type: "adverb" },
    ],
  },
  {
    id: "angry",
    baseForm: "angry",
    language: "en",
    classifications: { grammaticalCategory: "adjective" },
    meaning: "Feeling or showing strong displeasure or frustration.",
    forms: [
      { form: "angrier",  type: "comparative" },
      { form: "angriest", type: "superlative" },
      { form: "angrily",  type: "adverb" },
    ],
  },
  {
    id: "tired",
    baseForm: "tired",
    language: "en",
    classifications: { grammaticalCategory: "adjective" },
    meaning: "Feeling a need to rest or sleep; lacking energy.",
    forms: [],
  },
  {
    id: "hungry",
    baseForm: "hungry",
    language: "en",
    classifications: { grammaticalCategory: "adjective" },
    meaning: "Feeling a need or desire to eat.",
    forms: [
      { form: "hungrier",  type: "comparative" },
      { form: "hungriest", type: "superlative" },
    ],
  },
  {
    id: "sick",
    baseForm: "sick",
    language: "en",
    classifications: { grammaticalCategory: "adjective" },
    meaning: "Unwell; suffering from an illness.",
    forms: [],
  },
  {
    id: "busy",
    baseForm: "busy",
    language: "en",
    classifications: { grammaticalCategory: "adjective" },
    meaning: "Having a lot to do; occupied with tasks.",
    forms: [
      { form: "busier",  type: "comparative" },
      { form: "busiest", type: "superlative" },
    ],
  },
  {
    id: "right",
    baseForm: "right",
    language: "en",
    classifications: { grammaticalCategory: "adjective" },
    meaning: "Correct; appropriate.",
    forms: [],
  },
  {
    id: "wrong",
    baseForm: "wrong",
    language: "en",
    classifications: { grammaticalCategory: "adjective" },
    meaning: "Not correct; not appropriate.",
    forms: [],
  },
  {
    id: "nice",
    baseForm: "nice",
    language: "en",
    classifications: { grammaticalCategory: "adjective" },
    meaning: "Pleasant; kind; enjoyable.",
    forms: [
      { form: "nicer",  type: "comparative" },
      { form: "nicest", type: "superlative" },
    ],
  },
  {
    id: "beautiful",
    baseForm: "beautiful",
    language: "en",
    classifications: { grammaticalCategory: "adjective" },
    meaning: "Very attractive or pleasing to look at.",
    forms: [
      { form: "more beautiful", type: "comparative" },
      { form: "most beautiful", type: "superlative" },
      { form: "beautifully",   type: "adverb" },
    ],
  },

  // ── Colors (adjectives) ───────────────────────────────────────

  {
    id: "red",
    baseForm: "red",
    language: "en",
    classifications: { grammaticalCategory: "adjective" },
    meaning: "Having the color of blood or fire.",
    forms: [],
  },
  {
    id: "blue",
    baseForm: "blue",
    language: "en",
    classifications: { grammaticalCategory: "adjective" },
    meaning: "Having the color of a clear sky.",
    forms: [],
  },
  {
    id: "green",
    baseForm: "green",
    language: "en",
    classifications: { grammaticalCategory: "adjective" },
    meaning: "Having the color of grass or leaves.",
    forms: [],
  },
  {
    id: "yellow",
    baseForm: "yellow",
    language: "en",
    classifications: { grammaticalCategory: "adjective" },
    meaning: "Having the color of the sun or ripe bananas.",
    forms: [],
  },
  {
    id: "black",
    baseForm: "black",
    language: "en",
    classifications: { grammaticalCategory: "adjective" },
    meaning: "Having the darkest possible color, like night.",
    forms: [],
  },
  {
    id: "white",
    baseForm: "white",
    language: "en",
    classifications: { grammaticalCategory: "adjective" },
    meaning: "Having the lightest possible color, like snow.",
    forms: [],
  },
  {
    id: "gray",
    baseForm: "gray",
    language: "en",
    classifications: { grammaticalCategory: "adjective" },
    meaning: "Having a color between black and white.",
    forms: [
      { form: "grey", type: "variant_spelling" },
    ],
  },
  {
    id: "brown",
    baseForm: "brown",
    language: "en",
    classifications: { grammaticalCategory: "adjective" },
    meaning: "Having the color of earth or wood.",
    forms: [],
  },
  {
    id: "orange",
    baseForm: "orange",
    language: "en",
    classifications: { grammaticalCategory: "adjective" },
    meaning: "Having a color between red and yellow.",
    forms: [],
  },
  {
    id: "pink",
    baseForm: "pink",
    language: "en",
    classifications: { grammaticalCategory: "adjective" },
    meaning: "Having a light red color.",
    forms: [],
  },
  {
    id: "purple",
    baseForm: "purple",
    language: "en",
    classifications: { grammaticalCategory: "adjective" },
    meaning: "Having a color between blue and red.",
    forms: [],
  },

  // ── Nouns — people / family ───────────────────────────────────

  {
    id: "man",
    baseForm: "man",
    language: "en",
    classifications: { grammaticalCategory: "noun" },
    meaning: "An adult male person.",
    forms: [
      { form: "men", type: "plural" },
    ],
  },
  {
    id: "woman",
    baseForm: "woman",
    language: "en",
    classifications: { grammaticalCategory: "noun" },
    meaning: "An adult female person.",
    forms: [
      { form: "women", type: "plural" },
    ],
  },
  {
    id: "boy",
    baseForm: "boy",
    language: "en",
    classifications: { grammaticalCategory: "noun" },
    meaning: "A young male person; a child or teenager who is male.",
    forms: [
      { form: "boys", type: "plural" },
    ],
  },
  {
    id: "girl",
    baseForm: "girl",
    language: "en",
    classifications: { grammaticalCategory: "noun" },
    meaning: "A young female person; a child or teenager who is female.",
    forms: [
      { form: "girls", type: "plural" },
    ],
  },
  {
    id: "family",
    baseForm: "family",
    language: "en",
    classifications: { grammaticalCategory: "noun" },
    meaning: "A group of people related to each other, especially parents and children.",
    forms: [
      { form: "families", type: "plural" },
    ],
  },
  {
    id: "mother",
    baseForm: "mother",
    language: "en",
    classifications: { grammaticalCategory: "noun" },
    meaning: "A female parent.",
    forms: [
      { form: "mothers", type: "plural" },
      { form: "mom",     type: "informal" },
    ],
  },
  {
    id: "father",
    baseForm: "father",
    language: "en",
    classifications: { grammaticalCategory: "noun" },
    meaning: "A male parent.",
    forms: [
      { form: "fathers", type: "plural" },
      { form: "dad",     type: "informal" },
    ],
  },
  {
    id: "child",
    baseForm: "child",
    language: "en",
    classifications: { grammaticalCategory: "noun" },
    meaning: "A young person who is not yet an adult.",
    forms: [
      { form: "children", type: "plural" },
    ],
  },
  {
    id: "person",
    baseForm: "person",
    language: "en",
    classifications: { grammaticalCategory: "noun" },
    meaning: "A human being.",
    forms: [
      { form: "people", type: "plural" },
    ],
  },
  {
    id: "baby",
    baseForm: "baby",
    language: "en",
    classifications: { grammaticalCategory: "noun" },
    meaning: "A very young child who cannot yet walk or talk.",
    forms: [
      { form: "babies", type: "plural" },
    ],
  },

  // ── Nouns — food / drink ──────────────────────────────────────

  {
    id: "water",
    baseForm: "water",
    language: "en",
    classifications: { grammaticalCategory: "noun" },
    meaning: "The clear liquid needed for life; what falls as rain.",
    forms: [],
  },
  {
    id: "bread",
    baseForm: "bread",
    language: "en",
    classifications: { grammaticalCategory: "noun" },
    meaning: "A basic food made from flour and water, usually baked.",
    forms: [],
  },
  {
    id: "milk",
    baseForm: "milk",
    language: "en",
    classifications: { grammaticalCategory: "noun" },
    meaning: "The white liquid produced by cows and other animals; used as a drink and in cooking.",
    forms: [],
  },
  {
    id: "egg",
    baseForm: "egg",
    language: "en",
    classifications: { grammaticalCategory: "noun" },
    meaning: "An oval object laid by a bird, used as food.",
    forms: [
      { form: "eggs", type: "plural" },
    ],
  },
  {
    id: "coffee",
    baseForm: "coffee",
    language: "en",
    classifications: { grammaticalCategory: "noun" },
    meaning: "A hot drink made from roasted coffee beans.",
    forms: [
      { form: "coffees", type: "plural" },
    ],
  },
  {
    id: "tea",
    baseForm: "tea",
    language: "en",
    classifications: { grammaticalCategory: "noun" },
    meaning: "A hot drink made from dried leaves steeped in water.",
    forms: [
      { form: "teas", type: "plural" },
    ],
  },
  {
    id: "apple",
    baseForm: "apple",
    language: "en",
    classifications: { grammaticalCategory: "noun" },
    meaning: "A round fruit with red, green, or yellow skin.",
    forms: [
      { form: "apples", type: "plural" },
    ],
  },

  // ── Nouns — places ────────────────────────────────────────────

  {
    id: "home",
    baseForm: "home",
    language: "en",
    classifications: { grammaticalCategory: "noun" },
    meaning: "The place where you live or where you feel you belong.",
    forms: [
      { form: "homes", type: "plural" },
    ],
  },
  {
    id: "school",
    baseForm: "school",
    language: "en",
    classifications: { grammaticalCategory: "noun" },
    meaning: "A place where children go to learn.",
    forms: [
      { form: "schools", type: "plural" },
    ],
  },
  {
    id: "city",
    baseForm: "city",
    language: "en",
    classifications: { grammaticalCategory: "noun" },
    meaning: "A large and important town.",
    forms: [
      { form: "cities", type: "plural" },
    ],
  },
  {
    id: "street",
    baseForm: "street",
    language: "en",
    classifications: { grammaticalCategory: "noun" },
    meaning: "A public road in a town or city, usually with buildings on either side.",
    forms: [
      { form: "streets", type: "plural" },
    ],
  },
  {
    id: "country",
    baseForm: "country",
    language: "en",
    classifications: { grammaticalCategory: "noun" },
    meaning: "A nation with its own government and land.",
    forms: [
      { form: "countries", type: "plural" },
    ],
  },
  {
    id: "park",
    baseForm: "park",
    language: "en",
    classifications: { grammaticalCategory: "noun" },
    meaning: "An open outdoor area with grass and trees for public enjoyment.",
    forms: [
      { form: "parks", type: "plural" },
    ],
  },
  {
    id: "restaurant",
    baseForm: "restaurant",
    language: "en",
    classifications: { grammaticalCategory: "noun" },
    meaning: "A place where people pay to eat meals.",
    forms: [
      { form: "restaurants", type: "plural" },
    ],
  },

  // ── Nouns — things ────────────────────────────────────────────

  {
    id: "car",
    baseForm: "car",
    language: "en",
    classifications: { grammaticalCategory: "noun" },
    meaning: "A road vehicle with four wheels and an engine.",
    forms: [
      { form: "cars", type: "plural" },
    ],
  },
  {
    id: "book",
    baseForm: "book",
    language: "en",
    classifications: { grammaticalCategory: "noun" },
    meaning: "A written or printed work, usually with pages bound together.",
    forms: [
      { form: "books", type: "plural" },
    ],
  },
  {
    id: "money",
    baseForm: "money",
    language: "en",
    classifications: { grammaticalCategory: "noun" },
    meaning: "Currency; coins or notes used for buying things.",
    forms: [],
  },
  {
    id: "phone",
    baseForm: "phone",
    language: "en",
    classifications: { grammaticalCategory: "noun" },
    meaning: "A device for making calls or communicating; a mobile phone.",
    forms: [
      { form: "phones", type: "plural" },
    ],
  },
  {
    id: "table",
    baseForm: "table",
    language: "en",
    classifications: { grammaticalCategory: "noun" },
    meaning: "A piece of furniture with a flat top and legs.",
    forms: [
      { form: "tables", type: "plural" },
    ],
  },
  {
    id: "bed",
    baseForm: "bed",
    language: "en",
    classifications: { grammaticalCategory: "noun" },
    meaning: "A piece of furniture for sleeping on.",
    forms: [
      { form: "beds", type: "plural" },
    ],
  },

  // ── Nouns — time ──────────────────────────────────────────────

  {
    id: "morning",
    baseForm: "morning",
    language: "en",
    classifications: { grammaticalCategory: "noun" },
    meaning: "The early part of the day, from sunrise until noon.",
    forms: [
      { form: "mornings", type: "plural" },
    ],
  },
  {
    id: "evening",
    baseForm: "evening",
    language: "en",
    classifications: { grammaticalCategory: "noun" },
    meaning: "The part of the day from late afternoon until bedtime.",
    forms: [
      { form: "evenings", type: "plural" },
    ],
  },
  {
    id: "week",
    baseForm: "week",
    language: "en",
    classifications: { grammaticalCategory: "noun" },
    meaning: "A period of seven days.",
    forms: [
      { form: "weeks", type: "plural" },
    ],
  },
  {
    id: "month",
    baseForm: "month",
    language: "en",
    classifications: { grammaticalCategory: "noun" },
    meaning: "One of the twelve periods that a year is divided into.",
    forms: [
      { form: "months", type: "plural" },
    ],
  },
  {
    id: "year",
    baseForm: "year",
    language: "en",
    classifications: { grammaticalCategory: "noun" },
    meaning: "A period of twelve months or 365 days.",
    forms: [
      { form: "years", type: "plural" },
    ],
  },

  // ── Modals ────────────────────────────────────────────────────

  {
    id: "can",
    baseForm: "can",
    language: "en",
    classifications: { grammaticalCategory: "modal" },
    meaning: "Used to say that something is possible or that someone is able to do something.",
    forms: [
      { form: "can't",  type: "negative" },
      { form: "cannot", type: "negative_formal" },
    ],
  },
  {
    id: "will",
    baseForm: "will",
    language: "en",
    classifications: { grammaticalCategory: "modal" },
    meaning: "Used to talk about the future; expressing intention or prediction.",
    forms: [
      { form: "won't",    type: "negative" },
      { form: "will not", type: "negative_formal" },
    ],
  },
  {
    id: "would",
    baseForm: "would",
    language: "en",
    classifications: { grammaticalCategory: "modal" },
    meaning: "Used for polite requests, conditions, or things you want.",
    forms: [
      { form: "wouldn't", type: "negative" },
    ],
  },
  {
    id: "should",
    baseForm: "should",
    language: "en",
    classifications: { grammaticalCategory: "modal" },
    meaning: "Used to give advice or say what is the right thing to do.",
    forms: [
      { form: "shouldn't", type: "negative" },
    ],
  },
  {
    id: "must",
    baseForm: "must",
    language: "en",
    classifications: { grammaticalCategory: "modal" },
    meaning: "Used to say something is necessary or strongly required.",
    forms: [
      { form: "mustn't", type: "negative" },
    ],
  },
  {
    id: "could",
    baseForm: "could",
    language: "en",
    classifications: { grammaticalCategory: "modal" },
    meaning: "Past form of can; also used for polite requests and possibilities.",
    forms: [
      { form: "couldn't", type: "negative" },
    ],
  },
  {
    id: "may",
    baseForm: "may",
    language: "en",
    classifications: { grammaticalCategory: "modal" },
    meaning: "Used to say something is possible or to ask for permission politely.",
    forms: [],
  },

  // ── Question words (new) ──────────────────────────────────────

  {
    id: "when",
    baseForm: "when",
    language: "en",
    classifications: { grammaticalCategory: "adverb" },
    meaning: "Used to ask about or refer to the time of something.",
    forms: [],
  },
  {
    id: "why",
    baseForm: "why",
    language: "en",
    classifications: { grammaticalCategory: "adverb" },
    meaning: "Used to ask about the reason for something.",
    forms: [],
  },
  {
    id: "which",
    baseForm: "which",
    language: "en",
    classifications: { grammaticalCategory: "pronoun" },
    meaning: "Used to ask about or identify a specific item from a group.",
    forms: [],
  },

  // ── Social / response words ───────────────────────────────────

  {
    id: "yes",
    baseForm: "yes",
    language: "en",
    classifications: { grammaticalCategory: "interjection" },
    meaning: "Used to agree, confirm, or respond positively.",
    forms: [],
  },
  {
    id: "hello",
    baseForm: "hello",
    language: "en",
    classifications: { grammaticalCategory: "interjection" },
    meaning: "A greeting used when meeting someone or answering a call.",
    forms: [
      { form: "hi", type: "informal" },
    ],
  },
  {
    id: "goodbye",
    baseForm: "goodbye",
    language: "en",
    classifications: { grammaticalCategory: "interjection" },
    meaning: "Said when leaving someone or ending a conversation.",
    forms: [
      { form: "bye", type: "informal" },
    ],
  },

  // ── Conjunctions ──────────────────────────────────────────────

  {
    id: "and",
    baseForm: "and",
    language: "en",
    classifications: { grammaticalCategory: "conjunction" },
    meaning: "Used to join words, phrases, or clauses together.",
    forms: [],
  },
  {
    id: "but",
    baseForm: "but",
    language: "en",
    classifications: { grammaticalCategory: "conjunction" },
    meaning: "Used to introduce a contrast or exception.",
    forms: [],
  },
  {
    id: "or",
    baseForm: "or",
    language: "en",
    classifications: { grammaticalCategory: "conjunction" },
    meaning: "Used to present an alternative or choice.",
    forms: [],
  },
  {
    id: "because",
    baseForm: "because",
    language: "en",
    classifications: { grammaticalCategory: "conjunction" },
    meaning: "Used to give a reason for something.",
    forms: [],
  },
  {
    id: "if",
    baseForm: "if",
    language: "en",
    classifications: { grammaticalCategory: "conjunction" },
    meaning: "Used to introduce a condition or supposition.",
    forms: [],
  },

  {
    id: "more",
    baseForm: "more",
    language: "en",
    classifications: { grammaticalCategory: "adverb" },
    meaning: "A greater amount or degree of something.",
    forms: [],
  },
  {
    id: "no",
    baseForm: "no",
    language: "en",
    classifications: { grammaticalCategory: "interjection" },
    meaning: "Used to refuse, deny, or express the absence of something.",
    forms: [],
  },

  // ── Degree adverbs ────────────────────────────────────────────

  {
    id: "very",
    baseForm: "very",
    language: "en",
    classifications: { grammaticalCategory: "adverb" },
    meaning: "To a great degree; extremely.",
    forms: [],
  },
  {
    id: "really",
    baseForm: "really",
    language: "en",
    classifications: { grammaticalCategory: "adverb" },
    meaning: "Very much; in reality; used for emphasis.",
    forms: [],
  },
  {
    id: "also",
    baseForm: "also",
    language: "en",
    classifications: { grammaticalCategory: "adverb" },
    meaning: "In addition; as well; too.",
    forms: [],
  },
  {
    id: "maybe",
    baseForm: "maybe",
    language: "en",
    classifications: { grammaticalCategory: "adverb" },
    meaning: "Perhaps; possibly; used when uncertain.",
    forms: [],
  },
  {
    id: "just",
    baseForm: "just",
    language: "en",
    classifications: { grammaticalCategory: "adverb" },
    meaning: "Simply; only; exactly; recently.",
    forms: [],
  },

  // ── Prepositions (new) ────────────────────────────────────────

  {
    id: "to",
    baseForm: "to",
    language: "en",
    classifications: { grammaticalCategory: "preposition" },
    meaning: "Toward a place or person; used to show direction or destination.",
    forms: [],
  },
  {
    id: "from",
    baseForm: "from",
    language: "en",
    classifications: { grammaticalCategory: "preposition" },
    meaning: "Indicating the origin, starting point, or source of something.",
    forms: [],
  },
  {
    id: "for",
    baseForm: "for",
    language: "en",
    classifications: { grammaticalCategory: "preposition" },
    meaning: "Intended to benefit someone; in exchange for; during a period of time.",
    forms: [],
  },
  {
    id: "with",
    baseForm: "with",
    language: "en",
    classifications: { grammaticalCategory: "preposition" },
    meaning: "Accompanied by; having; using.",
    forms: [],
  },
  {
    id: "about",
    baseForm: "about",
    language: "en",
    classifications: { grammaticalCategory: "preposition" },
    meaning: "Concerning or relating to; approximately.",
    forms: [],
  },
  {
    id: "up",
    baseForm: "up",
    language: "en",
    classifications: { grammaticalCategory: "preposition" },
    meaning: "In or to a higher position; toward the top.",
    forms: [],
  },
  {
    id: "down",
    baseForm: "down",
    language: "en",
    classifications: { grammaticalCategory: "preposition" },
    meaning: "In or to a lower position; toward the bottom.",
    forms: [],
  },
]

export default words

