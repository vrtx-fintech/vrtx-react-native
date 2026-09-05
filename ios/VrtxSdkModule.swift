import ExpoModulesCore
import VRTX

/// Carries the SDK's error message through to JavaScript.
///
/// `Promise.reject(_ code:_ description:)` cannot: it builds a base
/// `ExpoModulesCore.Exception`, which assigns `description` but leaves `reason`
/// at its default literal `"undefined reason"` — and `reason` is what reaches
/// JS. A caller therefore saw `VRX_ERROR: undefined reason` instead of why the
/// SDK actually failed. Subclassing `GenericException` and overriding `reason`
/// is the documented way to surface a message.
///
/// Android has always been correct here: `CodedException("VRX_ERROR", message,
/// null)` passes the message through, and falls back when it is absent. This
/// keeps the two platforms consistent.
internal final class VrtxException: GenericException<String> {
  /// Mirrors Android's fallback so neither platform can surface a blank error.
  static let unknownReason = "Unknown error"

  override var code: String { "VRX_ERROR" }
  override var reason: String { param }
}

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
      let env: VRTX.Environment = (environment.uppercased() == "PRODUCTION") ? .production : .sandbox
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
          externalReference: externalReference,
          fontFamily: font,
          onSuccess: {
            promise.resolve(nil)
            self.sendEvent("onSuccess")
          },
          onError: { error in
            let message = error.message.isEmpty ? VrtxException.unknownReason : error.message
            promise.reject(VrtxException(message))
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
