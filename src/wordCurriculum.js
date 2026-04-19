// Word Curriculum — designer curriculum layer.
//
// Fourth boost source in the candidate pool, layered on top of
// slot / grammar / steering signals.
//
// Two sections:
//
//   INHERENT  — rules that follow from language structure and learning science.
//               The designer doesn't invent these; the system just needs to
//               respect them. Eventually derivable by the AI from word data alone.
//               Examples: paradigm completion, consolidation momentum.
//
//   SCULPTED  — explicit editorial decisions. The designer's voice in the
//               curriculum. Requires authoring and ongoing maintenance.
//               Examples: category composition balance, event-triggered domain steering.
//
// Public API:
//   getCurriculumBoosts(existingWordIds, allWords, activeLang)
//   → { wordBoosts: Map<wordId, number>, categoryBoosts: Map<category, number> }

// ═══════════════════════════════════════════════════════════════
// INHERENT RULES
// ═══════════════════════════════════════════════════════════════

// ── Paradigm completion ───────────────────────────────────────
//
// Closed word sets where having any one member makes the rest more salient.
//
// The AI is the right engine for discovering paradigm groups — it knows that
// personal pronouns form a closed set, that antonym pairs are paradigms, that
// color terms and days of the week cluster together, etc. Enumerating these
// manually would be both incomplete and the wrong job for a developer.
//
// Schema contract:
//   groupId   — stable string key (e.g. 'personal_pronoun', 'scale_temperature')
//   wordIds   — array of word IDs that are members of this group
//   reason    — why these words form a paradigm (for AI context and debugging)
//
// PARADIGM_STUBS covers the A1 carrier band — the groups obvious enough to
// seed manually. The AI fills the rest via addParadigmGroup() once wired.
//
// Rule: if any member is in the bank, boost all other members.

const PARADIGM_BOOST = 3.5

export const PARADIGM_SCHEMA = {
  groupId:  'stable string key identifying the paradigm group',
  wordIds:  'array of word IDs that are members of this group',
  reason:   'brief description of why these words form a paradigm (e.g. "closed pronoun system", "antonym pair", "near/far deictic contrast")',
}

// Stubs: obvious A1 groups seeded manually as the carrier band.
// The AI will discover and add the rest (antonym pairs, color terms,
// days of the week, number words, question words, etc.).
const PARADIGM_STUBS = {
  personal_pronoun: { wordIds: ['i', 'you', 'he', 'she', 'it', 'we', 'they'], reason: 'closed subject pronoun system' },
  demonstrative:    { wordIds: ['this', 'that'],                               reason: 'near/far deictic pair' },
  affirmation:      { wordIds: ['yes', 'no'],                                  reason: 'fundamental binary response pair' },
}

const PARADIGM_CACHE_KEY = 'paradigm_groups_cache'

function loadParadigmCache() {
  try { return JSON.parse(localStorage.getItem(PARADIGM_CACHE_KEY) ?? '{}') }
  catch { return {} }
}

function getParadigmGroups() {
  return { ...PARADIGM_STUBS, ...loadParadigmCache() }
}

// Hook for AI to call when it discovers a paradigm group.
// groupId: string, wordIds: string[], reason: string
export function addParadigmGroup(groupId, wordIds, reason) {
  try {
    const cache = loadParadigmCache()
    cache[groupId] = { wordIds, reason }
    localStorage.setItem(PARADIGM_CACHE_KEY, JSON.stringify(cache))
  } catch {}
}

function applyParadigmBoosts(existingWordIds, wordBoosts) {
  const bankSet = new Set(existingWordIds)
  for (const { wordIds } of Object.values(getParadigmGroups())) {
    const anyBanked = wordIds.some(id => bankSet.has(id))
    if (!anyBanked) continue
    for (const id of wordIds) {
      if (!bankSet.has(id)) {
        wordBoosts.set(id, (wordBoosts.get(id) ?? 0) + PARADIGM_BOOST)
      }
    }
  }
}

