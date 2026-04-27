import fs from 'node:fs'
import path from 'node:path'

export default function celestialDesignWriter() {
  return {
    name: 'celestial-design-writer',
    configureServer(server) {
      server.middlewares.use('/__celestial-design', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return }
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
