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
local_properties_file="$android_dir/local.properties"

configure_android() {
  if [[ ! -f "$root_build_file" || ! -f "$app_build_file" ]]; then
    echo "Expected an Expo-generated Android project at: $android_dir" >&2
    exit 1
  fi

  if [[ ! -f "$local_properties_file" ]]; then
    cat > "$local_properties_file" <<'EOF'
sdk.dir=/home/monaam/Android/Sdk
java.home=/usr/lib/jvm/java-21-openjdk-amd64

# Talsec freeRASP: Base64-encoded SHA-256 of android/app/debug.keystore.
# Replace with the certificate hash for the key that signs a release build.
VRTX_CERT_HASH=+sYXRdwJA3hvue3mKpYrOZ9zSPC7b4mbgzJmdZEDO5w=
EOF
  fi

  if ! grep -Fq 'talsec-artifact-repository/freerasp' "$root_build_file"; then
    cat >> "$root_build_file" <<'EOF'

allprojects {
  repositories {
    maven { url 'https://europe-west3-maven.pkg.dev/talsec-artifact-repository/freerasp' }
  }
  configurations.configureEach {
    resolutionStrategy.force("org.jetbrains.kotlin:kotlin-stdlib:2.1.20")
    resolutionStrategy.force("org.jetbrains.kotlin:kotlin-reflect:2.1.20")
    resolutionStrategy.force("androidx.lifecycle:lifecycle-runtime-compose-android:2.10.0")
    resolutionStrategy.force("androidx.lifecycle:lifecycle-viewmodel-compose-android:2.10.0")
    resolutionStrategy.eachDependency {
      if (requested.group == "org.jetbrains.kotlinx" && requested.name.startsWith("kotlinx-serialization-")) {
        useVersion("1.8.1")
      }
      if (requested.group == "org.jetbrains.kotlinx" && requested.name.startsWith("kotlinx-datetime")) {
        useVersion("0.7.1")
      }
    }
  }
}
EOF
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
# `postinstall` runs a cross-platform Expo prebuild. Skip it here so local
# Android testing does not need to remove an unrelated generated iOS project.
npm ci --ignore-scripts
npx expo prebuild --platform android --clean --no-install
configure_android

# Build and run the debuggable Expo development app.
npx expo run:android
