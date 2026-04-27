// Gate config: storage, schema, and pure evaluator.
//
// Schema: a gate config holds an array of CONTEXTS, each tied to a progression position.
// Contexts let you design different gate requirements for different points in progression.
//
// Context position fields (all optional — null = any):
//   level   — CEFR level ('A1', 'A2', etc.)
//   cluster — grammar cluster number (exact match)
//   atom    — a specific atom must be in activeAtoms
//
// Evaluation: the best matching context for the current user position is used.
// "Best" = most specific (level match = 3pts, cluster = 2pts, atom = 1pt).
// If no context matches, defaultOpen determines the result.
//
// Rule types within a context:
//   minWordCount  — wordBank.length >= value
//   keyWords      — specific words: at least N of [word1, word2...] must be banked
//   keyFilter     — words matching all filter criteria (atom/category/ids) >= minMatches
//   requiredAtoms — all listed atoms present in activeAtoms
//   minCluster    — currentCluster >= value
//
// AND/OR grouping (within a context's rules):
//   Rules with the same non-null group string are OR'd — any one passing satisfies the group.
//   Rules in different groups (or group: null) are AND'd — all must pass.
//
// Future: add optional `condition` field to any rule for finer-grained conditional logic (B).

// Destination IDs are stable localStorage keys (lapp-gate-{id}).
// Renaming a destination in worldSphereConfig.js orphans its gate config silently.
const storageKey = id => `lapp-gate-${id}`

// Dev override — when true, all gates return open regardless of rules.
export function loadGateOverride() {
  try { return localStorage.getItem('lapp-gate-override') === 'true' } catch { return false }
}
export function saveGateOverride(value) {
  localStorage.setItem('lapp-gate-override', value ? 'true' : 'false')
}

export function loadGateConfig(destinationId) {
  try {
    const raw = localStorage.getItem(storageKey(destinationId))
    if (raw) {
      const config = JSON.parse(raw)
      // Migrate old flat-rules format to contexts
      if (config.rules && !config.contexts) {
        return {
          destinationId: config.destinationId,
          defaultOpen:   config.defaultOpen ?? false,
          contexts: [{ id: 'ctx-legacy', level: null, cluster: null, atom: null, rules: config.rules }],
        }
      }
      return config
    }
  } catch {}
  return { destinationId, defaultOpen: false, contexts: [] }
}

export function saveGateConfig(destinationId, config) {
  localStorage.setItem(storageKey(destinationId), JSON.stringify(config))
}

// Builds wordId → L2 data map for words in the bank.
// Words not yet enriched are absent — reported as unenrichedWords in eval results.
export function buildWordDataMap(wordBank, lang) {
  const map = {}
  for (const wordId of wordBank) {
    try {
      const raw = localStorage.getItem(`lapp-l2-${lang}-${wordId}`)
      if (raw) map[wordId] = JSON.parse(raw)
    } catch {}
  }
  return map
}

// Pure evaluator. Returns:
//   open            — whether the gate is open
//   rules           — per-rule results (rule, passed, have, need, qualifying, unenrichedWords)
//   closestRule     — { ruleId, gap } — failing rule nearest to passing (recommender hookup)
//   unenrichedWords — wordIds skipped due to missing L2 data
//   matchedContext  — the context that was evaluated (or null)
//
// qualifying on keyWords/keyFilter results is the vocabulary fingerprint for this gate —
// same primitive needed for the content signature system.
export function evaluateGate(config, inventory, wordDataMap = {}) {
  const { wordBank = [], grammarPosition = {}, identity = {} } = inventory
  const { activeAtoms = [], currentCluster = 0 } = grammarPosition
  const { cefrLevel = 'A1', lang } = identity

  const empty = (open) => ({ open, rules: [], closestRule: null, unenrichedWords: [], matchedContext: null })

  if (!config) return empty(false)

  // Support old flat-rules format
  const contexts = config.contexts
    ?? (config.rules ? [{ id: 'legacy', level: null, cluster: null, atom: null, rules: config.rules }] : [])

  if (contexts.length === 0) return empty(config.defaultOpen ?? false)

  // Find all matching contexts, pick the most specific
  const matching = contexts.filter(ctx => contextMatches(ctx, cefrLevel, currentCluster, activeAtoms))
  if (matching.length === 0) return empty(config.defaultOpen ?? false)

  const best = matching.reduce((b, c) => contextScore(c) > contextScore(b) ? c : b)
  const rules = (best.rules ?? []).filter(r => r.enabled !== false)

  if (rules.length === 0) return { ...empty(config.defaultOpen ?? false), matchedContext: best }

  const results = rules.map(rule =>
    evalRule(rule, wordBank, activeAtoms, currentCluster, wordDataMap)
  )

  // Group rules: same group string → OR'd. Different groups (or null) → AND'd.
  const groups = {}
  rules.forEach((rule, i) => {
    const k = rule.group ?? `__solo_${rule.id}`
    ;(groups[k] ??= []).push(results[i])
  })
  const open = Object.values(groups).every(g => g.some(r => r.passed))

  const failing = results.filter(r => !r.passed && r.need != null)
  const closestRule = failing.length > 0
    ? failing.reduce((best, r) => {
        const gap = r.need - r.have
        return (!best || gap < best.gap) ? { ruleId: r.rule.id, gap } : best
      }, null)
    : null

  const unenrichedWords = [...new Set(results.flatMap(r => r.unenrichedWords ?? []))]

  return { open, rules: results, closestRule, unenrichedWords, matchedContext: best }
}

