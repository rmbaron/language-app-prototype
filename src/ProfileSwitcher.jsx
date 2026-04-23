import { useState } from 'react'
import {
  listProfiles, createProfile, activateProfile, deactivate,
  deleteProfile, saveActiveProfileSnapshot,
  getActiveProfileId, getActiveProfileName, getActiveProfileCefrLevel,
} from './profileStore'
import {
  getInterfaceLanguage,
  getActiveLanguage,
} from './learnerProfile'
import { getStrings } from './uiStrings'
import { getWordBank, addToWordBank, removeFromWordBank } from './userStore'
import { unlockAtom, lockAtom, lockAtoms } from './atomUnlockStore'
import { findWordInIndex } from './atomIndex'
import { ATOMS } from './grammarAtoms.en'
import { getAtomPioneers } from './atomPioneers'
import { getGrammarClusters } from './grammarClustering'
import { getLearnerGrammarState } from './learnerGrammarState'
import { WORD_SEED } from './wordSeed.en'
import { CONSTRUCTOR_TIERS, CONSTRUCTOR_BANDS } from './constructorTiers.en.js'

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

function AtomRow({ atomId, pioneers, unlockedAtoms }) {
  const atom      = ATOMS.find(a => a.id === atomId)
  const pioneerId = pioneers[atomId]
  const pioneer   = pioneerId ? (WORD_SEED.find(w => w.id === pioneerId)?.baseForm ?? pioneerId) : null
  const unlocked  = unlockedAtoms.has(atomId)
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', padding: '2px 0' }}>
      <span style={{ fontSize: 8, color: unlocked ? '#5fcf5f' : '#333' }}>●</span>
      <span style={{ color: unlocked ? '#bbb' : '#555', width: 190, fontSize: 12 }}>{atom?.label ?? atomId}</span>
      <span style={{ color: unlocked ? '#eee' : '#666', fontWeight: unlocked ? 600 : 400, fontSize: 13 }}>
        {pioneer ?? <span style={{ color: '#333', fontStyle: 'italic' }}>unset</span>}
      </span>
    </div>
  )
}

