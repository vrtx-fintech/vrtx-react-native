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

  spm_dependency(
    s,
    url: 'https://github.com/vrtx-fintech/vrtx-ios.git',
    requirement: {
      kind: 'exactVersion',
      version: '0.0.15',
    },
    products: ['VRTX']
  )

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = '*.{h,m,mm,swift,hpp,cpp}'
end
