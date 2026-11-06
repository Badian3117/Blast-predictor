package com.badian.phonelink

import android.Manifest
import android.content.ComponentName
import android.content.Context
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.service.quicksettings.TileService
import android.telecom.PhoneAccountHandle
import android.telecom.TelecomManager
import com.badian.phonelink.core.ForwardingCodes
import com.badian.phonelink.core.PhoneNumbers

sealed interface LinkResult {
    /** Done (alerts) or request handed to the carrier (forwarding). */
    data object Sent : LinkResult
    data class Failed(val messageRes: Int) : LinkResult
}

/**
 * Sends forwarding codes to the carrier. TelecomManager.placeCall routes a code like
 * "*004*+212600000000**20#" to the telephony stack as an MMI request rather than a
 * call, and works from a tile or a receiver without opening the dialer.
 */
object Forwarder {

    fun link(context: Context): LinkResult {
        val prefs = Prefs(context)
        val target = PhoneNumbers.clean(prefs.partnerNumber)
        if (!PhoneNumbers.isDialable(target)) return LinkResult.Failed(R.string.err_no_partner)
        val mode = prefs.mode
        val code = ForwardingCodes.activate(mode, target, prefs.delaySeconds)
        return dial(context, code).also {
            if (it == LinkResult.Sent) { prefs.markLinked(mode, target); refreshTile(context) }
        }
    }

    fun unlink(context: Context): LinkResult {
        val prefs = Prefs(context)
        val mode = prefs.linkedMode ?: prefs.mode
        val code = ForwardingCodes.deactivate(mode, prefs.voicemailNumber, prefs.delaySeconds)
        return dial(context, code).also {
            if (it == LinkResult.Sent) { prefs.markUnlinked(); refreshTile(context) }
        }
    }

    fun checkWithCarrier(context: Context): LinkResult {
        val prefs = Prefs(context)
        return dial(context, ForwardingCodes.interrogate(prefs.linkedMode ?: prefs.mode))
    }

    private fun dial(context: Context, code: String): LinkResult {
        if (context.checkSelfPermission(Manifest.permission.CALL_PHONE) != PackageManager.PERMISSION_GRANTED) {
            return LinkResult.Failed(R.string.err_call_permission)
        }
        val telecom = context.getSystemService(TelecomManager::class.java)
            ?: return LinkResult.Failed(R.string.err_no_telephony)
        val extras = Bundle()
        accountHandle(Prefs(context).phoneAccount)?.let {
            extras.putParcelable(TelecomManager.EXTRA_PHONE_ACCOUNT_HANDLE, it)
        }
        return try {
            telecom.placeCall(Uri.fromParts("tel", code, null), extras)
            LinkResult.Sent
        } catch (e: SecurityException) {
            LinkResult.Failed(R.string.err_call_permission)
        }
    }

    fun accountKey(handle: PhoneAccountHandle): String =
        handle.componentName.flattenToString() + "|" + handle.id

    private fun accountHandle(key: String?): PhoneAccountHandle? {
        if (key.isNullOrEmpty()) return null
        val split = key.indexOf('|')
        if (split <= 0) return null
        val component = ComponentName.unflattenFromString(key.substring(0, split)) ?: return null
        return PhoneAccountHandle(component, key.substring(split + 1))
    }

    fun refreshTile(context: Context) {
        TileService.requestListeningState(context, ComponentName(context, LinkTileService::class.java))
    }
}
