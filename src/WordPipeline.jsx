import { useState } from 'react'
import { WORD_SEED } from './wordSeed.en'
import { hasLayerOne, getLayerOne } from './wordLayerOne'
import { hasLayerTwo, getLayerTwo, hasRealLayerTwo, resetContentReady, markContentReady } from './wordLayerTwo'
import { runLayerOneBatch, enrichWord } from './wordEnrichment'
import { runLayerTwoBatch, enrichWordL2, forceReEnrichAllL2, getReEnrichCampaign, setReEnrichCampaign, clearReEnrichCampaign } from './wordEnrichmentTwo'
import { clearWordContent } from './contentStore'
import { getAtomIndex, getAtomIndexRebuiltAt, rebuildAtomIndex, findWordInIndex } from './atomIndex'

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']


function wordLayerStatuses(word) {
  const l1data = getLayerOne(word.id, 'en')
  const l2data = getLayerTwo(word.id, 'en')
  return {
    level: l2data?.cefrLevel ?? 'Unleveled',
    l1: !hasLayerOne(word.id, 'en') ? 'none' : l1data?.source === 'api' ? 'api' : 'pre',
    l2: !hasLayerTwo(word.id, 'en') ? 'none' : hasRealLayerTwo(word.id, 'en') ? 'api' : 'mock',
    l3: l2data?.contentReady ? 'ready' : 'none',
  }
}

const CHIP_STYLE = {
  api:   { background: '#1a3a1a', color: '#6fcf6f', border: '1px solid #3a6a3a' },
  pre:   { background: '#1a2a3a', color: '#6fa8cf', border: '1px solid #2a4a6a' },
  mock:  { background: '#2a2a1a', color: '#cfb96f', border: '1px solid #5a4a1a' },
  ready: { background: '#1a3a1a', color: '#6fcf6f', border: '1px solid #3a6a3a' },
  none:  { background: '#111', color: '#444', border: '1px solid #222' },
}

function Badge({ label, status }) {
  return (
    <span style={{
      padding: '1px 7px',
      borderRadius: 3,
      fontSize: 11,
      fontFamily: 'monospace',
      whiteSpace: 'nowrap',
      ...CHIP_STYLE[status],
    }}>
      {label}
    </span>
  )
}

