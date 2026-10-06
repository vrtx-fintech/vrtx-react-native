#!/usr/bin/env bash
set -euo pipefail
: "${RUNNER_TEMP:?This script is for the CI runner}"
signing_dir="$RUNNER_TEMP/vrtx-ios-signing"
keychain="$signing_dir/build.keychain-db"

if [[ "${1:-}" == cleanup ]]; then
  if [[ -f "$signing_dir/keychains.txt" ]]; then
    python3 - "$signing_dir/keychains.txt" <<'PY'
import shlex, subprocess, sys
from pathlib import Path
subprocess.run(['security', 'list-keychains', '-d', 'user', '-s', *shlex.split(Path(sys.argv[1]).read_text())], check=True)
PY
  fi
  if [[ -f "$signing_dir/profile-path" ]]; then
    rm -f "$(cat "$signing_dir/profile-path")"
  fi
  if [[ -e "$keychain" ]]; then security delete-keychain "$keychain"; fi
  rm -rf "$signing_dir"
  exit 0
fi

for name in IOS_DISTRIBUTION_CERT_BASE64 IOS_DISTRIBUTION_CERT_PASSWORD IOS_PROVISIONING_PROFILE_BASE64 KEYCHAIN_PASSWORD; do
  if [[ -z "${!name:-}" ]]; then echo "::error::$name is not set"; exit 1; fi
done
umask 077
mkdir -p "$signing_dir"
printf '%s' "$IOS_DISTRIBUTION_CERT_BASE64" | base64 --decode > "$signing_dir/certificate.p12"
printf '%s' "$IOS_PROVISIONING_PROFILE_BASE64" | base64 --decode > "$signing_dir/profile.mobileprovision"
security cms -D -i "$signing_dir/profile.mobileprovision" > "$signing_dir/profile.plist"
python3 - "$signing_dir" <<'PY'
import datetime, json, plistlib, shutil, sys
from pathlib import Path
root = Path(sys.argv[1])
profile = plistlib.loads((root / 'profile.plist').read_bytes())
bundle_id = json.loads(Path('example/app.json').read_text())['expo']['ios']['bundleIdentifier']
team = profile['TeamIdentifier'][0]
if profile['Entitlements']['application-identifier'] != f"{profile['ApplicationIdentifierPrefix'][0]}.{bundle_id}":
    raise SystemExit('Provisioning profile does not match the demo bundle identifier')
if profile['ExpirationDate'] <= datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None):
    raise SystemExit('Provisioning profile has expired')
if profile.get('ProvisionedDevices') or profile.get('ProvisionsAllDevices') or profile['Entitlements'].get('get-task-allow'):
    raise SystemExit('TestFlight requires an App Store distribution provisioning profile')
profile_path = Path.home() / 'Library/MobileDevice/Provisioning Profiles' / f"{profile['UUID']}.mobileprovision"
profile_path.parent.mkdir(parents=True, exist_ok=True)
(root / 'profile-path').write_text(str(profile_path))
shutil.copyfile(root / 'profile.mobileprovision', profile_path)
(root / 'metadata.json').write_text(json.dumps({'team': team, 'uuid': profile['UUID']}))
with (root / 'ExportOptions.plist').open('wb') as out:
    plistlib.dump({'method': 'app-store-connect', 'teamID': team, 'signingStyle': 'manual',
                  'provisioningProfiles': {bundle_id: profile['UUID']}, 'uploadSymbols': True,
                  'stripSwiftSymbols': True, 'manageAppVersionAndBuildNumber': False}, out)
PY
security list-keychains -d user > "$signing_dir/keychains.txt"
security create-keychain -p "$KEYCHAIN_PASSWORD" "$keychain"
security set-keychain-settings -lut 21600 "$keychain"
security unlock-keychain -p "$KEYCHAIN_PASSWORD" "$keychain"
security import "$signing_dir/certificate.p12" -P "$IOS_DISTRIBUTION_CERT_PASSWORD" -A -t cert -f pkcs12 -k "$keychain"
security set-key-partition-list -S apple-tool:,apple:,codesign: -k "$KEYCHAIN_PASSWORD" "$keychain"
python3 - "$signing_dir/keychains.txt" "$keychain" <<'PY'
import shlex, subprocess, sys
from pathlib import Path
subprocess.run(['security', 'list-keychains', '-d', 'user', '-s', sys.argv[2], *shlex.split(Path(sys.argv[1]).read_text())], check=True)
PY
# Only the application target receives provisioning settings, never pod targets.
node example/scripts/sign-ios.js "$signing_dir/metadata.json"
rm -f "$signing_dir/certificate.p12" "$signing_dir/profile.plist" "$signing_dir/profile.mobileprovision"