function GrammarMap({ clusters, pioneers, unlockedAtoms }) {
  return (
    <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
      {clusters.map(cluster => {
        const tiers        = CONSTRUCTOR_TIERS.filter(t => t.band === cluster.id)
        const tieredAtoms  = new Set(tiers.flatMap(t => t.atoms))
        const untiredAtoms = cluster.atoms.filter(id => !tieredAtoms.has(id))
        return (
          <div key={cluster.id} style={{ marginBottom: 28 }}>
            <div style={{ color: '#8f8', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, paddingBottom: 4, borderBottom: '1px solid #222' }}>
              C{cluster.id} — {cluster.label}
            </div>
            {tiers.map(tier => (
              <div key={tier.id} style={{ marginBottom: 10 }}>
                <div style={{ color: '#446', fontSize: 11, marginBottom: 4, paddingLeft: 4 }}>{tier.label}</div>
                <div style={{ paddingLeft: 16 }}>
                  {tier.atoms.length === 0
                    ? <span style={{ color: '#333', fontSize: 11, fontStyle: 'italic' }}>structure only — no new atoms</span>
                    : tier.atoms.map(atomId => (
                        <AtomRow key={atomId} atomId={atomId} pioneers={pioneers} unlockedAtoms={unlockedAtoms} />
                      ))
                  }
                </div>
              </div>
            ))}
            {untiredAtoms.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ color: '#333', fontSize: 11, marginBottom: 4, paddingLeft: 4 }}>pioneer only</div>
                <div style={{ paddingLeft: 16 }}>
                  {untiredAtoms.map(atomId => (
                    <AtomRow key={atomId} atomId={atomId} pioneers={pioneers} unlockedAtoms={unlockedAtoms} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function ProfileSwitcher({ onBack }) {
  const s = getStrings(getInterfaceLanguage())
  const ps = s.profiles

  const [profiles, setProfiles]   = useState(listProfiles)
  const [saving, setSaving]       = useState(false)
  const [newName, setNewName]     = useState('')
  const [newCefr, setNewCefr]     = useState('A1')
  const [tab, setTab]             = useState('profiles')

  const activeId    = getActiveProfileId()
  const activeName  = getActiveProfileName()
  const cefrLevel   = getActiveProfileCefrLevel()

  const [, forceUpdate] = useState(0)

  const lang          = getActiveLanguage()
  const pioneers      = getAtomPioneers(lang)
  const clusters      = getGrammarClusters(lang)
  const grammarState  = getLearnerGrammarState(lang)
  const unlockedAtoms = new Set(grammarState.activeAtoms)

  function handleAtomClick(atomId) {
    const wordId = pioneers[atomId]
    if (!wordId) return
    if (findWordInIndex(wordId, lang)?.atomId !== atomId) return
    addToWordBank(wordId)
    unlockAtom(atomId, wordId)
    forceUpdate(n => n + 1)
  }

  function handleRewindToCluster(clusterId) {
    const atomsToLock = clusters
      .filter(c => c.id >= clusterId)
      .flatMap(c => c.atoms)
    lockAtoms(atomsToLock)
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

  if (tab === 'map') {
    return (
      <div className="profile-switcher">
        <button className="profile-back" onClick={onBack}>{s.common.back}</button>
        <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1px solid #222' }}>
          <button onClick={() => setTab('profiles')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px 16px', fontSize: 13, color: '#555' }}>Profiles</button>
          <button style={{ background: 'none', border: 'none', padding: '8px 16px', fontSize: 13, color: '#ccc', borderBottom: '2px solid #ccc' }}>Grammar Map</button>
        </div>
        <GrammarMap clusters={clusters} pioneers={pioneers} unlockedAtoms={unlockedAtoms} />
      </div>
    )
  }

  return (
    <div className="profile-switcher">
      <button className="profile-back" onClick={onBack}>{s.common.back}</button>
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1px solid #222' }}>
        <button style={{ background: 'none', border: 'none', padding: '8px 16px', fontSize: 13, color: '#ccc', borderBottom: '2px solid #ccc' }}>Profiles</button>
        <button onClick={() => setTab('map')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px 16px', fontSize: 13, color: '#555' }}>Grammar Map</button>
      </div>

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
          <span className="profile-state-atoms-count">Cluster {grammarState.currentCluster}</span>
          <span className="profile-state-atoms-count">{unlockedAtoms.size} / {clusters.reduce((n, c) => n + c.atoms.length, 0)} atoms</span>
        </div>

        {clusters.map(cluster => {
          const cState    = grammarState.clusters[cluster.id]
          const complete  = cState?.complete ?? false
          const isCurrent = cluster.id === grammarState.currentCluster
          return (
            <div key={cluster.id} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: isCurrent ? '#8f8' : complete ? '#7a8' : '#444', fontFamily: 'monospace', textDecoration: isCurrent ? 'underline' : 'none' }}>
                  C{cluster.id} — {cluster.label}
                </span>
                {complete && <span style={{ fontSize: 10, color: isCurrent ? '#8f8' : '#7a8' }}>✓</span>}
                {complete && (
                  <button
                    onClick={() => handleRewindToCluster(cluster.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, color: '#444', padding: '0 4px' }}
                    title={`Rewind to start of Cluster ${cluster.id}`}
                  >↩</button>
                )}
              </div>
              <div className="profile-atom-grid">
                {cluster.atoms.map(atomId => {
                  const atom          = ATOMS.find(a => a.id === atomId)
                  if (!atom) return null
                  const unlocked      = unlockedAtoms.has(atomId)
                  const pioneerWordId = pioneers[atomId]
                  const canUnlock     = !unlocked && pioneerWordId && findWordInIndex(pioneerWordId, lang)?.atomId === atomId
                  return (
                    <div
                      key={atomId}
                      className={`profile-atom${unlocked ? ' profile-atom--unlocked' : ''}${canUnlock ? ' profile-atom--available' : ''}`}
                      title={unlocked ? `Click to lock "${pioneerWordId}" and remove from bank` : canUnlock ? `Click to unlock via "${pioneerWordId}"` : atom.description}
                      onClick={unlocked ? () => { lockAtom(atomId); if (pioneerWordId) removeFromWordBank(pioneerWordId); forceUpdate(n => n + 1) } : canUnlock ? () => handleAtomClick(atomId) : undefined}
                    >
                      {atom.label}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
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
