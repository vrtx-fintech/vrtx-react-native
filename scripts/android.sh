#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

configure_only=false

if [[ "${1:-}" == "--configure-only" ]]; then
  configure_only=true
  shift
fi

android_dir="${1:-$project_root/example/android}"
root_build_file="$android_dir/build.gradle"
app_build_file="$android_dir/app/build.gradle"
gradle_properties_file="$android_dir/gradle.properties"
local_properties_file="$android_dir/local.properties"

configure_android() {
  if [[ ! -f "$root_build_file" || ! -f "$app_build_file" ]]; then
    echo "Expected an Expo-generated Android project at: $android_dir" >&2
    exit 1
  fi

  if ! grep -Fq 'android.suppressUnsupportedCompileSdk=37.0' "$gradle_properties_file"; then
    printf '\nandroid.suppressUnsupportedCompileSdk=37.0\n' >> "$gradle_properties_file"
  fi

  # Resolve the local SDK from the environment or the standard host location.
  # Preserve an existing path and never hard-code a developer's home directory.
  if ! grep -q '^sdk.dir=' "$local_properties_file" 2>/dev/null; then
    sdk_dir="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"
    if [[ -z "$sdk_dir" ]]; then
      if [[ "$(uname -s)" == Darwin ]]; then sdk_dir="$HOME/Library/Android/sdk";
      else sdk_dir="$HOME/Android/Sdk"; fi
    fi
    if [[ -d "$sdk_dir" ]]; then printf '\nsdk.dir=%s\n' "$sdk_dir" >> "$local_properties_file"; fi
  fi

  # A local debug build uses the generated key. iOS-only installs may have no
  # JDK, so leave an actionable warning rather than failing their postinstall.
  if [[ -z "${VRTX_CERT_HASH:-}" ]] && ! grep -q '^VRTX_CERT_HASH=' "$local_properties_file" 2>/dev/null; then
    if [[ -f "$android_dir/app/debug.keystore" ]] && command -v keytool >/dev/null; then
      if debug_hash="$(keytool -exportcert -keystore "$android_dir/app/debug.keystore" \
        -storepass android -alias androiddebugkey | openssl dgst -sha256 -binary | openssl base64 -A)"; then
        printf '\nVRTX_CERT_HASH=%s\n' "$debug_hash" >> "$local_properties_file"
      else
        echo 'Configure a JDK or set VRTX_CERT_HASH before running the Android demo.' >&2
      fi
    fi
  fi

  if ! grep -Fq 'manifestPlaceholders.vrtxCertHash' "$app_build_file"; then
    cat >> "$app_build_file" <<'EOF'

android {
  defaultConfig {
    def vrtxLocalProperties = new Properties()
    def vrtxLocalPropertiesFile = rootProject.file("local.properties")
    if (vrtxLocalPropertiesFile.exists()) {
      vrtxLocalPropertiesFile.withInputStream { vrtxLocalProperties.load(it) }
    }
    manifestPlaceholders.vrtxPackageName = applicationId
    manifestPlaceholders.vrtxCertHash = System.getenv("VRTX_CERT_HASH") ?: vrtxLocalProperties.getProperty("VRTX_CERT_HASH", "")
  }
}
EOF
  fi

}

if "$configure_only"; then
  configure_android
  exit 0
fi

cd "$project_root/example"
npm ci --ignore-scripts
exec npm run android -- "$@"
