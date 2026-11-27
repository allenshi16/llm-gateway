#!/usr/bin/env bash
# fx-reprice-check.sh — periodic USD/CNY sanity check for the Qiniu cost-pass-through
# catalog. If the live mid-market rate has drifted from the rate baked into the
# generator by more than FX_THRESHOLD_PCT, it re-prices the COMMERCIAL DB so gateway
# billing tracks real cost (append-only version bump via t5).
#
# What is automated vs. manual:
#   AUTOMATED : generator FX constant -> regenerate t4/t5/json/yaml -> apply t5 to DB.
#               Billing (price_versions) is the financial source of truth, so it is
#               corrected unattended (guarded by dual-source + sane-band validation).
#   MANUAL    : marketing DISPLAY prices are hardcoded strings in
#               packages/brand/src/models.ts and the blog comparison tables. They are
#               NOT auto-edited (prose/ratios need a human). On a reprice the script
#               logs an ACTION REQUIRED line and (optionally) sends a notification.
#
# No sudo / docker needed: applies SQL over DATABASE_URL via scripts/fx-reprice-apply.mjs.
#
# Env overrides (all optional):
#   FX_THRESHOLD_PCT  drift %% that triggers a reprice        (default 2)
#   FX_SANE_MIN/MAX   plausible USD/CNY band                  (default 5.5 / 8.5)
#   FX_AGREE_TOL      max relative disagreement between the 2 sources (default 0.015)
#   FX_PROXY          HTTP proxy for the rate fetch           (default http://127.0.0.1:10809)
#   FX_OVERRIDE_RATE  skip the fetch, use this rate (testing/manual)
#   FX_DRY_RUN=1      compute + log the decision, change nothing
#   FX_SERVERCHAN_KEY Server酱 SendKey for alerts
#   FX_NOTIFY_URL     generic webhook (飞书-style text message) for alerts
#
# Cron (daily 06:30): 30 6 * * * /home/allen/project/llm-gateway/scripts/fx-reprice-check.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
LOGDIR=/tmp/llmgw-logs; mkdir -p "$LOGDIR"
LOG="$LOGDIR/fx-reprice.log"
LOCK="$LOGDIR/fx-reprice.lock"
GEN="$ROOT/infra/catalog/build-qiniu-catalog.mjs"
T5="$ROOT/infra/postgres/t5-qiniu-reprice.sql"

# node lives under nvm; cron has a minimal PATH, so resolve it explicitly.
NODE_BIN="$(ls -d /home/allen/.nvm/versions/node/*/bin 2>/dev/null | sort -V | tail -1)"
export PATH="${NODE_BIN:-/usr/bin}:/usr/local/bin:/usr/bin:/bin"
NODE="${NODE_BIN:-}/node"; [ -x "$NODE" ] || NODE="$(command -v node)"

THRESHOLD="${FX_THRESHOLD_PCT:-2}"
SANE_MIN="${FX_SANE_MIN:-5.5}"
SANE_MAX="${FX_SANE_MAX:-8.5}"
AGREE="${FX_AGREE_TOL:-0.015}"
PROXY="${FX_PROXY:-http://127.0.0.1:10809}"
URL1="https://open.er-api.com/v6/latest/USD"
URL2="https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json"

log(){ printf '%s %s\n' "$(date -u +%FT%TZ)" "$*" | tee -a "$LOG"; }

notify(){
  local msg="$1"
  if [ -n "${FX_SERVERCHAN_KEY:-}" ]; then
    curl -s -m 20 --proxy "$PROXY" "https://sctapi.ftqq.com/${FX_SERVERCHAN_KEY}.send" \
      --data-urlencode "title=LLM Gateway: FX reprice" --data-urlencode "desp=${msg}" >/dev/null 2>&1 \
      && log "alert sent via Server酱" || log "Server酱 alert FAILED"
  fi
  if [ -n "${FX_NOTIFY_URL:-}" ]; then
    local body; body="$(MSG="$msg" python3 -c 'import json,os;print(json.dumps({"msg_type":"text","content":{"text":os.environ["MSG"]}}))')"
    curl -s -m 20 --proxy "$PROXY" -X POST "$FX_NOTIFY_URL" -H 'Content-Type: application/json' -d "$body" >/dev/null 2>&1 \
      && log "alert sent via FX_NOTIFY_URL" || log "FX_NOTIFY_URL alert FAILED"
  fi
}

# single-instance guard
exec 9>"$LOCK"
if command -v flock >/dev/null; then flock -n 9 || { log "another run holds the lock; exiting"; exit 0; }; fi

