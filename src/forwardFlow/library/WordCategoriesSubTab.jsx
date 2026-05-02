// Library → Word Categories sub-tab.
//
// Schema view, NOT a per-word lookup. Surfaces the categorical architecture
// — what categories the system claims to know about, which are populated,
// which are placeholders, which have drift.
//
// Reads from (never from L2 directly):
//   - wordCategories.en.js   → closed-class function words
//   - grammarAtoms.en.js     → ATOMS (atom-level schema)
//   - atomIndex.js           → atom × cefrLevel → wordId[]
//   - vocabularies.en.js     → L2 sub-feature schema
//   - featureIndex.js        → feature × value → wordId[]
//   - derivedFormsIndex.js   → family root → expected derived forms
//
// Loud flags:
//   ✗   schema-declared, 0 words populate this bucket
//   ⚠   architectural gap (vocabulary undeclared, drift, family expectation unmet)
//   ✓   populated
//
// This file is the orchestrator. Each section (closed-class, atoms,
// features, families) lives in its own file under sections/. Add a new
// section by adding a file to sections/ and one render line below.

import { useState } from 'react'
import { T } from '../theme'
import { Section } from '../primitives'
import { getAtomIndex, getAtomIndexRebuiltAt } from '../../atomIndex'
import { getFeatureIndex, getFeatureIndexRebuiltAt } from '../../featureIndex'
import { getDerivedFormsIndex } from '../../derivedFormsIndex'
import { ClosedClassSection } from './sections/ClosedClass'
import { AtomsSection }       from './sections/Atoms'
import { FeaturesSection }    from './sections/Features'
import { FamiliesSection }    from './sections/Families'

export function WordCategoriesSubTabContent() {
  const [openSections, setOpenSections] = useState({
    closedClass: true,
    atoms:       true,
    features:    true,
    families:    true,
  })
  const [openRows, setOpenRows] = useState({})

  const toggleSection = (k) => setOpenSections(s => ({ ...s, [k]: !s[k] }))
  const toggleRow     = (k) => setOpenRows(r => ({ ...r, [k]: !r[k] }))

  const atomIndex          = getAtomIndex('en')
  const featureIndex       = getFeatureIndex('en')
  const derivedFormsIndex  = getDerivedFormsIndex('en')
  const atomBuiltAt        = getAtomIndexRebuiltAt('en')
  const featureBuiltAt     = getFeatureIndexRebuiltAt('en')
  const featureIndexEmpty  = Object.keys(featureIndex).length === 0
  const familyMembers      = featureIndex.lemmaFamily ?? {}

  return (
    <>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: T.label, textTransform: 'uppercase', marginBottom: 8 }}>
        Library · schema view
      </div>
      <Section>Word Categories — categorical architecture</Section>
      <div style={{ fontSize: 12, color: T.textDim, marginBottom: 14, lineHeight: 1.6, fontStyle: 'italic' }}>
        What categories the system claims to know about, and which are backed by words. Reads from atomIndex, featureIndex, and derivedFormsIndex (the runtime pools); never from L2 directly. Loud flags surface architectural gaps: <span style={{ color: T.red, fontWeight: 700 }}>✗</span> empty bucket, <span style={{ color: T.amber, fontWeight: 700 }}>⚠</span> schema gap, <span style={{ color: T.green, fontWeight: 700 }}>✓</span> populated.
      </div>

      {/* Index status banner */}
      <div style={{
        background: featureIndexEmpty ? T.amberBg : T.greenBg,
        border: `1px solid ${featureIndexEmpty ? T.amberBord : T.greenBord}`,
        borderRadius: 4, padding: '6px 10px', marginBottom: 14, fontSize: 11,
        color: featureIndexEmpty ? T.amber : T.green,
      }}>
        <span style={{ fontWeight: 700, marginRight: 6 }}>
          {featureIndexEmpty ? 'featureIndex empty' : 'featureIndex built'}
        </span>
        {featureIndexEmpty
          ? <>Run <code>window.__forceReEnrichAllL2()</code> to populate. Until then, all sub-feature buckets read as 0 because the index doesn't exist yet — not because the schema is empty.</>
          : <>Last rebuilt: {featureBuiltAt}. atomIndex last rebuilt: {atomBuiltAt ?? 'never'}.</>
        }
      </div>

      <ClosedClassSection
        open={openSections.closedClass}
        onToggle={() => toggleSection('closedClass')} />

      <AtomsSection
        atomIndex={atomIndex}
        openRows={openRows} toggleRow={toggleRow}
        open={openSections.atoms}
        onToggle={() => toggleSection('atoms')} />

      <FeaturesSection
        featureIndex={featureIndex}
        openRows={openRows} toggleRow={toggleRow}
        open={openSections.features}
        onToggle={() => toggleSection('features')} />

      <FamiliesSection
        derivedFormsIndex={derivedFormsIndex}
        familyMembers={familyMembers}
        openRows={openRows} toggleRow={toggleRow}
        open={openSections.families}
        onToggle={() => toggleSection('families')} />
    </>
  )
}
