// Vocabularies — English
//
// Schema declaration for L2 sub-feature enums. Each entry names a feature
// the L2 enrichment layer can populate, and lists its legal values.
//
// Companion to:
//   - grammarAtoms.en.js  — atom-level vocabulary (what KIND of word)
//   - atomIndex.js        — runtime pool keyed atomId × cefrLevel → wordId[]
//   - featureIndex.js     — parallel runtime pool keyed feature × value → wordId[]
//                           (this file declares featureIndex's bucket list)
//   - wordRegistry.js     — L2 field shapes (where these features are read
//                           from per word at composition time)
//
// ── Status flags ──────────────────────────────────────────────────────────
//   declared    — legal values are knowable now, listed here
//   boolean     — true/false (no enum needed; included for index parity)
//   open        — open-ended values (e.g. lemma family IDs) — bucketable but
//                 not enumerable. featureIndex still buckets these; the
//                 Library view shows the populated values rather than
//                 comparing against an enum.
//   undeclared  — field exists in L2 but values aren't bucketable at all
//                 (compound objects, arrays, etc.) — surface as gap markers.
//
// "undeclared" entries are intentional gap markers. The Library schema view
// surfaces them as ⚠ "shape declared, vocabulary undeclared."
//
// ── Scope ─────────────────────────────────────────────────────────────────
// This file does NOT redeclare things that already have canonical homes:
//   - grammaticalAtom values   → grammarAtoms.en.js (ATOMS)
//   - cefrLevel values         → cefrLevels.js
//   - closed-class categories  → wordCategories.en.js (function words)
//
// Out of scope here (open-ended / array-valued, not enumerable as buckets):
//   - frames               (per-verb assignments, IDs from frameLibrary)
//   - forms                (inflected surface forms — open per-word)
//   - commonCollocations   (open-ended phrase lists)
//   - alternateAtoms       (array of {atom, when} — atom IDs covered by ATOMS)
//   - lemmaFamily          (open-ended lemma IDs — see undeclared note below)

