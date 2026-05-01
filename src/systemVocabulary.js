// System Vocabulary — Circle 2
//
// Circle 2 = all words the system knows at a given cluster depth.
// Circle 3 = the learner's banked subset (ON words).
// Gap = circle 2 − circle 3 = recommender signal.
//
// The snapshot is the pre-computed constraint envelope for all AI calls.
// Computed once per session in the inventory assembler; every lane reads it.
//
// Prompt mode:
//   additions   — bank is sparse; enumerate what IS allowed (short list)
//   restrictions — bank is dense; enumerate what is NOT allowed (short list)
// Whichever list is shorter wins.

import { getGrammarClusters } from './grammarClustering'
import { SYSTEM_WORDS } from './systemWords.en'
import { CONSTRUCTOR_TIERS } from './constructorTiers.en'
import { ATOMS } from './grammarAtoms.en.js'
import { derivePromptLabels } from './atomMetadataDerivations.js'

// Concise labels for AI prompt blocks — shorter than full atom labels.
// DERIVED from each atom's defaults.promptLabel field. To change a label,
// edit the atom record in grammarAtoms.en.js — not here.
export const PROMPT_LABEL = derivePromptLabels(ATOMS)

// All system words at clusters 1..upToCluster, grouped by atom.
// Structure-unlock atoms (progressive_auxiliary etc.) have no index entries
// and return [] gracefully — they are intentionally skipped here.
export function buildCircle2(upToCluster, lang = 'en', cefrLevel = 'A1') {
  const clusters  = getGrammarClusters(lang).filter(c => c.id <= upToCluster)
  const atomIds   = clusters.flatMap(c => c.atoms)
  const levelPool = SYSTEM_WORDS[cefrLevel] ?? {}

  const byAtom = {}
  for (const atomId of atomIds) {
    const words = levelPool[atomId] ?? []
    if (words.length > 0) byAtom[atomId] = words
  }

  const words = [...new Set(Object.values(byAtom).flat())]
  return { byAtom, words }
}

// ── Snapshot persistence ──────────────────────────────────────
// Snapshot is NOT auto-computed. It is taken deliberately via the Mirror screen.
// Stored in localStorage so all lanes can read it without recomputing.

const SNAPSHOT_KEY = 'lapp-ai-snapshot'

export function saveSnapshot(snapshotData) {
  try {
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify({
      ...snapshotData,
      takenAt: Date.now(),
    }))
  } catch { /* storage full */ }
}

