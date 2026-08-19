#!/usr/bin/env bash

set -euo pipefail

readonly APP_ID="sa.vrtx.reactnative.example"
readonly METRO_PORT="8081"

emulator_serial="$({ adb devices | awk '$1 ~ /^emulator-[0-9]+$/ && $2 == "device" { print $1; exit }'; })"

if [[ -z "${emulator_serial}" ]]; then
  echo "No running Android emulator found. Start an AVD, then run npm run android:dev again." >&2
  exit 1
fi

echo "Using Android emulator: ${emulator_serial}"
adb -s "${emulator_serial}" reverse "tcp:${METRO_PORT}" "tcp:${METRO_PORT}"

# An old debug process can retain a stale Metro connection after an environment
# or native configuration change. Ignore the first-install case, where no app
# process exists yet.
adb -s "${emulator_serial}" shell am force-stop "${APP_ID}" || true

exec npx expo run:android --variant debug --device "${emulator_serial}"
