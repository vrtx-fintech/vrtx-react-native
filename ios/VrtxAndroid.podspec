require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'VrtxAndroid'
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

  # The VRTX.xcframework is intentionally not committed (binary, not a
  # source artefact). The package's `postinstall` (scripts/fetch-vrtx-ios.mjs)
  # downloads it on `npm install` so it's already on disk by the time
  # `pod install` resolves this entry.
  s.vendored_frameworks = 'Frameworks/VRTX.xcframework'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = '*.{h,m,mm,swift,hpp,cpp}'
end
