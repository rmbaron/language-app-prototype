// Subject SubTabContent — thin wrapper over the shared SlotAcceptanceView.
// Slot-specific bits: blue color, S chip, subj- prefix, single-shape match.

import { SlotAcceptanceView } from '../../SlotAcceptanceView'
import { STRUCTURES } from '../../structures.en.js'
import { SUBJECT_ACCEPTS } from './acceptance.en.js'

const ACCEPTED = STRUCTURES.filter(s => SUBJECT_ACCEPTS.includes(s.id))

const INTRO = (
  <>
    Subject's per-unit shape catalog has been retired — the structures shown here come from the shared registry. Pronoun case (subject I/he/she vs object me/him/her) is an atom-level concern, not a structure concern.
  </>
)

export function SubjectSubTabContent({
  lane, subjectShape,
  expanded, setExpanded, toggle,
  search, setSearch,
}) {
  const matchedIds = new Set(
    lane === 'fundamental' && subjectShape ? [subjectShape] : []
  )
  return (
    <SlotAcceptanceView
      acceptsList={ACCEPTED}
      colorKey="blue"
      slotShortLabel="S"
      storagePrefix="subj-"
      matchedIds={matchedIds}
      introNode={INTRO}
      expanded={expanded} setExpanded={setExpanded} toggle={toggle}
      search={search} setSearch={setSearch} />
  )
}
