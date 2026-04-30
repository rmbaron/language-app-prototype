import { useState, useEffect, useCallback } from 'react'
import { getActiveLanguage } from './learnerProfile'
import {
  getAllEntries, getPoolStats, getPoolGaps,
  updateEntry, bulkUpdateEntries, exportPool,
  deleteEntry, bulkDeleteEntries, clearPool,
} from './contentPool'
import IngestionTab from './IngestionTab'

const C = {
  bg:            '#f5f6fb',
  card:          '#ffffff',
  border:        '#dde0f0',
  primary:       '#1a1a2e',
  secondary:     '#4a5080',
  muted:         '#8890b8',
  accent:        '#3355cc',
  accentBg:      '#eef1ff',
  accentBorder:  '#b0bef0',
  success:       '#1a7a35',
  successBg:     '#e8f5ed',
  successBorder: '#88c8a0',
  danger:        '#a0182a',
  dangerBg:      '#fdecea',
  dangerBorder:  '#f0a0a8',
  warning:       '#8a6000',
  warningBg:     '#fffbec',
  warningBorder: '#f0d080',
}

function SL({ children, style }) {
  return (
    <div style={{ fontSize: 11, color: C.secondary, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, ...style }}>
      {children}
    </div>
  )
}

function Tag({ color, bg, border, children }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: 10, fontWeight: 600,
      color: color ?? C.secondary, background: bg ?? C.bg,
      border: `1px solid ${border ?? C.border}`,
      borderRadius: 3, padding: '1px 6px',
    }}>
      {children}
    </span>
  )
}

function StatusTag({ status }) {
  const map = {
    approved: { color: C.success,  bg: C.successBg,  border: C.successBorder },
    rejected: { color: C.danger,   bg: C.dangerBg,   border: C.dangerBorder  },
    pending:  { color: C.warning,  bg: C.warningBg,  border: C.warningBorder },
  }
  const s = map[status] ?? {}
  return <Tag color={s.color} bg={s.bg} border={s.border}>{status}</Tag>
}

function StatBox({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center', padding: '10px 18px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 8 }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: color ?? C.primary }}>{value}</div>
      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{label}</div>
    </div>
  )
}

