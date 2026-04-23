import { useState, useEffect, useMemo } from 'react'
import './constructor.css'
import { getStrings } from './uiStrings'
import {
  getInterfaceLanguage,
  getActiveLanguage,
} from './learnerProfile'
import { getWordBank, addToWordBank } from './userStore'
import { getBankedWords } from './wordRegistry'
import { ATOMS } from './grammarAtoms.en'
import { CONSTRUCTOR_TEST_SEED } from './constructorTestSeed.en'
import {
  getEligibleWords,
  getDoSupport,
  validateSentence,
} from './constructorEngine'
import { ALL_SLOTS_BY_ID } from './sentenceStructure.en.js'

// Each tier introduces exactly one slot. slotIds lists what's visible at that tier.
// Slot visibility is explicit — decoupled from atom unlocks so every slot gets its own test.
const TEST_TIERS = [
  { id: 1,  label: 'T1: Subject + Verb',           targetSlotId: 'verb',              atoms: ['personal_pronoun', 'lexical_verb'],                     slotIds: ['subject_noun', 'verb'],
    examples: ['I eat.', 'She runs.', 'We sleep.', 'You work.'] },
  { id: 2,  label: 'T2: + Object',                 targetSlotId: 'object',            atoms: ['noun', 'object_pronoun'],                               slotIds: ['subject_noun', 'verb', 'object'],
    examples: ['I want food.', 'She likes him.', 'We eat dinner.', 'I see her.'],
    freeSlots: ['subject_noun'] },
  { id: 3,  label: 'T3: + Copula / Complement',    targetSlotId: 'complement',        atoms: ['copula', 'adjective'],                                  slotIds: ['subject_noun', 'verb', 'complement'],
    examples: ['I am happy.', 'She is tired.', 'We are friends.', 'You are good.'],
    slotOverrides: { verb: { accepts: ['copula'] } }, freeSlots: ['subject_noun'] },
  { id: 4,  label: 'T4: + Determiner',             targetSlotId: 'determiner',        atoms: ['determiner', 'possessive_determiner', 'demonstrative'], slotIds: ['determiner', 'subject_noun', 'verb', 'object'],
    examples: ['The friend eats.', 'My book is here.', 'This food is good.', 'A teacher helps.'] },
  { id: 5,  label: 'T5: + Attributive Adjective',  targetSlotId: 'subject_adjective', atoms: [],                                                       slotIds: ['determiner', 'subject_adjective', 'subject_noun', 'verb', 'object'],
    examples: ['A good friend helps.', 'The tired teacher sleeps.', 'My happy dog eats food.'] },
  { id: 6,  label: 'T6: + Modal',                  targetSlotId: 'modal',             atoms: ['modal_auxiliary'],                                      slotIds: ['subject_noun', 'modal', 'verb', 'object'],
    examples: ['I can help.', 'She will eat.', 'We should sleep.', 'You must go.'] },
  { id: 7,  label: 'T7: + Negation',               targetSlotId: 'negation',          atoms: ['negation_marker', 'auxiliary'],                         slotIds: ['subject_noun', 'negation', 'verb', 'object'],
    examples: ['I do not eat.', 'She does not like food.', 'We do not sleep.'] },
  { id: 8,  label: 'T8: + Adverbial',              targetSlotId: 'adverbial',         atoms: ['adverb', 'preposition'],                                slotIds: ['subject_noun', 'verb', 'object', 'adverbial'],
    examples: ['I eat here.', 'She sleeps now.', 'We work there.', 'I eat at home.'],
    freeSlots: ['subject_noun'] },
  { id: 9,  label: 'T9: + Perfect',                targetSlotId: 'perfect',           atoms: [],                                                       slotIds: ['subject_noun', 'perfect', 'verb', 'object'],
    examples: ['I have eaten.', 'She has slept.', 'We have worked.', 'You have helped.'],
    forceWords: { perfect: ['have'] } },
  { id: 10, label: 'T10: + Progressive',           targetSlotId: 'progressive',       atoms: [],                                                       slotIds: ['subject_noun', 'progressive', 'verb', 'object'],
    examples: ['I am eating.', 'She is sleeping.', 'We are working.', 'You are helping.'],
    forceWords: { progressive: ['be'] } },
]