# load DATABASE_URL (+ optional notify creds) without exporting secrets to the log
set -a; . "$ROOT/.env"; set +a

# ---- current FX baked into the generator ----
CUR="$(sed -nE 's/^const FX = ([0-9]+(\.[0-9]+)?);.*/\1/p' "$GEN" | head -1)"
if [ -z "$CUR" ]; then log "could not parse 'const FX = <n>;' from $GEN; aborting"; exit 1; fi

# ---- live rate (dual source, validated) ----
if [ -n "${FX_OVERRIDE_RATE:-}" ]; then
  LIVE="$FX_OVERRIDE_RATE"
  log "using FX_OVERRIDE_RATE=$LIVE (fetch skipped)"
else
  export https_proxy="$PROXY" http_proxy="$PROXY"
  J1="$(curl -s -m 20 "$URL1" || true)"
  J2="$(curl -s -m 20 "$URL2" || true)"
  unset https_proxy http_proxy
  if ! LIVE="$(J1="$J1" J2="$J2" SANE_MIN="$SANE_MIN" SANE_MAX="$SANE_MAX" AGREE="$AGREE" python3 - <<'PY' 2>>"$LOG"
import os, sys, json
def g(env, *path):
    try:
        d = json.loads(os.environ[env])
        for k in path: d = d[k]
        return float(d)
    except Exception:
        return None
a = g("J1", "rates", "CNY")            # open.er-api.com
b = g("J2", "usd", "cny")              # fawazahmed0 currency-api
mn, mx, ag = float(os.environ["SANE_MIN"]), float(os.environ["SANE_MAX"]), float(os.environ["AGREE"])
if a is None or b is None:
    sys.stderr.write(f"FX fetch failed (er-api={a}, fawaz={b})\n"); sys.exit(3)
for v in (a, b):
    if not (mn <= v <= mx):
        sys.stderr.write(f"FX {v} outside sane band [{mn},{mx}]\n"); sys.exit(4)
if abs(a - b) / ((a + b) / 2) > ag:
    sys.stderr.write(f"FX sources disagree >{ag}: {a} vs {b}\n"); sys.exit(5)
print(round((a + b) / 2, 4))
PY
)"; then
    log "FX fetch/validation FAILED (details above); no changes made"
    exit 1
  fi
fi

DEV="$(python3 -c "c=float('$CUR'); l=float('$LIVE'); print(round(abs(l-c)/c*100, 3))")"

if python3 -c "import sys; sys.exit(0 if float('$DEV') < float('$THRESHOLD') else 1)"; then
  log "OK: FX current=$CUR live=$LIVE dev=${DEV}% < threshold=${THRESHOLD}% — no reprice"
  exit 0
fi

log "DRIFT: FX current=$CUR live=$LIVE dev=${DEV}% >= threshold=${THRESHOLD}%"
if [ "${FX_DRY_RUN:-0}" = "1" ]; then
  log "FX_DRY_RUN=1 — would reprice DB to $LIVE and flag marketing for manual sync. Nothing changed."
  exit 0
fi

# ---- reprice: generator FX -> regenerate -> apply t5 (append-only) ----
cp "$GEN" "$GEN.bak"
if ! sed -i -E "s/^const FX = [0-9]+(\.[0-9]+)?;/const FX = ${LIVE};/" "$GEN"; then
  log "sed on generator FAILED; restoring backup"; mv "$GEN.bak" "$GEN"; exit 1
fi
if ! "$NODE" "$GEN" >>"$LOG" 2>&1; then
  log "generator FAILED after FX edit; restoring backup"; mv "$GEN.bak" "$GEN"; exit 1
fi
rm -f "$GEN.bak"
if ! "$NODE" "$ROOT/scripts/fx-reprice-apply.mjs" "$T5" >>"$LOG" 2>&1; then
  log "t5 apply FAILED; DB unchanged this run (generator FX now $LIVE — review)"; exit 1
fi
log "DB repriced to FX=$LIVE (append-only version bump). Regenerated t4/t5/json/yaml."
MSG="Gateway billing re-priced: USD/CNY $CUR -> $LIVE (drift ${DEV}%). DB price_versions bumped (cost pass-through). ACTION REQUIRED: marketing display prices are hardcoded — update packages/brand/src/models.ts + blog tables (best-chinese-models-2026, deepseek-vs-qwen) + /pricing metadata to the new USD in infra/catalog/qiniu-models.json, then rebuild+restart web."
log "ACTION REQUIRED: $MSG"
notify "$MSG"
