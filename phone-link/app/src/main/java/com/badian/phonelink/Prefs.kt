package com.badian.phonelink

import android.content.Context
import com.badian.phonelink.core.ForwardMode
import com.badian.phonelink.core.ForwardingCodes
import com.badian.phonelink.core.LinkMethod
import com.badian.phonelink.core.Ntfy

/** All settings and the link state, stored on the device only. */
class Prefs(context: Context) {
    private val sp = context.applicationContext.getSharedPreferences("phonelink", Context.MODE_PRIVATE)

    var method: LinkMethod
        get() = LinkMethod.entries.firstOrNull { it.name == sp.getString("method", null) } ?: LinkMethod.ALERT
        set(v) = sp.edit().putString("method", v.name).apply()

    var ntfyServer: String
        get() = sp.getString("ntfyServer", Ntfy.DEFAULT_SERVER) ?: Ntfy.DEFAULT_SERVER
        set(v) = sp.edit().putString("ntfyServer", v).apply()

    /** Created once, randomly, on first use. */
    var ntfyTopic: String
        get() = sp.getString("ntfyTopic", null) ?: Ntfy.newTopic().also { ntfyTopic = it }
        set(v) = sp.edit().putString("ntfyTopic", v).apply()

    var smsFallback: Boolean
        get() = sp.getBoolean("smsFallback", false)
        set(v) = sp.edit().putBoolean("smsFallback", v).apply()

    /** Drops a second event for the same ringing call (some phones report it twice). */
    @Synchronized
    fun isDuplicateAlert(number: String?): Boolean {
        val now = System.currentTimeMillis()
        val key = number ?: "-"
        val dup = sp.getString("lastAlertKey", null) == key && now - sp.getLong("lastAlertAt", 0L) < 20_000L
        if (!dup) sp.edit().putString("lastAlertKey", key).putLong("lastAlertAt", now).commit()
        return dup
    }

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
    val linkedMethod: LinkMethod get() =
        LinkMethod.entries.firstOrNull { it.name == sp.getString("linkedMethod", null) } ?: LinkMethod.FORWARD
    val linkedMode: ForwardMode? get() = modeOf(sp.getString("linkedMode", null))
    val linkedTo: String get() = sp.getString("linkedTo", "") ?: ""
    val linkedAt: Long get() = sp.getLong("linkedAt", 0L)

    fun markAlertsOn() = sp.edit()
        .putBoolean("linked", true).putString("linkedMethod", LinkMethod.ALERT.name).remove("linkedMode")
        .putString("linkedTo", "").putLong("linkedAt", System.currentTimeMillis()).apply()

    fun markLinked(mode: ForwardMode, to: String) = sp.edit()
        .putBoolean("linked", true).putString("linkedMethod", LinkMethod.FORWARD.name).putString("linkedMode", mode.name)
        .putString("linkedTo", to).putLong("linkedAt", System.currentTimeMillis()).apply()

    fun markUnlinked() = sp.edit()
        .putBoolean("linked", false).remove("linkedMethod").remove("linkedMode").remove("linkedTo").remove("linkedAt").apply()

    private fun modeOf(name: String?) = ForwardMode.entries.firstOrNull { it.name == name }
}
