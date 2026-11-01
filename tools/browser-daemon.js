#!/usr/bin/env node
// Holds ONE persistent Playwright MCP session (stdio) per agent, so browser state
// (login cookie, current page) survives between tool calls.
// Agents send calls through tools/mcp-call.js -> this daemon -> Playwright MCP.
//
// Why: in Claude Code / Agent SDK the runtime keeps the MCP session for you (.mcp.json).
// This daemon is only needed when an agent drives the browser through shell commands
// (CI runners, cron, or this demo).
//
// Usage: node tools/browser-daemon.js <listenPort> <allowedOrigin> [storageStateFile]
//   storageStateFile: start already logged in as one role (from tools/login-state.js).
//   Env QA_MCP_CAPS (default "network,storage,pdf") enables extra tools: browser_route (mock/fault injection),
//   browser_network_state_set (offline), browser_set_storage_state (switch role), browser_pdf_save.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

const listenPort = Number(process.argv[2] || 8931);
const origin = process.argv[3] || 'http://localhost:4100';
const storageState = process.argv[4];
const caps = process.env.QA_MCP_CAPS === undefined ? 'network,storage,pdf' : process.env.QA_MCP_CAPS;
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'reports', 'artifacts', String(listenPort));
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [path.join(root, 'node_modules', '@playwright', 'mcp', 'cli.js'),
      '--headless', '--browser', 'chrome', '--no-sandbox', '--isolated',
      // Guard rail only. Playwright docs: allowed-origins is NOT a security boundary.
      '--allowed-origins', origin,
      '--viewport-size', '1280x800', '--console-level', 'error',
      '--output-dir', outDir,
      ...(caps ? ['--caps', caps] : []),
      ...(storageState ? ['--storage-state', path.resolve(root, storageState)] : [])],
    cwd: root, stderr: 'ignore',
  });
  const client = new Client({ name: 'qa-exploratory-daemon', version: '0.1.0' });
  await client.connect(transport);

  let queue = Promise.resolve();
  http.createServer((req, res) => {
    let body = '';
    req.on('data', c => (body += c));
    req.on('end', () => {
      queue = queue.then(async () => {
        try {
          const { tool, args } = JSON.parse(body || '{}');
          let out;
          if (tool === 'list') {
            out = (await client.listTools()).tools.map(t => `${t.name}: ${(t.description || '').split('\n')[0]}`).join('\n');
          } else {
            const r = await client.callTool({ name: tool, arguments: args || {} });
            out = (r.content || []).map(c => c.type === 'text' ? c.text : `[${c.type} saved to output dir]`).join('\n');
            // Snapshots are written to files by Playwright MCP; inline them so the agent sees the page.
            out = out.replace(/\[Snapshot\]\(([^)]+\.yml)\)/g, (m, p) => {
              const abs = path.isAbsolute(p) ? p : path.join(root, p);
              try { return '\n```yaml\n' + fs.readFileSync(abs, 'utf8') + '\n```'; } catch { return m; }
            });
            if (r.isError) out = 'ERROR: ' + out;
          }
          res.end(out);
        } catch (e) { res.statusCode = 500; res.end('daemon error: ' + e.message); }
      });
    });
  }).listen(listenPort, '127.0.0.1', () => console.log(`browser-daemon :${listenPort} -> Playwright MCP (origin ${origin}${storageState ? ', state ' + storageState : ''}, caps ${caps || '-'}, files ${outDir})`));
})().catch(e => { console.error(e); process.exit(1); });
