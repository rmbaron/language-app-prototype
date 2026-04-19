// Content Templates — per-lane, per-category generation schema.
//
// The designer-authored contract for how content is generated.
// AI reads a template and generates word-level instances from it.
// The contentStore holds the generated output.
//
// To change how Reading exercises work for all physical verbs: edit one template.
// AI regenerates from it. Individual word content is never touched directly.
//
// Template resolution — most specific match wins:
//   1. Word override      — specific wordId (rare; for words that don't fit their category template)
//   2. Subtype template   — grammaticalCategory + semanticSubtype + laneId
//   3. Category template  — grammaticalCategory + laneId
//   4. Lane default       — laneId only
//
// contentShape is intentionally a loose description, not a strict schema.
// Each lane's content structure hasn't been fully designed yet.
// Fill in contentShape when designing a lane. The AI reads it alongside
// generationPrompt and examples to know what fields to include per item.
//
// Public API:
//   getTemplate(wordId, laneId, grammaticalCategory, semanticSubtype)
//   → most specific matching template, or null

// ── Schema ────────────────────────────────────────────────────
//
// Each template has:
//   laneId              — which lane this applies to
//   grammaticalCategory — which grammatical category (or null for lane default)
//   semanticSubtype     — optional further refinement (or null)
//   generationPrompt    — instructions for the AI when generating for a matching word
//   contentShape        — loose description of what a generated item should contain.
//                         Stub until the lane is designed. AI reads this to know
//                         what fields to include.
//   constraints         — rules the AI must follow (vocab level, sentence length, etc.)
//   targetCount         — how many items to generate per word
//   examples            — sample outputs for AI context

// ── Lane defaults ─────────────────────────────────────────────
//
// Fallback templates — apply to any word in a lane with no more specific match.
// These are the most important ones to design first — they cover everything.

const LANE_DEFAULTS = [
  {
    laneId: 'reading',
    grammaticalCategory: null,
    semanticSubtype: null,
    generationPrompt: 'Generate a short, simple sentence using this word. A1 vocabulary only.',
    contentShape: 'TODO: define when designing the Reading lane — expected fields: text, level',
    constraints: [],
    targetCount: 3,
    examples: [],
  },
  {
    laneId: 'writing',
    grammaticalCategory: null,
    semanticSubtype: null,
    generationPrompt: 'Generate a writing prompt that asks the learner to use this word.',
    contentShape: 'TODO: define when designing the Writing lane — expected fields: prompt, level',
    constraints: [],
    targetCount: 2,
    examples: [],
  },
  {
    laneId: 'listening',
    grammaticalCategory: null,
    semanticSubtype: null,
    generationPrompt: 'Generate a short sentence to be read aloud using this word.',
    contentShape: 'TODO: define when designing the Listening lane — expected fields: text, audioUrl, level',
    constraints: [],
    targetCount: 3,
    examples: [],
  },
  {
    laneId: 'speaking',
    grammaticalCategory: null,
    semanticSubtype: null,
    generationPrompt: 'Generate a speaking prompt that invites the learner to use this word aloud.',
    contentShape: 'TODO: define when designing the Speaking lane — expected fields: prompt, level',
    constraints: [],
    targetCount: 2,
    examples: [],
  },
]

// ── Category templates ────────────────────────────────────────
//
// Per grammatical category, per lane.
// These override lane defaults for matching words.
// Fill these in as you design content for each category.
// The AI uses generationPrompt + contentShape + examples to generate.

const CATEGORY_TEMPLATES = [
  // ── Reading ──────────────────────────────────────────────────
  {
    laneId: 'reading',
    grammaticalCategory: 'verb',
    semanticSubtype: null,
    generationPrompt: 'TODO',
    contentShape: 'TODO',
    constraints: [],
    targetCount: 3,
    examples: [],
  },
  {
    laneId: 'reading',
    grammaticalCategory: 'noun',
    semanticSubtype: null,
    generationPrompt: 'TODO',
    contentShape: 'TODO',
    constraints: [],
    targetCount: 3,
    examples: [],
  },
  {
    laneId: 'reading',
    grammaticalCategory: 'adjective',
    semanticSubtype: null,
    generationPrompt: 'TODO',
    contentShape: 'TODO',
    constraints: [],
    targetCount: 3,
    examples: [],
  },

  // ── Add other lanes × categories as lanes are designed ───────
]

// ── Subtype templates ─────────────────────────────────────────
//
// Per grammaticalCategory + semanticSubtype, per lane.
// Most specific — override category templates for matching words.
// Leave empty until category templates are designed and subtype
// differentiation is actually needed.

const SUBTYPE_TEMPLATES = [
  // Example shape (not active):
  // {
  //   laneId: 'reading',
  //   grammaticalCategory: 'verb',
  //   semanticSubtype: 'physical',
  //   generationPrompt: 'Generate a present-simple action sentence. Show the body doing something.',
  //   contentShape: 'TODO',
  //   constraints: ['A1 vocabulary', 'max 8 words', 'subject + verb + optional object'],
  //   targetCount: 3,
  //   examples: ['She runs every morning.', 'They eat together.'],
  // },
]

// ── Word overrides ────────────────────────────────────────────
//
// For specific words that don't fit their category template well.
// Rare — most words should be handled by category or subtype templates.
// Shape: { [wordId]: { [laneId]: partialTemplate } }

const WORD_OVERRIDES = {
  // Example:
  // be: {
  //   reading: {
  //     generationPrompt: 'Generate a simple "X is Y" or "X are Y" sentence.',
  //     examples: ['The water is cold.', 'They are happy.'],
  //   }
  // }
}

// ── Resolution ────────────────────────────────────────────────

export function getTemplate(wordId, laneId, grammaticalCategory, semanticSubtype) {
  // 1. Word override
  const override = WORD_OVERRIDES[wordId]?.[laneId]
  if (override) {
    const base = _findTemplate(laneId, grammaticalCategory, semanticSubtype) ?? {}
    return { ...base, ...override }
  }

  return _findTemplate(laneId, grammaticalCategory, semanticSubtype)
}

function _findTemplate(laneId, grammaticalCategory, semanticSubtype) {
  // 2. Subtype match
  if (grammaticalCategory && semanticSubtype) {
    const subtype = SUBTYPE_TEMPLATES.find(
      t => t.laneId === laneId &&
           t.grammaticalCategory === grammaticalCategory &&
           t.semanticSubtype === semanticSubtype
    )
    if (subtype) return subtype
  }

  // 3. Category match
  if (grammaticalCategory) {
    const category = CATEGORY_TEMPLATES.find(
      t => t.laneId === laneId &&
           t.grammaticalCategory === grammaticalCategory &&
           t.semanticSubtype === null
    )
    if (category) return category
  }

  // 4. Lane default
  return LANE_DEFAULTS.find(t => t.laneId === laneId) ?? null
}
