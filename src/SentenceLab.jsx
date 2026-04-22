import { useState, useMemo } from 'react'
import { getAllWords } from './wordRegistry'
import { getActiveLanguage, getCefrLevel } from './learnerProfile'
import { getCurrentSubLevel, getCumulativeSlots } from './cefrLevels'
import { getWordBank } from './userStore'

// ── Tier definitions ──────────────────────────────────────────
//
// Each tier is a sentence structure.
// Slots define what fills each position in the sentence:
//   specific   — random pick from a list of word IDs
//   category   — random pick from a grammatical category
//   fixed      — literal string (e.g. "don't")
//   article    — random pick of a/the from wordData
//
// formHint on a slot changes which word form is displayed:
//   third_person_present  — uses verb's 3sg form
//   conjugate_be          — reads the subject slot to pick am/is/are

const TIERS = [
  {
    id: 1,
    name: 'Point at something',
    pattern: '[this/that] + [noun]',
    wordCount: 2,
    requiredSlots: ['demonstrative', 'basic_noun'],
    slots: [
      { type: 'specific', ids: ['this', 'that'], label: 'pointing' },
      { type: 'category', cat: 'noun', label: 'noun' },
    ],
  },
  {
    id: 2,
    name: 'I do',
    pattern: '[I] + [verb]',
    wordCount: 2,
    requiredSlots: ['personal_pronoun', 'present_simple_verbal'],
    slots: [
      { type: 'specific', ids: ['i'], label: 'subject' },
      { type: 'category', cat: 'verb', exclude: ['be'], label: 'verb' },
    ],
  },
  {
    id: 3,
    name: 'You do',
    pattern: '[you] + [verb]',
    wordCount: 2,
    requiredSlots: ['personal_pronoun', 'present_simple_verbal'],
    slots: [
      { type: 'specific', ids: ['you'], label: 'subject' },
      { type: 'category', cat: 'verb', exclude: ['be'], label: 'verb' },
    ],
  },
  {
    id: 4,
    name: 'I do something',
    pattern: '[I/you] + [verb] + [a/the] + [noun]',
    wordCount: 4,
    requiredSlots: ['personal_pronoun', 'present_simple_verbal', 'determiner_article', 'basic_noun'],
    slots: [
      { type: 'specific', ids: ['i', 'you'], label: 'subject' },
      { type: 'category', cat: 'verb', exclude: ['be'], label: 'verb' },
      { type: 'article', label: 'article' },
      { type: 'category', cat: 'noun', label: 'noun' },
    ],
  },
  {
    id: 5,
    name: 'X is Y',
    pattern: '[pronoun] + [am/is/are] + [adjective]',
    wordCount: 3,
    requiredSlots: ['personal_pronoun', 'copular_be', 'adjectival_description'],
    slots: [
      { type: 'category', cat: 'pronoun', exclude: ['this', 'that', 'what', 'who'], label: 'subject', role: 'subject' },
      { type: 'specific', ids: ['be'], label: 'be', formHint: 'conjugate_be', subjectSlot: 0 },
      { type: 'category', cat: 'adjective', label: 'adjective' },
    ],
  },
  {
    id: 6,
    name: 'I want a cold thing',
    pattern: '[I/you] + [verb] + [a/the] + [adjective] + [noun]',
    wordCount: 5,
    requiredSlots: ['personal_pronoun', 'present_simple_verbal', 'determiner_article', 'adjectival_description', 'basic_noun'],
    slots: [
      { type: 'specific', ids: ['i', 'you'], label: 'subject' },
      { type: 'category', cat: 'verb', exclude: ['be'], label: 'verb' },
      { type: 'article', label: 'article' },
      { type: 'category', cat: 'adjective', label: 'adjective' },
      { type: 'category', cat: 'noun', label: 'noun' },
    ],
  },
  {
    id: 7,
    name: "I don't",
    pattern: "[I/you] + [don't] + [verb] + [a/the] + [noun]",
    wordCount: 5,
    requiredSlots: ['personal_pronoun', 'negation', 'present_simple_verbal', 'determiner_article', 'basic_noun'],
    slots: [
      { type: 'specific', ids: ['i', 'you'], label: 'subject' },
      { type: 'fixed', word: "don't", label: 'negation' },
      { type: 'category', cat: 'verb', exclude: ['be'], label: 'verb' },
      { type: 'article', label: 'article' },
      { type: 'category', cat: 'noun', label: 'noun' },
    ],
  },
  {
    id: 8,
    name: 'What / Where',
    pattern: '[what/where] + [is] + [subject]',
    wordCount: 3,
    requiredSlots: ['interrogative', 'copular_be', 'personal_pronoun'],
    slots: [
      { type: 'specific', ids: ['what', 'where'], label: 'question' },
      { type: 'fixed', word: 'is', label: 'be' },
      { type: 'category', cat: 'pronoun', exclude: ['this', 'that', 'what', 'who'], label: 'subject' },
    ],
  },
  {
    id: 9,
    name: 'He/she does',
    pattern: '[he/she] + [verb·3sg] + [a/the] + [noun]',
    wordCount: 4,
    requiredSlots: ['personal_pronoun', 'present_simple_verbal', 'determiner_article', 'basic_noun'],
    slots: [
      { type: 'specific', ids: ['he', 'she'], label: 'subject' },
      { type: 'category', cat: 'verb', exclude: ['be'], label: 'verb·3sg', formHint: 'third_person_present' },
      { type: 'article', label: 'article' },
      { type: 'category', cat: 'noun', label: 'noun' },
    ],
  },
  {
    id: 10,
    name: 'Possession + state',
    pattern: '[possessive] + [noun] + [is] + [adjective]',
    wordCount: 4,
    requiredSlots: ['possession', 'basic_noun', 'copular_be', 'adjectival_description'],
    slots: [
      { type: 'fixed', word: 'my', label: 'possessive' },
      { type: 'category', cat: 'noun', label: 'noun' },
      { type: 'fixed', word: 'is', label: 'be' },
      { type: 'category', cat: 'adjective', label: 'adjective' },
    ],
  },
]

