package com.badian.phonelink

import android.content.Context
import com.badian.phonelink.core.LinkMethod

/** Turns the link on or off with whichever method is chosen in the settings. */
object Link {

    fun on(context: Context): LinkResult {
        val prefs = Prefs(context)
        return when (prefs.method) {
            LinkMethod.FORWARD -> Forwarder.link(context)
            LinkMethod.ALERT -> {
                Alerts.problem(context)?.let { return LinkResult.Failed(it) }
                prefs.markAlertsOn()
                Forwarder.refreshTile(context)
                LinkResult.Sent
            }
        }
    }

    fun off(context: Context): LinkResult {
        val prefs = Prefs(context)
        if (prefs.linked && prefs.linkedMethod == LinkMethod.FORWARD) return Forwarder.unlink(context)
        prefs.markUnlinked()
        Forwarder.refreshTile(context)
        return LinkResult.Sent
    }

    /** True when incoming calls should be announced on the other phone right now. */
    fun alertsActive(context: Context): Boolean {
        val prefs = Prefs(context)
        return prefs.linked && prefs.linkedMethod == LinkMethod.ALERT
    }
}