function LevelGroup({ level, words, onEnrich, onClearL2, onClearL3 }) {
  const [open, setOpen] = useState(level !== 'Unleveled')
  const [expanded, setExpanded] = useState(null)

  return (
    <div style={{ marginBottom: 12 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '4px 0', width: '100%', textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 12, color: '#555' }}>{open ? '▼' : '▶'}</span>
        <span style={{ fontWeight: 600, fontSize: 13, color: '#aaa' }}>{level}</span>
        <span style={{ fontSize: 12, color: '#555' }}>{words.length} words</span>
      </button>

      {open && (
        <div style={{ marginTop: 4 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '140px 60px 60px 60px 60px',
            gap: '2px 8px',
            fontSize: 11,
            color: '#444',
            padding: '2px 0 4px 20px',
          }}>
            <span>word</span><span>L1</span><span>L2</span><span>L3</span><span></span>
          </div>
          {words.map(({ word, s }) => {
            const indexed = findWordInIndex(word.id, 'en')
            return (
            <div key={word.id}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '140px 60px 60px 60px 60px',
              gap: '2px 8px',
              alignItems: 'center',
              padding: '2px 0 2px 20px',
            }}>
              <span
                style={{ fontFamily: 'monospace', fontSize: 13, color: '#ccc', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                onClick={() => setExpanded(expanded === word.id ? null : word.id)}
              >
                {word.baseForm}
                {indexed
                  ? <span title={`indexed: ${indexed.atomId} / ${indexed.cefrLevel}`} style={{ width: 6, height: 6, borderRadius: '50%', background: '#5fcf5f', flexShrink: 0 }} />
                  : <span title="not in atom index" style={{ width: 6, height: 6, borderRadius: '50%', background: '#333', flexShrink: 0 }} />
                }
              </span>
              <Badge label={s.l1 === 'none' ? '—' : s.l1} status={s.l1} />
              <Badge label={s.l2 === 'none' ? '—' : s.l2} status={s.l2} />
              <Badge label={s.l3 === 'none' ? '—' : 'ready'} status={s.l3} />
              <div style={{ display: 'flex', gap: 4 }}>
                {s.l1 !== 'api' && (
                  <button className="dev-toggle" style={{ padding: '1px 6px', fontSize: 11 }}
                    onClick={() => onEnrich(word.id, 'l1')}>L1</button>
                )}
                {s.l1 === 'api' && s.l2 !== 'api' && (
                  <button className="dev-toggle" style={{ padding: '1px 6px', fontSize: 11 }}
                    onClick={() => onEnrich(word.id, 'l2')}>L2</button>
                )}
                {s.l2 === 'api' && s.l3 === 'none' && (
                  <button className="dev-toggle" style={{ padding: '1px 6px', fontSize: 11 }}
                    onClick={() => onEnrich(word.id, 'l3')}>L3</button>
                )}
                {s.l2 === 'api' && (
                  <button className="dev-toggle" style={{ padding: '1px 6px', fontSize: 11, color: '#cf6f6f' }}
                    onClick={() => onClearL2(word.id)}>↺L2</button>
                )}
                {s.l3 === 'ready' && (
                  <button className="dev-toggle" style={{ padding: '1px 6px', fontSize: 11, color: '#cf6f6f' }}
                    onClick={() => onClearL3(word.id)}>↺L3</button>
                )}
              </div>
            </div>
            {expanded === word.id && (() => {
              const l2 = getLayerTwo(word.id, 'en')
              const l1 = getLayerOne(word.id, 'en')
              return (
                <div style={{
                  margin: '2px 0 4px 20px', padding: '8px 10px', borderRadius: 4,
                  background: '#0d0d0d', border: '1px solid #222', fontSize: 11,
                  fontFamily: 'monospace', color: '#888', lineHeight: 1.6,
                }}>
                  {l1 && <div><span style={{ color: '#555' }}>cat:</span> {l1.grammaticalCategory} · <span style={{ color: '#555' }}>meaning:</span> {l1.meaning}</div>}
                  {l2 && <>
                    <div><span style={{ color: '#555' }}>atom:</span> {l2.grammaticalAtom} · <span style={{ color: '#555' }}>level:</span> {l2.cefrLevel} {l2.subLevel} · <span style={{ color: '#555' }}>freq:</span> {l2.frequency}</div>
                    <div style={{ color: '#3a5a3a' }}>
                      <span style={{ color: '#555' }}>enriched:</span> {l2.enrichedAt ? new Date(l2.enrichedAt).toLocaleString() : '—'}
                      {l2.enrichmentNote && <span style={{ marginLeft: 8, color: '#3a6a5a' }}>"{l2.enrichmentNote}"</span>}
                    </div>
                    {l2.alternateAtoms?.length > 0 && <div><span style={{ color: '#555' }}>alt atoms:</span> {l2.alternateAtoms.map(a => `${a.atom} (${a.when})`).join(' · ')}</div>}
                    {l2.forms?.length > 0 && (
                      <div style={{ marginTop: 4 }}>
                        <span style={{ color: '#555' }}>forms:</span>
                        {l2.forms.map((f, i) => (
                          <div key={i} style={{ paddingLeft: 12, lineHeight: 1.8 }}>
                            <span style={{ color: '#ccc', minWidth: 120, display: 'inline-block' }}>{f.form}</span>
                            <span style={{ color: '#444', minWidth: 180, display: 'inline-block' }}>{f.type}</span>
                            {f.tenses?.length > 0
                              ? <span style={{ color: '#7a9a7a' }}>{f.tenses.join(' · ')}</span>
                              : <span style={{ color: '#333' }}>—</span>
                            }
                          </div>
                        ))}
                      </div>
                    )}
                    {!l2.forms?.length && <div><span style={{ color: '#555' }}>forms:</span> —</div>}
                  </>}
                  {!l1 && !l2 && <div style={{ color: '#444' }}>no data</div>}
                </div>
              )
            })()}
            </div>
          )})}
        </div>
      )}
    </div>
  )
}

