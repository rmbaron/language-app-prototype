// Exception Shapes — English
//
// The catalog of "marked" sentence openings — sentences that don't start
// with a normal Subject. Each one is announced by a specific kind of
// element at position 0 (the dispatch point).
//
// These are the operations from the macro-layer sketch — sentence-level
// transformations of a canonical declarative. Detection of which exception
// shape a typed sentence matches happens in exceptionShapeDetector.js
// (currently inlined in GrammarBreakerForwardFlowTab.jsx).
//
// Full handling of each shape (extracting the inverted Subject, finding the
// gap a wh-word fronted from, etc.) is future work — Phase 5 (marked
// constructions) and Phase 6 (operations).
//
// ── Record shape ──────────────────────────────────────────────────────────
//   id          — string, machine-readable id
//   label       — string, human-readable name
//   description — string, what this shape is and when it's used
//   pattern     — string, schematic of the shape using category names in brackets
//   trigger     — string, what's at position 0 that announces this shape
//   examples    — array of { sentence, highlight } showing the shape opening a sentence
//   testWords   — array of words needed in the seed (or hardcoded) to test this shape
//   detected    — boolean, whether Phase 3a currently detects this shape
//
// Source of truth for the macro-layer architecture: notes/macro-layer-sketch.md
//
// Router: exceptionShapes.js

