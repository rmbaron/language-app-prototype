import { useState } from 'react'
import { getStrings } from './uiStrings'
import { getInterfaceLanguage } from './learnerProfile'

// A grammar slot positioned in the celestial space.
// Appears when the learner has 2+ words of the given grammatical category.
// Tapping opens/closes the word list.
//
// Props:
//   category  — grammatical category key (e.g. 'pronoun', 'verb')
//   words     — array of word objects available in this category
//   x, y      — position as percent of celestial space (0–100)
//   editorMode — if true, always visible regardless of word count (for editor preview)

export default function GrammarSlot({ category, words, x, y, scale = 1, editorMode = false }) {
  const [open, setOpen] = useState(false)
  const s     = getStrings(getInterfaceLanguage())
  const label = s.common.categories[category] ?? category

  // Only show to learner when at least 1 word is available; always show in editor
  if (!editorMode && words.length < 1) return null

  const posStyle = editorMode
    ? {}
    : { left: `${x}%`, top: `${y}%`, transform: `translate(-50%, -50%) scale(${scale})` }

  return (
    <div
      className={`grammar-slot${open ? ' grammar-slot--open' : ''}${editorMode ? ' grammar-slot--editor' : ''}`}
      style={posStyle}
      onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
    >
      <span className="grammar-slot-label">{label}</span>
      {(open || (editorMode && words.length > 0)) && (
        <div className="grammar-slot-words">
          {words.length === 0
            ? <span className="grammar-slot-empty">—</span>
            : words.map(w => (
                <span key={w.id} className="grammar-slot-word">{w.baseForm}</span>
              ))
          }
        </div>
      )}
    </div>
  )
}
