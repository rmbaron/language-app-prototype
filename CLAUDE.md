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

## CRITICAL: Visibility rule — every change must be checkable on its surface

**This rule applies to every code change, every session — forever.**

Every code change must be checked against the surface where its effect lives — the dev panel, the Flow tab, the Patterns tab, the screen that displays the thing being changed. Don't ship a change without verifying it on that surface.

The test: pretend the user is going to open the relevant tab right after the commit lands and ask **"where do I see this?"** If the answer is "you can't" — either update the surface in the same change set, or flag it explicitly as missing visibility before declaring the change done.

### How to apply

When making a code change, before declaring it done, ask:

1. **What surface displays the thing I just changed?** (Flow tab? Patterns tab? Word profile? L2 Health dashboard? Index tab?)
2. **Will the change be visible on that surface automatically** (because the surface iterates dynamically over the underlying data) — or will it require a UI update?
3. **If it requires a UI update**, do it in the same change set. If you can't, surface the gap explicitly in the commit message and flag it as a follow-up.
4. **If no surface exists yet** for the kind of thing being changed, that's a signal — propose adding one before doing the change, not after.

### Why this matters

Changes that aren't visible on a testing surface are changes the user can't verify. Even if the code is correct, an invisible change feels broken — and over time, the gap between "what the code does" and "what the user can see it doing" grows into a fog where bugs hide. The dev surfaces are where the system is *legible* to the user; keeping them in sync with the code is non-optional.

This rule is *broader* than the testing surfaces themselves: it includes any UI element that displays state, any dashboard, any panel, any popover. If the change touches behavior, the place that shows that behavior gets touched too.

### Examples

- Added a new pattern? The Patterns tab and Flow tab should show it (auto, if the surface iterates `PATTERNS`). The Patterns tab's count should change. **If the new pattern emits useful `info`, the Flow tab should render it — that's a UI update.**
- Added per-match license to the validator? The Flow tab's fired-match panel should display the per-match license when present. **UI update required.**
- Added a `defaults` block to atom records? The atom display surfaces (Flow tab column 1, Patterns tab atom view) should expose the defaults. **UI update required, even if defaults are derivable.**
- Added a row to a dispatch table (`ADVERB_POSITION_RULES`, `FORBIDDEN_VERB_FORMS`, `VERB_CONSTRUCTIONS`)? There should be a surface that shows the table. **If no such surface exists, that's the signal to add one.**

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
