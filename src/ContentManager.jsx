import { useState } from 'react'
import words from './wordData'
import { LANES } from './lanes'
import { getContent, addContent, updateContent, removeContent, getPronunciation, setPronunciation } from './contentStore'
import { GRAMMATICAL_GROUPS, getGrammaticalGroup } from './classifications'

const isAudio = lane => lane.medium === 'audio'
const isProductive = lane => lane.modality === 'productive'

function EditableItem({ wordId, laneId, item, lane, onDone }) {
  const [text, setText] = useState(item.text)
  const [audioUrl, setAudioUrl] = useState(item.audioUrl ?? '')
  const [level, setLevel] = useState(item.level ?? 1)

  function save() {
    const trimmed = text.trim()
    if (!trimmed) { onDone(); return }
    const fields = isAudio(lane)
      ? { text: trimmed, audioUrl: audioUrl.trim(), level }
      : { text: trimmed, level }
    updateContent(wordId, laneId, item.id, fields)
    onDone()
  }

  return (
    <div className="cm-item cm-item--editing">
      <textarea
        className="cm-item-input"
        value={text}
        onChange={e => setText(e.target.value)}
        rows={2}
        autoFocus
        placeholder={isProductive(lane) ? 'Prompt text...' : 'Sentence text...'}
      />
      {isAudio(lane) && (
        <input
          className="cm-item-input cm-item-input--url"
          value={audioUrl}
          onChange={e => setAudioUrl(e.target.value)}
          placeholder="Audio URL (e.g. /audio/want-1.mp3)"
        />
      )}
      <div className="cm-item-level">
        <label className="cm-level-label">Level</label>
        <input
          type="number"
          className="cm-level-input"
          value={level}
          min={1}
          onChange={e => setLevel(Number(e.target.value))}
        />
      </div>
      <div className="cm-item-actions">
        <button className="cm-btn cm-btn--save" onClick={save}>Save</button>
        <button className="cm-btn cm-btn--cancel" onClick={onDone}>Cancel</button>
      </div>
    </div>
  )
}

function ItemDisplay({ item, lane, onEdit, onRemove }) {
  return (
    <div className="cm-item">
      <div className="cm-item-body">
        <div className="cm-item-text-row">
          <p className="cm-item-text">{item.text}</p>
          <span className="cm-item-level-badge">L{item.level ?? 1}</span>
        </div>
        {isAudio(lane) && (
          <div className="cm-item-audio">
            {item.audioUrl
              ? <audio controls src={item.audioUrl} className="cm-audio-player" />
              : <span className="cm-audio-missing">No audio yet</span>
            }
            <span className="cm-audio-url">{item.audioUrl || '—'}</span>
          </div>
        )}
      </div>
      <div className="cm-item-actions">
        <button className="cm-btn cm-btn--edit" onClick={onEdit}>Edit</button>
        <button className="cm-btn cm-btn--delete" onClick={onRemove}>Delete</button>
      </div>
    </div>
  )
}

