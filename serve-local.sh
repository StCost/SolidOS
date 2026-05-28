#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo ""
echo "  COLLAPSE MACHINE Web UI"
echo "  http://localhost:8765"
echo "  http://localhost:8765/Web%20Main%20Menu/index.html"
echo ""
echo "  Press Ctrl+C to stop."
echo ""

NODE_EXE=""
NPX_CMD=""

if command -v node >/dev/null 2>&1; then
  NODE_EXE="$(command -v node)"
  if command -v npx >/dev/null 2>&1; then
    NPX_CMD="$(command -v npx)"
  fi
fi

if [[ -z "$NODE_EXE" ]]; then
  echo "Node.js was not found. Install from https://nodejs.org/"
  exit 1
fi

if [[ -n "$NPX_CMD" ]]; then
  if "$NPX_CMD" --yes serve . -p 8765; then
    exit 0
  fi
  echo ""
  echo "npx serve failed, using built-in static server..."
  echo ""
fi

exec "$NODE_EXE" "$(dirname "$0")/serve-local-server.js"