// ── Generation helpers ────────────────────────────────────────

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)] ?? null
}

function getForm(word, formType) {
  const found = word.forms?.find(f => f.type === formType)
  return found?.form ?? word.baseForm
}

function conjugateBe(subjectWord) {
  if (!subjectWord) return 'is'
  if (subjectWord.id === 'i') return 'am'
  if (['he', 'she', 'it'].includes(subjectWord.id)) return 'is'
  return 'are'
}

function generateSentence(tier, langWords) {
  const result = []

  // First pass: resolve all non-be slots so conjugate_be has a subject to look at
  for (const slot of tier.slots) {
    if (slot.type === 'fixed') {
      result.push({ display: slot.word, label: slot.label, isFixed: true })
      continue
    }
    if (slot.type === 'specific') {
      const pool = langWords.filter(w => slot.ids.includes(w.id))
      const pick = pickRandom(pool)
      if (!pick) return null
      result.push({ display: pick.baseForm, label: slot.label, word: pick, role: slot.role })
      continue
    }
    if (slot.type === 'article') {
      const pool = langWords.filter(w => ['a', 'the'].includes(w.id))
      const pick = pickRandom(pool)
      if (!pick) return null
      result.push({ display: pick.baseForm, label: slot.label, word: pick })
      continue
    }
    if (slot.type === 'category') {
      const exclude = new Set(slot.exclude ?? [])
      const pool = langWords.filter(
        w => w.classifications.grammaticalCategory === slot.cat && !exclude.has(w.id)
      )
      const pick = pickRandom(pool)
      if (!pick) return null
      let display = pick.baseForm
      if (slot.formHint === 'third_person_present') {
        display = getForm(pick, 'third_person_present')
      }
      result.push({ display, label: slot.label, word: pick, role: slot.role })
      continue
    }
    result.push(null)
  }

  if (result.includes(null)) return null

  // Second pass: resolve conjugate_be now that subject is known
  for (let i = 0; i < tier.slots.length; i++) {
    const slot = tier.slots[i]
    if (slot.formHint === 'conjugate_be') {
      const subjectEntry = result[slot.subjectSlot ?? 0]
      result[i] = { display: conjugateBe(subjectEntry?.word), label: slot.label }
    }
  }

  // Third pass: a → an before vowel-initial words
  for (let i = 0; i < result.length - 1; i++) {
    if (tier.slots[i]?.type === 'article' && result[i].display === 'a') {
      if (/^[aeiou]/i.test(result[i + 1].display)) {
        result[i] = { ...result[i], display: 'an' }
      }
    }
  }

  return result
}

