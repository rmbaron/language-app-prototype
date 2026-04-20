import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

// Dev-only plugin: accepts POST /__celestial-design and writes src/celestialDesign.js.
// This endpoint only exists during `vite dev` — it is never included in builds.
function celestialDesignWriter() {
  return {
    name: 'celestial-design-writer',
    configureServer(server) {
      server.middlewares.use('/__celestial-design', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end()
          return
        }
        const chunks = []
        req.on('data', chunk => chunks.push(chunk))
        req.on('end', () => {
          try {
            const design = JSON.parse(Buffer.concat(chunks).toString('utf-8'))
            const filePath = path.join(process.cwd(), 'src', 'celestialDesign.js')
            const content = [
              '// Celestial Design Config — managed by the Celestial Editor.',
              '// Open the editor with the E key while on the Celestial screen.',
              `export default ${JSON.stringify(design, null, 2)}`,
              '',
            ].join('\n')
            fs.writeFileSync(filePath, content, 'utf-8')
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true }))
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

// Dev-only plugin: accepts POST /__phase1-sequence and writes src/phase1Sequence.en.js.
function phase1SequenceWriter() {
  return {
    name: 'phase1-sequence-writer',
    configureServer(server) {
      server.middlewares.use('/__phase1-sequence', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end()
          return
        }
        const chunks = []
        req.on('data', chunk => chunks.push(chunk))
        req.on('end', () => {
          try {
            const sequence = JSON.parse(Buffer.concat(chunks).toString('utf-8'))
            const filePath = path.join(process.cwd(), 'src', 'phase1Sequence.en.js')
            const content = [
              '// Phase 1 word sequence — English target language.',
              '// Managed by the Celestial Editor. Manual edits are safe.',
              '// Field reference: wordId, laneOrder, functionUnlocked, sentences, grammarSlots.',
              '',
              `export const PHASE1_SEQUENCE = ${JSON.stringify(sequence, null, 2)}`,
              '',
            ].join('\n')
            fs.writeFileSync(filePath, content, 'utf-8')
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true }))
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

export default defineConfig({
  plugins: [react(), celestialDesignWriter(), phase1SequenceWriter()],
})