function EntryRow({ entry, selected, onSelect, onApprove, onReject, onCopy, onDelete }) {
  const [expanded, setExpanded] = useState(false)

  const wordIds = entry.wordIds ?? []
  const themes = entry.themes ?? []

  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 8, marginBottom: 8, overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px' }}>
        <input
          type="checkbox"
          checked={selected}
          onChange={e => onSelect(e.target.checked)}
          style={{ marginTop: 3, flexShrink: 0 }}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: C.primary, lineHeight: 1.5, marginBottom: 6 }}>
            {entry.text}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
            <StatusTag status={entry.status} />
            <Tag color={C.muted}>{entry.lang}</Tag>
            <Tag color={C.muted}>{entry.source}</Tag>
            {entry.cefrLevel && <Tag color={C.accent} bg={C.accentBg} border={C.accentBorder}>{entry.cefrLevel}</Tag>}
            <Tag color={C.muted}>cl {entry.clusterFloor}–{entry.clusterCeiling}</Tag>
            {wordIds.map(w => (
              <Tag key={w} color={C.accent} bg={C.accentBg} border={C.accentBorder}>{w}</Tag>
            ))}
            {themes.map(t => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button onClick={() => setExpanded(x => !x)} style={btnStyle(C.muted, C.bg, C.border)}>
            {expanded ? '▲' : '▼'}
          </button>
          <button onClick={onCopy} style={btnStyle(C.secondary, C.bg, C.border)}>Copy</button>
          {entry.status !== 'approved' && (
            <button onClick={onApprove} style={btnStyle(C.success, C.successBg, C.successBorder)}>Approve</button>
          )}
          {entry.status !== 'rejected' && (
            <button onClick={onReject} style={btnStyle(C.danger, C.dangerBg, C.dangerBorder)}>Reject</button>
          )}
          <button onClick={onDelete} style={btnStyle(C.danger, C.card, C.dangerBorder)}>Delete</button>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: `1px solid ${C.border}`, padding: '10px 12px', background: C.bg }}>
          <SL style={{ marginBottom: 8 }}>Full entry</SL>
          <pre style={{ fontSize: 11, color: C.secondary, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {JSON.stringify(entry, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

function btnStyle(color, bg, border) {
  return {
    fontSize: 11, fontWeight: 600, color, background: bg,
    border: `1px solid ${border}`, borderRadius: 4,
    padding: '4px 10px', cursor: 'pointer',
  }
}

export default function ContentPoolScreen({ onBack }) {
  const lang = getActiveLanguage() ?? 'en'
  const [tab, setTab] = useState('pool')

  const [entries, setEntries] = useState([])
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 })
  const [gaps, setGaps] = useState([])
  const [filters, setFilters] = useState({ status: 'all', wordId: '', source: 'all' })
  const [selected, setSelected] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const reload = useCallback(async () => {
    setLoading(true)
    const f = {}
    if (filters.status !== 'all') f.status = filters.status
    if (filters.wordId.trim()) f.wordId = filters.wordId.trim()
    if (filters.source !== 'all') f.source = filters.source
    f.lang = lang

    const [loaded, s, g] = await Promise.all([
      getAllEntries(f),
      getPoolStats(lang),
      getPoolGaps(lang, 1),
    ])
    setEntries(loaded)
    setStats(s)
    setGaps(g)
    setSelected(new Set())
    setLoading(false)
  }, [filters, lang])

  useEffect(() => { reload() }, [reload])

  async function approve(id) {
    await updateEntry(id, { status: 'approved' })
    reload()
  }

  async function reject(id) {
    await updateEntry(id, { status: 'rejected' })
    reload()
  }

  async function bulkApprove() {
    await bulkUpdateEntries([...selected], { status: 'approved' })
    reload()
  }

  async function bulkReject() {
    await bulkUpdateEntries([...selected], { status: 'rejected' })
    reload()
  }

  async function deleteOne(id) {
    await deleteEntry(id)
    reload()
  }

  async function bulkDelete() {
    await bulkDeleteEntries([...selected])
    reload()
  }

  async function handleClearPool() {
    if (!window.confirm('Clear all entries from the pool? This cannot be undone.')) return
    await clearPool(lang)
    reload()
  }

  function toggleSelect(id, val) {
    setSelected(prev => {
      const next = new Set(prev)
      val ? next.add(id) : next.delete(id)
      return next
    })
  }

  function selectAll() {
    setSelected(new Set(entries.map(e => e.id)))
  }

  function selectNone() {
    setSelected(new Set())
  }

  async function copyEntry(entry) {
    const text = JSON.stringify(entry, null, 2)
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  async function handleExport() {
    const data = await exportPool({ lang })
    const text = JSON.stringify(data, null, 2)
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: '20px 24px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={onBack} style={btnStyle(C.muted, C.card, C.border)}>← Back</button>
          <h2 style={{ margin: 0, fontSize: 18, color: C.primary, fontWeight: 700 }}>Content Pool</h2>
          <span style={{ fontSize: 12, color: C.muted }}>{lang}</span>
          <div style={{ display: 'flex', gap: 6, marginLeft: 16 }}>
            {['pool', 'ingest'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={btnStyle(
                  tab === t ? C.accent : C.muted,
                  tab === t ? C.accentBg : C.card,
                  tab === t ? C.accentBorder : C.border,
                )}
              >
                {t === 'pool' ? 'Pool' : 'Ingest'}
              </button>
            ))}
          </div>
          {copied && <span style={{ fontSize: 12, color: C.success, marginLeft: 'auto' }}>Copied!</span>}
        </div>

        {tab === 'ingest' && <IngestionTab />}

        {tab === 'pool' && <>
        {/* Stats */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <StatBox label="total" value={stats.total} />
          <StatBox label="pending" value={stats.pending} color={C.warning} />
          <StatBox label="approved" value={stats.approved} color={C.success} />
          <StatBox label="rejected" value={stats.rejected} color={C.danger} />
          <StatBox label="words with gaps" value={gaps.length} color={gaps.length > 0 ? C.warning : C.success} />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <SL>Filter</SL>

          {['all', 'pending', 'approved', 'rejected'].map(s => (
            <button
              key={s}
              onClick={() => setFilters(f => ({ ...f, status: s }))}
              style={btnStyle(
                filters.status === s ? C.accent : C.muted,
                filters.status === s ? C.accentBg : C.card,
                filters.status === s ? C.accentBorder : C.border,
              )}
            >
              {s}
            </button>
          ))}

          <input
            placeholder="word ID"
            value={filters.wordId}
            onChange={e => setFilters(f => ({ ...f, wordId: e.target.value }))}
            style={{
              fontSize: 12, padding: '4px 8px', border: `1px solid ${C.border}`,
              borderRadius: 4, background: C.card, color: C.primary, width: 120,
            }}
          />

          {['all', 'flywheel', 'ingested', 'authored'].map(s => (
            <button
              key={s}
              onClick={() => setFilters(f => ({ ...f, source: s }))}
              style={btnStyle(
                filters.source === s ? C.accent : C.muted,
                filters.source === s ? C.accentBg : C.card,
                filters.source === s ? C.accentBorder : C.border,
              )}
            >
              {s}
            </button>
          ))}

          <button onClick={handleExport} style={{ ...btnStyle(C.secondary, C.card, C.border), marginLeft: 'auto' }}>
            Export (copy)
          </button>
        </div>

        {/* Bulk actions */}
        {entries.length > 0 && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: C.muted }}>{selected.size} selected</span>
            <button onClick={selectAll} style={btnStyle(C.muted, C.card, C.border)}>Select all</button>
            <button onClick={selectNone} style={btnStyle(C.muted, C.card, C.border)}>None</button>
            {selected.size > 0 && (
              <>
                <button onClick={bulkApprove} style={btnStyle(C.success, C.successBg, C.successBorder)}>
                  Approve {selected.size}
                </button>
                <button onClick={bulkReject} style={btnStyle(C.danger, C.dangerBg, C.dangerBorder)}>
                  Reject {selected.size}
                </button>
                <button onClick={bulkDelete} style={btnStyle(C.danger, C.card, C.dangerBorder)}>
                  Delete {selected.size}
                </button>
              </>
            )}
            <button onClick={handleClearPool} style={{ ...btnStyle(C.danger, C.card, C.dangerBorder), marginLeft: 'auto' }}>
              Clear pool
            </button>
          </div>
        )}

        {/* Entry list */}
        {loading ? (
          <div style={{ color: C.muted, fontSize: 13, padding: 20 }}>Loading...</div>
        ) : entries.length === 0 ? (
          <div style={{ color: C.muted, fontSize: 13, padding: 20 }}>
            No entries{filters.status !== 'all' ? ` with status "${filters.status}"` : ''}.
            {stats.total === 0 && ' The pool is empty — use the ingestion pipeline to add content.'}
          </div>
        ) : (
          entries.map(entry => (
            <EntryRow
              key={entry.id}
              entry={entry}
              selected={selected.has(entry.id)}
              onSelect={val => toggleSelect(entry.id, val)}
              onApprove={() => approve(entry.id)}
              onReject={() => reject(entry.id)}
              onCopy={() => copyEntry(entry)}
              onDelete={() => deleteOne(entry.id)}
            />
          ))
        )}

        </>}

      </div>
    </div>
  )
}
