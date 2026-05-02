// Forward Flow — Verb agreement check.
//
// Given the matched verb's form (from matchVerb), the expected agreement
// pattern (derived from subject features in units/subject/detector.js), and
// whether an aux chain is present, return null when fine or a small issue
// record when the form contradicts the expectation.
//
// Skipped when:
//   • An aux chain is present — the agreement bears on the FIRST aux, and
//     post-aux lexical-verb form is governed by chain projection rules
//     (handled elsewhere; see units/verb/internalChain.en.js).
//   • The verb is past/past-participle/present-participle — past doesn't
//     agree in English (except be: was/were), participles never bear
//     agreement on their own.
//
// Currently checks only the present-tense -s contrast. The "be" present
// paradigm (am/is/are) is naturally covered because formsMap tags them
// with the right type.

const PRESENT_AGREEING_TYPES = new Set([
  'base', 'present', 'first_person_present', 'third_person_present',
])

function typesOf(type) {
  if (!type) return []
  return Array.isArray(type) ? type : [type]
}

export function checkAgreement(form, expectedPattern, hasAux) {
  if (!form || !expectedPattern) return null
  if (hasAux) return null

  const types = typesOf(form.type)
  const isAgreeing = types.some(t => PRESENT_AGREEING_TYPES.has(t))
  if (!isAgreeing) return null

  const isThirdSg = types.includes('third_person_present')
  const expectsThirdSg = expectedPattern === '-s ending (present)'
  const expectsBase    = expectedPattern === 'base form (present)'

  if (expectsThirdSg && !isThirdSg) {
    return {
      severity: 'warning',
      issue:    'missing -s on 3rd-singular verb',
      expected: '-s ending (e.g. runs, eats, is, has)',
      got:      form.surface,
    }
  }
  if (expectsBase && isThirdSg) {
    return {
      severity: 'warning',
      issue:    'unexpected -s ending for non-3rd-singular subject',
      expected: 'base form (e.g. run, eat, are, have)',
      got:      form.surface,
    }
  }
  return null
}