export default function WordPipeline({ onClose }) {
  const [running, setRunning]           = useState(null)
  const [batchReport, setBatchReport]   = useState(null)
  const [batchSize, setBatchSize]       = useState(10)
  const [reEnrichProgress, setReEnrichProgress] = useState(null)
  const [campaign, setCampaign] = useState(() => getReEnrichCampaign())
  const [campaignNote, setCampaignNote] = useState(() => getReEnrichCampaign()?.note ?? '')
  const [search, setSearch]           = useState('')
  const [newWord, setNewWord]         = useState('')
  const [addError, setAddError]       = useState(null)
  const [, forceUpdate]               = useState(0)

  async function handleAddWord() {
    const trimmed = newWord.trim()
    if (!trimmed) return
    setAddError(null)
    try {
      const res = await fetch('/__add-seed-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseForm: trimmed, language: 'en' }),
      })
      const data = await res.json()
      if (data.error) { setAddError(data.error); return }
      setNewWord('')
      forceUpdate(n => n + 1)
    } catch {
      setAddError('Failed to add word')
    }
  }

  async function runBatch(layer) {
    setRunning(layer)
    setBatchReport(null)

    const beforeIds = layer === 'l1'
      ? WORD_SEED.filter(w => { const d = getLayerOne(w.id, 'en'); return !d || d.source !== 'api' }).map(w => w.id)
      : WORD_SEED.filter(w => hasLayerOne(w.id, 'en') && !hasRealLayerTwo(w.id, 'en')).map(w => w.id)

    try {
      if (layer === 'l1') await runLayerOneBatch('en', batchSize)
      if (layer === 'l2') await runLayerTwoBatch('en', batchSize)
      if (layer === 'l3') {
        const eligible = WORD_SEED.filter(w => {
          const s = wordLayerStatuses(w)
          return s.l2 === 'api' && s.l3 === 'none'
        })
        for (const word of eligible) {
          markContentReady(word.id, 'en')
        }
      }
    } finally {
      setRunning(null)
      forceUpdate(n => n + 1)

      if (layer !== 'l3') {
        const isNowDone = id => layer === 'l1'
          ? getLayerOne(id, 'en')?.source === 'api'
          : hasRealLayerTwo(id, 'en')
        const attempted  = beforeIds.slice(0, batchSize)
        const notAttempted = beforeIds.slice(batchSize)
        const enriched = attempted.filter(isNowDone)
          .map(id => WORD_SEED.find(w => w.id === id)?.baseForm).filter(Boolean)
        const failed = attempted.filter(id => !isNowDone(id))
          .map(id => WORD_SEED.find(w => w.id === id)?.baseForm).filter(Boolean)
        const remaining = notAttempted
          .map(id => WORD_SEED.find(w => w.id === id)?.baseForm).filter(Boolean)
        setBatchReport({ layer: layer.toUpperCase(), enriched, failed, remaining })
      }
    }
  }

  async function handleEnrich(wordId, layer) {
    setRunning(wordId + layer)
    try {
      if (layer === 'l1') await enrichWord(wordId, 'en')
      if (layer === 'l2') await enrichWordL2(wordId, 'en')
      if (layer === 'l3') {
        markContentReady(wordId, 'en')
      }
    } finally {
      setRunning(null)
      forceUpdate(n => n + 1)
    }
  }

  function handleClearL2(wordId) {
    clearLayerTwo(wordId, 'en')
    forceUpdate(n => n + 1)
  }

  function handleClearL3(wordId) {
    clearWordContent(wordId)
    resetContentReady(wordId, 'en')
    forceUpdate(n => n + 1)
  }

  const query = search.trim().toLowerCase()
  const filtered = WORD_SEED.filter(w =>
    !query || w.baseForm.toLowerCase().includes(query) || w.id.includes(query)
  )

  // Group by level
  const groups = {}
  for (const word of filtered) {
    const s = wordLayerStatuses(word)
    const lvl = s.level
    if (!groups[lvl]) groups[lvl] = []
    groups[lvl].push({ word, s })
  }

  // Unleveled words are A1 candidates not yet enriched — nest them under A1
  if (groups['Unleveled']?.length) {
    groups['A1'] = [...(groups['A1'] ?? []), ...groups['Unleveled']]
  }

  const orderedGroups = LEVEL_ORDER
    .filter(lvl => groups[lvl]?.length)
    .map(lvl => ({ level: lvl, words: groups[lvl].sort((a, b) => a.word.baseForm.localeCompare(b.word.baseForm)) }))

  return (
    <div style={{ padding: '20px 24px', maxWidth: 600, margin: '0 auto' }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <button className="dev-toggle" onClick={onClose}>← Back</button>
        <span style={{ fontWeight: 600, fontSize: 15, color: '#ccc' }}>Word Pipeline</span>
        <span style={{ fontSize: 12, color: '#555', marginLeft: 'auto' }}>
          {filtered.length} / {WORD_SEED.length} words
        </span>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
        <input
          type="text"
          value={newWord}
          onChange={e => setNewWord(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAddWord()}
          placeholder="Add word to seed…"
          style={{
            flex: 1, padding: '5px 10px', borderRadius: 4,
            background: '#1a1a1a', border: '1px solid #333',
            color: '#ccc', fontSize: 13, fontFamily: 'monospace',
          }}
        />
        <button className="dev-toggle" onClick={handleAddWord} disabled={!newWord.trim()}>
          Add
        </button>
      </div>
      {addError && (
        <p style={{ fontSize: 11, color: '#cf6f6f', margin: '0 0 8px' }}>{addError}</p>
      )}

      {(() => {
        const pendingL1 = WORD_SEED.filter(w => { const d = getLayerOne(w.id, 'en'); return !d || d.source !== 'api' }).length
        const pendingL2 = WORD_SEED.filter(w => hasLayerOne(w.id, 'en') && !hasRealLayerTwo(w.id, 'en')).length
        return (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search words…"
                style={{
                  flex: 1, padding: '5px 10px', borderRadius: 4,
                  background: '#1a1a1a', border: '1px solid #333',
                  color: '#ccc', fontSize: 13, fontFamily: 'monospace',
                }}
              />
              <button className="dev-toggle" onClick={() => runBatch('l3')} disabled={!!running}>
                {running === 'l3' ? 'Running…' : 'Run L3'}
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="range" min={1} max={150} value={batchSize}
                onChange={e => setBatchSize(Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: 12, color: '#666', minWidth: 24, textAlign: 'right' }}>
                {batchSize}
              </span>
              <button className="dev-toggle" onClick={() => runBatch('l1')} disabled={!!running}>
                {running === 'l1' ? 'Running…' : `Run L1 (${pendingL1} pending)`}
              </button>
              <button className="dev-toggle" onClick={() => runBatch('l2')} disabled={!!running}>
                {running === 'l2' ? 'Running…' : `Run L2 (${pendingL2} pending)`}
              </button>
            </div>
            {(() => {
              const eligible = campaign
                ? WORD_SEED.filter(w => {
                    if (!hasLayerOne(w.id, 'en')) return false
                    const l2 = getLayerTwo(w.id, 'en')
                    return !l2?.enrichedAt || l2.enrichedAt < campaign.since
                  }).length
                : null
              return (
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 10px', borderRadius: 4, background: '#0d1520', border: '1px solid #1a2a3a' }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input
                      type="text"
                      value={campaignNote}
                      onChange={e => setCampaignNote(e.target.value)}
                      placeholder="Note (e.g. fix tense tags)…"
                      style={{ flex: 1, padding: '3px 8px', borderRadius: 3, background: '#111', border: '1px solid #222', color: '#aaa', fontSize: 11, fontFamily: 'monospace' }}
                    />
                    <button
                      className="dev-toggle"
                      style={{ background: '#1a3a2a', whiteSpace: 'nowrap' }}
                      disabled={!!running}
                      onClick={() => {
                        const c = { since: Date.now(), note: campaignNote }
                        setReEnrichCampaign(c.since, c.note)
                        setCampaign(c)
                      }}
                    >
                      Set cutoff to now
                    </button>
                    {campaign && (
                      <button
                        className="dev-toggle"
                        style={{ background: '#2a1a1a' }}
                        disabled={!!running}
                        onClick={() => { clearReEnrichCampaign(); setCampaign(null) }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {campaign && (
                    <div style={{ fontSize: 11, color: '#555', fontFamily: 'monospace' }}>
                      cutoff: {new Date(campaign.since).toLocaleString()}
                      {campaign.note && <span style={{ color: '#3a6a5a', marginLeft: 8 }}>"{campaign.note}"</span>}
                      <span style={{ marginLeft: 12, color: eligible > 0 ? '#cf9f4f' : '#3a6a3a' }}>
                        {eligible} word{eligible !== 1 ? 's' : ''} eligible
                      </span>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                      className="dev-toggle"
                      style={{ background: '#1a2a3a' }}
                      disabled={!!running || !campaign}
                      onClick={async () => {
                        setRunning('l2-force')
                        setReEnrichProgress({ done: 0, total: batchSize, current: null, enriched: [], failed: [] })
                        await forceReEnrichAllL2('en', batchSize, p => setReEnrichProgress({ ...p }), campaign?.since ?? null, campaign?.note ?? '')
                        setRunning(null)
                        forceUpdate(n => n + 1)
                      }}
                    >
                      {running === 'l2-force' ? 'Re-enriching…' : `Re-enrich L2${eligible != null ? ` (${eligible} eligible)` : ''}`}
                    </button>
                    {!campaign && <span style={{ fontSize: 11, color: '#444' }}>set a cutoff first</span>}
                  </div>
                </div>
              )
            })()}
          </div>
        )
      })()}

      {reEnrichProgress && (
        <div style={{
          marginBottom: 16, padding: '10px 14px', borderRadius: 6,
          background: '#0d1520', border: '1px solid #1a2a3a', fontSize: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ color: '#6fa8cf', fontWeight: 600 }}>
              Re-enrich L2 — {reEnrichProgress.done} / {reEnrichProgress.total}
            </span>
            {reEnrichProgress.current && (
              <span style={{ color: '#555', fontFamily: 'monospace' }}>
                → {reEnrichProgress.current}
              </span>
            )}
            {reEnrichProgress.done === reEnrichProgress.total && reEnrichProgress.total > 0 && (
              <span style={{ color: '#6fcf6f', marginLeft: 'auto' }}>done</span>
            )}
          </div>
          {/* Progress bar */}
          <div style={{ height: 4, background: '#1a2a3a', borderRadius: 2, marginBottom: 8, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 2, background: '#3a6a9a',
              width: `${reEnrichProgress.total > 0 ? (reEnrichProgress.done / reEnrichProgress.total) * 100 : 0}%`,
              transition: 'width 0.2s ease',
            }} />
          </div>
          {reEnrichProgress.enriched.length > 0 && (
            <div style={{ color: '#6fcf6f', fontFamily: 'monospace', lineHeight: 1.7 }}>
              {reEnrichProgress.enriched.join(' · ')}
            </div>
          )}
          {reEnrichProgress.failed.length > 0 && (
            <div style={{ color: '#cf6f6f', fontFamily: 'monospace', marginTop: 4 }}>
              ✕ {reEnrichProgress.failed.join(', ')}
            </div>
          )}
        </div>
      )}

      {batchReport && (
        <div style={{
          marginBottom: 16, padding: '10px 14px', borderRadius: 6,
          background: '#111', border: '1px solid #2a2a2a', fontSize: 12,
        }}>
          <div style={{ color: '#888', marginBottom: 6, fontWeight: 600 }}>
            {batchReport.layer} batch — {batchReport.enriched.length} enriched
            {batchReport.failed.length > 0 && `, ${batchReport.failed.length} failed`}
            {batchReport.remaining.length > 0 && `, ${batchReport.remaining.length} remaining`}
          </div>
          {batchReport.enriched.length > 0 && (
            <div style={{ color: '#6fcf6f', marginBottom: 4, fontFamily: 'monospace' }}>
              ✓ {batchReport.enriched.join(', ')}
            </div>
          )}
          {batchReport.failed.length > 0 && (
            <div style={{ color: '#cf6f6f', marginBottom: 4, fontFamily: 'monospace' }}>
              ✕ {batchReport.failed.join(', ')}
            </div>
          )}
          {batchReport.remaining.length > 0 && (
            <div style={{ color: '#444', fontFamily: 'monospace' }}>
              {batchReport.remaining.join(', ')}
            </div>
          )}
        </div>
      )}

      <div style={{ fontSize: 11, color: '#444', marginBottom: 16, display: 'flex', gap: 12 }}>
        <Badge label="api" status="api" /> api &nbsp;
        <Badge label="pre" status="pre" /> pre-pop &nbsp;
        <Badge label="—" status="none" /> missing
      </div>

      {orderedGroups.map(({ level, words }) => (
        <LevelGroup key={level} level={level} words={words} onEnrich={handleEnrich} onClearL2={handleClearL2} onClearL3={handleClearL3} />
      ))}

      {orderedGroups.length === 0 && (
        <p style={{ color: '#555', fontSize: 13 }}>No words match.</p>
      )}

      <AtomIndexPanel
        running={running}
        onRebuild={async () => {
          setRunning('atom-index')
          const enrichedWords = WORD_SEED
            .map(w => {
              const l2 = getLayerTwo(w.id, 'en')
              return l2?.grammaticalAtom && l2?.cefrLevel
                ? { id: w.id, atomId: l2.grammaticalAtom, cefrLevel: l2.cefrLevel }
                : null
            })
            .filter(Boolean)
          rebuildAtomIndex('en', enrichedWords)
          setRunning(null)
          forceUpdate(n => n + 1)
        }}
      />
    </div>
  )
}

const ATOM_INDEX_LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

function AtomIndexPanel({ running, onRebuild }) {
  const [open, setOpen] = useState(false)
  const [expandedAtom, setExpandedAtom] = useState(null)
  const index = getAtomIndex('en')
  const rebuiltAt = getAtomIndexRebuiltAt('en')
  const totalWords = Object.values(index).reduce((sum, levels) =>
    sum + Object.values(levels).reduce((s, ids) => s + ids.length, 0), 0
  )

  return (
    <div style={{ marginTop: 32, borderTop: '1px solid #1a1a1a', paddingTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: open ? 12 : 0 }}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}
        >
          <span style={{ fontSize: 12, color: '#555' }}>{open ? '▼' : '▶'}</span>
          <span style={{ fontWeight: 600, fontSize: 13, color: '#888' }}>Atom Index</span>
        </button>
        <span style={{ fontSize: 11, color: '#444' }}>{totalWords} words</span>
        {rebuiltAt && (
          <span style={{ fontSize: 11, color: '#333', marginLeft: 'auto' }}>
            rebuilt {new Date(rebuiltAt).toLocaleTimeString()}
          </span>
        )}
        <button
          className="dev-toggle"
          style={{ marginLeft: rebuiltAt ? 0 : 'auto' }}
          disabled={!!running}
          onClick={onRebuild}
        >
          {running === 'atom-index' ? 'Rebuilding…' : 'Rebuild'}
        </button>
      </div>

      {open && (
        <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
          {Object.keys(index).length === 0 && (
            <p style={{ color: '#444', fontSize: 12 }}>Index is empty — run L2 enrichment or rebuild.</p>
          )}
          {Object.entries(index)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([atomId, levels]) => {
              const atomTotal = Object.values(levels).reduce((s, ids) => s + ids.length, 0)
              const isExpanded = expandedAtom === atomId
              return (
                <div key={atomId} style={{ marginBottom: 6 }}>
                  <button
                    onClick={() => setExpandedAtom(isExpanded ? null : atomId)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', width: '100%', textAlign: 'left' }}
                  >
                    <span style={{ fontSize: 11, color: '#444' }}>{isExpanded ? '▼' : '▶'}</span>
                    <span style={{ color: '#7a9a7a', minWidth: 180 }}>{atomId}</span>
                    <span style={{ color: '#444' }}>{atomTotal}</span>
                  </button>
                  {isExpanded && (
                    <div style={{ paddingLeft: 20, marginTop: 2 }}>
                      {ATOM_INDEX_LEVEL_ORDER
                        .filter(lvl => levels[lvl]?.length)
                        .map(lvl => (
                          <div key={lvl} style={{ marginBottom: 4 }}>
                            <span style={{ color: '#555', minWidth: 32, display: 'inline-block' }}>{lvl}</span>
                            <span style={{ color: '#666' }}>
                              {levels[lvl]
                                .map(id => WORD_SEED.find(w => w.id === id)?.baseForm ?? id)
                                .sort()
                                .join(', ')}
                            </span>
                          </div>
                        ))
                      }
                    </div>
                  )}
                </div>
              )
            })
          }
        </div>
      )}
    </div>
  )
}
