import ExpoModulesCore
import VRTX

public class VrtxSdkModule: Module {
  public func definition() -> ModuleDefinition {
    Name("VrtxSdk")

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
      externalReference: String?,
      promise: Promise
    ) in
      // Fully qualify the SDK enum: ExpoModulesCore (Expo 56+) transitively
      // brings SwiftUI into scope, and SwiftUI also exports an `Environment`
      // type, so the bare name is ambiguous.
      let env: VRTX.Environment = (environment.uppercased() == "STAGING") ? .staging : .sandbox
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
          externalReference: externalReference,
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
