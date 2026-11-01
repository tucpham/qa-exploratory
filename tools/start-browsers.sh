#!/usr/bin/env bash
# Start one browser daemon (persistent Playwright MCP session) per agent.
# Parallel agents never share a browser, cookie or page.
# Usage: tools/start-browsers.sh <allowed-origin> <port>[:<storage-state>] [...]
# Example: tools/start-browsers.sh http://localhost:4100 8931 8932 8933
# Multi-role (1 agent drives 2 roles at once, e.g. concurrency / approval flows):
#   tools/start-browsers.sh http://localhost:4100 8931:.auth/miniacc/staff1.storage-state.json 8934:.auth/miniacc/manager1.storage-state.json
set -euo pipefail
ORIGIN="$1"; shift
cd "$(dirname "$0")/.."
mkdir -p reports/artifacts
for SPEC in "$@"; do
  PORT="${SPEC%%:*}"; STATE=""
  [[ "$SPEC" == *:* ]] && STATE="${SPEC#*:}"
  node tools/browser-daemon.js "$PORT" "$ORIGIN" $STATE > "reports/artifacts/daemon-$PORT.log" 2>&1 &
  echo "browser daemon :$PORT (pid $!) ${STATE:+state=$STATE}"
done
wait
