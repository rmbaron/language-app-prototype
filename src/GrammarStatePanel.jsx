import { useState } from 'react'
import { getActiveLanguage } from './learnerProfile'
import { getWordBank, addToWordBank, removeFromWordBank } from './userStore'
import { unlockAtom, lockAtom, lockAtoms } from './atomUnlockStore'
import { findWordInIndex } from './atomIndex'
import { ATOMS } from './grammarAtoms.en'
import { getAtomPioneers } from './atomPioneers'
import { getGrammarClusters } from './grammarClustering'
import { getLearnerGrammarState } from './learnerGrammarState'
import { getBankedWords } from './wordRegistry'

const FORM_WAVES = [
  {
    id:      'base_form',
    label:   'Base form',
    example: 'want, eat, run',
    trigger: 'always',
    check:   () => true,
  },
  {
    id:      'third_person_present',
    label:   '3rd person present',
    example: 'wants, eats, runs',
    trigger: 'personal_pronoun unlocked',
    check:   (activeAtoms) => activeAtoms.includes('personal_pronoun'),
  },
  {
    id:      'copula_agreement',
    label:   'Copula agreement',
    example: 'am, is, are',
    trigger: 'copula unlocked',
    check:   (activeAtoms) => activeAtoms.includes('copula'),
  },
  {
    id:      'contracted_negative',
    label:   'Contracted negatives',
    example: "don't, doesn't, can't",
    trigger: 'auxiliary + negation unlocked',
    check:   (activeAtoms) => activeAtoms.includes('auxiliary') && activeAtoms.includes('negation_marker'),
  },
  {
    id:      'present_participle',
    label:   'Present participle (-ing)',
    example: 'wanting, eating, running',
    trigger: 'progressive_auxiliary unlocked',
    check:   (activeAtoms) => activeAtoms.includes('progressive_auxiliary'),
  },
  {
    id:      'past_participle',
    label:   'Past participle',
    example: 'wanted, eaten, run',
    trigger: 'perfect_auxiliary (A2)',
    check:   (activeAtoms) => activeAtoms.includes('perfect_auxiliary'),
  },
]

export default function GrammarStatePanel() {
  const [, forceUpdate] = useState(0)
  const refresh = () => forceUpdate(n => n + 1)

  const lang         = getActiveLanguage()
  const pioneers     = getAtomPioneers(lang)
  const clusters     = getGrammarClusters(lang)
  const grammarState = getLearnerGrammarState(lang)
  const unlocked     = new Set(grammarState.activeAtoms)
  const bankWords    = getBankedWords(getWordBank(), lang)

  function handleAtomClick(atomId) {
    const wordId = pioneers[atomId]
    if (!wordId) return
    if (findWordInIndex(wordId, lang)?.atomId !== atomId) return
    addToWordBank(wordId)
    unlockAtom(atomId, wordId)
    refresh()
  }

  function handleAtomLock(atomId) {
    const wordId = pioneers[atomId]
    lockAtom(atomId)
    if (wordId) removeFromWordBank(wordId)
    refresh()
  }

  function handleRewind(clusterId) {
    const toLock = clusters.filter(c => c.id >= clusterId).flatMap(c => c.atoms)
    lockAtoms(toLock)
    refresh()
  }

  return (
    <div className="profile-state">
      <div className="profile-state-meta">
        <span className="profile-state-label">Grammar state</span>
        <span className="profile-state-atoms-count">Cluster {grammarState.currentCluster}</span>
        <span className="profile-state-atoms-count">{unlocked.size} / {clusters.reduce((n, c) => n + c.atoms.length, 0)} atoms</span>
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
                  onClick={() => handleRewind(cluster.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, color: '#444', padding: '0 4px' }}
                  title={`Rewind to start of Cluster ${cluster.id}`}
                >↩</button>
              )}
            </div>
            <div className="profile-atom-grid">
              {cluster.atoms.map(atomId => {
                const atom          = ATOMS.find(a => a.id === atomId)
                if (!atom) return null
                const isUnlocked    = unlocked.has(atomId)
                const pioneerWordId = pioneers[atomId]
                const canUnlock     = !isUnlocked && pioneerWordId && findWordInIndex(pioneerWordId, lang)?.atomId === atomId
                return (
                  <div
                    key={atomId}
                    className={`profile-atom${isUnlocked ? ' profile-atom--unlocked' : ''}${canUnlock ? ' profile-atom--available' : ''}`}
                    title={isUnlocked ? `Click to lock "${pioneerWordId}"` : canUnlock ? `Click to unlock via "${pioneerWordId}"` : atom.description}
                    onClick={isUnlocked ? () => handleAtomLock(atomId) : canUnlock ? () => handleAtomClick(atomId) : undefined}
                  >
                    {atom.label}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
      <details style={{ marginTop: 12 }}>
        <summary style={{ fontSize: 11, color: '#555', cursor: 'pointer' }}>Form waves</summary>
        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {FORM_WAVES.map(wave => {
            const active = wave.check(grammarState.activeAtoms, bankWords, lang)
            return (
              <div key={wave.id} style={{ display: 'flex', alignItems: 'baseline', gap: 6, fontSize: 11 }}>
                <span style={{ color: active ? '#8f8' : '#444', flexShrink: 0 }}>{active ? '●' : '○'}</span>
                <span style={{ color: active ? '#ccc' : '#555' }}>{wave.label}</span>
                {active
                  ? <span style={{ color: '#666', fontStyle: 'italic' }}>{wave.example}</span>
                  : <span style={{ color: '#333', marginLeft: 'auto' }}>{wave.trigger}</span>
                }
              </div>
            )
          })}
        </div>
      </details>
    </div>
  )
}
