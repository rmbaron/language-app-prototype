// 12-form tense grid — English
// time:   'present' | 'past' | 'future'
// aspect: 'simple' | 'continuous' | 'perfect' | 'perfect_continuous'
// spaceCount: how many spaces the construction takes (excluding the base verb itself)
// atoms: atom classes involved in the construction

export const TENSE_GRID = [
  // ── Simple ──────────────────────────────────────────────────────────────────
  { id: 'present_simple',
    time: 'present', aspect: 'simple',
    name: 'Present Simple',
    structure: '[base]',
    example: 'I eat',
    spaceCount: 0,
    atoms: ['lexical_verb'] },

  { id: 'past_simple',
    time: 'past', aspect: 'simple',
    name: 'Past Simple',
    structure: '[past form]',
    example: 'I ate',
    spaceCount: 0,
    atoms: ['lexical_verb'] },

  { id: 'future_simple',
    time: 'future', aspect: 'simple',
    name: 'Future Simple',
    structure: 'will + [base]',
    example: 'I will eat',
    spaceCount: 1,
    atoms: ['modal_auxiliary', 'lexical_verb'] },

  // ── Continuous ───────────────────────────────────────────────────────────────
  { id: 'present_continuous',
    time: 'present', aspect: 'continuous',
    name: 'Present Continuous',
    structure: 'am/is/are + [base]-ing',
    example: 'I am eating',
    spaceCount: 1,
    atoms: ['copula', 'lexical_verb'] },

  { id: 'past_continuous',
    time: 'past', aspect: 'continuous',
    name: 'Past Continuous',
    structure: 'was/were + [base]-ing',
    example: 'I was eating',
    spaceCount: 1,
    atoms: ['copula', 'lexical_verb'] },

  { id: 'future_continuous',
    time: 'future', aspect: 'continuous',
    name: 'Future Continuous',
    structure: 'will be + [base]-ing',
    example: 'I will be eating',
    spaceCount: 2,
    atoms: ['modal_auxiliary', 'copula', 'lexical_verb'] },

  // ── Perfect ──────────────────────────────────────────────────────────────────
  { id: 'present_perfect',
    time: 'present', aspect: 'perfect',
    name: 'Present Perfect',
    structure: 'have/has + [past participle]',
    example: 'I have eaten',
    spaceCount: 1,
    atoms: ['auxiliary', 'lexical_verb'] },

  { id: 'past_perfect',
    time: 'past', aspect: 'perfect',
    name: 'Past Perfect',
    structure: 'had + [past participle]',
    example: 'I had eaten',
    spaceCount: 1,
    atoms: ['auxiliary', 'lexical_verb'] },

  { id: 'future_perfect',
    time: 'future', aspect: 'perfect',
    name: 'Future Perfect',
    structure: 'will have + [past participle]',
    example: 'I will have eaten',
    spaceCount: 2,
    atoms: ['modal_auxiliary', 'auxiliary', 'lexical_verb'] },

  // ── Perfect Continuous ───────────────────────────────────────────────────────
  { id: 'present_perfect_continuous',
    time: 'present', aspect: 'perfect_continuous',
    name: 'Present Perfect Continuous',
    structure: 'have been + [base]-ing',
    example: 'I have been eating',
    spaceCount: 2,
    atoms: ['auxiliary', 'copula', 'lexical_verb'] },

  { id: 'past_perfect_continuous',
    time: 'past', aspect: 'perfect_continuous',
    name: 'Past Perfect Continuous',
    structure: 'had been + [base]-ing',
    example: 'I had been eating',
    spaceCount: 2,
    atoms: ['auxiliary', 'copula', 'lexical_verb'] },

  { id: 'future_perfect_continuous',
    time: 'future', aspect: 'perfect_continuous',
    name: 'Future Perfect Continuous',
    structure: 'will have been + [base]-ing',
    example: 'I will have been eating',
    spaceCount: 3,
    atoms: ['modal_auxiliary', 'auxiliary', 'copula', 'lexical_verb'] },
]

export const TIMES   = ['present', 'past', 'future']
export const ASPECTS = ['simple', 'continuous', 'perfect', 'perfect_continuous']

export const ASPECT_LABELS = {
  simple:             'Simple',
  continuous:         'Continuous',
  perfect:            'Perfect',
  perfect_continuous: 'Perfect Continuous',
}

export function getCell(time, aspect) {
  return TENSE_GRID.find(t => t.time === time && t.aspect === aspect)
}