function seedAllTiers() {
  for (const [atom, wordIds] of Object.entries(CONSTRUCTOR_TEST_SEED)) {
    wordIds.forEach(id => addToWordBank(id))
  }
}

export default function Constructor({ targetSlotId, onBack }) {
  const s    = getStrings(getInterfaceLanguage())
  const lang = getActiveLanguage()
  const [seeded, setSeeded] = useState(false)
  const [, forceUpdate]     = useState(0)

  const bankWords = useMemo(() =>
    getBankedWords(getWordBank(), lang), [seeded])

  function handleSeedAll() {
    seedAllTiers()
    setSeeded(true)
    forceUpdate(n => n + 1)
  }

  return (
    <div className="constructor">
      <div className="constructor-header">
        <button className="back-btn" onClick={onBack}>{s.common.back}</button>
        <h1 className="constructor-title">{s.constructor.title}</h1>
        <button className="constructor-seed-btn" onClick={handleSeedAll}>
          Seed words
        </button>
      </div>

      <div className="constructor-tiers">
        {TEST_TIERS.map(tier => {
            return (
            <TierConstructor
              key={tier.id}
              tier={tier}
              bankWords={bankWords}
              lang={lang}
              targetSlotId={tier.targetSlotId}
              s={s}
            />
          )
        })}
      </div>
    </div>
  )
}

