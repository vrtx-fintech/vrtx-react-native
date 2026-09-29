const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withAndroidDebugMetro(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const debugDir = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'src',
        'debug',
      );
      const manifestPath = path.join(debugDir, 'AndroidManifest.xml');
      const xmlDir = path.join(debugDir, 'res', 'xml');
      const networkConfig = [
        '<?xml version="1.0" encoding="utf-8"?>',
        '<network-security-config>',
        '  <domain-config cleartextTrafficPermitted="true">',
        '    <domain includeSubdomains="true">10.0.2.2</domain>',
        '    <domain includeSubdomains="true">localhost</domain>',
        '  </domain-config>',
        '</network-security-config>',
        '',
      ].join('\n');

      fs.mkdirSync(xmlDir, { recursive: true });
      fs.writeFileSync(
        path.join(xmlDir, 'network_security_config_debug.xml'),
        networkConfig,
      );

      const defaultManifest = [
        '<manifest xmlns:android="http://schemas.android.com/apk/res/android" xmlns:tools="http://schemas.android.com/tools">',
        '  <application android:networkSecurityConfig="@xml/network_security_config_debug" tools:replace="android:networkSecurityConfig" />',
        '</manifest>',
        '',
      ].join('\n');
      let manifest = fs.existsSync(manifestPath)
        ? fs.readFileSync(manifestPath, 'utf8')
        : defaultManifest;

      if (
        !manifest.includes('android:networkSecurityConfig') &&
        manifest.includes('<application ')
      ) {
        manifest = manifest.replace(
          '<application ',
          '<application android:networkSecurityConfig="@xml/network_security_config_debug" ',
        );
      }

      if (manifest.includes('tools:replace=')) {
        manifest = manifest.replace(
          /tools:replace="([^"]*)"/,
          (match, value) =>
            value.includes('android:networkSecurityConfig')
              ? match
              : 'tools:replace="' + value + ',android:networkSecurityConfig"',
        );
      } else if (manifest.includes('<application ')) {
        manifest = manifest.replace(
          '<application ',
          '<application tools:replace="android:networkSecurityConfig" ',
        );
      }

      fs.writeFileSync(manifestPath, manifest);
      return config;
    },
  ]);
};
