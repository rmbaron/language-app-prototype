// L2 sub-feature coverage section.
// For each feature in VOCABULARIES: legal-value enum (declared) or summary
// (open/undeclared) with drift detection where applicable. Reads from
// featureIndex.

import { T } from '../../theme'
import { VOCABULARIES, getLegalValues } from '../../../vocabularies.en.js'
import { SchemaSectionHeader } from './_shared'

const GROUP_ORDER = ['verb', 'noun', 'adjective', 'adverb', 'numeral', 'pronoun', '*']
const GROUP_LABELS = {
  verb: 'Verb features', noun: 'Noun features', adjective: 'Adjective features',
  adverb: 'Adverb features', numeral: 'Numeral features', pronoun: 'Pronoun features',
  '*': 'Universal features',
}

function groupFeatures() {
  const groups = GROUP_ORDER.map(g => ({ key: g, features: [] }))
  for (const [feature, vocab] of Object.entries(VOCABULARIES)) {
    const primary = vocab.appliesTo[0] ?? '*'
    const target = groups.find(g => g.key === primary) ?? groups[groups.length - 1]
    target.features.push({ feature, ...vocab })
  }
  return groups.filter(g => g.features.length > 0)
}

export function FeaturesSection({ featureIndex, openRows, toggleRow, open, onToggle }) {
  return (
    <>
      <SchemaSectionHeader
        label="L2 sub-feature coverage"
        count={`${Object.keys(VOCABULARIES).length} features`}
        open={open} onToggle={onToggle} />
      {open && (
        <div style={{ marginBottom: 18 }}>
          {groupFeatures().map(({ key, features }) => (
            <div key={key} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: T.textDim, textTransform: 'uppercase', marginBottom: 4 }}>
                {GROUP_LABELS[key]}
              </div>
              {features.map(feat => (
                <FeatureRow key={feat.feature}
                  feature={feat}
                  buckets={featureIndex[feat.feature] ?? {}}
                  open={!!openRows[`feat-${feat.feature}`]}
                  onToggle={() => toggleRow(`feat-${feat.feature}`)} />
              ))}
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function FeatureRow({ feature, buckets, open, onToggle }) {
  const isUndeclared = feature.status === 'undeclared'
  const isOpen       = feature.status === 'open'
  const legalValues  = getLegalValues(feature.feature) ?? []
  const legalSet     = new Set(legalValues.map(v => String(v)))
  const foundValues  = Object.keys(buckets)
  const driftValues  = isOpen ? [] : foundValues.filter(v => !legalSet.has(v))
  const totalWords   = Object.values(buckets).reduce((a, ids) => a + (Array.isArray(ids) ? ids.length : 0), 0)

  let topFlag
  if (isUndeclared)                topFlag = 'warn'
  else if (driftValues.length > 0) topFlag = 'warn'
  else if (totalWords === 0)       topFlag = 'empty'
  else                             topFlag = 'ok'

  const flagDisplay = {
    ok:    { mark: '✓', color: T.green },
    empty: { mark: '✗', color: T.red },
    warn:  { mark: '⚠', color: T.amber },
  }[topFlag]

  return (
    <div>
      <div onClick={() => !isUndeclared && onToggle()}
        style={{
          display: 'flex', alignItems: 'baseline', gap: 10,
          padding: '4px 12px', fontSize: 12,
          borderBottom: `1px dashed ${T.border}`,
          cursor: isUndeclared ? 'default' : 'pointer',
        }}>
        <span style={{ color: flagDisplay.color, fontWeight: 700, minWidth: 14 }}>{flagDisplay.mark}</span>
        <span style={{ fontFamily: 'monospace', color: T.text, fontWeight: 600, minWidth: 180 }}>{feature.feature}</span>
        <span style={{ color: T.textDim, fontSize: 11, flex: 1 }}>
          {isUndeclared
            ? 'shape declared, vocabulary undeclared'
            : isOpen
            ? `open-ended values · ${foundValues.length} populated`
            : `${legalValues.length} value${legalValues.length === 1 ? '' : 's'} declared${driftValues.length > 0 ? ` · ${driftValues.length} drift` : ''}`}
        </span>
        <span style={{ color: totalWords === 0 ? T.red : T.textSub, fontWeight: totalWords === 0 ? 700 : 400, fontFamily: 'monospace' }}>
          {totalWords} {totalWords === 1 ? 'word' : 'words'}
        </span>
        {!isUndeclared && <span style={{ fontSize: 10, color: T.textDim, minWidth: 12 }}>{open ? '▴' : '▾'}</span>}
      </div>
      {open && !isUndeclared && (
        <div style={{ marginLeft: 32, marginBottom: 6 }}>
          {feature.description && (
            <div style={{ fontSize: 11, color: T.textDim, fontStyle: 'italic', padding: '4px 0' }}>
              {feature.description}
            </div>
          )}
          {isOpen && feature.feature === 'lemmaFamily' && (
            <div style={{ fontSize: 11, color: T.textDim, padding: '4px 0' }}>
              See <b>Lemma Family Coverage</b> section below for per-family expected-vs-present detail.
            </div>
          )}
          {isOpen && feature.feature !== 'lemmaFamily' && (
            <div style={{ fontSize: 11, color: T.textSub, padding: '4px 0' }}>
              {foundValues.length} distinct value{foundValues.length === 1 ? '' : 's'} populated. Top values:{' '}
              {Object.entries(buckets)
                .sort((a, b) => (b[1]?.length ?? 0) - (a[1]?.length ?? 0))
                .slice(0, 8)
                .map(([v, ids]) => `${v} (${ids.length})`)
                .join(', ')}
              {foundValues.length > 8 && ` … and ${foundValues.length - 8} more`}
            </div>
          )}
          {!isOpen && legalValues.map(v => {
            const k = String(v)
            const count = buckets[k]?.length ?? 0
            return (
              <div key={k} style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 11, padding: '2px 0' }}>
                <span style={{ color: count === 0 ? T.red : T.green, fontWeight: 700, minWidth: 14 }}>
                  {count === 0 ? '✗' : '✓'}
                </span>
                <span style={{ fontFamily: 'monospace', color: T.text, minWidth: 140 }}>{k}</span>
                <span style={{ color: count === 0 ? T.red : T.textSub, fontWeight: count === 0 ? 700 : 400, fontFamily: 'monospace' }}>
                  {count} word{count === 1 ? '' : 's'}
                </span>
              </div>
            )
          })}
          {!isOpen && driftValues.map(v => (
            <div key={`drift-${v}`} style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 11, padding: '2px 0' }}>
              <span style={{ color: T.amber, fontWeight: 700, minWidth: 14 }}>⚠</span>
              <span style={{ fontFamily: 'monospace', color: T.amber, minWidth: 140 }}>{v}</span>
              <span style={{ color: T.amber, fontFamily: 'monospace' }}>
                {buckets[v]?.length ?? 0} words · drift (value not in declared enum)
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
