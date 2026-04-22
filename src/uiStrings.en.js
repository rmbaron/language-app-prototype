// English UI strings — the default interface language.
//
// To add a new interface language:
//   1. Create uiStrings.{code}.js mirroring this structure
//   2. Import it in uiStrings.js and add to the STRINGS map
//
// Structure: nested by screen/component.
// Parameterized strings are arrow functions: n => `${n} words`
//
// RULE: any text a user reads goes here, never hardcoded into a component.
// This applies to all future screens: companion, modules, outer world, etc.

export default {

  common: {
    back:    '← Back',
    loading: 'Loading...',
    search:  'Search...',

    // Grammatical category labels — used everywhere categories are shown to the user:
    // word cards, word profiles, filter buttons, steering buttons, etc.
    // These must be in the interface language — a learner who doesn't yet know English
    // cannot be expected to know what "verb" means.
    categories: {
      verb:          'Verb',
      noun:          'Noun',
      adjective:     'Adjective',
      pronoun:       'Pronoun',
      preposition:   'Preposition',
      demonstrative: 'Demonstrative',
      interrogative: 'Question word',
      determiner:    'Article / determiner',
      adverb:        'Adverb',
      conjunction:   'Conjunction',
      interjection:  'Interjection',
    },

    // Plural forms for filter buttons (e.g. "Verbs", "Nouns")
    categoriesPlural: {
      verb:          'Verbs',
      noun:          'Nouns',
      adjective:     'Adjectives',
      pronoun:       'Pronouns',
      preposition:   'Place words',
      demonstrative: 'Pointing words',
      interrogative: 'Questions',
      determiner:    'Articles',
      adverb:        'Adverbs',
    },

    // Lane names — used everywhere lanes are shown to the user
    lanes: {
      reading:   'Reading',
      writing:   'Writing',
      listening: 'Listening',
      speaking:  'Speaking',
    },
  },

  onboarding: {
    continue:   'Continue',
    getStarted: 'Get started',

    welcome: {
      title: 'Welcome.',
      body1: 'This app helps you build a real working vocabulary — one word at a time, practiced across reading, listening, writing, and speaking.',
      body2: "It'll take about a minute to set things up.",
    },

    targetLanguage: {
      title: 'What language are you learning?',
    },

    level: {
      title: 'How much do you already know?',
      options: {
        beginner:           { label: "I'm just starting out",  tooltip: "Choose this if you've never studied this language, or only recognize a handful of words." },
        elementary:         { label: "I know a little",        tooltip: "Choose this if you know some common words and basic phrases but can't yet form sentences on your own." },
        intermediate:       { label: "I know a fair amount",   tooltip: "Choose this if you can handle simple everyday conversations with some effort and occasional gaps." },
        upper_intermediate: { label: "I know a good amount",   tooltip: "Choose this if you're comfortable in most everyday situations but still actively building vocabulary." },
      },
    },

    goal: {
      title:           "What's your goal?",
      noteLabel:       'Want to say more? (optional)',
      notePlaceholder: 'In your own words, why are you learning...',
      options: {
        fluency:  'Full fluency',
        trip:     'A short trip',
        work:     'Work or professional use',
        phrases:  'Just a few useful phrases',
        course:   "Match a course I'm already taking",
      },
    },

    personalization: {
      title:    'How personal do you want it?',
      subtitle: 'This shapes how practice content is tailored to you.',
      options: {
        general:  { label: 'Keep it general', description: 'Standard practice content — not tailored to you personally.' },
        blended:  { label: 'Mix it in',        description: 'Occasionally weave your interests and context into practice.' },
        personal: { label: 'Make it mine',     description: 'Everything reflects your world — topics, style, and context.' },
      },
    },
  },

  wordBank: {
    title:             'Word Bank',
    searchPlaceholder: 'Search...',
    empty:             'No words match.',

    sort: {
      az:        'A–Z',
      za:        'Z–A',
      strongest: 'Strongest',
      weakest:   'Weakest',
    },

    status: {
      all:       n => `all (${n})`,
      active:    n => `active (${n})`,
      banked:    n => `banked (${n})`,
      completed: n => `completed (${n})`,
    },

    addWord:           'Add a word',

    milestones: {
      wordsToGo: n => `${n} word${n !== 1 ? 's' : ''} to go`,
      seeAhead:  "see what's ahead",
      hideAhead: "hide what's ahead",
      achieved:  n => `Achieved (${n})`,
    },
  },

  wordProfile: {
    mastery:   'Word mastery',
    practice:  'Practice',
    remove:    'Remove from Word Bank',

    sections: {
      fullerMeaning: 'Fuller meaning',
      otherForms:    'Other forms',
      stats:         'Stats',
    },

    stats: {
      timesSeen:     'Times seen',
      dayStreak:     'Day streak',
      lastPracticed: 'Last practiced',
      level:         'Level',
    },
  },

  addWord: {
    title:             'Add a word',
    subtitle:          'Search for a word you already know and prove it.',
    searchPlaceholder: 'Search for a word...',
    noResults:         q => `No words found for "${q}".`,
    lanePrompt:        'How would you like to prove you know it?',
    success:           'Added to your Word Bank',
    addAnother:        'Add another word',
  },

  discover: {
    title:             'Discover Words',
    subtitle:          'Tap a word to practice it and add it to your Word Bank.',
    searchPlaceholder: 'Search for a specific word...',
    aiToggle:          'AI decides how many',
    words:             n => `${n} words`,
    loading:           'Loading recommendations...',

    empty: {
      search:     q => `No words found for "${q}".`,
      noRecs:     'No recommendations right now — check back as your Word Bank grows.',
      noSteering: 'No recommendations available for that steering — try adjusting your level or filters.',
    },

    success:     'Added to your Word Bank',
    backToRecs:  'Back to recommendations',
    tapToReveal: 'tap to reveal',
    correct:     '✓  I knew it',
    incorrect:   '✗  Not yet',
    chooseLane:  'Choose a lane to practice',
    moreCorrect: n => `${n} more correct to add to Word Bank`,

    slotReason: {
      fills_missing: label => `fills missing: ${label}`,
      deepens:       label => `deepens: ${label}`,
    },

    intentPlaceholder: 'Tell me what you want to do… (coming soon)',
    addTopic:          '+ Add',
    topicPlaceholder:  'e.g. food, music…',
  },

  celestial: {

    firstWord: 'Your first word.',

    // Shown when a lane auto-completes in Phase 1
    laneAck: {
      reading:   'Reading',
      writing:   'Writing',
      listening: 'Listening',
      speaking:  'Speaking',
    },

    // Shown when a communicative function is unlocked
    // Keys match functionUnlocked values in phase1Sequence.en.js
    functions: {
      refer_to_self:    'You can refer to yourself.',
      express_desire:   'You can express desire.',
      name_food:        'You can talk about food.',
      express_possession: 'You can say what you have.',
      address_others:   'You can address someone directly.',
      greet_others:     'You can greet people.',
      ask_for_more:     'You can ask for more.',
      decline_refuse:   'You can say no.',
      connect_ideas:    'You can connect two ideas.',
      name_water:       'You can ask for water.',
    },

    tapToHear:      'tap to hear',
    speakIt:        'say it',
    bannerDismiss:  '×',
    devSpeakDone:   '✓ mark done',
    tapToContinue:  'tap to continue',
    useNewWord:     'place the new word to continue',

    // Syntactic roles shown in the sentence phase slot labels
    roles: {
      subject:   'Subject',
      verb:      'Verb',
      object:    'Object',
      modifier:  'Modifier',
      connector: 'Connector',
      greeting:  'Greeting',
      response:  'Response',
    },

  },

  practiceHub: {
    title:       'Practice',
    laneReading:   'Read sentences built from your words.',
    laneWriting:   'Write sentences using your words.',
    laneListening: 'Listen and respond.',
    laneSpeaking:  'Say it out loud.',
    comingSoon:    'Coming soon',
  },

  readingPractice: {
    title:       'Reading',
    generating:  'Generating...',
    next:        'Next sentence',
    error:       'Could not generate a sentence. Try again.',
    noStructures: 'Keep building your word bank to unlock sentences.',
  },

  // Lane-specific practice mechanics.
  // Used by DiscoverWords (and eventually AddWord) when a lane is active.
  // These are foundation strings — the exercise design will evolve these.
  practice: {

    writing: {
      instruction:  'Use this word in a sentence:',
      placeholder:  'Write your sentence here...',
      submit:       'Submit',
    },

    speaking: {
      instruction:  'Say the word out loud:',
      micLabel:     'Tap to speak',
      listening:    'Listening...',
      notSupported: 'Speech recognition is not supported. Try Chrome.',
    },

    listening: {
      instruction: 'Listen, then mark whether you got it.',
      play:        'Play word',
      playing:     'Playing...',
    },

    reading: {
      wrong:    'Not quite — try again.',
      tryAgain: 'Try again',
    },

  },

  profiles: {
    title:          'Profiles',
    defaultLabel:   'Dev default',
    viewingAs:      name => `Viewing as: ${name}`,
    returnToDefault: 'Return to default',
    saveCurrentBtn: 'Create new user',
    saveStateBtn:   'Save state',
    namePlaceholder: 'Profile name',
    saveBtn:        'Save',
    cancelBtn:      'Cancel',
    loadBtn:        'Load',
    deleteBtn:      '✕',
    empty:          'No saved profiles yet.',
    cefrLabel:      'Level',
    words:          n => `${n} word${n === 1 ? '' : 's'}`,
  },

}
