import { useState, useEffect } from 'react'
import { getActiveLanguage, getInterfaceLanguage, getCefrLevel } from './learnerProfile'
import { getStrings } from './uiStrings'
import { getWordBank } from './userStore'
import allWords from './wordData'
import { getCurrentSubLevel } from './cefrLevels'
import { getFullPracticePool } from './practicePool'
import { generatePracticeSentence, generateForCache, MIN_WORDS, LANE_MAX_WORDS } from './practiceGenerate'
import { getMatchesAcrossStructures, addToCache, needsFill, getPoolStats, CACHE_MIN_MATCHES } from './practiceCache'

const HARD_MAX = LANE_MAX_WORDS.reading  // ceiling from config

export default function WorldReadingLane({ onBack }) {
  const s          = getStrings(getInterfaceLanguage())
  const activeLang = getActiveLanguage()
  const cefrLevel  = getCefrLevel() ?? 'A1'

  // ── Pool ──────────────────────────────────────────────────────
  const [pool,          setPool]          = useState([])   // all 12, annotated
  const [wordBankWords, setWordBankWords] = useState([])

  // ── Config (shown before first generate) ─────────────────────
  const [maxWords,      setMaxWords]      = useState(HARD_MAX)
  const [activeIds,     setActiveIds]     = useState(new Set()) // structure ids toggled on

  // ── Tab ───────────────────────────────────────────────────────
  const [activeTab,     setActiveTab]     = useState('config')

  // ── Locked-structure info panel ───────────────────────────────
  const [lockedInfo,    setLockedInfo]    = useState(null) // { id, missingAtoms }

  // ── Cache inspector ───────────────────────────────────────────
  const [expandedBucket, setExpandedBucket] = useState(null) // structure id

  // ── Generation output ─────────────────────────────────────────
  const [sentence,      setSentence]      = useState(null)
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState(null)
  const [hasGenerated,  setHasGenerated]  = useState(false)

  useEffect(() => {
    const bankIds    = getWordBank()
    const subLevel   = getCurrentSubLevel(cefrLevel, bankIds, allWords, activeLang) ?? 'A1.1'
    const full       = getFullPracticePool(bankIds, subLevel, activeLang)

    const words = bankIds
      .map(id => allWords.find(w => w.id === id && w.language === activeLang))
      .filter(Boolean)
      .map(w => w.baseForm)

    setPool(full)
    setWordBankWords(words)
    // All eligible structures on by default; locked ones start off
    setActiveIds(new Set(full.filter(s => s.eligible).map(s => s.id)))
  }, [])

  function toggleStructure(id) {
    const struct = pool.find(s => s.id === id)
    if (!struct?.eligible) {
      // Toggle the info panel for this locked structure
      setLockedInfo(prev => prev?.id === id ? null : { id, missingAtoms: struct.missingAtoms })
      return
    }
    setLockedInfo(null)
    setActiveIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function runGenerate() {
    const eligible = pool.filter(s => s.eligible && activeIds.has(s.id))
    if (!eligible.length || !wordBankWords.length) return

    // ── Try cache first ───────────────────────────────────────
    const cachedMatches = getMatchesAcrossStructures(
      activeLang, eligible.map(s => s.id), 'reading', wordBankWords
    )
    if (cachedMatches.length >= CACHE_MIN_MATCHES) {
      const pick = cachedMatches[Math.floor(Math.random() * cachedMatches.length)]
      setSentence(pick.text)
      setHasGenerated(true)
      return
    }

    // ── Live generation ───────────────────────────────────────
    setLoading(true)
    setError(null)
    try {
      const result = await generatePracticeSentence({
        eligibleStructures: eligible,
        wordBankWords,
        lane: 'reading',
        maxWordsOverride: maxWords,
      })
      setSentence(result)
      setHasGenerated(true)

      // ── Background cache fill ─────────────────────────────
      // After a live generate, fill any thin buckets so future requests
      // are served from cache. Fire-and-forget — never blocks the UI.
      for (const struct of eligible) {
        if (needsFill(activeLang, struct.id, 'reading')) {
          generateForCache({ structure: struct, wordBankWords })
            .then(cached => addToCache(activeLang, struct.id, 'reading', cached))
            .catch(() => {})
        }
      }
    } catch {
      setError(s.readingPractice.error)
    } finally {
      setLoading(false)
    }
  }

  const eligiblePool = pool.filter(s => s.eligible)
  const noStructures = eligiblePool.length === 0 || wordBankWords.length === 0
  const noneSelected = activeIds.size === 0

  return (
    <div className="reading-practice">
      <button className="profile-back" onClick={onBack}>{s.common.back}</button>
      <p className="reading-practice-title">{s.readingPractice.title}</p>

      {noStructures ? (
        <p className="reading-practice-empty">{s.readingPractice.noStructures}</p>
      ) : (
        <>
          {/* ── Tabs ─────────────────────────────────────────── */}
          <div className="rp-tabs">
            <button
              className={`rp-tab${activeTab === 'config' ? ' rp-tab--active' : ''}`}
              onClick={() => setActiveTab('config')}
            >Config</button>
            <button
              className={`rp-tab${activeTab === 'cache' ? ' rp-tab--active' : ''}`}
              onClick={() => setActiveTab('cache')}
            >Cache</button>
          </div>

          {/* ── Config panel ─────────────────────────────────── */}
          {activeTab === 'config' && <div className="rp-config">

            <div className="rp-config-row">
              <span className="rp-config-label">Max words</span>
              <div className="rp-word-count-btns">
                {[3, 4, 5].filter(n => n <= HARD_MAX).map(n => (
                  <button
                    key={n}
                    className={`rp-wc-btn${maxWords === n ? ' rp-wc-btn--active' : ''}`}
                    onClick={() => setMaxWords(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="rp-config-row rp-config-row--top">
              <span className="rp-config-label">Structures</span>
              <div className="rp-structure-toggles">
                {pool.map(struct => (
                  <button
                    key={struct.id}
                    className={[
                      'rp-struct-btn',
                      !struct.eligible              ? 'rp-struct-btn--locked'  : '',
                      struct.eligible && activeIds.has(struct.id) ? 'rp-struct-btn--active' : '',
                      lockedInfo?.id === struct.id  ? 'rp-struct-btn--info'    : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => toggleStructure(struct.id)}
                    title={struct.eligible ? struct.example : 'Click to see what\'s missing'}
                  >
                    {struct.label}
                  </button>
                ))}
              </div>
            </div>

            {lockedInfo && (
              <div className="rp-locked-info">
                <span className="rp-locked-info-title">Missing for this structure:</span>
                <ul className="rp-locked-info-list">
                  {lockedInfo.missingAtoms.map(a => (
                    <li key={a.atomId}>
                      {a.levelGated
                        ? `${a.label} — unlocks at ${a.grantedAtLevel} with level progression`
                        : `${a.label} — add one to your word bank (e.g. ${a.examples.slice(0, 2).join(', ')})`
                      }
                    </li>
                  ))}
                </ul>
              </div>
            )}

          </div>}

          {/* ── Cache inspector ──────────────────────────────── */}
          {activeTab === 'cache' && (
            <div className="rp-cache">
              {pool.map(struct => {
                const stats    = getPoolStats(activeLang, struct.id, 'reading', wordBankWords)
                const expanded = expandedBucket === struct.id
                return (
                  <div key={struct.id} className={`rp-cache-row${!struct.eligible ? ' rp-cache-row--locked' : ''}`}>
                    <button
                      className="rp-cache-row-header"
                      onClick={() => setExpandedBucket(expanded ? null : struct.id)}
                    >
                      <span className="rp-cache-row-label">{struct.label}</span>
                      <span className="rp-cache-row-counts">
                        {struct.eligible
                          ? <>{stats.total} stored · <span className="rp-cache-match">{stats.matched} match your bank</span></>
                          : <span className="rp-cache-locked">locked</span>
                        }
                      </span>
                      {stats.total > 0 && <span className="rp-cache-chevron">{expanded ? '▲' : '▼'}</span>}
                    </button>

                    {expanded && stats.sentences.length > 0 && (
                      <ul className="rp-cache-sentences">
                        {stats.sentences.map((s, i) => {
                          const bankSet  = new Set(wordBankWords)
                          const matches  = s.contentWords.every(w => bankSet.has(w))
                          return (
                            <li key={i} className={`rp-cache-sentence${matches ? ' rp-cache-sentence--match' : ''}`}>
                              <span className="rp-cache-sentence-text">{s.text}</span>
                              <span className="rp-cache-sentence-words">{s.contentWords.join(', ')}</span>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* ── Generate button ───────────────────────────────── */}
          <button
            className="reading-practice-next"
            onClick={runGenerate}
            disabled={loading || noneSelected}
          >
            {loading
              ? s.readingPractice.generating
              : hasGenerated
                ? s.readingPractice.next
                : 'Generate'}
          </button>

          {/* ── Output ───────────────────────────────────────── */}
          {error   && <p className="reading-practice-error">{error}</p>}
          {sentence && !loading && (
            <p className="reading-practice-sentence">{sentence}</p>
          )}
        </>
      )}
    </div>
  )
}
