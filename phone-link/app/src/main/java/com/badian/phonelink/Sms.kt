package com.badian.phonelink

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.telephony.SmsManager
import android.telephony.SubscriptionManager

object Sms {
    fun send(
        context: Context,
        to: String,
        text: String,
        subscriptionId: Int = SubscriptionManager.INVALID_SUBSCRIPTION_ID,
    ): Boolean {
        if (context.checkSelfPermission(Manifest.permission.SEND_SMS) != PackageManager.PERMISSION_GRANTED) return false
        val hasSub = subscriptionId != SubscriptionManager.INVALID_SUBSCRIPTION_ID
        val manager: SmsManager = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val base = context.getSystemService(SmsManager::class.java) ?: return false
            if (hasSub) base.createForSubscriptionId(subscriptionId) else base
        } else {
            @Suppress("DEPRECATION")
            if (hasSub) SmsManager.getSmsManagerForSubscriptionId(subscriptionId) else SmsManager.getDefault()
        }
        return try {
            manager.sendTextMessage(to, null, text, null, null)
            true
        } catch (e: Exception) {
            false
        }
    }
}
