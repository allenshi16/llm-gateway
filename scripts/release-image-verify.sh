#!/usr/bin/env bash
set -euo pipefail

: "${LITELLM_IMAGE:?Set LITELLM_IMAGE to an immutable LiteLLM image reference}"
: "${LITELLM_COSIGN_KEY:?Set LITELLM_COSIGN_KEY to the pinned LiteLLM cosign public key URL or file}"

if [[ "${LITELLM_IMAGE}" != *@sha256:* ]]; then
  printf '%s\n' 'LITELLM_IMAGE must be pinned by digest' >&2
  exit 1
fi

if ! command -v cosign >/dev/null 2>&1; then
  printf '%s\n' 'cosign is required for release verification' >&2
  exit 1
fi

cosign verify --key "${LITELLM_COSIGN_KEY}" "${LITELLM_IMAGE}"
