import { useState } from 'react'
import { getStrings } from './uiStrings'
import { getInterfaceLanguage } from './learnerProfile'
import { getBankedWords } from './wordRegistry'
import { getActiveLanguage } from './learnerProfile'
import WordCard from './WordCard'
import { getWordBank, loadState, THRESHOLD, getWordStatuses, ACTIVE_LIMIT, removeFromWordBank } from './userStore'
import { getWordProgress } from './wordProgress'
import { LANES } from './lanes'
import { getNextMilestone, getRecentAchievements, getUpcomingMilestones } from './milestones'
import { loadGrammarState } from './grammarStore'
import {
  GRAMMATICAL_GROUPS,
  BROAD_THEMES,
  GRANULAR_THEMES,
  getThematicTier,
  getWordTheme,
} from './classifications'

function compositeProgress(wordId, attempts) {
  const wordAttempts = attempts[wordId]
  if (!wordAttempts) return 0
  const total = LANES.reduce((sum, { id }) => sum + Math.min((wordAttempts[id] ?? 0) / THRESHOLD, 1), 0)
  return Math.round((total / LANES.length) * 100)
}

function matchesFilter(word, filter) {
  if (filter === 'all') return true
  const group = GRAMMATICAL_GROUPS.find(g => g.label === filter)
  if (group) return group.categories.includes(word.classifications.grammaticalCategory)
  const { theme, subTheme } = getWordTheme(word.id)
  const granular = GRANULAR_THEMES.find(g => g.label === filter)
  if (granular) return subTheme === filter
  return theme === filter
}

export default function WordBank({ onSelectWord, onBack, onAddWord }) {
  const s = getStrings(getInterfaceLanguage())
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('az')
  const [achievedOpen, setAchievedOpen] = useState(false)
  const [upcomingOpen, setUpcomingOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [devSelectMode, setDevSelectMode] = useState(false)
  const [selectedIds, setSelectedIds]     = useState(new Set())
  const [refreshKey, setRefreshKey]       = useState(0)

  // refreshKey increments after dev removals, forcing a re-read of bank state
  const bankIds   = getWordBank()              // eslint-disable-line react-hooks/exhaustive-deps
  const state     = loadState()                // eslint-disable-line react-hooks/exhaustive-deps
  const { attempts } = state
  const bankWords = getBankedWords(bankIds, getActiveLanguage())


  const grammarState = loadGrammarState()
  const nextMilestone = getNextMilestone(state, grammarState)
  const recentAchievements = getRecentAchievements(state, grammarState)
  const upcomingMilestones = getUpcomingMilestones(state, grammarState, 3)

  const thematicTier = getThematicTier(bankWords.length)
  const wordStatuses = getWordStatuses()
  const activeCount = Object.values(wordStatuses).filter(s => s === 'active').length
  const statusCounts = {
    active:    bankWords.filter(w => (wordStatuses[w.id] ?? 'banked') === 'active').length,
    banked:    bankWords.filter(w => (wordStatuses[w.id] ?? 'banked') === 'banked').length,
    completed: bankWords.filter(w => wordStatuses[w.id] === 'completed').length,
  }

  // Counts per filter option
  const grammaticalCounts = Object.fromEntries(
    GRAMMATICAL_GROUPS.map(g => [
      g.label,
      bankWords.filter(w => g.categories.includes(w.classifications.grammaticalCategory)).length,
    ])
  )

  const broadThemeCounts = Object.fromEntries(
    BROAD_THEMES.map(t => [t, bankWords.filter(w => getWordTheme(w.id).theme === t).length])
  )

  const granularThemeCounts = Object.fromEntries(
    GRANULAR_THEMES.map(g => [g.label, bankWords.filter(w => getWordTheme(w.id).subTheme === g.label).length])
  )

  // Only show filters that have at least one word
  const visibleGrammaticalGroups = GRAMMATICAL_GROUPS.filter(g => grammaticalCounts[g.label] > 0)
  const visibleBroadThemes = BROAD_THEMES.filter(t => broadThemeCounts[t] > 0)
  const visibleGranularThemes = GRANULAR_THEMES.filter(g => granularThemeCounts[g.label] > 0)

  const filteredWords = bankWords.filter(w => {
    const matchesCategory = matchesFilter(w, categoryFilter)
    const matchesSearch = w.baseForm.toLowerCase().includes(search.toLowerCase()) ||
                          w.meaning.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || (wordStatuses[w.id] ?? 'banked') === statusFilter
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

        {/* Grammatical layer — always visible */}
        <div className="word-bank-categories">
          <button
            className={`word-bank-cat-btn ${categoryFilter === 'all' ? 'word-bank-cat-btn--active' : ''}`}
            onClick={() => handleFilterClick('all')}
          >
            all ({bankWords.length})
          </button>
          {visibleGrammaticalGroups.map(g => (
            <button
              key={g.label}
              className={`word-bank-cat-btn ${categoryFilter === g.label ? 'word-bank-cat-btn--active' : ''}`}
              onClick={() => handleFilterClick(g.label)}
            >
              {g.label.toLowerCase()} ({grammaticalCounts[g.label]})
            </button>
          ))}
        </div>

        {/* Thematic layer — unlocks above threshold */}
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
        {nextMilestone && (
          <div className="milestone-next">
            <p className="milestone-next-count">
              {s.wordBank.milestones.wordsToGo(nextMilestone.wordsToGo)}
            </p>
            <p className="milestone-next-desc">{nextMilestone.description}</p>

            {upcomingMilestones.length > 0 && (
              <div className="milestone-upcoming">
                <button
                  className="milestone-toggle-btn"
                  onClick={() => setUpcomingOpen(o => !o)}
                >
                  {upcomingOpen ? s.wordBank.milestones.hideAhead : s.wordBank.milestones.seeAhead}
                </button>
                {upcomingOpen && (
                  <div className="milestone-upcoming-list">
                    {upcomingMilestones.map(m => (
                      <div key={m.id} className="milestone-upcoming-item">
                        <span className="milestone-upcoming-label">{m.label}</span>
                        <span className="milestone-upcoming-desc">{m.description}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {recentAchievements.length > 0 && (
          <div className="milestone-achieved">
            <button
              className="milestone-toggle-btn milestone-achieved-heading"
              onClick={() => setAchievedOpen(o => !o)}
            >
              {s.wordBank.milestones.achieved(recentAchievements.length)} {achievedOpen ? '▴' : '▾'}
            </button>
            {achievedOpen && recentAchievements.map(m => (
              <div key={m.id} className="milestone-achieved-item">
                <span className="milestone-achieved-check">✓</span>
                <span className="milestone-achieved-label">{m.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      </div>{/* end word-bank-layout */}
    </div>
  )
}
