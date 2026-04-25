import { useState, useMemo, useEffect, useRef } from 'react'
import { useInventory } from './InventoryContext'
import { getStrings } from './uiStrings'
import { getInterfaceLanguage } from './learnerProfile'
import { scanAIText, buildBankSurfaceSet, resolveToBase } from './wordScanner'
import { findWordInIndex } from './atomIndex'
import { addToWordBank, addToRecommenderQueue } from './userStore'

// atomId → category key in s.common.categories
const ATOM_TO_CATEGORY = {
  lexical_verb:          'verb',
  copula:                'verb',
  auxiliary:             'verb',
  modal_auxiliary:       'verb',
  progressive_auxiliary: 'verb',
  personal_pronoun:      'pronoun',
  object_pronoun:        'pronoun',
  possessive_determiner: 'pronoun',
  noun:                  'noun',
  adjective:             'adjective',
  determiner:            'determiner',
  numeral:               'determiner',
  demonstrative:         'demonstrative',
  preposition:           'preposition',
  interrogative:         'interrogative',
  negation_marker:       'adverb',
  conjunction:           'conjunction',
  adverb:                'adverb',
  interjection:          'interjection',
}

export default function AIText({ text, lang = 'en' }) {
  const { inventory, refreshInventory } = useInventory()
  const s        = getStrings(getInterfaceLanguage())
  const bankSet  = useMemo(() => new Set(inventory.wordBank), [inventory.wordBank])
  const tokens   = useMemo(() => scanAIText(text, bankSet), [text, bankSet])

  const [selected, setSelected] = useState(null) // { normalized, surface }
  const panelRef  = useRef(null)

  // Dismiss panel on outside click
  useEffect(() => {
    if (!selected) return
    function onDown(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setSelected(null)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
    }
  }, [selected])

  function handleUnlock() {
    addToWordBank(selected.normalized)
    refreshInventory()
    setSelected(null)
  }

  function handleRecommend() {
    addToRecommenderQueue(selected.normalized)
    setSelected(null)
  }

  // Resolve atom class for selected word
  const selectedAtomInfo = useMemo(() => {
    if (!selected) return null
    const found = findWordInIndex(selected.normalized, lang)
    if (!found) return null
    const catKey   = ATOM_TO_CATEGORY[found.atomId]
    const catLabel = catKey ? (s.common.categories[catKey] ?? found.atomId) : found.atomId
    return { atomId: found.atomId, catLabel }
  }, [selected, lang, s])

  return (
    <>
      <span className="ai-text">
        {tokens.map((tok, i) => {
          if (!tok.isWord || tok.isKnown) return <span key={i}>{tok.text}</span>
          return (
            <span
              key={i}
              className="ai-text-unknown"
              onClick={() => setSelected({ normalized: resolveToBase(tok.normalized), surface: tok.text })}
            >
              {tok.text}
            </span>
          )
        })}
      </span>

      {selected && (
        <div className="ai-text-panel" ref={panelRef}>
          <div className="ai-text-panel-word">{selected.surface}</div>
          {selectedAtomInfo && (
            <div className="ai-text-panel-class">
              {s.aiText.wordClass}: {selectedAtomInfo.catLabel}
            </div>
          )}
          <div className="ai-text-panel-actions">
            <button className="ai-text-btn ai-text-btn--unlock"    onClick={handleUnlock}>
              {s.aiText.unlock}
            </button>
            <button className="ai-text-btn ai-text-btn--recommend" onClick={handleRecommend}>
              {s.aiText.recommend}
            </button>
            <button className="ai-text-btn ai-text-btn--ignore"    onClick={() => setSelected(null)}>
              {s.aiText.ignore}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
