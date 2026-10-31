#!/usr/bin/env node
// Oracle runner: node oracles/run.js <project>
// Loads oracles/<project>.js, which checks project RULES against real data (API/DB read-only)
// and prints violations as JSON. Agents use the output as evidence; it never modifies data.
const path = require('path');
const project = process.argv[2];
if (!project) { console.error('Usage: node oracles/run.js <project>'); process.exit(2); }
require(path.join(__dirname, `${project}.js`))().then(v => {
  console.log(JSON.stringify({ project, checkedAt: new Date().toISOString(), violations: v }, null, 2));
}).catch(e => { console.error('oracle failed: ' + e.message); process.exit(1); });
