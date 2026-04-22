import { useState } from 'react'
import {
  listProfiles, createProfile, activateProfile, deactivate,
  deleteProfile, saveActiveProfileSnapshot,
  getActiveProfileId, getActiveProfileName, getActiveProfileCefrLevel,
} from './profileStore'
import { getInterfaceLanguage } from './learnerProfile'
import { getStrings } from './uiStrings'
import { getWordBank, addToWordBank } from './userStore'
import { getLayerTwo } from './wordLayerTwo'
import { ATOMS } from './grammarAtoms.en'

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

const ATOM_CANONICAL_WORD = {
  personal_pronoun:     'i',
  noun:                 'food',
  lexical_verb:         'want',
  copula:               'be',
  auxiliary:            'do',
  modal_auxiliary:      'can',
  adjective:            'good',
  determiner:           'a',
  numeral:              'one',
  demonstrative:        'this',
  possessive_determiner:'my',
  preposition:          'in',
  interrogative:        'what',
  negation_marker:      'not',
  conjunction:          'and',
  adverb:               'here',
  interjection:         'hello',
}

export default function ProfileSwitcher({ onBack }) {
  const s = getStrings(getInterfaceLanguage())
  const ps = s.profiles

  const [profiles, setProfiles]   = useState(listProfiles)
  const [saving, setSaving]       = useState(false)
  const [newName, setNewName]     = useState('')
  const [newCefr, setNewCefr]     = useState('A1')

  const activeId    = getActiveProfileId()
  const activeName  = getActiveProfileName()
  const cefrLevel   = getActiveProfileCefrLevel()

  const [, forceUpdate] = useState(0)

  const unlockedAtoms = new Set(
    getWordBank()
      .map(id => getLayerTwo(id, 'en')?.grammaticalAtom)
      .filter(Boolean)
  )

  function handleAtomClick(atomId) {
    const wordId = ATOM_CANONICAL_WORD[atomId]
    if (!wordId) return
    const l2 = getLayerTwo(wordId, 'en')
    if (!l2 || l2.grammaticalAtom !== atomId) return
    addToWordBank(wordId)
    forceUpdate(n => n + 1)
  }

  function handleSave() {
    if (!newName.trim()) return
    const id = createProfile(newName.trim(), newCefr)
    activateProfile(id)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter')  handleSave()
    if (e.key === 'Escape') { setSaving(false); setNewName('') }
  }

  function handleDelete(id) {
    deleteProfile(id)
    setProfiles(listProfiles())
  }

  return (
    <div className="profile-switcher">
      <button className="profile-back" onClick={onBack}>{s.common.back}</button>

      <div className="profile-switcher-header">
        <h2 className="profile-switcher-title">{ps.title}</h2>
        <div className={`profile-switcher-status${activeId ? ' profile-switcher-status--active' : ''}`}>
          {activeId ? ps.viewingAs(activeName) : ps.defaultLabel}
        </div>
        {activeId && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="profile-switcher-btn profile-switcher-btn--save"
              style={{ fontSize: '0.8rem', padding: '6px 14px' }}
              onClick={() => { saveActiveProfileSnapshot(); forceUpdate(n => n + 1) }}
            >
              {ps.saveStateBtn}
            </button>
            <button className="profile-switcher-return" onClick={deactivate}>
              {ps.returnToDefault}
            </button>
          </div>
        )}
      </div>

      <div className="profile-state">
        <div className="profile-state-meta">
          <span className="profile-state-label">Current state</span>
          {cefrLevel && <span className="profile-state-cefr">{cefrLevel}</span>}
          <span className="profile-state-atoms-count">{unlockedAtoms.size} / {ATOMS.length} atoms</span>
        </div>
        <div className="profile-atom-grid">
          {ATOMS.map(atom => {
            const unlocked = unlockedAtoms.has(atom.id)
            const canonicalId = ATOM_CANONICAL_WORD[atom.id]
            const canUnlock = !unlocked && canonicalId && getLayerTwo(canonicalId, 'en')?.grammaticalAtom === atom.id
            return (
              <div
                key={atom.id}
                className={`profile-atom${unlocked ? ' profile-atom--unlocked' : ''}${canUnlock ? ' profile-atom--available' : ''}`}
                title={unlocked ? atom.description : canUnlock ? `Click to unlock via "${canonicalId}"` : atom.description}
                onClick={canUnlock ? () => handleAtomClick(atom.id) : undefined}
              >
                {atom.label}
              </div>
            )
          })}
        </div>
      </div>

      <div className="profile-switcher-save-area">
        {saving ? (
          <div className="profile-switcher-save-form">
            <input
              className="profile-switcher-name-input"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder={ps.namePlaceholder}
              autoFocus
              onKeyDown={handleKeyDown}
            />
            <div className="profile-switcher-cefr-row">
              <span className="profile-switcher-cefr-label">{ps.cefrLabel}</span>
              <select
                className="profile-switcher-cefr-select"
                value={newCefr}
                onChange={e => setNewCefr(e.target.value)}
              >
                {CEFR_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="profile-switcher-save-actions">
              <button
                className="profile-switcher-btn profile-switcher-btn--save"
                onClick={handleSave}
                disabled={!newName.trim()}
              >
                {ps.saveBtn}
              </button>
              <button
                className="profile-switcher-btn profile-switcher-btn--cancel"
                onClick={() => { setSaving(false); setNewName('') }}
              >
                {ps.cancelBtn}
              </button>
            </div>
          </div>
        ) : (
          <button
            className="profile-switcher-btn profile-switcher-btn--new"
            onClick={() => setSaving(true)}
          >
            {ps.saveCurrentBtn}
          </button>
        )}
      </div>

      <div className="profile-switcher-list">
        {profiles.length === 0 && (
          <p className="profile-switcher-empty">{ps.empty}</p>
        )}
        {profiles.map(p => (
          <div
            key={p.id}
            className={`profile-switcher-row${activeId === p.id ? ' profile-switcher-row--active' : ''}`}
          >
            <div className="profile-switcher-row-info">
              <span className="profile-switcher-row-name">{p.name}</span>
              <span className="profile-switcher-row-meta">
                {p.cefrLevel} · {ps.words(p.wordCount)} · {new Date(p.savedAt).toLocaleDateString()}
              </span>
            </div>
            <div className="profile-switcher-row-actions">
              {activeId !== p.id && (
                <button
                  className="profile-switcher-btn profile-switcher-btn--load"
                  onClick={() => activateProfile(p.id)}
                >
                  {ps.loadBtn}
                </button>
              )}
              <button
                className="profile-switcher-btn profile-switcher-btn--delete"
                onClick={() => handleDelete(p.id)}
              >
                {ps.deleteBtn}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
