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

npx --yes serve . -p 8765
