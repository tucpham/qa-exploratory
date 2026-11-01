#!/usr/bin/env node
// Test data setup (fixtures): put the test object into a precondition state WITHOUT clicking through the UI,
// so an exploratory session spends its budget on the step under test, not on setup.
//
//   node fixtures/run.js <project> list
//   node fixtures/run.js <project> <fixture> '{"prefix":"QA-run-002-tester-1-","state":"approved"}'
//
// Rules: every fixture must create data inside a test data namespace (prefix starting with "QA-"),
// never touch baseline data, and print what it created as JSON (ids, numbers) for the flow state file.
const { loadEnv, parseArgs, loadProjectModule, printJson } = require('../tools/lib/common');

(async () => {
  loadEnv();
  const { pos } = parseArgs(process.argv.slice(2));
  const [project, name = 'list', raw] = pos;
  if (!project) { console.error('Usage: node fixtures/run.js <project> <fixture|list> [json-args]'); process.exit(2); }
  const mod = loadProjectModule('fixtures', project);
  if (name === 'list') {
    printJson(Object.entries(mod.fixtures).map(([k, f]) => ({ fixture: k, description: f.description, args: f.args })));
    return;
  }
  const f = mod.fixtures[name];
  if (!f) throw new Error(`Unknown fixture "${name}". Available: ${Object.keys(mod.fixtures).join(', ')}`);
  const args = raw ? JSON.parse(raw) : {};
  if (f.writes !== false) {
    if (!args.prefix || !/^QA-[A-Za-z0-9-]*$/.test(args.prefix)) throw new Error('Writing fixtures need args.prefix matching ^QA-[A-Za-z0-9-]*$ (test data namespace)');
  }
  const result = await f.run(args);
  printJson({ project, fixture: name, args, createdAt: new Date().toISOString(), result });
})().catch(e => { console.error('fixture failed: ' + e.message); process.exit(1); });
