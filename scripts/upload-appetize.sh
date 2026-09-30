#!/usr/bin/env bash
set -euo pipefail
: "${APPETIZE_TOKEN:?APPETIZE_API_TOKEN is not set}"
response=$(curl -sS --fail-with-body \
  -H "X-API-KEY: ${APPETIZE_TOKEN}" \
  --form "file=@${2}" --form "platform=${1}" \
  'https://api.appetize.io/v1/apps')
public_url=$(jq -er '.publicURL | select(type == "string" and startswith("https://"))' <<< "$response")
printf 'url=%s\n' "$public_url" >> "$GITHUB_OUTPUT"
