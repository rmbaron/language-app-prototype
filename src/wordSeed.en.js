// Word Seed — English
//
// The base layer of the word knowledge system.
// Plain word entries only — no metadata, no linguistic judgments.
// Metadata is filled in by Layer 1 enrichment (wordLayerOne.js).
//
// This file is append-only. Words go in, they don't come out.
// New words added here will be picked up by the Layer 1 batch processor
// and enriched via API the next time it runs.

export const WORD_SEED = [

  // ── People / reference ────────────────────────────────────────
  { id: 'i',        baseForm: 'I',        language: 'en' },
  { id: 'you',      baseForm: 'you',      language: 'en' },
  { id: 'he',       baseForm: 'he',       language: 'en' },
  { id: 'she',      baseForm: 'she',      language: 'en' },
  { id: 'we',       baseForm: 'we',       language: 'en' },
  { id: 'they',     baseForm: 'they',     language: 'en' },
  { id: 'my',       baseForm: 'my',       language: 'en' },
  { id: 'your',     baseForm: 'your',     language: 'en' },
  { id: 'this',     baseForm: 'this',     language: 'en' },
  { id: 'that',     baseForm: 'that',     language: 'en' },

  // ── Core verbs ────────────────────────────────────────────────
  { id: 'be',       baseForm: 'be',       language: 'en' },
  { id: 'have',     baseForm: 'have',     language: 'en' },
  { id: 'want',     baseForm: 'want',     language: 'en' },
  { id: 'go',       baseForm: 'go',       language: 'en' },
  { id: 'come',     baseForm: 'come',     language: 'en' },
  { id: 'like',     baseForm: 'like',     language: 'en' },
  { id: 'need',     baseForm: 'need',     language: 'en' },
  { id: 'eat',      baseForm: 'eat',      language: 'en' },
  { id: 'drink',    baseForm: 'drink',    language: 'en' },
  { id: 'see',      baseForm: 'see',      language: 'en' },

  // ── Basic nouns ───────────────────────────────────────────────
  { id: 'food',     baseForm: 'food',     language: 'en' },
  { id: 'water',    baseForm: 'water',    language: 'en' },
  { id: 'house',    baseForm: 'house',    language: 'en' },
  { id: 'book',     baseForm: 'book',     language: 'en' },
  { id: 'car',      baseForm: 'car',      language: 'en' },
  { id: 'school',   baseForm: 'school',   language: 'en' },
  { id: 'work',     baseForm: 'work',     language: 'en' },
  { id: 'friend',   baseForm: 'friend',   language: 'en' },
  { id: 'family',   baseForm: 'family',   language: 'en' },
  { id: 'name',     baseForm: 'name',     language: 'en' },

  // ── Basic adjectives ──────────────────────────────────────────
  { id: 'good',     baseForm: 'good',     language: 'en' },
  { id: 'bad',      baseForm: 'bad',      language: 'en' },
  { id: 'big',      baseForm: 'big',      language: 'en' },
  { id: 'small',    baseForm: 'small',    language: 'en' },
  { id: 'happy',    baseForm: 'happy',    language: 'en' },
  { id: 'sad',      baseForm: 'sad',      language: 'en' },
  { id: 'hot',      baseForm: 'hot',      language: 'en' },
  { id: 'cold',     baseForm: 'cold',     language: 'en' },
  { id: 'new',      baseForm: 'new',      language: 'en' },
  { id: 'old',      baseForm: 'old',      language: 'en' },

  // ── Useful function words ─────────────────────────────────────
  { id: 'a',        baseForm: 'a',        language: 'en' },
  { id: 'the',      baseForm: 'the',      language: 'en' },
  { id: 'and',      baseForm: 'and',      language: 'en' },
  { id: 'no',       baseForm: 'no',       language: 'en' },
  { id: 'not',      baseForm: 'not',      language: 'en' },
  { id: 'here',     baseForm: 'here',     language: 'en' },
  { id: 'there',    baseForm: 'there',    language: 'en' },
  { id: 'where',    baseForm: 'where',    language: 'en' },
  { id: 'what',     baseForm: 'what',     language: 'en' },
  { id: 'hello',    baseForm: 'hello',    language: 'en' },

  // ── Time / everyday ───────────────────────────────────────────
  { id: 'today',    baseForm: 'today',    language: 'en' },
  { id: 'tomorrow', baseForm: 'tomorrow', language: 'en' },
  { id: 'now',      baseForm: 'now',      language: 'en' },
  { id: 'morning',  baseForm: 'morning',  language: 'en' },
  { id: 'night',    baseForm: 'night',    language: 'en' },

]
