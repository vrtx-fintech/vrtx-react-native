package sa.vrtx.reactnative

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.app.ContextHolder
import sa.vrtx.public.Vrtx
import sa.vrtx.public.configuration.Environment
import sa.vrtx.public.configuration.Language
import sa.vrtx.public.configuration.ThemeMode
import androidx.compose.ui.text.font.FontFamily
import androidx.activity.ComponentActivity

class VrtxAndroidModule : Module() {
  
  private fun getActivity(): ComponentActivity? {
    return ContextHolder.getActivityProvider()?.currentActivity as? ComponentActivity
  }
  
  override fun definition() = ModuleDefinition {
    Name("VrtxAndroid")

    Constant("LIBRARY_NAME") {
      "vrtx-android"
    }

    Events("onSuccess", "onError")

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
      
      // Get activity and run on UI thread
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
            themeMode = theme,
            fontFamily = fontFamily,
            onSuccess = {
              promise.resolve(null)
              sendEvent("onSuccess", null)
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