export const VOCABULARIES = {
  // ── Verb sub-features ──────────────────────────────────────────────────
  transitivity: {
    status:      'declared',
    appliesTo:   ['verb'],
    description: "How many objects the verb takes in its canonical frame.",
    values: [
      'intransitive', // takes no object — "she sleeps"
      'transitive',   // takes one direct object — "she eats food"
      'ditransitive', // takes two objects — "she gave him a book"
      'both',         // flexes between transitive and intransitive — "I eat" / "I eat food"
    ],
  },
  verbAspectClass: {
    status:      'declared',
    appliesTo:   ['verb'],
    description: "Whether the verb refers to a state or a dynamic action — controls progressive (-ing) compatibility.",
    values: [
      'stative',  // "know", "like", "want", "need", "see", "hear", "own", "belong"
      'dynamic',  // "run", "eat", "write", "build"
      'both',     // sense-dependent — "have a cat" stative vs "having dinner" dynamic
    ],
  },

  // ── Noun sub-features ──────────────────────────────────────────────────
  countability: {
    status:      'declared',
    appliesTo:   ['noun'],
    description: "Whether the noun pluralizes and takes count quantifiers.",
    values: [
      'count',            // ordinary singular/plural — cat → cats
      'mass',             // uncountable — water, advice, music
      'pluralia_tantum',  // plural-only — scissors, jeans
      'both',             // flexes by context — coffee, glass
    ],
  },
  properNoun: {
    status:      'boolean',
    appliesTo:   ['noun'],
    description: "True if the noun names a unique referent (John, Tokyo, Friday). Field is null for common nouns; otherwise an object — boolean derived from presence/absence.",
  },
  properNounType: {
    status:      'declared',
    appliesTo:   ['noun'],
    description: "Sub-classification of proper nouns. Read from properNoun.type when properNoun is non-null.",
    values: [
      'person',       // Mary, Einstein
      'place',        // Tokyo, the Pacific
      'organization', // Microsoft, the Beatles
      'temporal',     // January, Monday
      'language',     // English, Spanish
      'other',        // catch-all
    ],
  },
  takesArticle: {
    status:      'boolean',
    appliesTo:   ['noun'],
    description: "True if the proper noun requires \"the\" (the United States, the Pacific). Read from properNoun.takesArticle when properNoun is non-null.",
  },
  concreteness: {
    status:      'declared',
    appliesTo:   ['noun'],
    description: "Whether the noun's referent is physically perceivable.",
    values: ['concrete', 'abstract'],
  },
  animate: {
    status:      'boolean',
    appliesTo:   ['noun'],
    description: "True if the noun's referent is a living being capable of intention.",
  },

  // ── Adjective sub-features ─────────────────────────────────────────────
  adjectivePosition: {
    status:      'declared',
    appliesTo:   ['adjective'],
    description: "Where the adjective can appear relative to its noun.",
    values: [
      'attributive', // "the happy child" — before noun
      'predicative', // "the child is asleep" — only after copula
      'both',        // "happy" — works in both positions
    ],
  },

  // ── Adverb sub-features ────────────────────────────────────────────────
  adverbType: {
    status:      'declared',
    appliesTo:   ['adverb'],
    description: "Semantic class of the adverb — what dimension it modifies.",
    values: [
      'time',      // "now", "soon", "today", "yesterday", "then"
      'place',     // "here", "there", "everywhere", "outside"
      'manner',    // "quickly", "carefully", "happily" (most -ly adverbs)
      'frequency', // "always", "never", "often", "sometimes", "usually"
      'degree',    // "very", "really", "quite", "too", "extremely"
      'other',     // catch-all for adverbs that don't fit the above
    ],
  },

  // ── Numeral sub-features ───────────────────────────────────────────────
  numeralType: {
    status:      'declared',
    appliesTo:   ['numeral'],
    description: "Whether the numeral counts or orders.",
    values: [
      'cardinal', // "one", "two", "three"
      'ordinal',  // "first", "second", "third"
    ],
  },

  // ── Pronoun + applicable-noun features ─────────────────────────────────
  person: {
    status:      'declared',
    appliesTo:   ['pronoun'],
    description: "Grammatical person. Stored as numbers in L2, not strings.",
    values: [1, 2, 3],
  },
  number: {
    status:      'declared',
    appliesTo:   ['pronoun', 'noun'],
    description: "Grammatical number.",
    values: ['singular', 'plural'],
  },
  gender: {
    status:      'declared',
    appliesTo:   ['pronoun', 'noun'],
    description: "Grammatical gender (English: pronoun-restricted + person nouns like actor/actress).",
    values: ['masculine', 'feminine', 'neuter'],
  },

  // ── Universal features ─────────────────────────────────────────────────
  frequency: {
    status:      'declared',
    appliesTo:   ['*'],
    description: "How common the word is at its CEFR level.",
    values: ['core', 'high', 'medium', 'low'],
  },
  colloquial: {
    status:      'boolean',
    appliesTo:   ['*'],
    description: "True if the word is informal / spoken-register.",
  },

  // ── Open-ended-but-bucketable ──────────────────────────────────────────
  lemmaFamily: {
    status:      'open',
    appliesTo:   ['*'],
    description: "Lemma group ID — words sharing a derivational stem (happy/happily/happiness all carry lemmaFamily='happy'). Open-ended IDs, not a small enum. Bucketed in featureIndex by family root so the Library view can show family membership.",
  },
}

// ── Convenience accessors ─────────────────────────────────────────────────

export function getVocabulary(feature) {
  return VOCABULARIES[feature] ?? null
}

// Features featureIndex should bucket — declared, boolean, and open.
// Undeclared features are visible in the schema view but skipped by the
// coating step (no values to write).
export function getBucketableFeatures() {
  return Object.entries(VOCABULARIES)
    .filter(([, v]) => v.status === 'declared' || v.status === 'boolean' || v.status === 'open')
    .map(([k]) => k)
}

// Legal values for one feature, normalized to an array.
// Returns null for undeclared features and open features (no fixed enum),
// [true, false] for booleans.
export function getLegalValues(feature) {
  const v = VOCABULARIES[feature]
  if (!v) return null
  if (v.status === 'declared') return v.values
  if (v.status === 'boolean')  return [true, false]
  return null  // open and undeclared have no legal-value enum
}

// Features applicable to a given word-class label (e.g. 'verb', 'noun').
// '*' matches all classes. Used by the Library schema view to group rows
// under the right word-class header.
export function getFeaturesForClass(wordClass) {
  return Object.entries(VOCABULARIES)
    .filter(([, v]) => v.appliesTo.includes(wordClass) || v.appliesTo.includes('*'))
    .map(([k]) => k)
}