export const EXCEPTION_SHAPES = [
  {
    id:          'imperative',
    label:       'Imperative',
    description: 'A command or instruction. Subject "you" is elided (the listener is implicit). The verb appears at position 0 in its base form.',
    pattern:     '[verb-base] [rest]',
    trigger:     'verb in base form at position 0',
    examples: [
      { sentence: 'Eat the food.',              highlight: 'Eat' },
      { sentence: 'Run!',                       highlight: 'Run' },
      { sentence: 'Give him a book.',           highlight: 'Give' },
      { sentence: 'Be quiet.',                  highlight: 'Be' },
    ],
    testWords:   ['(any of our 7 known verbs at position 0)'],
    detected:    true,
  },
  {
    id:          'yes_no_question',
    label:       'Yes/no question',
    description: 'A question expecting yes or no as an answer. Formed by inverting the Subject and the auxiliary or modal. If the underlying clause has no auxiliary (just present or past simple of a lexical verb), "do"-support is used.',
    pattern:     '[aux/modal] [subject] [verb] [rest]',
    trigger:     'auxiliary verb (do, does, did, am, is, are, was, were, have, has, had) or modal (can, could, will, would, shall, should, may, might, must) at position 0',
    examples: [
      { sentence: 'Did you eat?',               highlight: 'Did' },
      { sentence: 'Can she swim?',              highlight: 'Can' },
      { sentence: 'Is he tired?',               highlight: 'Is' },
      { sentence: 'Have they arrived?',         highlight: 'Have' },
    ],
    testWords:   ['do', 'does', 'did', 'am', 'is', 'are', 'was', 'were', 'have', 'has', 'had', 'can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must'],
    detected:    true,
  },
  {
    id:          'wh_question',
    label:       'Wh-question',
    description: 'A question asking for specific information. The wh-word fronts to position 0. If the wh-word is the subject, no inversion follows ("Who broke it?"). If the wh-word is anything else, subject-aux inversion follows ("What did she break?").',
    pattern:     '[wh-word] [aux] [subject] [verb] [rest]',
    trigger:     'wh-word (what, where, when, why, how, who, whom, whose, which) at position 0',
    examples: [
      { sentence: 'What did she eat?',          highlight: 'What' },
      { sentence: 'Who broke the vase?',        highlight: 'Who' },
      { sentence: 'Where are you going?',       highlight: 'Where' },
      { sentence: 'How tall is she?',           highlight: 'How' },
    ],
    testWords:   ['what', 'where', 'when', 'why', 'how', 'who', 'whom', 'whose', 'which'],
    detected:    true,
  },
  {
    id:          'adverbial_fronting',
    label:       'Adverbial fronting',
    description: 'A topicalized declarative — an adverbial of time, place, or frequency moves to position 0 for emphasis or topic-setting. The Subject and Verb keep their normal order.',
    pattern:     '[adverbial] [subject] [verb] [rest]',
    trigger:     'time/frequency/place adverb or PP at position 0 (yesterday, today, tomorrow, sometimes, always, often, in the morning, on Monday)',
    examples: [
      { sentence: 'Yesterday, she ate.',        highlight: 'Yesterday' },
      { sentence: 'On Monday, we went home.',   highlight: 'On Monday' },
      { sentence: 'Sometimes he sings.',        highlight: 'Sometimes' },
    ],
    testWords:   ['yesterday', 'tomorrow', 'sometimes', 'always', 'often', 'rarely'],
    detected:    true,
  },
  {
    id:          'negative_inversion',
    label:       'Negative inversion',
    description: 'A fronted negative or restrictive adverb (never, rarely, seldom, hardly, scarcely, nowhere) forces the Subject and auxiliary to invert — like a question, but in a declarative. Marked register, often literary or emphatic.',
    pattern:     '[negative-adverb] [aux] [subject] [verb] [rest]',
    trigger:     'negative or restrictive adverb at position 0 (never, rarely, seldom, hardly, scarcely, nowhere)',
    examples: [
      { sentence: 'Never have I seen this.',    highlight: 'Never' },
      { sentence: 'Rarely does she speak.',     highlight: 'Rarely' },
      { sentence: 'Hardly had he left.',        highlight: 'Hardly' },
    ],
    testWords:   ['never', 'rarely', 'seldom', 'hardly', 'scarcely', 'nowhere'],
    detected:    true,
  },
  {
    id:          'quotative_inversion',
    label:       'Quotative inversion',
    description: 'A direct quotation at position 0, followed by an inverted verb of saying and its Subject. Common in narrative writing.',
    pattern:     '[quote] [verb-of-saying] [subject]',
    trigger:     'open quote character (" or \') at position 0',
    examples: [
      { sentence: '"Hello," said the man.',     highlight: '"Hello,"' },
      { sentence: '"Yum," murmured she.',       highlight: '"Yum,"' },
    ],
    testWords:   ['said', 'murmured', 'whispered', 'shouted', '(plus a verb of saying)'],
    detected:    true,
  },
  {
    id:          'minor_sentence',
    label:       'Minor sentence / interjection',
    description: 'A standalone discourse element — interjection, greeting, reply, or politeness marker. These don\'t have a clause structure at all; they exist outside the Subject-Verb framework.',
    pattern:     '[interjection-or-discourse-marker]',
    trigger:     'discourse marker at position 0 (hello, hi, hey, wow, oh, sorry, thanks, please, welcome, goodbye, bye, etc.)',
    examples: [
      { sentence: 'Hello!',                     highlight: 'Hello' },
      { sentence: 'Sorry.',                     highlight: 'Sorry' },
      { sentence: 'Thanks.',                    highlight: 'Thanks' },
      { sentence: 'Wow!',                       highlight: 'Wow' },
      { sentence: 'Goodbye.',                   highlight: 'Goodbye' },
    ],
    testWords:   ['hello', 'hi', 'hey', 'wow', 'oh', 'sorry', 'thanks', 'please', 'welcome', 'goodbye', 'bye', 'okay', 'ok'],
    detected:    true,
  },
  {
    id:          'dummy_insertion',
    label:       'Dummy insertion (existential / cleft)',
    description: 'The surface Subject slot is filled by a dummy "there" or "it" that doesn\'t carry meaning; the real Subject (existential) or focused element (cleft) appears later in the sentence.',
    pattern:     '[there/it] [BE] [logical-subject or focused-NP] [rest]',
    trigger:     '"there" or "it" at position 0 followed by a form of BE',
    examples: [
      { sentence: 'There is a problem.',                highlight: 'There is' },
      { sentence: 'There were three dogs.',             highlight: 'There were' },
      { sentence: 'It was the cat that broke the vase.', highlight: 'It was' },
      { sentence: 'It is raining.',                     highlight: 'It is' },
    ],
    testWords:   ['there', 'it', 'be', 'is', 'are', 'was', 'were', 'that'],
    detected:    'partial',
  },
]
