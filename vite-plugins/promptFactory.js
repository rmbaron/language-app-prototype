import Anthropic from '@anthropic-ai/sdk'

const SYSTEM = `You are a content generator for a language learning app.

You will receive a POSITIONING block (where the learner is in their progression) and a DIRECTIVE block (what kind of content to produce for a specific lane).

Generate the requested number of candidates. Separate each candidate with exactly this delimiter on its own line:
---
No preamble, no numbering, no explanation. Just the candidates separated by ---.`

export default function promptFactory() {
  return {
    name: 'prompt-factory',
    configureServer(server) {
      server.middlewares.use('/__factory-generate', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return }
        const chunks = []
        req.on('data', chunk => chunks.push(chunk))
        req.on('end', async () => {
          try {
            const { l4Block, directiveBlock, count = 3, lane } = JSON.parse(Buffer.concat(chunks).toString('utf-8'))

            const userMessage = [
              `POSITIONING:\n${l4Block}`,
              `DIRECTIVE (${lane}):\n${directiveBlock}`,
              `Generate ${count} candidate${count !== 1 ? 's' : ''}.`,
            ].join('\n\n')

            const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
            const message = await client.messages.create({
              model: 'claude-sonnet-4-6',
              max_tokens: 2000,
              system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
              messages: [{ role: 'user', content: userMessage }],
            })

            const raw = message.content[0]?.text?.trim() ?? ''
            const candidates = raw.split(/\n---\n/).map(s => s.trim()).filter(Boolean)

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ candidates }))
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
