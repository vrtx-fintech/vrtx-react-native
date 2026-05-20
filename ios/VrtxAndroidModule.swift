import ExpoModulesCore
import VRTX

public class VrtxAndroidModule: Module {
  public func definition() -> ModuleDefinition {
    Name("VrtxAndroid")

    Constant("LIBRARY_NAME") {
      return "vrtx-ios"
    }

    Events("onSuccess", "onError")

    /**
     * Initialize and launch the Vrtx SDK UI flow on iOS via the vrtx-ios
     * SDK (VRTX.xcframework). Mirrors the Android Vrtx.setup contract.
     */
    AsyncFunction("setup") { (
      clientId: String,
      clientSecret: String,
      environment: String,
      language: String,
      mode: String?,
      fontFamily: String?,
      promise: Promise
    ) in
      let env: Environment = (environment.uppercased() == "STAGING") ? .staging : .sandbox
      let lang: Language = (language.uppercased() == "ARABIC") ? .arabic : .english
      let theme: Mode = (mode?.uppercased() == "DARK") ? .dark : .light
      let font = fontFamily ?? ""

      DispatchQueue.main.async { [weak self] in
        guard let self else { return }
        Vrtx.setup(
          environment: env,
          clientID: clientId,
          clientSecret: clientSecret,
          mode: theme,
          language: lang,
          fontFamily: font,
          onSuccess: {
            promise.resolve(nil)
            self.sendEvent("onSuccess")
          },
          onError: { error in
            let message = error.message
            promise.reject("VRX_ERROR", message)
            self.sendEvent("onError", [
              "code": "VRX_ERROR",
              "message": message
            ])
          }
        )
      }
    }
  }
}
