package com.badian.phonelink

import android.content.Context
import com.badian.phonelink.core.ForwardMode
import com.badian.phonelink.core.ForwardingCodes

/** All settings and the link state, stored on the device only. */
class Prefs(context: Context) {
    private val sp = context.applicationContext.getSharedPreferences("phonelink", Context.MODE_PRIVATE)

    var partnerNumber: String
        get() = sp.getString("partner", "") ?: ""
        set(v) = sp.edit().putString("partner", v).apply()

    var mode: ForwardMode
        get() = modeOf(sp.getString("mode", null)) ?: ForwardMode.CONDITIONAL
        set(v) = sp.edit().putString("mode", v.name).apply()

    var delaySeconds: Int
        get() = sp.getInt("delay", ForwardingCodes.DEFAULT_DELAY)
        set(v) = sp.edit().putInt("delay", v).apply()

    var voicemailNumber: String
        get() = sp.getString("voicemail", "") ?: ""
        set(v) = sp.edit().putString("voicemail", v).apply()

    /** "flattenedComponent|id" of the SIM to use, or null for the system default. */
    var phoneAccount: String?
        get() = sp.getString("account", null)
        set(v) = sp.edit().putString("account", v).apply()

    var remoteEnabled: Boolean
        get() = sp.getBoolean("remote", false)
        set(v) = sp.edit().putBoolean("remote", v).apply()

    var pin: String
        get() = sp.getString("pin", "") ?: ""
        set(v) = sp.edit().putString("pin", v).apply()

    // Link state. The network does not report back to apps, so this records the
    // last request this app sent; "Check with carrier" shows the real state.
    val linked: Boolean get() = sp.getBoolean("linked", false)
    val linkedMode: ForwardMode? get() = modeOf(sp.getString("linkedMode", null))
    val linkedTo: String get() = sp.getString("linkedTo", "") ?: ""
    val linkedAt: Long get() = sp.getLong("linkedAt", 0L)

    fun markLinked(mode: ForwardMode, to: String) = sp.edit()
        .putBoolean("linked", true).putString("linkedMode", mode.name)
        .putString("linkedTo", to).putLong("linkedAt", System.currentTimeMillis()).apply()

    fun markUnlinked() = sp.edit()
        .putBoolean("linked", false).remove("linkedMode").remove("linkedTo").remove("linkedAt").apply()

    private fun modeOf(name: String?) = ForwardMode.entries.firstOrNull { it.name == name }
}
