// Demo Content Words — English (TRANSITIONAL layer)
//
// A small set of common nouns and adjectives so the Forward Flow demo can
// exercise detection without relying on L1 enrichment of every word. This
// file is the open-class equivalent of verbFramesBootstrap.en.js — it
// exists ONLY because L1 enrichment isn't run for demo content. As more
// words get L1-enriched (via API or manual setup), they fall off this list.
// The file should shrink toward zero, never grow.
//
// Function words (pronouns, determiners, quantifiers, coordinators,
// prepositions, degree modifiers, closed-class adverbs) live in
// wordCategories.en.js and are PERMANENT. Don't add closed-class words
// here.
//
// Format: { [word]: 'noun' | 'adjective' }
// Adverbs that ARE part of the closed-class semantic groupings (time,
// place, frequency) live in wordCategories.en.js. Manner adverbs that
// derive from -ly suffixes are open-class; common ones live here.

export const DEMO_CONTENT_WORDS = {
  // ── Common nouns ───────────────────────────────────────────────────────
  // Animals
  dog: 'noun', dogs: 'noun', cat: 'noun', cats: 'noun', bird: 'noun', birds: 'noun', fish: 'noun',
  // Food / drink
  food: 'noun', water: 'noun', tea: 'noun', coffee: 'noun', juice: 'noun', milk: 'noun',
  bread: 'noun', rice: 'noun', apple: 'noun', apples: 'noun', egg: 'noun', eggs: 'noun',
  cake: 'noun',
  // Objects
  book: 'noun', books: 'noun', car: 'noun', cars: 'noun', bike: 'noun', phone: 'noun',
  ticket: 'noun', tickets: 'noun', bag: 'noun', money: 'noun',
  table: 'noun', desk: 'noun', wall: 'noun', floor: 'noun', door: 'noun', window: 'noun',
  // Places
  house: 'noun', room: 'noun', school: 'noun', work: 'noun', home: 'noun',
  garden: 'noun', kitchen: 'noun', city: 'noun', street: 'noun', country: 'noun',
  // People
  man: 'noun', woman: 'noun', men: 'noun', women: 'noun',
  boy: 'noun', boys: 'noun', girl: 'noun', girls: 'noun',
  child: 'noun', children: 'noun', baby: 'noun', babies: 'noun',
  mother: 'noun', father: 'noun',
  person: 'noun', people: 'noun',
  family: 'noun', friend: 'noun', friends: 'noun',
  teacher: 'noun', doctor: 'noun', fool: 'noun', genius: 'noun',
  // Abstract / time
  music: 'noun', name: 'noun', help: 'noun', morning: 'noun', night: 'noun',

  // ── Common adjectives ──────────────────────────────────────────────────
  // Affect / state
  happy: 'adjective', sad: 'adjective', tired: 'adjective', angry: 'adjective',
  hungry: 'adjective', thirsty: 'adjective', sick: 'adjective', healthy: 'adjective',
  busy: 'adjective', ready: 'adjective', free: 'adjective',
  // Evaluation
  good: 'adjective', bad: 'adjective', great: 'adjective', awful: 'adjective',
  nice: 'adjective', beautiful: 'adjective', ugly: 'adjective',
  right: 'adjective', wrong: 'adjective',
  easy: 'adjective',
  // Size / shape
  big: 'adjective', small: 'adjective', tall: 'adjective', short: 'adjective',
  long: 'adjective',
  // Temperature / texture
  hot: 'adjective', cold: 'adjective', warm: 'adjective', cool: 'adjective',
  // Age
  new: 'adjective', old: 'adjective', young: 'adjective',
  // Speed
  fast: 'adjective', slow: 'adjective',
  // Color
  red: 'adjective', blue: 'adjective', green: 'adjective', yellow: 'adjective',
  black: 'adjective', white: 'adjective', gray: 'adjective', brown: 'adjective',
  orange: 'adjective', pink: 'adjective', purple: 'adjective',
  // Cognition
  intelligent: 'adjective', smart: 'adjective', clever: 'adjective',
  // Wealth
  rich: 'adjective', poor: 'adjective',
}

export function lookupContentWord(token) {
  if (!token) return null
  const t = token.toLowerCase().replace(/[^\w'-]/g, '')
  return DEMO_CONTENT_WORDS[t] ?? null
}
