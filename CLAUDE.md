# Claude Code Instructions — Language App Prototype

## CRITICAL: No hardcoded English in components

**This rule applies to every component, every screen, every feature — forever.**

All user-visible text must go through the string table. Never write English text directly into JSX.

### How to do it

Every component that renders text must:

```js
import { getStrings } from './uiStrings'
import { getInterfaceLanguage } from './learnerProfile'

// At the top of the component:
const s = getStrings(getInterfaceLanguage())
```

Then use string table keys for all displayed text:
- `s.common.back` — not `'← Back'`
- `s.common.categories[word.classifications.grammaticalCategory]` — not the raw category ID
- `s.common.categoriesPlural[cat]` — for filter buttons
- `s.common.lanes[laneId]` — not lane.label from lanes.js
- `s.screenName.key` — for screen-specific strings

When building a new screen, add a new section to `src/uiStrings.en.js` first, then build the component against it.

### Why this matters

A Spanish speaker learning English does not know what "verb", "noun", "← Back", or "Loading..." means in English. The app must be usable by people whose native language is not English. Hardcoded English is invisible debt that compounds badly — a component built wrong must be rebuilt entirely when the app expands to new languages.

### What goes through supportLanguage instead

`word.meaning` (definitions) uses `getSupportLanguage()`, not `getInterfaceLanguage()`. Word definitions require language-specific content or AI translation — that is a content layer problem, not a UI strings problem.

---

## Architecture rules

### Content store
- `hasContent(wordId, laneId)` reads the index only — never loads content data
- Per-word content lives at `lapp-content-word-{wordId}` — one key per word
- Content store holds URL strings only — binary files (audio, etc.) go to Cloud Storage

### Language separation
- `getActiveLanguage()` — the language the user is learning (e.g. 'en')
- `getInterfaceLanguage()` — the language the app UI appears in
- `getSupportLanguage()` — the language for definitions/translations (needed from day one)

These are three separate things and must never be conflated.