// ── Consolidation momentum ────────────────────────────────────
//
// When a learner has just begun a new grammar category (1 to WINDOW words),
// boost more words of that same category before moving on.
// Prevents the recommender from immediately scattering into new categories
// before the learner has had a chance to feel the new superpower.
//
// Fades automatically once the category fills past the window.

const CONSOLIDATION_BOOST  = 2.0
const CONSOLIDATION_WINDOW = 3   // applies while bank has fewer than this many words in category

function applyConsolidationBoosts(existingWordIds, allWords, activeLang, categoryBoosts) {
  const bankWords = allWords.filter(
    w => w.language === activeLang && existingWordIds.includes(w.id)
  )
  const categoryCounts = {}
  for (const w of bankWords) {
    const cat = w.classifications.grammaticalCategory
    categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1
  }
  for (const [cat, count] of Object.entries(categoryCounts)) {
    if (count > 0 && count < CONSOLIDATION_WINDOW) {
      categoryBoosts.set(cat, (categoryBoosts.get(cat) ?? 0) + CONSOLIDATION_BOOST)
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// SCULPTED RULES
// ═══════════════════════════════════════════════════════════════

// ── Category composition balance ─────────────────────────────
//
// Prevents any semantic sub-type from dominating an open-ended category
// by sheer volume. Without this, a large pool of action verbs could surface
// dozens of times before a feeling verb ("love") ever appears.
//
// Mechanism: track the sub-type distribution already in the bank;
// dampen over-represented sub-types, let under-represented ones through.
//
// Requires word attributes (verbType, nounType, etc.) to be populated.
// TODO: implement once wordAttributes has broader coverage beyond nounType.
// The hook is: read getWordAttributes(word.id)?.verbType (etc.), compare
// distribution in existingWordIds, apply dampening boost to under-represented types.

// ── Function goal coverage boost ─────────────────────────────
//
// When a function goal (e.g. "Navigate and Locate") has no or thin coverage
// in the learner's bank, boost words that serve it.
//
// Mechanism: read getGoalCoverage(); for each uncovered/thin goal, boost all
// words whose `functionGoals` attribute includes that goal ID.
//
// Two coverage signals (mirrors getGoalCoverage in functionGoals.js):
//   1. carrierWords match — explicit seeded carriers
//   2. attribute match    — AI-filled word.functionGoals array
//
// TODO: implement once function goals are defined broadly enough to test.
// The hook is: import { getGoalCoverage } from './functionGoals';
// call with (cefrLevel, existingWordIds, allWords, activeLang);
// iterate uncovered goals; boost words whose attributes list the goal ID.

// ── Event-triggered domain steering ──────────────────────────
//
// Module events (attempt, fail, unlock) trigger vocabulary domain boosts.
// The designer scripts: "if the learner fails the taxi module, surface more
// transportation words." The rule fires automatically; the learner never sees it.
//
// Routes through steeringParams.intentQuery to the AI layer (getAICandidates),
// not through the static scoring layer — the AI handles domain-to-word mapping.
//
// TODO: implement once module system is built and AI layer is wired.
// The hook is: getCurriculumBoosts accepts a `journeyEvents` param (recent
// module attempts/outcomes), maps them to domain labels, returns
// { domainSteering: [{ intentQuery, weight }] } alongside wordBoosts/categoryBoosts.

// ═══════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════

export function getCurriculumBoosts(existingWordIds, allWords, activeLang) {
  const wordBoosts     = new Map()
  const categoryBoosts = new Map()

  // Inherent rules
  applyParadigmBoosts(existingWordIds, wordBoosts)
  applyConsolidationBoosts(existingWordIds, allWords, activeLang, categoryBoosts)

  // Sculpted rules (stubbed — see TODOs above)

  return { wordBoosts, categoryBoosts }
}
