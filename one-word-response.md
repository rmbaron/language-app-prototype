## 1. Tech Stack

**React + Vite + plain CSS**

- Vite for zero-config local dev
- React for component structure (you'll need it when the word grows)
- No UI library, no router, no state manager — just one component file
- No backend, no database — data lives in a single JS object for now

---

## 2. Data Model

```js
const word = {
  // Stable identity — never changes
  id: "want",
  baseForm: "want",
  language: "en",

  // Core classification — grows slowly
  grammaticalCategory: "verb",

  // Expandable metadata — starts empty, fills over time
  meta: {
    semanticTags: [],
    situationalTags: [],
    functionalRoles: [],
  }
}
```

Two clean layers: **identity** (what this word *is*) and **meta** (what we *know about* it so far).

---

## 3. UI Structure

```
┌──────────────────────────────┐
│                              │
│   want                       │
│                              │
│   Verb                       │
│                              │
└──────────────────────────────┘
```

One card. The word large. The category small and muted below it. Nothing else visible yet — but the data model is already richer than the display.

---

## 4. Separating Identity from Metadata

| Layer | What it holds | Why it's separate |
|---|---|---|
| **Identity** | `id`, `baseForm`, `language` | Stable — never reassigned, used as a key |
| **Core classification** | `grammaticalCategory` | Slow-changing, always present |
| **Meta** | tags, roles, relationships | Fast-changing, optional, additive |

The `id` field is the anchor. You can add 50 tags to `meta` and the word is still unambiguously `"want"`. This mirrors how a real word profile hub would work — the identity is the stable core, everything else hangs off it.

---

## 5. Scaffold Plan

```
language-app-prototype/
├── index.html
├── main.jsx
├── App.jsx          ← mounts WordCard
├── WordCard.jsx     ← displays the word and category
├── wordData.js      ← the single word object
└── style.css        ← minimal card styles
```

**Build order:**
1. `wordData.js` — define the word object
2. `WordCard.jsx` — accepts a word prop, renders base form + category
3. `App.jsx` — imports the word, passes it to WordCard
4. `style.css` — card layout, typography only
5. `main.jsx` + `index.html` — Vite entry point

---

Ready to build it? I can scaffold all five files right now if you confirm the stack.
