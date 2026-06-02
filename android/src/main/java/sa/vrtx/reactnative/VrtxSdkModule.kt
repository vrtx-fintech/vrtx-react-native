package sa.vrtx.reactnative

import android.graphics.Typeface
import androidx.activity.ComponentActivity
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import com.facebook.react.common.assets.ReactFontManager
import sa.vrtx.public.Vrtx
import sa.vrtx.public.configuration.Environment
import sa.vrtx.public.configuration.Language
import sa.vrtx.public.configuration.Mode
import androidx.compose.ui.text.font.FontFamily

class VrtxSdkModule : Module() {
  
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

    Events("onSuccess", "onError")

    AsyncFunction("setup") { 
      clientId: String, 
      clientSecret: String, 
      environment: String, 
      language: String, 
      mode: String?,
      fontFamilyName: String?,
      promise: Promise ->
      
      val env = when(environment.uppercase()) {
        "STAGING" -> Environment.Staging
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
            fontFamily = fontFamily,
            onSuccess = {
              promise.resolve(null)
              sendEvent("onSuccess")
            },
            onError = { error ->
              val errorMessage = error.message ?: "Unknown error"
              promise.reject(CodedException("VRX_ERROR", errorMessage, null))
              sendEvent("onError", mapOf("code" to "VRX_ERROR", "message" to errorMessage))
            }
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