function LaneSection({ wordId, lane }) {
  const [items, setItems] = useState(() => getContent(wordId, lane.id))
  const [addText, setAddText] = useState('')
  const [addAudioUrl, setAddAudioUrl] = useState('')
  const [addLevel, setAddLevel] = useState(1)
  const [editingId, setEditingId] = useState(null)
  const [importOpen, setImportOpen] = useState(false)
  const [importText, setImportText] = useState('')
  const [importFeedback, setImportFeedback] = useState(null)

  function refresh() {
    setItems([...getContent(wordId, lane.id)])
  }

  function handleAdd() {
    const trimmed = addText.trim()
    if (!trimmed) return
    const fields = isAudio(lane)
      ? { text: trimmed, audioUrl: addAudioUrl.trim(), level: addLevel }
      : { text: trimmed, level: addLevel }
    addContent(wordId, lane.id, fields)
    setAddText('')
    setAddAudioUrl('')
    setAddLevel(1)
    refresh()
  }

  function handleRemove(itemId) {
    removeContent(wordId, lane.id, itemId)
    refresh()
  }

  function handleEditDone() {
    setEditingId(null)
    refresh()
  }

  function handleImport() {
    try {
      const parsed = JSON.parse(importText)
      if (!Array.isArray(parsed)) {
        setImportFeedback({ ok: false, message: 'Expected a JSON array.' })
        return
      }
      let count = 0
      if (isAudio(lane)) {
        // Accept array of strings or array of {text, audioUrl, level?} objects
        parsed.forEach(item => {
          if (typeof item === 'string' && item.trim()) {
            addContent(wordId, lane.id, { text: item.trim(), audioUrl: '', level: 1 })
            count++
          } else if (item && typeof item === 'object' && item.text?.trim()) {
            addContent(wordId, lane.id, { text: item.text.trim(), audioUrl: item.audioUrl ?? '', level: item.level ?? 1 })
            count++
          }
        })
      } else {
        parsed.forEach(item => {
          if (typeof item === 'string' && item.trim()) {
            addContent(wordId, lane.id, { text: item.trim(), level: 1 })
            count++
          } else if (item && typeof item === 'object' && item.text?.trim()) {
            addContent(wordId, lane.id, { text: item.text.trim(), level: item.level ?? 1 })
            count++
          }
        })
      }
      if (count === 0) {
        setImportFeedback({ ok: false, message: 'No valid items found.' })
        return
      }
      setImportText('')
      setImportFeedback({ ok: true, message: `${count} item${count !== 1 ? 's' : ''} imported.` })
      refresh()
    } catch {
      setImportFeedback({ ok: false, message: 'Invalid JSON — check the format and try again.' })
    }
  }

  function toggleImport() {
    setImportOpen(o => !o)
    setImportFeedback(null)
    setImportText('')
  }

  const itemLabel = isProductive(lane) ? 'prompt' : 'sentence'
  const importHint = isAudio(lane)
    ? `["sentence one", "sentence two"] or [{"text":"...","audioUrl":"/audio/..."}]`
    : `["${itemLabel} one", "${itemLabel} two", ...]`

  return (
    <div className="cm-lane">
      <div className="cm-lane-header">
        <span className="cm-lane-title">{lane.label}</span>
        <div className="cm-lane-header-right">
          <span className="cm-lane-count">{items.length} item{items.length !== 1 ? 's' : ''}</span>
          <button className="cm-btn cm-btn--import-toggle" onClick={toggleImport}>
            {importOpen ? 'Cancel import' : 'Import JSON'}
          </button>
        </div>
      </div>

      {importOpen && (
        <div className="cm-import">
          <p className="cm-import-hint">
            Paste a JSON array. Format: <code>{importHint}</code>
          </p>
          <textarea
            className="cm-import-input"
            value={importText}
            onChange={e => { setImportText(e.target.value); setImportFeedback(null) }}
            placeholder={importHint}
            rows={4}
            autoFocus
          />
          {importFeedback && (
            <p className={`cm-import-feedback ${importFeedback.ok ? 'cm-import-feedback--ok' : 'cm-import-feedback--err'}`}>
              {importFeedback.message}
            </p>
          )}
          <button
            className="cm-btn cm-btn--add"
            onClick={handleImport}
            disabled={!importText.trim()}
          >
            Import
          </button>
        </div>
      )}

      <div className="cm-items">
        {items.length === 0 && <p className="cm-empty">No content yet.</p>}
        {items.map(item => (
          editingId === item.id
            ? <EditableItem
                key={item.id}
                wordId={wordId}
                laneId={lane.id}
                lane={lane}
                item={item}
                onDone={handleEditDone}
              />
            : <ItemDisplay
                key={item.id}
                item={item}
                lane={lane}
                onEdit={() => setEditingId(item.id)}
                onRemove={() => handleRemove(item.id)}
              />
        ))}
      </div>

      <div className="cm-add">
        <div className="cm-add-fields">
          <textarea
            className="cm-add-input"
            value={addText}
            onChange={e => setAddText(e.target.value)}
            placeholder={isProductive(lane) ? 'Prompt text...' : 'Sentence text...'}
            rows={2}
          />
          {isAudio(lane) && (
            <input
              className="cm-add-input cm-add-input--url"
              value={addAudioUrl}
              onChange={e => setAddAudioUrl(e.target.value)}
              placeholder="Audio URL (optional — e.g. /audio/want-1.mp3)"
            />
          )}
        </div>
        <div className="cm-item-level">
          <label className="cm-level-label">Level</label>
          <input
            type="number"
            className="cm-level-input"
            value={addLevel}
            min={1}
            onChange={e => setAddLevel(Number(e.target.value))}
          />
        </div>
        <button
          className="cm-btn cm-btn--add"
          onClick={handleAdd}
          disabled={!addText.trim()}
        >
          Add
        </button>
      </div>
    </div>
  )
}

