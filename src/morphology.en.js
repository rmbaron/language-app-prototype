// English morphology expansion — English-specific.
// Maps a base word (word bank ID) to all its surface forms.
// Used by the word scanner to avoid false positives on inflected forms,
// and by the forms map to expose form-type tags for the grammar validator.

// Irregular forms tagged with their grammatical role.
// Canonical source. The legacy IRREGULAR table (untyped) is derived below.
//
// Type strings align with what L2 enrichment produces (see vite-plugins/wordEnricher.js):
//   base, third_person_present, present, first_person_present,
//   past, past_participle, present_participle, plural
// A surface that fills multiple roles holds an array (e.g. 'had' → ['past','past_participle']).
export const IRREGULAR_TYPES = {
  // Core verb: be
  be:    { be: 'base', am: 'first_person_present', is: 'third_person_present', are: 'present',
           was: 'past', were: 'past', been: 'past_participle', being: 'present_participle' },
  // High-frequency irregulars
  have:  { have: 'base', has: 'third_person_present', had: ['past', 'past_participle'], having: 'present_participle' },
  do:    { do: 'base', does: 'third_person_present', did: 'past', done: 'past_participle', doing: 'present_participle' },
  go:    { go: 'base', goes: 'third_person_present', went: 'past', gone: 'past_participle', going: 'present_participle' },
  get:   { get: 'base', gets: 'third_person_present', got: ['past', 'past_participle'], gotten: 'past_participle', getting: 'present_participle' },
  make:  { make: 'base', makes: 'third_person_present', made: ['past', 'past_participle'], making: 'present_participle' },
  know:  { know: 'base', knows: 'third_person_present', knew: 'past', known: 'past_participle', knowing: 'present_participle' },
  think: { think: 'base', thinks: 'third_person_present', thought: ['past', 'past_participle'], thinking: 'present_participle' },
  see:   { see: 'base', sees: 'third_person_present', saw: 'past', seen: 'past_participle', seeing: 'present_participle' },
  come:  { come: ['base', 'past_participle'], comes: 'third_person_present', came: 'past', coming: 'present_participle' },
  take:  { take: 'base', takes: 'third_person_present', took: 'past', taken: 'past_participle', taking: 'present_participle' },
  give:  { give: 'base', gives: 'third_person_present', gave: 'past', given: 'past_participle', giving: 'present_participle' },
  say:   { say: 'base', says: 'third_person_present', said: ['past', 'past_participle'], saying: 'present_participle' },
  tell:  { tell: 'base', tells: 'third_person_present', told: ['past', 'past_participle'], telling: 'present_participle' },
  speak: { speak: 'base', speaks: 'third_person_present', spoke: 'past', spoken: 'past_participle', speaking: 'present_participle' },
  eat:   { eat: 'base', eats: 'third_person_present', ate: 'past', eaten: 'past_participle', eating: 'present_participle' },
  drink: { drink: 'base', drinks: 'third_person_present', drank: 'past', drunk: 'past_participle', drinking: 'present_participle' },
  run:   { run: ['base', 'past_participle'], runs: 'third_person_present', ran: 'past', running: 'present_participle' },
  sit:   { sit: 'base', sits: 'third_person_present', sat: ['past', 'past_participle'], sitting: 'present_participle' },
  write: { write: 'base', writes: 'third_person_present', wrote: 'past', written: 'past_participle', writing: 'present_participle' },
  // 'read' — same spelling, different pronunciation; tag past+pp on the surface form
  read:  { read: ['base', 'past', 'past_participle'], reads: 'third_person_present', reading: 'present_participle' },
  feel:  { feel: 'base', feels: 'third_person_present', felt: ['past', 'past_participle'], feeling: 'present_participle' },
  leave: { leave: 'base', leaves: 'third_person_present', left: ['past', 'past_participle'], leaving: 'present_participle' },
  meet:  { meet: 'base', meets: 'third_person_present', met: ['past', 'past_participle'], meeting: 'present_participle' },
  build: { build: 'base', builds: 'third_person_present', built: ['past', 'past_participle'], building: 'present_participle' },
  understand: { understand: 'base', understands: 'third_person_present', understood: ['past', 'past_participle'], understanding: 'present_participle' },
  // Irregular nouns
  person: { person: 'base', people: 'plural' },
  child:  { child: 'base', children: 'plural' },
  man:    { man: 'base', men: 'plural' },
  woman:  { woman: 'base', women: 'plural' },
}

// Legacy untyped table — derived from IRREGULAR_TYPES. Kept for backward compatibility
// with the word scanner and other callers that just need the surface forms.
const IRREGULAR = Object.fromEntries(
  Object.entries(IRREGULAR_TYPES).map(([base, surfaceMap]) => [base, Object.keys(surfaceMap)])
)

function isVowel(ch) {
  return ch !== undefined && 'aeiou'.includes(ch)
}

