#!/usr/bin/env bash
set -euo pipefail
project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_root/example"

# Release bundles JS so the artifact starts without a Metro server.
output="${IOS_BUILD_DIR:-$project_root/example/ios/build/demo}"
xcodebuild -workspace ios/ReactNativeSandbox.xcworkspace \
  -scheme ReactNativeSandbox -configuration Release \
  -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath "$output" CODE_SIGN_IDENTITY=- \
  COMPILER_INDEX_STORE_ENABLE=NO build "$@"
app="$output/Build/Products/Release-iphonesimulator/ReactNativeSandbox.app"
test -s "$app/main.jsbundle"
ditto -c -k --sequesterRsrc --keepParent "$app" "$output/ios-simulator.zip"
