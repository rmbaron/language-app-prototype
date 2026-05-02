// Adverbial SubTabContent — thin wrapper over the shared SlotAcceptanceView.
// Slot-specific bits: violet color, A chip, adv- prefix, single-structure match.

import { SlotAcceptanceView } from '../../SlotAcceptanceView'
import { STRUCTURES } from '../../structures.en.js'
import { ADVERBIAL_ACCEPTS } from './acceptance.en.js'

const ACCEPTED = STRUCTURES.filter(s => ADVERBIAL_ACCEPTS.includes(s.id))

const INTRO = (
  <>
    Adverbial fills two roles depending on the verb's frame. <b>Argument</b> A is required (live → "in London", put → "on the table"). <b>Adjunct</b> A is free-attaching ("She runs <i>in the park</i>" — frame is SV; "in the park" attaches anyway). v1 detects end-position A only; medial ("She <i>often</i> runs") and initial ("<i>Yesterday</i> she arrived") A are deferred.
  </>
)

export function AdverbialSubTabContent({
  adverbialAnalysis,
  expanded, setExpanded, toggle,
  search, setSearch,
}) {
  const matchedIds = new Set(
    adverbialAnalysis?.structure ? [adverbialAnalysis.structure] : []
  )
  return (
    <SlotAcceptanceView
      acceptsList={ACCEPTED}
      colorKey="violet"
      slotShortLabel="A"
      storagePrefix="adv-"
      matchedIds={matchedIds}
      introNode={INTRO}
      expanded={expanded} setExpanded={setExpanded} toggle={toggle}
      search={search} setSearch={setSearch} />
  )
}
