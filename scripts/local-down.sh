#!/usr/bin/env bash
# Stop the local llm-gateway stack started by scripts/local-up.sh.
set -uo pipefail
LOG=/tmp/llmgw-logs
for name in control-plane edge worker console web console-web; do
  pidfile="$LOG/$name.pid"
  [[ -f "$pidfile" ]] || continue
  pid="$(cat "$pidfile")"
  if kill -0 "$pid" 2>/dev/null; then
    pkill -TERM -P "$pid" 2>/dev/null   # children (e.g. next-server workers)
    kill -TERM "$pid" 2>/dev/null
    echo "  stopped $name (pid $pid)"
  else
    echo "  $name not running (stale pid $pid)"
  fi
  rm -f "$pidfile"
done
# safety net: any leftover app processes from this repo
for p in $(pgrep -f "apps/(control-plane|edge|worker|console)/dist/index.js" 2>/dev/null); do
  kill -TERM "$p" 2>/dev/null && echo "  cleaned stray pid $p"
done
echo "Done."
