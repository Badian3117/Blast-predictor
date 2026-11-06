package com.badian.phonelink

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.telephony.SubscriptionManager
import com.badian.phonelink.core.PhoneNumbers
import com.badian.phonelink.core.RemoteCommand
import com.badian.phonelink.core.RemoteCommand.Ack
import com.badian.phonelink.core.RemoteCommand.Action

/**
 * Lets the phone you carry switch the link on the phone you left behind, by SMS.
 * A command is accepted only if it comes from the saved partner number AND carries
 * the right PIN. Calls are always forwarded to the saved partner number, never to
 * the sender, so a spoofed SMS cannot redirect your calls to a stranger.
 */
class SmsReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return
        val parts = Telephony.Sms.Intents.getMessagesFromIntent(intent)
        if (parts.isNullOrEmpty()) return
        val sender = parts[0].originatingAddress ?: return
        val body = parts.joinToString("") { it.messageBody ?: "" }

        val prefs = Prefs(context)
        if (!PhoneNumbers.matches(sender, prefs.partnerNumber)) return

        RemoteCommand.parseAck(body)?.let { ack ->
            Notifier.show(context, context.getString(ackMessage(ack)))
            return
        }

        val command = RemoteCommand.parseCommand(body) ?: return
        val subscriptionId = intent.getIntExtra(
            "android.telephony.extra.SUBSCRIPTION_INDEX", // SubscriptionManager.EXTRA_SUBSCRIPTION_INDEX, API 30+
            intent.getIntExtra("subscription", SubscriptionManager.INVALID_SUBSCRIPTION_ID),
        )
        if (!prefs.remoteEnabled) {
            Notifier.show(context, context.getString(R.string.remote_ignored_disabled))
            return
        }
        if (!RemoteCommand.pinMatches(command.pin, prefs.pin)) {
            Sms.send(context, sender, RemoteCommand.ack(Ack.BADPIN), subscriptionId)
            Notifier.show(context, context.getString(R.string.remote_bad_pin))
            return
        }

        val ack = when (command.action) {
            Action.ON -> if (Link.on(context) == LinkResult.Sent) Ack.LINKED else Ack.FAILED
            Action.OFF -> if (Link.off(context) == LinkResult.Sent) Ack.UNLINKED else Ack.FAILED
            Action.STATUS -> if (prefs.linked) Ack.LINKED else Ack.UNLINKED
        }
        Sms.send(context, sender, RemoteCommand.ack(ack), subscriptionId)
        if (command.action != Action.STATUS) {
            Notifier.show(context, context.getString(R.string.remote_done, context.getString(ackMessage(ack))))
        }
    }

    private fun ackMessage(ack: Ack): Int = when (ack) {
        Ack.LINKED -> R.string.ack_linked
        Ack.UNLINKED -> R.string.ack_unlinked
        Ack.FAILED -> R.string.ack_failed
        Ack.BADPIN -> R.string.ack_badpin
    }
}
