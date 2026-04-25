// English morphology expansion — English-specific.
// Maps a base word (word bank ID) to all its surface forms.
// Used by the word scanner to avoid false positives on inflected forms.

// Irregular forms that cannot be derived by rule.
// Each entry: base form → all surface forms (base included).
const IRREGULAR = {
  // Core verb: be
  be:      ['be', 'am', 'is', 'are', 'was', 'were', 'been', 'being'],
  // High-frequency irregulars
  have:    ['have', 'has', 'had', 'having'],
  do:      ['do', 'does', 'did', 'done', 'doing'],
  go:      ['go', 'goes', 'went', 'gone', 'going'],
  get:     ['get', 'gets', 'got', 'gotten', 'getting'],
  make:    ['make', 'makes', 'made', 'making'],
  know:    ['know', 'knows', 'knew', 'known', 'knowing'],
  think:   ['think', 'thinks', 'thought', 'thinking'],
  see:     ['see', 'sees', 'saw', 'seen', 'seeing'],
  come:    ['come', 'comes', 'came', 'coming'],
  take:    ['take', 'takes', 'took', 'taken', 'taking'],
  give:    ['give', 'gives', 'gave', 'given', 'giving'],
  say:     ['say', 'says', 'said', 'saying'],
  tell:    ['tell', 'tells', 'told', 'telling'],
  speak:   ['speak', 'speaks', 'spoke', 'spoken', 'speaking'],
  eat:     ['eat', 'eats', 'ate', 'eaten', 'eating'],
  drink:   ['drink', 'drinks', 'drank', 'drunk', 'drinking'],
  run:     ['run', 'runs', 'ran', 'running'],
  sit:     ['sit', 'sits', 'sat', 'sitting'],
  write:   ['write', 'writes', 'wrote', 'written', 'writing'],
  read:    ['read', 'reads', 'reading'],  // read/read same spelling
  feel:    ['feel', 'feels', 'felt', 'feeling'],
  leave:   ['leave', 'leaves', 'left', 'leaving'],
  meet:    ['meet', 'meets', 'met', 'meeting'],
  build:   ['build', 'builds', 'built', 'building'],
  understand: ['understand', 'understands', 'understood', 'understanding'],
  // Irregular nouns
  person:  ['person', 'people'],
  child:   ['child', 'children'],
  man:     ['man', 'men'],
  woman:   ['woman', 'women'],
}

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
