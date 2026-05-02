// Forward Flow — Verb live-status accordion sections (composer).
//
// V's StatusBlock is a thin composer that arranges per-concern sub-blocks
// living in ./statusBlocks/. Each sub-block decides whether to render itself
// based on its own props; this file owns the order they appear in.
//
// Order matters (top → bottom):
//   1. AgreementIssue     — surfaces a mismatch first if any
//   2. VerbMatched        — what verb the system locked onto
//   3. AuxChain           — chain elements + named cluster configuration
//   4. VerbExpected       — the agreement pattern the verb should follow
//
// Adding a new verb-status sub-block: drop a file in ./statusBlocks/ and
// add a single line here. No other file in the repo needs to change.

import { AgreementIssueStatus } from './statusBlocks/AgreementIssue'
import { VerbMatchedStatus }    from './statusBlocks/VerbMatched'
import { AuxChainStatus }       from './statusBlocks/AuxChain'
import { VerbExpectedStatus }   from './statusBlocks/VerbExpected'

export function VerbStatusBlock({
  lane, exceptionType,
  matchedVerb, matchedVerbForm,
  auxChain, auxConfiguration,
  expectedAgreement, agreementCheck,
  statusOpen, toggleStatus,
}) {
  const passthrough = { statusOpen, toggleStatus }
  return (
    <>
      <AgreementIssueStatus agreementCheck={agreementCheck} {...passthrough} />
      <VerbMatchedStatus    matchedVerb={matchedVerb} matchedVerbForm={matchedVerbForm} {...passthrough} />
      <AuxChainStatus       auxChain={auxChain} auxConfiguration={auxConfiguration} exceptionType={exceptionType} {...passthrough} />
      <VerbExpectedStatus   lane={lane} expectedAgreement={expectedAgreement} {...passthrough} />
    </>
  )
}