// ── Component ─────────────────────────────────────────────────

export default function SentenceLab({ onBack }) {
  const activeLang  = getActiveLanguage()
  const cefrLevel   = getCefrLevel() ?? 'A1'
  const bankIds     = getWordBank()
  const currentSub  = getCurrentSubLevel(cefrLevel, bankIds, allWords, activeLang)
  const activeSlots = new Set(getCumulativeSlots(cefrLevel, currentSub))

  const langWords  = useMemo(
    () => allWords.filter(w => w.language === activeLang),
    [activeLang]
  )

  // Only surface tiers whose required grammar slots are all active for this learner
  const slotEligibleTiers = TIERS.filter(t =>
    t.requiredSlots.every(s => activeSlots.has(s))
  )

  const [selectedTierIds, setSelectedTierIds] = useState(
    () => new Set(slotEligibleTiers.map(t => t.id))
  )
  const [wordCountFilter, setWordCountFilter] = useState(0) // 0 = no filter
  const [sentence, setSentence] = useState(null)
  const [tierUsed, setTierUsed] = useState(null)

  const availableTiers = slotEligibleTiers.filter(t =>
    wordCountFilter === 0 || t.wordCount === wordCountFilter
  )

  const activeTiers = availableTiers.filter(t => selectedTierIds.has(t.id))

  function toggleTier(id) {
    setSelectedTierIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        if (next.size > 1) next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function generate() {
    if (activeTiers.length === 0) return
    const tier = pickRandom(activeTiers)
    const result = generateSentence(tier, langWords)
    setSentence(result)
    setTierUsed(tier)
  }

  const wcCounts = [...new Set(TIERS.map(t => t.wordCount))].sort((a, b) => a - b)

  return (
    <div className="sentence-lab">
      <button className="profile-back" onClick={onBack}>← Back</button>
      <p className="sentence-lab-title">Sentence Lab</p>

      {/* ── Word count filter ── */}
      <div className="sentence-lab-section">
        <p className="sentence-lab-label">Word count</p>
        <div className="sentence-lab-chips">
          <button
            className={`sentence-lab-chip ${wordCountFilter === 0 ? 'sentence-lab-chip--active' : ''}`}
            onClick={() => setWordCountFilter(0)}
          >
            All
          </button>
          {wcCounts.map(n => (
            <button
              key={n}
              className={`sentence-lab-chip ${wordCountFilter === n ? 'sentence-lab-chip--active' : ''}`}
              onClick={() => setWordCountFilter(n)}
            >
              {n} words
            </button>
          ))}
        </div>
      </div>

      {/* ── Tier selector ── */}
      <div className="sentence-lab-section">
        <p className="sentence-lab-label">Structure tiers</p>
        <div className="sentence-lab-tiers">
          {availableTiers.map(tier => (
            <button
              key={tier.id}
              className={`sentence-lab-tier ${selectedTierIds.has(tier.id) ? 'sentence-lab-tier--active' : ''}`}
              onClick={() => toggleTier(tier.id)}
            >
              <span className="sentence-lab-tier-num">{tier.id}</span>
              <span className="sentence-lab-tier-name">{tier.name}</span>
              <span className="sentence-lab-tier-pattern">{tier.pattern}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Generate button ── */}
      <button
        className="sentence-lab-generate"
        onClick={generate}
        disabled={activeTiers.length === 0}
      >
        Generate
      </button>

      {/* ── Output ── */}
      {sentence && tierUsed && (
        <div className="sentence-lab-output">
          <p className="sentence-lab-output-tier">{tierUsed.name}</p>
          <div className="sentence-lab-words">
            {sentence.map((part, i) => (
              <div key={i} className="sentence-lab-word">
                <span className="sentence-lab-word-form">{part.display}</span>
                <span className="sentence-lab-word-label">{part.label}</span>
              </div>
            ))}
          </div>
          <p className="sentence-lab-output-sentence">
            {sentence.map(p => p.display).join(' ')}
          </p>
        </div>
      )}
    </div>
  )
}
