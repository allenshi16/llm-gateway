#!/usr/bin/env bash
# Start the private LiteLLM data-plane proxy on :4302 (host network).
#
# CRITICAL: this proxy must be STATELESS. Do NOT pass DATABASE_URL to it.
# LiteLLM bundles Prisma; if it sees DATABASE_URL it runs its own migrations
# against the authoritative gateway Postgres and DROPS our schema. We only ever
# pass LITELLM_MASTER_KEY + the upstream aggregator creds.
#
# Upstream is an OpenAI-compatible aggregator defined in infra/litellm/config.yaml
# (public alias "deepseek-chat" -> openai/<QNAIGC_MODEL> at QNAIGC_BASE_URL).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Load secrets from .env into the shell WITHOUT exporting them to the container
# wholesale (we re-pass only the three vars LiteLLM needs below).
set -a; . ./.env; set +a

IMAGE="${LITELLM_IMAGE:-ghcr.io/berriai/litellm:v1.95.1}"
# The .env LITELLM_IMAGE may hold an unverified digest placeholder; fall back to
# the pinned tag if it is not a usable image reference.
case "$IMAGE" in
  *replace-with-registry-verified-digest*) IMAGE="ghcr.io/berriai/litellm:v1.95.1" ;;
esac

NAME="llmgw-litellm"

echo "==> removing any existing $NAME container"
docker rm -f "$NAME" >/dev/null 2>&1 || true

echo "==> starting LiteLLM ($IMAGE) on :4302, stateless (no DATABASE_URL)"
docker run -d --name "$NAME" --network host --restart unless-stopped \
  -e LITELLM_MASTER_KEY="$LITELLM_MASTER_KEY" \
  -e QNAIGC_BASE_URL="$QNAIGC_BASE_URL" \
  -e QNAIGC_API_KEY="$QNAIGC_API_KEY" \
  -e STORE_MODEL_IN_DB="False" \
  -v "$ROOT/infra/litellm/config.yaml:/app/config.yaml:ro" \
  "$IMAGE" \
  --config /app/config.yaml --port 4302 >/dev/null

echo "==> waiting for :4302 to listen"
for _ in $(seq 1 90); do
  if ss -ltn 2>/dev/null | grep -q ':4302'; then
    echo "LiteLLM is listening on :4302"
    exit 0
  fi
  sleep 1
done

echo "LiteLLM did not open :4302 in time; check: docker logs $NAME" >&2
exit 1
