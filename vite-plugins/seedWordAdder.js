import fs from 'node:fs'
import path from 'node:path'

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
            const id = baseForm.trim().toLowerCase().replace(/\s+/g, '_')
            const filePath = path.join(process.cwd(), 'src', 'wordSeed.en.js')
            let content = fs.readFileSync(filePath, 'utf-8')
            if (content.includes(`id: '${id}'`)) {
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: `'${id}' already exists in seed` }))
              return
            }
            const entry = `  { id: '${id}', baseForm: '${baseForm.trim()}', language: '${language}' },\n`
            content = content.trimEnd().replace(/\]$/, '') + entry + ']\n'
            fs.writeFileSync(filePath, content, 'utf-8')
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
