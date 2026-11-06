package com.badian.phonelink

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.telephony.TelephonyManager

/** Android 8–9 only (Android 10+ uses CallAlertService). */
class LegacyCallReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) return
        if (intent.action != TelephonyManager.ACTION_PHONE_STATE_CHANGED) return
        if (intent.getStringExtra(TelephonyManager.EXTRA_STATE) != TelephonyManager.EXTRA_STATE_RINGING) return
        // With READ_CALL_LOG the broadcast arrives twice: without, then with the number.
        @Suppress("DEPRECATION")
        val number = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER) ?: return
        if (!Link.alertsActive(context)) return

        val pending = goAsync()
        val app = context.applicationContext
        Thread {
            try { Alerts.announce(app, number) } finally { pending.finish() }
        }.start()
    }
}
