import fs from 'node:fs'
import path from 'node:path'

// Seed Word Adder — Vite middleware
//
// POST /__add-seed-word { baseForm, language? } → writes to src/wordSeed.en.json
//
// Reads the JSON, parses, deduplicates by id, appends, stringifies, writes.
// Atomic-ish: parse/validate before writing. JSON.stringify can't produce
// invalid JSON, and a parse round-trip catches any pre-existing corruption
// before we add to it.

export default function seedWordAdder() {
  return {
    name: 'seed-word-adder',
    configureServer(server) {
      server.middlewares.use('/__add-seed-word', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return }
        const chunks = []
        req.on('data', chunk => chunks.push(chunk))
        req.on('end', () => {
          try {
            const { baseForm, language = 'en' } = JSON.parse(Buffer.concat(chunks).toString('utf-8'))
            if (typeof baseForm !== 'string' || !baseForm.trim()) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'baseForm is required and must be a non-empty string' }))
              return
            }

            const id = baseForm.trim().toLowerCase().replace(/\s+/g, '_')
            const filePath = path.join(process.cwd(), 'src', `wordSeed.${language}.json`)

            // Read + parse the current seed. If the file is missing or
            // corrupted, fail loudly — do not silently overwrite.
            let entries
            try {
              const raw = fs.readFileSync(filePath, 'utf-8')
              entries = JSON.parse(raw)
            } catch (err) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({
                error: `could not read or parse ${path.basename(filePath)}: ${err.message}`,
              }))
              return
            }
            if (!Array.isArray(entries)) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({
                error: `${path.basename(filePath)} is not a JSON array`,
              }))
              return
            }

            // Duplicate check
            if (entries.some(w => w?.id === id)) {
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: `'${id}' already exists in seed` }))
              return
            }

            // Append the new entry
            entries.push({ id, baseForm: baseForm.trim(), language })

            // Write back as pretty-printed JSON. JSON.stringify is incapable of
            // producing invalid JSON, so no further validation is needed beyond
            // confirming the round-trip parse before write.
            const updated = JSON.stringify(entries, null, 2) + '\n'
            try { JSON.parse(updated) } catch (err) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({
                error: `internal: serialized seed failed parse round-trip: ${err.message}`,
              }))
              return
            }

            fs.writeFileSync(filePath, updated, 'utf-8')
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true, id }))
          } catch (err) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: err.message }))
          }
        })
      })
    },
  }
}
