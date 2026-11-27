#!/usr/bin/env bash
# IndexNow submission for bestllm.dev
# Fetches sitemap from local dev server, rewrites URLs to production domain,
# and submits to IndexNow (propagates to Bing, Yandex, Seznam, Naver, etc.)
#
# Usage:
#   bash scripts/indexnow-submit-local.sh
set -euo pipefail

PROD_HOST="bestllm.dev"
LOCAL_SITEMAP="http://127.0.0.1:4300/sitemap.xml"
KEY="0a805f9c287e0b5cf17768b8c37791f7"
KEY_LOCATION="https://${PROD_HOST}/${KEY}.txt"
ENDPOINT="https://api.indexnow.org/indexnow"

# Extract <loc> URLs from sitemap XML on stdin
extract_locs() {
  perl -0777 -ne 'while(/<loc>\s*(.*?)\s*<\/loc>/gs){$u=$1;$u=~s/\s+//g;print "$u\n" if $u=~m#^https?://#}'
}

# Rewrite localhost URLs to production domain
rewrite_to_prod() {
  sed 's|http://localhost:4300|https://bestllm.dev|g; s|http://127.0.0.1:4300|https://bestllm.dev|g'
}

TMP="$(mktemp)"
RESP="$(mktemp)"
trap 'rm -f "$TMP" "$RESP" "${RESP}.code"' EXIT

echo "Fetching sitemap from $LOCAL_SITEMAP..."
XML="$(curl -fsSL "$LOCAL_SITEMAP")"

if printf '%s' "$XML" | grep -q '<sitemapindex'; then
  echo "Sitemap index detected, fetching child sitemaps..."
  printf '%s' "$XML" | extract_locs | while read -r sm; do
    curl -fsSL "$sm" | extract_locs
  done | rewrite_to_prod | awk '!seen[$0]++' > "$TMP"
else
  printf '%s' "$XML" | extract_locs | rewrite_to_prod | awk '!seen[$0]++' > "$TMP"
fi

COUNT="$(wc -l < "$TMP" | tr -d ' ')"
if [ "$COUNT" -eq 0 ]; then
  echo "ERROR: no URLs parsed from sitemap" >&2
  exit 1
fi

echo "Found $COUNT URL(s) for $PROD_HOST:"
cat "$TMP" | sed 's/^/  /'
echo

echo "Submitting to IndexNow..."
python3 -c '
import json, sys
host, key, kloc, path = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
urls = [l.strip() for l in open(path) if l.strip()]
sys.stdout.write(json.dumps({"host": host, "key": key, "keyLocation": kloc, "urlList": urls}))
' "$PROD_HOST" "$KEY" "$KEY_LOCATION" "$TMP" \
| curl -s -o "$RESP" -w '%{http_code}' -X POST "$ENDPOINT" \
    -H 'Content-Type: application/json; charset=utf-8' --data @- > "${RESP}.code"

CODE="$(cat "${RESP}.code")"
echo "HTTP $CODE"
[ -s "$RESP" ] && { cat "$RESP"; echo; }
case "$CODE" in
  200|202) echo "✓ OK: submission accepted. Bing will re-crawl these URLs.";;
  400)     echo "✗ Bad request — check the URL list format.";;
  403)     echo "✗ Invalid key — is https://${PROD_HOST}/${KEY}.txt live?";;
  422)     echo "✗ Unprocessable — key/keyLocation mismatch, or URLs not on this host.";;
  429)     echo "⚠ Rate limited — wait and retry.";;
  *)       echo "⚠ Unexpected response code.";;
esac
