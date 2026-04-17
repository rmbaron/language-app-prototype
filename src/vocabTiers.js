// Vocabulary Tier System — defines tiers based on word bank size and what each
// tier means for content generation, selection, and assumption logic.
//
// This is a single adjustable source of truth. Other systems (wbSelector,
// content generation, World Sphere) import from here to make tier-sensitive
// decisions. Adjusting thresholds or tier parameters here propagates everywhere
// without touching any other system.
//
// Core principle: both Word Bank and World Sphere only use words the learner
// already knows. The tier system governs HOW that constraint is enforced.
//
// ── How the context check works ───────────────────────────────
//
// The gate always checks the user's actual pools first — this is free,
// authoritative, and requires no API call. The system literally looks at
// whether the word is in the user's lane-specific wbPool or worldPool.
//
//   Step 1 — Direct pool check (always runs, always free):
//     Is the context word in the user's lane pool? → confirmed known, allow.
//
//   Step 2 — Frequency assumption fallback (only if step 1 fails):
//     If the word wasn't found in the pool, check the tier's frequencyFloor.
//     If the word's frequencyTier score meets or exceeds the floor, assume known.
//     This handles high-frequency function words ("the", "a", "is") that
//     advanced learners almost certainly know even if not explicitly practiced.
//
//   frequencyFloor values per tier:
//     null  — never assume; every context word must be in the pool (small vocab)
//     5     — only assume words scored 5/5 for frequency (the most common ~50 words)
//     4     — assume words scored 4–5 (top tier of everyday vocabulary)
//     3     — assume words scored 3–5 (broad everyday coverage)
//
//   The floor decreases as vocabulary grows — more words assumed known,
//   fewer live checks needed. Each tier's floor is independently adjustable.
//
// practiceIsolation values (future — controls World Sphere prompt complexity):
//   'strict'   — one target concept per prompt, minimal context
//   'moderate' — small clusters of known words can interact
//   'open'     — full natural interaction within known vocabulary

const TIERS = [
  {
    id: 'foundation',
    label: 'Foundation',
    minWords: 0,
    maxWords: 99,
    frequencyFloor: null,       // never assume — pool must confirm every context word
    practiceIsolation: 'strict',
  },
  {
    id: 'developing',
    label: 'Developing',
    minWords: 100,
    maxWords: 299,
    frequencyFloor: null,       // still no assumptions — pool is growing but small
    practiceIsolation: 'strict',
  },
  {
    id: 'intermediate',
    label: 'Intermediate',
    minWords: 300,
    maxWords: 699,
    frequencyFloor: 5,          // assume only the highest-frequency words (scored 5/5)
    practiceIsolation: 'strict',
  },
  {
    id: 'established',
    label: 'Established',
    minWords: 700,
    maxWords: 1199,
    frequencyFloor: 5,          // same floor, but practiceIsolation begins relaxing
    practiceIsolation: 'moderate',
  },
  {
    id: 'expansive',
    label: 'Expansive',
    minWords: 1200,
    maxWords: 1999,
    frequencyFloor: 4,          // assume words scored 4–5; broad everyday vocabulary
    practiceIsolation: 'moderate',
  },
  {
    id: 'fluent',
    label: 'Fluent',
    minWords: 2000,
    maxWords: null,
    frequencyFloor: 3,          // assume words scored 3–5; most everyday vocabulary covered
    practiceIsolation: 'open',
  },
]

// ── What "knows" means ────────────────────────────────────────
//
// "Knows" is not a single definition — different systems need different answers.
// All three pool types live in userStore; these constants name which pool
// each system should consult, so the definition is adjustable in one place.
//
//   KNOWN_FOR_CONTENT     — words eligible to appear as context in generated prompts.
//                           Uses wordBank: the user has intentionally added the word,
//                           regardless of practice history.
//
//   KNOWN_FOR_DISTRACTORS — words eligible to appear as wrong-answer choices.
//                           Uses wbPools: the user has encountered the word in practice
//                           at least once, so it won't feel completely alien as a choice.
//
//   KNOWN_FOR_WORLD       — words eligible to interact freely in World Sphere prompts.
//                           Uses worldPools: the word has been practiced to the graduation
//                           threshold — solid enough to carry weight in open scenarios.
//
// These are string keys matching the pool names in userStore's state object.
// Systems that need to check "is this word known?" import the relevant constant
// and read the corresponding pool — they don't hardcode which pool to use.

// Both KNOWN_FOR_CONTENT and KNOWN_FOR_DISTRACTORS resolve to wbPools,
// but wbPools is per-lane — the check is always lane-specific.
// Practicing "process" in reading makes it eligible as context in reading
// prompts only. It does not become eligible in writing prompts until the
// user has a successful writing attempt for that word.
// wordBank alone is not sufficient — a user can add hundreds of words
// without any familiarity with them.
export const KNOWN_FOR_CONTENT     = 'wbPools'
export const KNOWN_FOR_DISTRACTORS = 'wbPools'
export const KNOWN_FOR_WORLD       = 'worldPools'

// ── Cohort content caching ────────────────────────────────────
//
// Content is generated for tiers (cohorts), not individuals. A sentence
// generated for "want → reading" at the Foundation tier can be served to
// any Foundation-tier user — they share approximately the same vocabulary
// context, so the prompt is appropriate for all of them.
//
// This means contentStore eventually gains a third dimension:
//   word × lane × tier
//
// Content items carry a generatedForTier field (set at generation time)
// so the selector can match the user's current tier to the right pool.
// Items without this field are treated as tier-agnostic (safe for all).
//
// Not yet active — stub encoded here so the intent is clear when generation
// is wired and contentStore is extended.

// ── Public API ────────────────────────────────────────────────

export function getTiers() {
  return TIERS
}

export function getTierForSize(wordBankSize) {
  return (
    TIERS.find(t => wordBankSize >= t.minWords && (t.maxWords === null || wordBankSize <= t.maxWords))
    ?? TIERS[0]
  )
}

// Returns the full tier profile for the current user.
// Pass in wordBankSize from userStore.getWordBank().length.
export function getTierProfile(wordBankSize) {
  const tier = getTierForSize(wordBankSize)
  return { ...tier, wordBankSize }
}
