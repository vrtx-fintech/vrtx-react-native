import ExpoModulesCore

public class VrtxAndroidModule: Module {
  public func definition() -> ModuleDefinition {
    Name("VrtxAndroid")

    Constant("VERSION") {
      return "ios-stub"
    }
    Constant("LIBRARY_NAME") {
      return "vrtx-android-ios-stub"
    }

    Events("onSuccess", "onError")

    // Environment enum values
    EnumValue("Sandbox", "SANDBOX")
    EnumValue("Staging", "STAGING")

    // Language enum values
    EnumValue("English", "ENGLISH")
    EnumValue("Arabic", "ARABIC")

    // Mode enum values
    EnumValue("LIGHT", "LIGHT")
    EnumValue("DARK", "DARK")

    /**
     * Initialize and launch the Vrtx SDK UI flow.
     * 
     * Note: vrtx-android is an Android-only SDK. On iOS, this function is a no-op
     * that immediately calls onSuccess. To support iOS, integrate vrtx-ios SDK separately.
     */
    AsyncFunction("setup") { (
      clientId: String,
      clientSecret: String,
      environment: String,
      language: String,
      mode: String?,
      fontFamily: String?
    ) in
      NSLog("[VrtxAndroid] setup called on iOS (stub): clientId=\(clientId.prefix(8))..., environment=\(environment), language=\(language), mode=\(mode ?? "LIGHT"), fontFamily=\(fontFamily ?? "system")")
      self.sendEvent("onSuccess", nil)
    }
  }
}
