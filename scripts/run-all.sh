#!/usr/bin/env zsh
set -euo pipefail

if [[ -s "$HOME/.nvm/nvm.sh" ]]; then
  source "$HOME/.nvm/nvm.sh"
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PARENT_PORT="${PARENT_PORT:-3000}"
STOCK_PORT="${STOCK_PORT:-3001}"
VF_PORT="${VF_PORT:-3002}"

PIDS=()

cleanup() {
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
}

trap cleanup EXIT INT TERM

cd "$ROOT/stock-autonomy"
pnpm exec next start -p "$STOCK_PORT" &
PIDS+=($!)

cd "$ROOT/virtual-flow"
pnpm exec next start -p "$VF_PORT" &
PIDS+=($!)

cd "$ROOT/parent"
pnpm start &
PIDS+=($!)

echo "Dashboard Total running:"
echo "  Parent:         http://localhost:${PARENT_PORT}"
echo "  Stock Autonomy: http://localhost:${STOCK_PORT}"
echo "  Virtual Flow:   http://localhost:${VF_PORT}"

wait
