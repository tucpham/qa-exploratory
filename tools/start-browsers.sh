#!/usr/bin/env bash
# Start one browser daemon (persistent Playwright MCP session) per agent.
# Parallel agents never share a browser, cookie or page.
# Usage: tools/start-browsers.sh <allowed-origin> <port> [<port>...]
# Example: tools/start-browsers.sh http://localhost:4100 8931 8932 8933
set -euo pipefail
ORIGIN="$1"; shift
cd "$(dirname "$0")/.."
mkdir -p reports/artifacts
for PORT in "$@"; do
  node tools/browser-daemon.js "$PORT" "$ORIGIN" > "reports/artifacts/daemon-$PORT.log" 2>&1 &
  echo "browser daemon :$PORT (pid $!)"
done
wait
