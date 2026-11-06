package com.badian.phonelink

import android.Manifest
import android.app.role.RoleManager
import android.content.Context
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.ContactsContract
import android.util.Log
import com.badian.phonelink.core.Ntfy
import com.badian.phonelink.core.PhoneNumbers
import java.net.HttpURLConnection
import java.net.URL

/** Announces a call ringing on this phone to the other phone, through ntfy (SMS as fallback). */
object Alerts {
    private const val TAG = "PhoneLinkAlerts"

    /** Why alerts cannot work yet, as a message resource, or null when everything is ready. */
    fun problem(context: Context): Int? {
        val prefs = Prefs(context)
        if (Ntfy.normalizeServer(prefs.ntfyServer) == null) return R.string.err_server
        if (!Ntfy.isValidTopic(prefs.ntfyTopic)) return R.string.err_topic
        if (!canDetectCalls(context)) return R.string.err_call_detection
        return null
    }

    /**
     * Android 10+: the app must hold the call-screening role (the system then calls
     * CallAlertService for every incoming call). Android 8–9: the phone-state broadcast,
     * which needs READ_PHONE_STATE and READ_CALL_LOG to carry the number.
     */
    fun canDetectCalls(context: Context): Boolean =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            context.getSystemService(RoleManager::class.java)?.isRoleHeld(RoleManager.ROLE_CALL_SCREENING) == true
        } else {
            granted(context, Manifest.permission.READ_PHONE_STATE) && granted(context, Manifest.permission.READ_CALL_LOG)
        }

    /** Must be called off the main thread. Returns true when the alert left the phone. */
    fun announce(context: Context, rawNumber: String?, test: Boolean = false): Boolean {
        val prefs = Prefs(context)
        val number = rawNumber?.takeIf { PhoneNumbers.isDialable(it) }?.let { PhoneNumbers.clean(it) }
        if (!test && prefs.isDuplicateAlert(number)) return true

        val name = number?.let { contactName(context, it) }
        val who = when {
            number == null -> context.getString(R.string.alert_private)
            name != null -> "$name ($number)"
            else -> number
        }
        val title = context.getString(if (test) R.string.alert_title_test else R.string.alert_title)
        val body = Ntfy.incomingCall(prefs.ntfyTopic, title, who, number, context.getString(R.string.alert_call_back))

        if (post(prefs.ntfyServer, body)) return true
        if (prefs.smsFallback && PhoneNumbers.isDialable(prefs.partnerNumber)) {
            return Sms.send(context, PhoneNumbers.clean(prefs.partnerNumber), "$title: $who")
        }
        return false
    }

    private fun post(server: String, json: String): Boolean {
        val base = Ntfy.normalizeServer(server) ?: return false
        var conn: HttpURLConnection? = null
        return try {
            conn = (URL("$base/").openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = 8_000
                readTimeout = 8_000
                doOutput = true
                setRequestProperty("Content-Type", "application/json; charset=utf-8")
            }
            conn.outputStream.use { it.write(json.toByteArray(Charsets.UTF_8)) }
            conn.responseCode in 200..299
        } catch (e: Exception) {
            Log.w(TAG, "ntfy publish failed", e)
            false
        } finally {
            conn?.disconnect()
        }
    }

    private fun contactName(context: Context, number: String): String? {
        if (!granted(context, Manifest.permission.READ_CONTACTS)) return null
        val uri = Uri.withAppendedPath(ContactsContract.PhoneLookup.CONTENT_FILTER_URI, Uri.encode(number))
        return try {
            context.contentResolver.query(uri, arrayOf(ContactsContract.PhoneLookup.DISPLAY_NAME), null, null, null)
                ?.use { c -> if (c.moveToFirst()) c.getString(0) else null }
        } catch (e: Exception) {
            null
        }
    }

    private fun granted(context: Context, permission: String) =
        context.checkSelfPermission(permission) == PackageManager.PERMISSION_GRANTED
}
