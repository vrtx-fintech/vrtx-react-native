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
  s.dependency 'VRTX', '0.1.2'
  # VRTX 0.1.2 imports DeviceKit from its public Swift interface. Declare it
  # here so CocoaPods links it for consumers of this React Native module.
  s.dependency 'DeviceKit'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = '*.{h,m,mm,swift,hpp,cpp}'
end
