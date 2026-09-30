#!/usr/bin/env bash
set -euo pipefail
project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
mode="${1:-run}"
shift || true
cd "$project_root/example"

case "$mode" in
  run)
    npm ci --ignore-scripts
    exec npm run ios -- "$@"
    ;;
  simulator)
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
    ;;
  *) echo 'Usage: bash scripts/ios.sh [run|simulator] [build options]' >&2; exit 1 ;;
esac
