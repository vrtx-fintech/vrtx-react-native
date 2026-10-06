#!/usr/bin/env bash
set -euo pipefail
for name in APP_STORE_CONNECT_API_KEY_ID APP_STORE_CONNECT_API_ISSUER_ID APP_STORE_CONNECT_API_KEY_BASE64; do
  if [[ -z "${!name:-}" ]]; then echo "::error::$name is not set"; exit 1; fi
done
key_dir="$HOME/.appstoreconnect/private_keys"
key_file="$key_dir/AuthKey_${APP_STORE_CONNECT_API_KEY_ID}.p8"
mkdir -p "$key_dir"
umask 077
trap 'rm -f "$key_file"' EXIT
printf '%s' "$APP_STORE_CONNECT_API_KEY_BASE64" | base64 --decode > "$key_file"
log="$RUNNER_TEMP/vrtx-testflight-upload.log"
# altool can exit zero on a rejected upload. Require its success marker too.
xcrun altool --upload-app --type ios --file "$1" \
  --apiKey "$APP_STORE_CONNECT_API_KEY_ID" \
  --apiIssuer "$APP_STORE_CONNECT_API_ISSUER_ID" 2>&1 | tee "$log"
if grep -qE 'Failed to upload archive|ENTITY_ERROR|iris-code|ERROR:[[:space:]]*\[' "$log" || ! grep -q 'No errors uploading' "$log"; then
  echo '::error::App Store Connect did not confirm a successful upload.'
  exit 1
fi
