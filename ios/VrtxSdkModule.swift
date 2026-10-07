import Foundation
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

    Events("onSuccess", "onError", "onExit")

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
      designOptionName: String?,
      themeJson: String?,
      promise: Promise
    ) in
      // Fully qualify the SDK enum: ExpoModulesCore (Expo 56+) transitively
      // brings SwiftUI into scope, and SwiftUI also exports an `Environment`
      // type, so the bare name is ambiguous.
      let env: VRTX.Environment = (environment.uppercased() == "PRODUCTION") ? .production : .sandbox
      let lang: Language = (language.uppercased() == "ARABIC") ? .arabic : .english
      let theme: Mode = (mode?.uppercased() == "DARK") ? .dark : .light
      let designOption: DesignOption
      switch designOptionName?.uppercased() {
      case "OPTION_A": designOption = .optionA
      case "OPTION_B": designOption = .optionB
      default: designOption = .optionC
      }
      let sdkThemeOptions = themeOptions(from: themeJson)
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
          designOption: designOption,
          theme: sdkThemeOptions,
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
          },
          onExit: {
            self.sendEvent("onExit")
          }
        )
      }
    }
  }

  private func themeOptions(from json: String?) -> ThemeOptions? {
    guard let json, let data = json.data(using: .utf8),
          let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
    else { return nil }

    func text(_ object: [String: Any]?, _ key: String) -> String? { object?[key] as? String }
    func number(_ object: [String: Any]?, _ key: String) -> CGFloat? {
      guard let value = object?[key] as? NSNumber else { return nil }
      return CGFloat(value.doubleValue)
    }

    let options = ThemeOptions()
    options.brandName = text(object, "brandName")
    if let value = text(object, "cardImage"), let url = URL(string: value) { options.cardImage = .remote(url) }
    if let value = text(object, "brandLogo"), let url = URL(string: value) { options.brandLogo = .remote(url) }

    if let colors = object["colors"] as? [String: Any] {
      let allBrands = (colors["allBrands"] as? [String: Any]).map { VrtxColors.AllBrands(primary: text($0, "primary"), buttonLabel: text($0, "buttonLabel")) }
      let labels = (colors["labels"] as? [String: Any]).map { VrtxColors.Labels(primary: text($0, "primary"), secondary: text($0, "secondary"), tertiary: text($0, "tertiary"), quaternary: text($0, "quaternary")) }
      let fills = (colors["fills"] as? [String: Any]).map { value in
        let vibrant = (value["vibrant"] as? [String: Any]).map { VrtxColors.Fills.Vibrant(secondary: text($0, "secondary")) }
        return VrtxColors.Fills(primary: text(value, "primary"), secondary: text(value, "secondary"), tertiary: text(value, "tertiary"), quaternary: text(value, "quaternary"), vibrant: vibrant)
      }
      let backgrounds = (colors["backgrounds"] as? [String: Any]).map { VrtxColors.Backgrounds(primary: text($0, "primary"), secondary: text($0, "secondary")) }
      let gradient = (colors["backgroundsGradient"] as? [String: Any]).map { VrtxColors.BackgroundsGradient(wb01: text($0, "wb01"), wb02: text($0, "wb02")) }
      let accents = (colors["accents"] as? [String: Any]).map { VrtxColors.Accents(red: text($0, "red"), redBg: text($0, "redBg"), green: text($0, "green"), greenBg: text($0, "greenBg")) }
      options.colors = VrtxColors(allBrands: allBrands, labels: labels, fills: fills, backgrounds: backgrounds, backgroundsGradient: gradient, accents: accents)
    }

    if let spacing = object["spacing"] as? [String: Any] {
      options.spacing = VrtxSpacing(x0: number(spacing, "x0"), xxs: number(spacing, "xxs"), xs: number(spacing, "xs"), sm: number(spacing, "sm"), md: number(spacing, "md"), ml: number(spacing, "ml"), lg: number(spacing, "lg"))
    }
    if let radius = object["radius"] as? [String: Any] {
      options.radius = VrtxRadius(s: number(radius, "s"), sm: number(radius, "sm"), md: number(radius, "md"), ml: number(radius, "ml"), lg: number(radius, "lg"), xl: number(radius, "xl"), full: number(radius, "full"), huge: number(radius, "huge"))
    }
    return options
  }
}
