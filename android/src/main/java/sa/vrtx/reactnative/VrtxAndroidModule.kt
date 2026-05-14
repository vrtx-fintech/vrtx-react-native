package sa.vrtx.reactnative

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import sa.vrtx.public.Vrtx
import sa.vrtx.public.configuration.Environment
import sa.vrtx.public.configuration.Language
import sa.vrtx.public.configuration.ThemeMode
import androidx.compose.ui.text.font.FontFamily
import android.os.Handler
import android.os.Looper

class VrtxAndroidModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("VrtxAndroid")

    Constant("LIBRARY_NAME") {
      "vrtx-android"
    }

    Events("onError")

    AsyncFunction("setup") { 
      clientId: String, 
      clientSecret: String, 
      environment: String, 
      language: String, 
      themeMode: String?,
      promise: Promise ->
      
      val env = when(environment.uppercase()) {
        "STAGING" -> Environment.Staging
        else -> Environment.Sandbox
      }
      
      val lang = when(language.uppercase()) {
        "ARABIC" -> Language.Arabic
        else -> Language.English
      }
      
      val theme = when(themeMode?.uppercase()) {
        "DARK" -> ThemeMode.DARK
        else -> ThemeMode.LIGHT
      }
      
      val fontFamily = FontFamily.Default
      
      // Must run on main thread to launch Activity
      Handler(Looper.getMainLooper()).post {
        Vrtx.setup(
          clientId = clientId,
          clientSecret = clientSecret,
          environment = env,
          language = lang,
          themeMode = theme,
          fontFamily = fontFamily,
          onSuccess = {
            promise.resolve(null)
          },
          onError = { error ->
            val errorMessage = error.message ?: "Unknown error"
            promise.reject(CodedException("VRX_ERROR", errorMessage, null))
            // Emit error event with message
            runCatching { sendEvent("onError", mapOf("message" to errorMessage)) }
          }
        )
      }
    }
  }
}
