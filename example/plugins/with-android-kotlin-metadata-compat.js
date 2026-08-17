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
const FREE_RASP_REPOSITORY =
  'https://europe-west3-maven.pkg.dev/talsec-artifact-repository/freerasp';

module.exports = function withAndroidKotlinMetadataCompat(config) {
  return withProjectBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes('-Xskip-metadata-version-check')) {
      config.modResults.contents += `\n${KOTLIN_METADATA_COMPAT_BLOCK}\n`;
    }

    if (!config.modResults.contents.includes(FREE_RASP_REPOSITORY)) {
      config.modResults.contents = config.modResults.contents.replace(
        /allprojects\s*\{\s*repositories\s*\{/,
        (match) =>
          `${match}\n    maven { url '${FREE_RASP_REPOSITORY}' }\n    maven { url 'https://jitpack.io' }`,
      );
    }

    return config;
  });
};
