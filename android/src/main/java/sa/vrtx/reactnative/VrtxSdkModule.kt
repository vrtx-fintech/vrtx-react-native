package sa.vrtx.reactnative

import android.graphics.Typeface
import android.net.Uri
import androidx.activity.ComponentActivity
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import com.facebook.react.common.assets.ReactFontManager
import org.json.JSONObject
import sa.vrtx.public.Vrtx
import sa.vrtx.public.configuration.DesignOption
import sa.vrtx.public.configuration.Environment
import sa.vrtx.public.configuration.Language
import sa.vrtx.public.configuration.Mode
import sa.vrtx.public.configuration.theme.ThemeOptions
import sa.vrtx.public.configuration.theme.VrtxColors
import sa.vrtx.public.configuration.theme.VrtxRadius
import sa.vrtx.public.configuration.theme.VrtxSpacing
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp

class VrtxSdkModule : Module() {

  private fun themeOptions(json: String?): ThemeOptions? {
    val root = json?.let { runCatching { JSONObject(it) }.getOrNull() } ?: return null
    fun text(parent: JSONObject?, key: String): String? = parent?.optString(key)?.takeIf { it.isNotBlank() }
    fun color(parent: JSONObject?, key: String): Color? = text(parent, key)?.let { runCatching { Color(android.graphics.Color.parseColor(it)) }.getOrNull() }
    fun dp(parent: JSONObject?, key: String) = if (parent?.has(key) == true) parent.optDouble(key).toFloat().dp else null
    fun child(parent: JSONObject?, key: String) = parent?.optJSONObject(key)

    val colors = child(root, "colors")
    val allBrands = child(colors, "allBrands")?.let { VrtxColors.AllBrands(primary = color(it, "primary"), buttonLabel = color(it, "buttonLabel")) }
    val labels = child(colors, "labels")?.let { VrtxColors.Labels(primary = color(it, "primary"), secondary = color(it, "secondary"), tertiary = color(it, "tertiary"), quaternary = color(it, "quaternary")) }
    val fills = child(colors, "fills")?.let { value ->
      VrtxColors.Fills(primary = color(value, "primary"), secondary = color(value, "secondary"), tertiary = color(value, "tertiary"), quaternary = color(value, "quaternary"), vibrant = child(value, "vibrant")?.let { VrtxColors.Fills.Vibrant(secondary = color(it, "secondary")) })
    }
    val backgrounds = child(colors, "backgrounds")?.let { VrtxColors.Backgrounds(primary = color(it, "primary"), secondary = color(it, "secondary")) }
    val gradients = child(colors, "backgroundsGradient")?.let { VrtxColors.BackgroundsGradients(wb01 = color(it, "wb01"), wb02 = color(it, "wb02")) }
    val accents = child(colors, "accents")?.let { VrtxColors.Accents(red = color(it, "red"), green = color(it, "green"), greenBg = color(it, "greenBg")) }
    val themeColors = if (colors == null) null else VrtxColors(allBrands, labels, fills, backgrounds, gradients, accents)

    val spacing = child(root, "spacing")?.let { VrtxSpacing(x0 = dp(it, "x0"), xxs = dp(it, "xxs"), xs = dp(it, "xs"), sm = dp(it, "sm"), md = dp(it, "md"), ml = dp(it, "ml"), lg = dp(it, "lg")) }
    val radius = child(root, "radius")?.let { VrtxRadius(s = dp(it, "s"), sm = dp(it, "sm"), md = dp(it, "md"), lg = dp(it, "lg"), full = dp(it, "full"), huge = dp(it, "huge")) }

    return ThemeOptions(
      cardImage = text(root, "cardImage")?.let(Uri::parse),
      brandLogo = text(root, "brandLogo")?.let(Uri::parse),
      brandName = text(root, "brandName"),
      colors = themeColors,
      spacing = spacing,
      radius = radius,
    )
  }
  
  private fun getActivity(): ComponentActivity? {
    return appContext.activityProvider?.currentActivity as? ComponentActivity
  }

  private fun getFontFamily(fontFamilyName: String?): FontFamily {
    if (fontFamilyName.isNullOrBlank()) {
      return FontFamily.Default
    }

    val assetManager = appContext.reactContext?.assets ?: return FontFamily.Default
    val typeface = ReactFontManager.getInstance().getTypeface(
      fontFamilyName,
      Typeface.NORMAL,
      assetManager
    )

    return FontFamily(typeface)
  }
  
  override fun definition() = ModuleDefinition {
    Name("VrtxSdk")

    Constant("LIBRARY_NAME") {
      "vrtx-android"
    }

    Events("onSuccess", "onError", "onExit")

    AsyncFunction("setup") { 
      clientId: String, 
      clientSecret: String, 
      environment: String, 
      language: String, 
      mode: String?,
      fontFamilyName: String?,
      externalReference: String?,
      designOptionName: String?,
      themeJson: String?,
      promise: Promise ->
      
      val env = when(environment.uppercase()) {
        "PRODUCTION" -> Environment.Production
        else -> Environment.Sandbox
      }
      
      val lang = when(language.uppercase()) {
        "ARABIC" -> Language.Arabic
        else -> Language.English
      }
      
      val selectedMode = when(mode?.uppercase()) {
        "DARK" -> Mode.DARK
        else -> Mode.LIGHT
      }

      val designOption = when (designOptionName?.uppercase()) {
        "OPTION_A" -> DesignOption.OptionA
        "OPTION_B" -> DesignOption.OptionB
        else -> DesignOption.OptionC
      }

      val fontFamily = getFontFamily(fontFamilyName)
      
      val activity = getActivity()
      if (activity == null) {
        promise.reject(CodedException("VRX_ERROR", "Activity not available", null))
        return@AsyncFunction
      }
      
      activity.runOnUiThread {
        try {
          Vrtx.setup(
            clientId = clientId,
            clientSecret = clientSecret,
            environment = env,
            language = lang,
            mode = selectedMode,
            designOption = designOption,
            theme = themeOptions(themeJson),
            fontFamily = fontFamily,
            externalReference = externalReference,
            onSuccess = {
              promise.resolve(null)
              sendEvent("onSuccess")
            },
            onError = { error ->
              val errorMessage = error.message ?: "Unknown error"
              promise.reject(CodedException("VRX_ERROR", errorMessage, null))
              sendEvent("onError", mapOf("code" to "VRX_ERROR", "message" to errorMessage))
            },
            onExit = {
              sendEvent("onExit")
            },
          )
        } catch (e: Exception) {
          val errorMessage = e.message ?: "Failed to initialize Vrtx SDK"
          promise.reject(CodedException("VRX_ERROR", errorMessage, e))
          sendEvent("onError", mapOf("code" to "VRX_ERROR", "message" to errorMessage))
        }
      }
    }
  }
}
