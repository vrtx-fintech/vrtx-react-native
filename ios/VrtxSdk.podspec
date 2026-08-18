require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'VrtxSdk'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms      = {
    :ios => '15.6'
  }
  s.swift_version  = '5.9'
  s.source         = { git: 'https://github.com/vrtx-fintech/vrtx-react-native' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # The Vrtx iOS SDK ships as a binary XCFramework published to CocoaPods
  # trunk (https://github.com/vrtx-fintech/vrtx-ios). CocoaPods downloads and
  # embeds it automatically, mirroring how Android pulls `vrtx-android` from
  # Maven Central. Keep this version aligned with the VRTX pod release.
  # 0.1.6 exposes the environment case as `production`, matching the Android
  # SDK and what VrtxSdkModule.swift already passes. It also drops DeviceKit
  # from the framework's public .swiftinterface, so consumers no longer need
  # that module to compile against VRTX — which is why no DeviceKit dependency
  # is declared here any more.
  #
  # Do not go below 0.1.6: earlier pods either could not resolve TalsecRuntime
  # at all, or leaked DeviceKit into the ABI and failed with "cannot load
  # underlying module for 'DeviceKit'" on any toolchain that had to rebuild the
  # interface.
  s.dependency 'VRTX', '0.1.6'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = '*.{h,m,mm,swift,hpp,cpp}'
end
