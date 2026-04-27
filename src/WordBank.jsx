import { useState } from 'react'
import { getStrings } from './uiStrings'
import { getInterfaceLanguage } from './learnerProfile'
import { getBankedWords } from './wordRegistry'
import { getActiveLanguage } from './learnerProfile'
import WordCard from './WordCard'
import { getWordBank, loadState, THRESHOLD, getWordStatuses, removeFromWordBank } from './userStore'
import { getWordProgress } from './wordProgress'
import { LANES } from './lanes'
import {
  GRAMMATICAL_GROUPS,
  BROAD_THEMES,
  GRANULAR_THEMES,
  getThematicTier,
  getWordTheme,
  matchesFilter,
} from './classifications'

export default function WordBank({ onSelectWord, onBack, onAddWord }) {
  const s = getStrings(getInterfaceLanguage())
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('az')
  const [statusFilter, setStatusFilter] = useState('all')
  const [devSelectMode, setDevSelectMode] = useState(false)
  const [selectedIds, setSelectedIds]     = useState(new Set())
  const [refreshKey, setRefreshKey]       = useState(0) // eslint-disable-line no-unused-vars

  const bankIds    = getWordBank()
  const state      = loadState()
  const { attempts } = state
  const bankWords  = getBankedWords(bankIds, getActiveLanguage())

  const thematicTier = getThematicTier(bankWords.length)
  const wordStatuses = getWordStatuses()

  const statusCounts = {
    active:    bankWords.filter(w => (wordStatuses[w.id] ?? 'banked') === 'active').length,
    banked:    bankWords.filter(w => (wordStatuses[w.id] ?? 'banked') === 'banked').length,
    completed: bankWords.filter(w => wordStatuses[w.id] === 'completed').length,
  }

  const grammaticalCounts = Object.fromEntries(
    GRAMMATICAL_GROUPS.map(g => [
      g.label,
      bankWords.filter(w => matchesFilter(w, g.label)).length,
    ])
  )

  const broadThemeCounts = Object.fromEntries(
    BROAD_THEMES.map(t => [t, bankWords.filter(w => getWordTheme(w.id).theme === t).length])
  )

  const granularThemeCounts = Object.fromEntries(
    GRANULAR_THEMES.map(g => [g.label, bankWords.filter(w => getWordTheme(w.id).subTheme === g.label).length])
  )

  const visibleGrammaticalGroups = GRAMMATICAL_GROUPS.filter(g => grammaticalCounts[g.label] > 0)
  const visibleBroadThemes       = BROAD_THEMES.filter(t => broadThemeCounts[t] > 0)
  const visibleGranularThemes    = GRANULAR_THEMES.filter(g => granularThemeCounts[g.label] > 0)

  const filteredWords = bankWords.filter(w => {
    const matchesCategory = matchesFilter(w, categoryFilter)
    const matchesSearch   = w.baseForm.toLowerCase().includes(search.toLowerCase()) ||
                            (w.meaning ?? '').toLowerCase().includes(search.toLowerCase())
    const matchesStatus   = statusFilter === 'all' || (wordStatuses[w.id] ?? 'banked') === statusFilter
    return matchesCategory && matchesSearch && matchesStatus
  })

  const visibleWords = [...filteredWords].sort((a, b) => {
    if (sort === 'az') return a.baseForm.localeCompare(b.baseForm)
    if (sort === 'za') return b.baseForm.localeCompare(a.baseForm)
    const pa = compositeProgress(a.id, attempts)
    const pb = compositeProgress(b.id, attempts)
    if (sort === 'strongest') return pb - pa
    if (sort === 'weakest')   return pa - pb
    return 0
  })

  function handleFilterClick(value) {
    setCategoryFilter(value)
    setSearch('')
  }

  // ── Dev: bulk remove ──────────────────────────────────────────

  function devToggleSelect(wordId) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(wordId) ? next.delete(wordId) : next.add(wordId)
      return next
    })
  }

  function devSelectAll() {
    setSelectedIds(new Set(visibleWords.map(w => w.id)))
  }

  function devRemoveSelected() {
    for (const id of selectedIds) removeFromWordBank(id)
    setSelectedIds(new Set())
    setDevSelectMode(false)
    setRefreshKey(k => k + 1)
  }

  function devExitSelectMode() {
    setDevSelectMode(false)
    setSelectedIds(new Set())
  }

  return (
    <div className="word-bank">
      {onBack && <button className="profile-back" onClick={onBack}>{s.common.back}</button>}
      <div className="word-bank-title-row">
        <h1 className="word-bank-title">{s.wordBank.title}</h1>
        {onAddWord && (
          <button className="word-bank-add-btn" onClick={onAddWord}>
            {s.wordBank.addWord}
          </button>
        )}
        {bankWords.length > 0 && (
          <button
            className={`word-bank-dev-select-btn ${devSelectMode ? 'word-bank-dev-select-btn--active' : ''}`}
            onClick={() => devSelectMode ? devExitSelectMode() : setDevSelectMode(true)}
          >
            {devSelectMode ? 'cancel' : '[dev] select'}
          </button>
        )}
      </div>

      <div className="word-bank-layout">
      <div className="word-bank-left">
      <div className="word-bank-controls">
        <input
          className="word-bank-search"
          type="text"
          placeholder={s.wordBank.searchPlaceholder}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <div className="word-bank-categories">
          <button
            className={`word-bank-cat-btn ${categoryFilter === 'all' ? 'word-bank-cat-btn--active' : ''}`}
            onClick={() => handleFilterClick('all')}
          >
            <em>All</em> ({bankWords.length})
          </button>
          {visibleGrammaticalGroups.map(g => (
            <button
              key={g.label}
              className={`word-bank-cat-btn ${categoryFilter === g.label ? 'word-bank-cat-btn--active' : ''}`}
              onClick={() => handleFilterClick(g.label)}
            >
              <em>{g.label}</em> ({grammaticalCounts[g.label]})
            </button>
          ))}
        </div>

        {thematicTier === 'broad' && visibleBroadThemes.length > 0 && (
          <div className="word-bank-categories word-bank-categories--thematic">
            {visibleBroadThemes.map(t => (
              <button
                key={t}
                className={`word-bank-cat-btn word-bank-cat-btn--theme ${categoryFilter === t ? 'word-bank-cat-btn--active' : ''}`}
                onClick={() => handleFilterClick(t)}
              >
                {t} ({broadThemeCounts[t]})
              </button>
            ))}
          </div>
        )}

        {thematicTier === 'granular' && visibleGranularThemes.length > 0 && (
          <div className="word-bank-categories word-bank-categories--thematic">
            {visibleGranularThemes.map(g => (
              <button
                key={g.label}
                className={`word-bank-cat-btn word-bank-cat-btn--theme ${categoryFilter === g.label ? 'word-bank-cat-btn--active' : ''}`}
                onClick={() => handleFilterClick(g.label)}
              >
                {g.label} ({granularThemeCounts[g.label]})
              </button>
            ))}
          </div>
        )}

        <div className="word-bank-sort">
          {(['az', 'za', 'strongest', 'weakest']).map(val => (
            <button
              key={val}
              className={`word-bank-sort-btn ${sort === val ? 'word-bank-sort-btn--active' : ''}`}
              onClick={() => setSort(val)}
            >
              {s.wordBank.sort[val]}
            </button>
          ))}
        </div>
      </div>

      <div className="word-bank-status-bar">
        {(['all', 'active', 'banked', 'completed']).map(val => (
          <button
            key={val}
            className={`word-bank-status-tab word-bank-status-tab--${val} ${statusFilter === val ? 'word-bank-status-tab--active' : ''}`}
            onClick={() => setStatusFilter(val)}
          >
            {s.wordBank.status[val](statusCounts[val] ?? bankWords.length)}
          </button>
        ))}
      </div>

      <div className="word-bank-list">
        {visibleWords.length === 0
          ? <p className="word-bank-empty">{s.wordBank.empty}</p>
          : visibleWords.map(word => (
              devSelectMode ? (
                <div
                  key={word.id}
                  className={`word-bank-selectable ${selectedIds.has(word.id) ? 'word-bank-selectable--selected' : ''}`}
                  onClick={() => devToggleSelect(word.id)}
                >
                  <span className="word-bank-selectable-check">{selectedIds.has(word.id) ? '✓' : ''}</span>
                  <WordCard
                    word={word}
                    wordProgress={getWordProgress(word.id, state)}
                    status={wordStatuses[word.id] ?? 'banked'}
                    onSelect={() => {}}
                  />
                </div>
              ) : (
                <WordCard
                  key={word.id}
                  word={word}
                  wordProgress={getWordProgress(word.id, state)}
                  status={wordStatuses[word.id] ?? 'banked'}
                  onSelect={() => onSelectWord(word)}
                />
              )
            ))
        }
      </div>

      {devSelectMode && (
        <div className="word-bank-selection-bar">
          <button className="word-bank-selection-all" onClick={devSelectAll}>
            select all ({visibleWords.length})
          </button>
          <span className="word-bank-selection-count">{selectedIds.size} selected</span>
          <button
            className="word-bank-selection-remove"
            onClick={devRemoveSelected}
            disabled={selectedIds.size === 0}
          >
            remove selected
          </button>
        </div>
      )}
      </div>{/* end word-bank-left */}

      <div className="word-bank-right">
      </div>

      </div>{/* end word-bank-layout */}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// Composite 0–100 progress across all lanes. Used for sort only.
// Lives here (not wordProgress.js) because it's specific to WordBank's sort UI.
function compositeProgress(wordId, attempts) {
  const wordAttempts = attempts[wordId]
  if (!wordAttempts) return 0
  const total = LANES.reduce((sum, { id }) => sum + Math.min((wordAttempts[id] ?? 0) / THRESHOLD, 1), 0)
  return Math.round((total / LANES.length) * 100)
}
