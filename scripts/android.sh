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
    resolutionStrategy {
      force("androidx.compose:compose-bom:2026.06.01")
      force("androidx.navigation:navigation-compose:2.9.8")
      force("androidx.navigation:navigation-compose-android:2.9.8")
      force("androidx.navigation:navigation-runtime:2.9.8")
      force("androidx.navigation:navigation-runtime-android:2.9.8")
      force("androidx.navigation:navigation-common:2.9.8")
      force("androidx.navigation:navigation-common-android:2.9.8")
      eachDependency {
        if (requested.group in ["androidx.compose.ui", "androidx.compose.runtime", "androidx.compose.foundation", "androidx.compose.animation"]) {
          useVersion("1.11.4")
        }
        if (requested.group == "androidx.lifecycle") {
          useVersion("2.10.0")
        }
        if (requested.group == "androidx.navigation") {
          useVersion("2.9.8")
        }
      }
    }
  }
}
  gradle.projectsEvaluated {
    allprojects {
      tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
        kotlinOptions.freeCompilerArgs += '-Xskip-metadata-version-check'
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

# Ensure the selected emulator can reach Metro on the fixed development port.
metro_port=8081
emulator_serial="$(adb devices | grep -m1 -E "^emulator-[0-9]+[[:space:]]+device" | cut -f1)"
if [[ -n "$emulator_serial" ]]; then
  echo "Using Android emulator: $emulator_serial"
  export ANDROID_SERIAL="$emulator_serial"
  adb -s "$emulator_serial" reverse "tcp:$metro_port" "tcp:$metro_port"
fi

# Build and run the debuggable Expo development app.
npx expo run:android --port "$metro_port"
