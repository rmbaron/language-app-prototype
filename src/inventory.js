// Inventory assembler
//
// Packs the four portrait components into one object — the carried inventory.
// Every screen reads from this; nothing fetches its own portrait data.
//
// WHO   — learner identity (learnerProfile)
// WHAT  — vocabulary state (userStore)
// CAN DO — grammar physics (atomUnlockStore)
// WHERE  — grammar position (learnerGrammarState, derived)

import { loadProfile } from './learnerProfile'
import { loadState } from './userStore'
import { getAtomUnlocks } from './atomUnlockStore'
import { getLearnerGrammarState } from './learnerGrammarState'

export function assembleInventory(lang = 'en') {
  const profile  = loadProfile()
  const store    = loadState()
  const unlocks  = getAtomUnlocks()
  const grammar  = getLearnerGrammarState(lang)

  const stable = profile.expressed?.stable ?? {}
  const prefs  = profile.expressed?.preferences ?? {}

  const assembled = {
    // The inventory itself — central to everything
    wordBank: store.wordBank ?? [],

    // WHO — stable identity, languages, level
    identity: {
      lang:         stable.targetLanguage    ?? 'en',
      interfaceLang: stable.interfaceLanguage ?? stable.nativeLanguage ?? 'en',
      supportLang:  stable.supportLanguage   ?? stable.nativeLanguage ?? 'en',
      nativeLang:   stable.nativeLanguage    ?? null,
      cefrLevel:    stable.cefrLevel         ?? 'A1',
      topics:       prefs.topics             ?? [],
    },

    // WHAT — the practice layer around the word bank
    vocabulary: {
      statuses:   store.wordStatuses ?? {},
      wbPools:    store.wbPools      ?? {},
      worldPools: store.worldPools   ?? {},
    },

    // CAN DO — which grammar atom classes are unlocked
    grammarPhysics: {
      unlockedAtoms: unlocks,
    },

    // WHERE — derived intersection of vocabulary + grammar
    grammarPosition: {
      activeAtoms:    grammar.activeAtoms,
      currentCluster: grammar.currentCluster,
      atomWords:      grammar.atomWords,
      pioneerGaps:    grammar.pioneerGaps,
      clusters:       grammar.clusters,
    },
  }

  return assembled
}
