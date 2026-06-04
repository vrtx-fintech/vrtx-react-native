const { withProjectBuildGradle } = require('@expo/config-plugins');

const KOTLIN_METADATA_COMPAT_BLOCK = `
subprojects { subproject ->
  subproject.tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
    kotlinOptions {
      freeCompilerArgs += ['-Xskip-metadata-version-check']
    }
  }
}
`;

module.exports = function withAndroidKotlinMetadataCompat(config) {
  return withProjectBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes('-Xskip-metadata-version-check')) {
      config.modResults.contents += `\n${KOTLIN_METADATA_COMPAT_BLOCK}\n`;
    }

    return config;
  });
};
