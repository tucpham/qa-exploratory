#!/usr/bin/env node
// CLI for agents: send one Playwright MCP tool call to this agent's browser daemon.
//
//   node tools/mcp-call.js --port 8931 --agent explorer-1 list
//   node tools/mcp-call.js --port 8931 --agent explorer-1 browser_navigate '{"url":"http://localhost:4100/login"}'
//   node tools/mcp-call.js --port 8931 --agent explorer-1 browser_click '{"element":"Lưu hoá đơn","ref":"e23"}'
//
// Each call appends to reports/usage.jsonl (chars in/out) so token cost per run can be measured.
const http = require('http');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
let port = 8931, agent = process.env.QA_AGENT || 'unknown';
while (args[0] && args[0].startsWith('--')) {
  const k = args.shift(); const v = args.shift();
  if (k === '--port') port = Number(v);
  if (k === '--agent') agent = v;
}
const tool = args[0] || 'list';
let params = {};
try { params = args[1] ? JSON.parse(args[1]) : {}; } catch (e) { console.error('Invalid JSON args: ' + e.message); process.exit(2); }

const payload = JSON.stringify({ tool, args: params });
const req = http.request({ host: '127.0.0.1', port, method: 'POST', path: '/' }, res => {
  let out = '';
  res.on('data', c => (out += c));
  res.on('end', () => {
    console.log(out);
    const logDir = path.join(__dirname, '..', 'reports');
    fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(path.join(logDir, 'usage.jsonl'), JSON.stringify({
      ts: new Date().toISOString(), agent, tool, inChars: payload.length, outChars: out.length,
    }) + '\n');
  });
});
req.on('error', e => { console.error('Cannot reach browser daemon on :' + port + ' - ' + e.message); process.exit(1); });
req.end(payload);