function contextMatches(ctx, cefrLevel, currentCluster, activeAtoms) {
  if (ctx.level   != null && ctx.level   !== cefrLevel)               return false
  if (ctx.cluster != null && ctx.cluster !== currentCluster)           return false
  if (ctx.atom    != null && !activeAtoms.includes(ctx.atom))          return false
  return true
}

function contextScore(ctx) {
  return (ctx.level   != null ? 3 : 0)
       + (ctx.cluster != null ? 2 : 0)
       + (ctx.atom    != null ? 1 : 0)
}

// Rule mode: 'require' (default) = gate opens when condition IS met.
// 'exclude' = gate opens when condition is NOT met (e.g. beginner-only content).
function evalRule(rule, wordBank, activeAtoms, currentCluster, wordDataMap) {
  const result = evalRuleRaw(rule, wordBank, activeAtoms, currentCluster, wordDataMap)
  return rule.mode === 'exclude' ? { ...result, passed: !result.passed } : result
}

function evalRuleRaw(rule, wordBank, activeAtoms, currentCluster, wordDataMap) {
  const base = { rule, qualifying: [], unenrichedWords: [] }

  if (rule.type === 'minWordCount') {
    const have = wordBank.length, need = rule.value ?? 1
    return { ...base, passed: have >= need, have, need }
  }

  if (rule.type === 'keyWords') {
    const required = rule.words ?? [], need = rule.minMatches ?? 1
    const bankedSet = new Set(wordBank)
    const qualifying = required.filter(w => bankedSet.has(w))
    return { ...base, passed: qualifying.length >= need, have: qualifying.length, need, qualifying }
  }

  if (rule.type === 'keyFilter') {
    const { filter = {}, minMatches = 1 } = rule
    const fw = filter.words ?? [], fa = filter.atoms ?? [], fc = filter.grammaticalCategories ?? []
    const needsL2 = fa.length > 0 || fc.length > 0
    const qualifying = [], unenriched = []

    for (const wordId of wordBank) {
      if (fw.length > 0 && !fw.includes(wordId)) continue
      if (needsL2) {
        const l2 = wordDataMap[wordId]
        if (!l2) { unenriched.push(wordId); continue }
        if (fa.length > 0 && !fa.includes(l2.grammaticalAtom)) continue
        if (fc.length > 0 && !fc.includes(l2.grammaticalCategory)) continue
      }
      qualifying.push(wordId)
    }

    const have = qualifying.length
    return { ...base, passed: have >= minMatches, have, need: minMatches, qualifying, unenrichedWords: unenriched }
  }

  if (rule.type === 'requiredAtoms') {
    const required = rule.atoms ?? []
    const have = required.filter(a => activeAtoms.includes(a)).length
    return { ...base, passed: have === required.length, have, need: required.length }
  }

  if (rule.type === 'minCluster') {
    const have = currentCluster, need = rule.value ?? 1
    return { ...base, passed: have >= need, have, need }
  }

  // Unknown rule type — pass silently for forward compatibility
  return { ...base, passed: true, have: null, need: null }
}
