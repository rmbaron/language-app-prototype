# New Atom Runbook

What to do when adding an atom to the grammar system. Follow each step in order.
The atom-wiring sanity check (`src/atomWiring.js`) runs at app load and will
report any step you forgot.

---

## 1. Define the atom

File: `src/grammarAtoms.en.js`

Add an entry to the `ATOMS` array:

```js
{
  id:          'your_new_atom',
  label:       'Human-readable label',           // shown in dev panels
  group:       'Function words',                  // legacy section grouping
  description: 'What this atom is, with a few examples.',
  examples:    ['word1', 'word2', 'word3'],      // 1-3 representative examples
}
```

**Naming convention:** snake_case. If it's an umbrella atom (alternateAtom only,
never primary), append `(umbrella)` to the label. If alternate-atom-only on a
specific word, note that in the description.

---

## 2. Tag the L2 enrichment prompt

File: `vite-plugins/wordEnricher.js`

Add per-atom guidance to the prompt so the AI knows when to use this new atom.
The atom list is auto-generated from `ATOMS` so it appears in the prompt
automatically — but the AI usually needs explicit guidance about edge cases.

For umbrella atoms, the prompt should say:
> Every {parent-class} word also gets `{ atom: 'your_umbrella', when: 'umbrella' }` in alternateAtoms.

For dual-function words like `to`:
> For "to": primary stays preposition; add `{ atom: 'infinitive_marker', when: 'before a bare infinitive verb' }` to alternateAtoms.

---

## 3. Update function words (if any new function words map to this atom)

File: `src/circuitCheck.js` — the `ALWAYS_PASS_WORDS` array

If any function-class words (a, an, the, and, but, or, etc.) should now have
this atom as their primary, update their `atomClass` field. Function words
in this list bypass the registry — their atom comes from this list directly.

If no function words map to the new atom, skip this step.

---

## 4. Add to ATOM_TO_CATEGORY

File: `src/atomToCategory.en.js`

Map the atom to a grammaticalCategory string (used by display surfaces via
`uiStrings.common.categories[]`):

```js
your_new_atom: 'pronoun',  // or 'verb', 'noun', 'conjunction', etc.
```

Pick the category the atom semantically belongs to. For umbrella atoms, use
the same category as the specific atoms it umbrellas.

---

## 5. Add an atom pioneer

File: `src/atomPioneers.en.js`

Every atom needs an entry. For atoms that are primary on actual words,
designate a pioneer:

```js
your_new_atom: 'word_id',
```

For umbrella / alternate-atom-only atoms, set the entry to null with a comment:

```js
your_umbrella: null,    // umbrella; every X word's alternateAtom — no pioneer
```

The pioneer is what the recommender surfaces first when introducing the atom
class. It doesn't matter much for umbrellas (they're not surfaced as primary).

---

## 6. Add to atomGroups

File: `src/atomGroups.en.js`

Every atom should appear in at least one pedagogical group for bulk-toggle UX
in the grammar breaker dev panel. Pick the group(s) that fit:

```js
existing_group:    [...existing, 'your_new_atom'],
// or create a new group:
new_pedagogical_cluster: ['your_new_atom', 'related_atom'],
```

If the atom is open class (accumulates vocabulary), also add it to
`OPEN_CLASS_ATOMS` in the same file. Closed class is the default.

---

## 7. Re-enrich affected words

If the atom changes the primary classification of existing words (e.g.,
splitting `determiner` into specific subtypes affects `a`, `an`, `the`),
run the L2 re-enrichment campaign on those words:

1. Open the Pipeline tab
2. Set the campaign cutoff to before the atom-add timestamp
3. Run "Re-enrich L2"

Words that were previously primary on the old atom move to the new atom in
their L2 records. The atom index updates automatically via `updateWordInIndex`.

---

## 8. (When relevant) Write patterns that use the new atom

Files: `src/grammarPatterns/*.js`

Add patterns that target the new atom directly. For umbrella atoms, patterns
will fire on any word with the umbrella as alternateAtom — useful for
cross-cutting rules. For specific atoms, patterns target precise constraints
(e.g., "indefinite_article + plural noun → forbidden").

Each pattern needs:
- `id`, `group`, `description`, `type` (bigram/trigram/morphology/boundary)
- `coupling` (which Level-3 micro-structure it implements — see grammarBreakerCouplings.js)
- `detector`, `license`
- For forbidden patterns referencing atoms not in the license: `detectsAtoms` (so the Flow tab can light them up)

---

## 9. Run the app and check the console

The atom-wiring sanity check runs at module load. If you missed any of steps
1, 4, 5, 6 — you'll see warnings like:

```
[atomWiring] 3 wiring issue(s) detected on load:
  [pioneer_missing] atom "your_new_atom" has no entry in ATOM_PIONEERS — add one ...
  [group_missing] atom "your_new_atom" is not in any atomGroup ...
  [category_missing] atom "your_new_atom" has no entry in ATOM_TO_CATEGORY ...
```

Fix each. Reload. Console should be clean.

---

## 10. (Optional) Verify in the Grammar Breaker dev panel

- **Patterns tab** — invalid patterns banner reports any pattern issues.
- **Flow tab** — Column 1 (atoms) should show the new atom. Click it to confirm
  the right downstream patterns light up (assuming you wrote any patterns
  using the atom in step 8).

---

## What gets touched, summary

| File | What changes |
|---|---|
| `src/grammarAtoms.en.js` | Atom definition (always) |
| `vite-plugins/wordEnricher.js` | Per-atom prompt guidance (always) |
| `src/circuitCheck.js` | Function-word atomClass (only if new function words use the atom) |
| `src/atomToCategory.en.js` | Display category mapping (always) |
| `src/atomPioneers.en.js` | Pioneer designation (always) |
| `src/atomGroups.en.js` | Pedagogical clustering (always) |
| `src/grammarPatterns/*.js` | Patterns using the atom (when ready) |
| Re-enrichment campaign | When existing words' primary atoms change |

The sanity check verifies items 1, 4, 5, 6 are all done. Items 2, 3, 7, 8 are
curatorial and not auto-checkable.

---

## Note: this manual checklist is temporary

Some of these touch-points (ATOM_TO_CATEGORY, ATOM_PIONEERS, atomGroups
membership) could live as fields on the atom definition itself, reducing the
"add an atom in 6 places" problem to "add an atom in 1 place." That refactor
is on the deferred list — see `grammar-breaker-deferred.md` item 8 (atom
metadata consolidation). When that ships, this runbook collapses.