function TierConstructor({ tier, bankWords, lang, targetSlotId, s }) {
  const [filledSlots, setFilledSlots]             = useState({})
  const [generationState, setGenerationState]     = useState('idle')
  const [generatedSentence, setGeneratedSentence] = useState(null)

  const allVisibleSlots = tier.slotIds.map(id => {
    const base = ALL_SLOTS_BY_ID[id]
    const override = tier.slotOverrides?.[id]
    return base ? { ...base, ...override } : null
  }).filter(Boolean)

  // T2+: always show object slot so the SVO core is visible, greyed if not active
  const activeSlotIds = new Set(tier.slotIds)
  const displaySlots = [...allVisibleSlots]
  if (tier.id >= 2 && !activeSlotIds.has('object') && !activeSlotIds.has('complement')) {
    const objectSlot = ALL_SLOTS_BY_ID['object']
    if (objectSlot) displaySlots.push(objectSlot)
  }

  const doSupport       = getDoSupport(filledSlots['subject_noun'], filledSlots)
  const isValid         = validateSentence(allVisibleSlots, filledSlots)

  function fillSlot(slotId, wordId) {
    setFilledSlots(prev => ({ ...prev, [slotId]: wordId }))
    setGeneratedSentence(null)
    setGenerationState('idle')
  }

  function clearSlot(slotId) {
    setFilledSlots(prev => {
      const next = { ...prev }
      delete next[slotId]
      return next
    })
    setGeneratedSentence(null)
    setGenerationState('idle')
  }

  async function handleGenerate() {
    const targetWord = filledSlots[targetSlotId]
    if (!targetWord) return
    setGenerationState('loading')

    // Build per-slot word lists from the bank — only slots visible in this tier
    const slotWords = {}
    allVisibleSlots.forEach(slot => {
      if (slot.id === targetSlotId) return
      const eligible = getEligibleWords(slot, bankWords, lang).map(w => w.id)
      if (eligible.length) slotWords[slot.id] = eligible
    })

    try {
      const res = await fetch('/__generate-constructor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetSlotId, targetWord, targetSlotRole: ALL_SLOTS_BY_ID[targetSlotId]?.role ?? '', filledSlots, slotWords, lang }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setGeneratedSentence(data.sentence)
      setGenerationState('result')
    } catch {
      setGenerationState('idle')
    }
  }

  return (
    <div className="constructor-tier-section">
      <div className="constructor-tier-heading">
        <span className="constructor-tier-title">{tier.label}</span>
        <span className="constructor-tier-atoms">
          {tier.atoms.map(a => {
            const atom = ATOMS.find(x => x.id === a)
            return <span key={a} className="constructor-tier-atom">{atom?.label ?? a}</span>
          })}
          {tier.atoms.length === 0 && (
            <span className="constructor-tier-atom constructor-tier-atom--implicit">be · have via alternateAtoms</span>
          )}
        </span>
        <span className="constructor-tier-examples">
          {tier.examples.map((ex, i) => (
            <span key={i} className="constructor-tier-example">{ex}</span>
          ))}
        </span>
        <button
          className="constructor-tier-clear"
          onClick={() => { setFilledSlots({}); setGeneratedSentence(null); setGenerationState('idle') }}
        >
          clear
        </button>
      </div>

      <div className="constructor-sentence">
        {displaySlots.map((slot, i) => {
          const isActive = activeSlotIds.has(slot.id)
          const isFree = tier.freeSlots?.includes(slot.id)
          const activeIndex = tier.slotIds.indexOf(slot.id)
          const prevRequired = tier.slotIds.slice(0, activeIndex).filter(id => !tier.freeSlots?.includes(id)).at(-1)
          const cascadeDisabled = isActive && !isFree && !!prevRequired && !filledSlots[prevRequired]
          return (
            <SlotBox
              key={slot.id}
              slot={slot}
              label={s.constructor.slots[slot.id] ?? slot.id}
              filledWordId={filledSlots[slot.id] ?? null}
              eligibleWords={isActive ? [
                ...getEligibleWords(slot, bankWords, lang),
                ...(tier.forceWords?.[slot.id] ?? [])
                  .map(id => bankWords.find(w => w.id === id))
                  .filter(w => w && !getEligibleWords(slot, bankWords, lang).some(e => e.id === w.id)),
              ] : []}
              isTarget={slot.id === targetSlotId}
              disabled={!isActive || cascadeDisabled}
              onFill={wordId => fillSlot(slot.id, wordId)}
              onClear={() => clearSlot(slot.id)}
              doSupportBefore={i === 1 && doSupport ? doSupport : null}
            />
          )
        })}

        <button
          className="constructor-generate"
          disabled={!isValid || generationState === 'loading'}
          onClick={handleGenerate}
        >
          {generationState === 'loading' ? s.constructor.generating : s.constructor.generate}
        </button>
      </div>

      {generationState === 'result' && generatedSentence && (
        <div className="constructor-result">
          {generatedSentence.split(new RegExp(`(\\b${filledSlots[targetSlotId]}\\b)`, 'i')).map((part, i) =>
            part.toLowerCase() === filledSlots[targetSlotId]?.toLowerCase()
              ? <span key={i} className="constructor-result-target">{part}</span>
              : part
          )}
        </div>
      )}
    </div>
  )
}

function SlotBox({ slot, label, filledWordId, eligibleWords, isTarget, disabled, onFill, onClear, doSupportBefore }) {
  const s = getStrings(getInterfaceLanguage())

  return (
    <>
      {doSupportBefore && (
        <div className="constructor-do-support">{doSupportBefore}</div>
      )}
      <div className={[
        'slot-box',
        isTarget        ? 'slot-box--target'    : '',
        filledWordId    ? 'slot-box--filled'    : 'slot-box--empty',
        !slot.optional  ? 'slot-box--required'  : '',
        disabled        ? 'slot-box--disabled'  : '',
      ].filter(Boolean).join(' ')}>
        <div className="slot-box-label">{label}</div>
        <select
          value={filledWordId ?? ''}
          disabled={disabled}
          onChange={e => e.target.value ? onFill(e.target.value) : onClear()}
        >
          <option value="">{s.constructor.empty}</option>
          {eligibleWords.map(word => (
            <option key={word.id} value={word.id}>{word.id}</option>
          ))}
        </select>
      </div>
    </>
  )
}