function PronunciationSection({ wordId }) {
  const [url, setUrl] = useState(() => getPronunciation(wordId) ?? '')
  const [saved, setSaved] = useState(false)

  function handleSave() {
    setPronunciation(wordId, url)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="cm-pronunciation">
      <span className="cm-pronunciation-label">Pronunciation audio</span>
      <div className="cm-pronunciation-row">
        <input
          className="cm-item-input cm-item-input--url"
          value={url}
          onChange={e => { setUrl(e.target.value); setSaved(false) }}
          placeholder="Audio URL (e.g. /audio/want-pronunciation.mp3)"
        />
        {url && (
          <audio controls src={url} className="cm-audio-player" />
        )}
        <button className="cm-btn cm-btn--save" onClick={handleSave}>
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>
    </div>
  )
}

export default function ContentManager({ onClose }) {
  const [selectedWord, setSelectedWord] = useState(words[0].id)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [search, setSearch] = useState('')
  const word = words.find(w => w.id === selectedWord)

  const categoryCounts = words.reduce((acc, w) => {
    const group = getGrammaticalGroup(w.classifications.grammaticalCategory)
    acc[group] = (acc[group] ?? 0) + 1
    return acc
  }, {})

  const categories = ['all', ...GRAMMATICAL_GROUPS.filter(g => categoryCounts[g.label]).map(g => g.label)]

  const visibleWords = words.filter(w => {
    const matchesCategory = categoryFilter === 'all' || getGrammaticalGroup(w.classifications.grammaticalCategory) === categoryFilter
    const matchesSearch = w.baseForm.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  function handleCategoryFilter(cat) {
    setCategoryFilter(cat)
    setSearch('')
    const stillVisible = cat === 'all' || getGrammaticalGroup(words.find(w => w.id === selectedWord)?.classifications.grammaticalCategory) === cat
    if (!stillVisible) {
      const first = words.find(w => getGrammaticalGroup(w.classifications.grammaticalCategory) === cat)
      if (first) setSelectedWord(first.id)
    }
  }

  return (
    <div className="cm">
      <div className="cm-header">
        <p className="cm-heading">Content Manager</p>
        <button className="cm-close" onClick={onClose}>✕ Close</button>
      </div>

      <div className="cm-category-filters">
        {categories.map(cat => (
          <button
            key={cat}
            className={`cm-category-btn ${categoryFilter === cat ? 'cm-category-btn--active' : ''}`}
            onClick={() => handleCategoryFilter(cat)}
          >
            {cat === 'all' ? `all (${words.length})` : `${cat} (${categoryCounts[cat]})`}
          </button>
        ))}
      </div>

      <div className="cm-search-row">
        <input
          className="cm-search"
          type="text"
          placeholder="Search words..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="cm-word-tabs">
        {visibleWords.length === 0
          ? <span className="cm-tabs-empty">No words match.</span>
          : visibleWords.map(w => (
          <button
            key={w.id}
            className={`cm-word-tab ${w.id === selectedWord ? 'cm-word-tab--active' : ''}`}
            onClick={() => setSelectedWord(w.id)}
          >
            {w.baseForm}
          </button>
        ))}
      </div>

      <div className="cm-body">
        <div className="cm-word-meta">
          <span className="cm-word-title">{word.baseForm}</span>
          <span className="cm-word-category">{word.classifications.grammaticalCategory}</span>
        </div>

        <PronunciationSection key={selectedWord} wordId={selectedWord} />

        <div className="cm-lanes">
          {LANES.map(lane => (
            <LaneSection key={lane.id} wordId={selectedWord} lane={lane} />
          ))}
        </div>
      </div>
    </div>
  )
}
