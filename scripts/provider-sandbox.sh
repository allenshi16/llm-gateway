#!/usr/bin/env bash
set -euo pipefail

: "${EDGE_BASE_URL:?Set EDGE_BASE_URL to the private staging Edge URL}"
: "${GATEWAY_API_KEY:?Set GATEWAY_API_KEY to a staging key}"
SANDBOX_MODEL="${SANDBOX_MODEL:-deepseek-chat}"

curl --fail-with-body --silent --show-error \
  --header "Authorization: Bearer ${GATEWAY_API_KEY}" \
  --header 'Content-Type: application/json' \
  --data "{\"model\":\"${SANDBOX_MODEL}\",\"messages\":[{\"role\":\"user\",\"content\":\"release sandbox probe\"}],\"stream\":false}" \
  "${EDGE_BASE_URL%/}/v1/chat/completions"
