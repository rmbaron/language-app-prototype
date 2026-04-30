const fs = require('fs');
const path = require('path');

const SOURCE = 'C:/Users/rtheb/.claude/projects/c--Users-rtheb-language-app-prototype/bd997467-11ac-47f1-a7b0-f29e0783f17c.jsonl';
const OUT = 'C:/Users/rtheb/language-app-prototype/session-39-transcript.md';

const lines = fs.readFileSync(SOURCE, 'utf8').split('\n').filter(Boolean);

let out = '# Session 39 — 2026-04-29\n\nLanguage app design session. Crisis → peer chat as the medium → bank-overlap mechanic → still-image social media positioning.\n\n---\n\n';

for (const line of lines) {
  let obj;
  try { obj = JSON.parse(line); } catch (e) { continue; }
  if (obj.type !== 'user' && obj.type !== 'assistant') continue;
  if (obj.isSidechain) continue;

  const role = obj.type === 'user' ? 'User' : 'Assistant';
  const content = obj.message?.content;
  if (!content) continue;

  let text = '';
  if (typeof content === 'string') {
    text = content;
  } else if (Array.isArray(content)) {
    for (const block of content) {
      if (block.type === 'text') text += block.text;
      else if (block.type === 'tool_use') text += `\n\n*[tool: ${block.name}]*\n`;
      else if (block.type === 'tool_result') {
        // skip tool results — too noisy for transcript
        continue;
      }
    }
  }

  text = text.trim();
  if (!text) continue;

  // Skip system reminders and tool result wrappers in user messages
  if (role === 'User') {
    // Strip system-reminder tags
    text = text.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '').trim();
    // Skip purely tool-result messages
    if (text.startsWith('[{"tool_use_id"') || text.startsWith('Tool ')) continue;
    if (!text) continue;
  }

  out += `## ${role}\n\n${text}\n\n---\n\n`;
}

fs.writeFileSync(OUT, out);
console.log(`Wrote ${OUT}`);
console.log(`Size: ${(fs.statSync(OUT).size / 1024).toFixed(1)} KB`);
