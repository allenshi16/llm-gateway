#!/usr/bin/env bash
# Local deployment runner for llm-gateway.
# Reuses the already-running Postgres (15432) and Redis (16379) on this machine.
# Starts: control-plane(4100), edge(4000), worker, console legacy BFF(4200),
#         web(4300), console-web(4301).
# Logs -> /tmp/llmgw-logs/*.log ; real PIDs -> /tmp/llmgw-logs/*.pid
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
LOG=/tmp/llmgw-logs; mkdir -p "$LOG"
export BUN_INSTALL="$HOME/.bun"; export PATH="$BUN_INSTALL/bin:$HOME/.local/bin:$PATH"
NEXT="$ROOT/node_modules/.bin/next"

# load env (commented lines like RESEND_API_KEY stay unset)
set -a; . "$ROOT/.env"; set +a

# start <name> <dir> <cmd...>  -- nohup+exec so $! is the real process pid
start(){
  local name="$1" dir="$2"; shift 2
  local cmd; cmd="$(printf '%q ' "$@")"
  nohup bash -c "cd $(printf '%q' "$dir") && exec $cmd" >"$LOG/$name.log" 2>&1 </dev/null &
  echo $! > "$LOG/$name.pid"
  echo "  started $name (pid $(cat "$LOG/$name.pid"))"
}

echo "Starting llm-gateway stack..."
start control-plane "$ROOT"               node apps/control-plane/dist/index.js
start edge          "$ROOT"               node apps/edge/dist/index.js
start worker        "$ROOT"               node apps/worker/dist/index.js
start console       "$ROOT"               node apps/console/dist/index.js
start web           "$ROOT/apps/web"         env NODE_ENV=production "$NEXT" start -p 4300
start console-web   "$ROOT/apps/console-web" env NODE_ENV=production "$NEXT" start -p 4301

# Cloudflare Tunnel is NOT started here: it runs as a systemd service in
# local-config mode (`systemctl status cloudflared`, config /etc/cloudflared/config.yml,
# ingress bestllm.dev -> localhost:4300). Manage it with:
#   sudo systemctl restart cloudflared
echo "  cloudflared: managed by systemd (sudo systemctl restart cloudflared)"

sleep 6
echo
echo "Health:"
for u in http://127.0.0.1:4100/health http://127.0.0.1:4000/health http://127.0.0.1:4300/ http://127.0.0.1:4301/; do
  printf "  %-34s -> %s\n" "$u" "$(curl -s -m6 -o /dev/null -w '%{http_code}' "$u" || echo ERR)"
done
echo
echo "URLs: web http://127.0.0.1:4300 | console-web http://127.0.0.1:4301 | console(legacy) http://127.0.0.1:4200"
echo "      edge http://127.0.0.1:4000 | control-plane http://127.0.0.1:4100"
echo "Logs: $LOG/*.log   Stop: scripts/local-down.sh"
