package com.badian.phonelink

import android.os.Build
import android.telecom.Call
import android.telecom.CallScreeningService

/**
 * Android 10+. Bound by the system for each incoming call once the user gives
 * Phone Link the call-screening role. It never blocks or silences a call: it answers
 * "allow" immediately (so ringing is not delayed), then sends the alert in the background.
 * Without READ_CONTACTS, Android skips this service for callers in your contacts.
 */
class CallAlertService : CallScreeningService() {

    override fun onScreenCall(details: Call.Details) {
        respondToCall(details, CallResponse.Builder().build())

        val incoming = Build.VERSION.SDK_INT < Build.VERSION_CODES.R ||
            details.callDirection == Call.Details.DIRECTION_INCOMING
        if (!incoming || !Link.alertsActive(this)) return

        val number = details.handle?.schemeSpecificPart
        val app = applicationContext
        Thread { Alerts.announce(app, number) }.start()
    }
}
