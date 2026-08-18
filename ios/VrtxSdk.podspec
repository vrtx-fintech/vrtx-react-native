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
  # 0.1.4 is the first pod release that is actually installable. Earlier
  # versions vendored only VRTX.xcframework and declared no dependencies, so
  # neither DeviceKit nor TalsecRuntime was available — and VRTX ships only a
  # .swiftinterface, so `import VRTX` recompiles it and fails on its own
  # `import TalsecRuntime`. Talsec publishes no pod, so there was no way for a
  # consumer to supply it. 0.1.4 vendors TalsecRuntime.xcframework itself.
  s.dependency 'VRTX', '0.1.4'
  # VRTX 0.1.4 also declares DeviceKit transitively; it stays declared here,
  # pinned to the exact version the xcframework is compiled against, because a
  # module built by a different DeviceKit is a build error, not a soft
  # incompatibility.
  s.dependency 'DeviceKit', '5.7.0'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = '*.{h,m,mm,swift,hpp,cpp}'
end
