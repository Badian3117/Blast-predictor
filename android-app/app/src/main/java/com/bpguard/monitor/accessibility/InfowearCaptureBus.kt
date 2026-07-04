package com.bpguard.monitor.accessibility

import android.content.Context
import android.content.SharedPreferences
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Decouples [InfowearCaptureService] (an Android Service, hard to hand a repository to
 * directly) from the rest of the app. The service publishes here; the repository/ViewModel
 * layer collects.
 */
object InfowearCaptureBus {
    private val _parsedReadings = MutableSharedFlow<InfowearParser.ParsedReading>(extraBufferCapacity = 8)
    val parsedReadings = _parsedReadings.asSharedFlow()

    /** Raw text seen on the last matched screen -- surfaced in Settings for calibration. */
    private val _lastRawCapture = MutableStateFlow<List<String>>(emptyList())
    val lastRawCapture = _lastRawCapture.asStateFlow()

    private val _lastForegroundPackage = MutableStateFlow<String?>(null)
    val lastForegroundPackage = _lastForegroundPackage.asStateFlow()

    suspend fun publish(reading: InfowearParser.ParsedReading) {
        _parsedReadings.emit(reading)
    }

    fun updateRawCapture(texts: List<String>) {
        _lastRawCapture.value = texts
    }

    fun updateForegroundPackage(packageName: String?) {
        _lastForegroundPackage.value = packageName
    }
}

private const val PREFS_NAME = "infowear_capture_prefs"
private const val KEY_TARGET_PACKAGE = "target_package"
private const val KEY_DEBUG_MODE = "debug_mode"

class InfowearCapturePrefs(context: Context) {
    private val prefs: SharedPreferences =
        context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    var targetPackage: String?
        get() = prefs.getString(KEY_TARGET_PACKAGE, null)
        set(value) = prefs.edit().putString(KEY_TARGET_PACKAGE, value).apply()

    var debugModeEnabled: Boolean
        get() = prefs.getBoolean(KEY_DEBUG_MODE, false)
        set(value) = prefs.edit().putBoolean(KEY_DEBUG_MODE, value).apply()
}