// Returns true if a one-syllable verb should double its final consonant.
// CVC pattern, excluding endings in w/x/y.
function shouldDouble(word) {
  if (word.length < 3) return false
  const a = word[word.length - 3]
  const b = word[word.length - 2]
  const c = word[word.length - 1]
  return !isVowel(a) && isVowel(b) && !isVowel(c) && !['w', 'x', 'y'].includes(c)
}

// Generate regular verb forms.
function regularVerbForms(w) {
  const forms = [w]
  // 3rd person singular
  if (/(?:s|sh|ch|x|z)$/.test(w))           forms.push(w + 'es')
  else if (/[^aeiou]y$/.test(w))            forms.push(w.slice(0, -1) + 'ies')
  else                                       forms.push(w + 's')
  // Present participle
  if (/e$/.test(w) && w.length > 3)         forms.push(w.slice(0, -1) + 'ing')
  else if (shouldDouble(w))                  forms.push(w + w[w.length - 1] + 'ing')
  else                                       forms.push(w + 'ing')
  // Past simple / past participle
  if (/e$/.test(w))                          forms.push(w + 'd')
  else if (/[^aeiou]y$/.test(w))            forms.push(w.slice(0, -1) + 'ied')
  else if (shouldDouble(w))                  forms.push(w + w[w.length - 1] + 'ed')
  else                                       forms.push(w + 'ed')
  return forms
}

// Generate regular noun plural forms.
function regularNounForms(w) {
  const forms = [w]
  if (/(?:s|sh|ch|x|z)$/.test(w))           forms.push(w + 'es')
  else if (/[^aeiou]y$/.test(w))            forms.push(w.slice(0, -1) + 'ies')
  else if (/fe?$/.test(w))                  forms.push(w.replace(/fe?$/, 'ves'))
  else                                       forms.push(w + 's')
  return forms
}

// Typed regular verb forms — same shape as regularVerbForms but each entry tagged.
// Past simple and past participle share a surface form for regulars; that form is tagged with both.
export function regularVerbFormsTyped(w) {
  const out = [{ form: w, type: 'base' }]

  let third
  if (/(?:s|sh|ch|x|z)$/.test(w))           third = w + 'es'
  else if (/[^aeiou]y$/.test(w))            third = w.slice(0, -1) + 'ies'
  else                                       third = w + 's'
  out.push({ form: third, type: 'third_person_present' })

  let pp
  if (/e$/.test(w) && w.length > 3)         pp = w.slice(0, -1) + 'ing'
  else if (shouldDouble(w))                  pp = w + w[w.length - 1] + 'ing'
  else                                       pp = w + 'ing'
  out.push({ form: pp, type: 'present_participle' })

  let past
  if (/e$/.test(w))                          past = w + 'd'
  else if (/[^aeiou]y$/.test(w))            past = w.slice(0, -1) + 'ied'
  else if (shouldDouble(w))                  past = w + w[w.length - 1] + 'ed'
  else                                       past = w + 'ed'
  out.push({ form: past, type: ['past', 'past_participle'] })

  return out
}

// Typed regular noun forms.
export function regularNounFormsTyped(w) {
  const out = [{ form: w, type: 'base' }]
  let plural
  if (/(?:s|sh|ch|x|z)$/.test(w))           plural = w + 'es'
  else if (/[^aeiou]y$/.test(w))            plural = w.slice(0, -1) + 'ies'
  else if (/fe?$/.test(w))                  plural = w.replace(/fe?$/, 'ves')
  else                                       plural = w + 's'
  out.push({ form: plural, type: 'plural' })
  return out
}

// Reverse map: surface form → base word ID (irregulars only).
// Built once from IRREGULAR at module load.
const SURFACE_TO_BASE = {}
for (const [base, forms] of Object.entries(IRREGULAR)) {
  for (const form of forms) {
    if (!SURFACE_TO_BASE[form]) SURFACE_TO_BASE[form] = base
  }
}

// Returns the base word ID for a surface form.
// Falls back to the surface form itself for regular words.
export function resolveToBase(surfaceForm) {
  return SURFACE_TO_BASE[surfaceForm] ?? surfaceForm
}

// Returns a Set of all surface forms for a given base word.
export function expandWord(wordId) {
  if (IRREGULAR[wordId]) return new Set(IRREGULAR[wordId])
  // Apply both verb and noun rules — over-expansion is harmless for the scanner
  return new Set([...regularVerbForms(wordId), ...regularNounForms(wordId)])
}

// Builds a surface-form Set from the entire word bank.
// This is what the scanner should check against instead of the raw bank array.
export function buildBankSurfaceSet(wordBank) {
  const set = new Set()
  for (const wordId of wordBank) {
    for (const form of expandWord(wordId)) {
      set.add(form)
    }
  }
  return set
}
