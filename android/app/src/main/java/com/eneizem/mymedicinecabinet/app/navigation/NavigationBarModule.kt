package com.eneizem.mymedicinecabinet.app.navigation

import android.app.Activity
import android.os.Build
import android.provider.Settings
import android.util.Log
import android.view.ViewConfiguration
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsCompat.Type
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class NavigationBarModule(private val reactContext: ReactApplicationContext)
  : ReactContextBaseJavaModule(reactContext) {

  private val TAG = "NavigationBarModule"
  private val FALLBACK_PX = 130

  override fun getName(): String = "NavigationBarModule"

  private fun currentActivityOrNull(): Activity? = reactApplicationContext.currentActivity

  private fun pxToDp(px: Int): Int {
    val density = reactApplicationContext.resources.displayMetrics.density
    return ((px / density) + 0.5f).toInt()
  }

  private fun hasSoftNavigation(): Boolean {
    try {
      // 1) Проверяем через WindowInsets
      val activity = currentActivityOrNull()
      if (activity != null) {
        val decor = activity.window.decorView
        val rootInsets = ViewCompat.getRootWindowInsets(decor)
        if (rootInsets != null) {
          val navInsets = rootInsets.getInsets(Type.navigationBars())
          if (navInsets.bottom > 0) {
            return true
          }
        }
      }

      // 2) На Android 10+ проверяем navigation_mode
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        try {
          val mode = Settings.Secure.getInt(reactContext.contentResolver, "navigation_mode", -1)
          if (mode == 2) return false // gestures = no soft nav
          if (mode == 0 || mode == 1) return true
        } catch (e: Exception) {
          Log.d(TAG, "Cannot read navigation_mode: ${e.message}")
        }
      }

      // 3) Проверяем config_showNavigationBar
      try {
        val res = reactContext.resources
        val id = res.getIdentifier("config_showNavigationBar", "bool", "android")
        if (id > 0) {
          return res.getBoolean(id)
        }
      } catch (e: Exception) {
        Log.d(TAG, "Cannot read config_showNavigationBar: ${e.message}")
      }

      // 4) Проверяем аппаратные кнопки
      try {
        val hasPermanent = ViewConfiguration.get(reactContext).hasPermanentMenuKey()
        if (hasPermanent) return false
      } catch (e: Exception) {
        Log.d(TAG, "ViewConfiguration check failed: ${e.message}")
      }

    } catch (e: Exception) {
      Log.w(TAG, "hasSoftNavigation error: ${e.message}")
    }

    // Fallback: считаем что есть soft nav
    return true
  }

  @ReactMethod
  fun getNavigationBarHeight(promise: Promise) {
    try {
      if (!hasSoftNavigation()) {
        promise.resolve(0)
        return
      }

      // 1) Пробуем получить через WindowInsets (возвращаем px)
      try {
        val activity = currentActivityOrNull()
        if (activity != null) {
          val decor = activity.window.decorView
          val rootInsets = ViewCompat.getRootWindowInsets(decor)
          if (rootInsets != null) {
            val insets = rootInsets.getInsets(Type.navigationBars())
            val bottomPx = insets.bottom
            if (bottomPx > 0) {
              promise.resolve(bottomPx) // Возвращаем в px
              return
            }
          }
        }
      } catch (e: Exception) {
        Log.d(TAG, "WindowInsets failed: ${e.message}")
      }

      /*
      // 2) Fallback к ресурсу navigation_bar_height (ОТКЛЮЧЕНО)
      try {
        val res = reactContext.resources
        val id = res.getIdentifier("navigation_bar_height", "dimen", "android")
        if (id > 0) {
          val px = res.getDimensionPixelSize(id)
          if (px > 0) {
            sb.append("==> RESULT: $px px (resource fallback)\n")
            showAlert(sb.toString())
            promise.resolve(px)
            return
          }
        }
      } catch (_: Exception) { }
      */

      // 3) Последний fallback: 130px
      promise.resolve(FALLBACK_PX) // Возвращаем в px

    } catch (e: Exception) {
      promise.reject("ERR", e.message, e)
    }
  }
}