export function loadSnapshot() {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function clearSnapshot() {
  localStorage.removeItem(SNAPSHOT_KEY)
}

// ── Layer 2 — Learner introduction ───────────────────────────
// Formats the inventory as an introduction to the AI — not a constraint envelope.
// "You are speaking with someone. This is their world."
// Passed as the second layer of the three-layer AI call architecture.

const LANG_NAMES = {
  en: 'English', es: 'Spanish', fr: 'French', de: 'German',
  it: 'Italian', pt: 'Portuguese', ja: 'Japanese', zh: 'Chinese', ko: 'Korean',
}

// portrait is optional qualitative text from interaction history — empty until that layer is built.
export function buildLearnerIntroduction(inventory, portrait = null) {
  const { wordBank, identity } = inventory
  const { nativeLang, lang } = identity

  const langName   = LANG_NAMES[lang]   ?? lang
  const nativeName = LANG_NAMES[nativeLang] ?? nativeLang

  const lines = []

  // ── Meeting ──────────────────────────────────────────────────────────
  if (nativeLang && nativeLang !== lang) {
    lines.push(`You are meeting someone whose first language is ${nativeName}. They are building a world in ${langName}.`)
  } else {
    lines.push(`You are meeting someone. They are building a world in ${langName}.`)
  }

  // ── Qualitative portrait ─────────────────────────────────────────────
  // Populated from interaction history when available. Empty until that layer is built.
  if (portrait) {
    lines.push(`\n${portrait}`)
  }

  // ── WANT / MUST ──────────────────────────────────────────────────────
  lines.push(`\nYou bring your full intelligence into their world. What you want to say and what their world can currently hold are two different things — and the gap is not a problem. It is what they are reaching toward. You know what they're reaching for before they have the words for it.`)

  return lines.join('\n')
}

// ── Layer 3 — Level channel ──────────────────────────────────
// Tells the AI the shape of the communication channel to this person.
// Separate from the portrait (Layer 2) — the AI's understanding of the person
// is not constrained by their level. Only the channel is.
// The portrait is complete. Only how much of it can currently be transmitted is limited.

const CEFR_CHANNEL = {
  A1: 'short present-tense sentences, one clause, common words only',
  A2: 'simple past and future, basic connectors, familiar topics',
  B1: 'compound sentences, past and future, opinions and reasons',
  B2: 'complex sentences, abstract ideas, nuanced expression',
  C1: 'sophisticated structure, idiomatic range, subtle meaning',
  C2: 'full native range',
}

export function buildLevelChannel(cefrLevel) {
  const channel = CEFR_CHANNEL[cefrLevel] ?? cefrLevel
  return `This person is at ${cefrLevel}: ${channel}. Stay inside this. If you reach further, you lose them — and losing them is the one thing you won't do.`
}

// ── Layer 4 — World folder ───────────────────────────────────
// Communicates the shape and vocabulary of the learner's current world.
// Not a constraint list — a precise description of where they live right now,
// so the AI can reach them with maximum efficiency.
export function buildWorldFolder(inventory) {
  const { grammarPosition, identity } = inventory
  const { activeAtoms, atomWords, currentCluster } = grammarPosition
  const lang = identity?.lang ?? 'en'

  const clusters = getGrammarClusters(lang)
  const clusterData = clusters.find(c => c.id === currentCluster)

  // Highest-band tiers available at this cluster level — show the AI what a full sentence looks like
  const availableTiers = CONSTRUCTOR_TIERS.filter(t => t.band <= currentCluster)
  const topTier = availableTiers[availableTiers.length - 1]

  const lines = []

  if (clusterData) {
    lines.push(`This person is at Cluster ${currentCluster} — ${clusterData.label}: ${clusterData.description}.`)
  }

  if (topTier) {
    lines.push(`The sentences their world can currently hold: ${topTier.examples.slice(0, 3).join(' / ')}`)
  }

  lines.push(`\nTheir vocabulary:`)
  for (const atomId of activeAtoms) {
    const words = atomWords[atomId] ?? []
    if (words.length > 0)
      lines.push(`  ${PROMPT_LABEL[atomId] ?? atomId}: ${words.join(', ')}`)
  }

  lines.push(`\nKnowing this precisely is what lets you reach them. Everything outside this world — they won't follow you there.`)

  return lines.join('\n')
}

// ── Layer 5 — Directive ──────────────────────────────────────
// What to do with the context assembled in Layers 1–4.
// Task-specific: the Friend, Reading Lane, Writing Lab, and layer test
// all want different things from the same setup.
// Also carries immediate situational context — the conversational moment,
// topic, or prior exchange — things that don't belong in the portrait
// but shape what to say right now.
//
// task: 'speak' | 'read' | 'write-prompt' | 'friend' | 'layer-test'
// options: { scope, context, format }
//   scope:   'sentence' | 'paragraph' (default: 'sentence')
//   context: prior exchange or topic string (optional)
//   format:  additional format instruction (optional)

export function buildDirective(task, options = {}) {
  const { scope = 'sentence', context = null, format = null } = options
  const lines = []

  if (context) lines.push(context)

  if (task === 'speak') {
    const length = scope === 'paragraph' ? 'Three to five sentences.' : 'Two or three sentences.'
    lines.push(`Now speak to them. ${length} Direct speech only. No commentary on the constraint.`)
  } else if (task === 'friend') {
    lines.push(`Continue the conversation. One or two exchanges. Speak naturally within their world — no more, no less.`)
  } else if (task === 'read') {
    lines.push(`Generate one sentence for them to read. It should feel like something worth reading — not a drill, a moment.`)
  } else if (task === 'write-prompt') {
    lines.push(`Generate a writing prompt within their world. It should invite them to express something true about themselves.`)
  } else if (task === 'layer-test') {
    const length = scope === 'paragraph' ? 'Up to a paragraph (3–5 sentences). Let the thought breathe.' : 'Two or three sentences.'
    lines.push(`Now speak to them. ${length} Direct speech only. No commentary on the constraint.`)
  } else {
    lines.push(`Now speak to them. Direct speech only.`)
  }

  if (format) lines.push(format)

  return lines.join('\n')
}

// Builds the full constraint snapshot from the assembled inventory.
// Called deliberately (e.g. via Mirror button), not on every inventory load.
export function buildSnapshot(inventory) {
  const { wordBank, identity, grammarPosition } = inventory
  const { currentCluster }                       = grammarPosition
  const { lang, cefrLevel }                      = identity

  const circle2    = buildCircle2(currentCluster, lang, cefrLevel)
  const circle3    = wordBank
  const circle3Set = new Set(circle3)

  const gap  = circle2.words.filter(w => !circle3Set.has(w))

  // Additions: bank is smaller than gap → enumerate what IS allowed
  // Restrictions: gap is smaller than bank → enumerate what is NOT allowed
  const mode = circle3.length <= gap.length ? 'additions' : 'restrictions'

  const promptBlock = buildPromptBlock({ mode, cefrLevel, circle2, circle3Set, gap })

  return { circle2, circle3, gap, mode, promptBlock, currentCluster, lang, cefrLevel }
}

// Pre-formatted constraint block ready to inject into any AI prompt.
// Atom-sorted so the AI can reason about structural possibility from shape.
function buildPromptBlock({ mode, cefrLevel, circle2, circle3Set, gap }) {
  const lines = []

  if (mode === 'additions') {
    lines.push('AVAILABLE')
    for (const [atomId, allWords] of Object.entries(circle2.byAtom)) {
      const banked = allWords.filter(w => circle3Set.has(w))
      if (banked.length > 0) {
        lines.push(`  ${PROMPT_LABEL[atomId] ?? atomId}: ${banked.join(', ')}`)
      }
    }
  } else {
    lines.push(`VOCABULARY: all ${cefrLevel} words`)
    const gapSet    = new Set(gap)
    const gapByAtom = {}
    for (const [atomId, allWords] of Object.entries(circle2.byAtom)) {
      const excluded = allWords.filter(w => gapSet.has(w))
      if (excluded.length > 0) gapByAtom[atomId] = excluded
    }
    if (Object.keys(gapByAtom).length > 0) {
      lines.push('RESTRICTED (not yet in learner\'s bank)')
      for (const [atomId, words] of Object.entries(gapByAtom)) {
        lines.push(`  ${PROMPT_LABEL[atomId] ?? atomId}: ${words.join(', ')}`)
      }
    }
  }

  return lines.join('\n')
}
