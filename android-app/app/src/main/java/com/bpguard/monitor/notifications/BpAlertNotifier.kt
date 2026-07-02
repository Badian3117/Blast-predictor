package com.bpguard.monitor.notifications

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import com.bpguard.monitor.data.BpReading

class BpAlertNotifier(private val context: Context) {

    init {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Blood pressure alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Warns when a reading falls into the hypertensive crisis range"
            }
            context.getSystemService(NotificationManager::class.java)?.createNotificationChannel(channel)
        }
    }

    fun notifyCrisis(reading: BpReading) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ActivityCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) !=
            PackageManager.PERMISSION_GRANTED
        ) {
            return
        }

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setContentTitle("Hypertensive crisis range: ${reading.systolic}/${reading.diastolic}")
            .setContentText("This reading is at or above 180/120 mmHg. If you have symptoms (chest pain, shortness of breath, vision changes), seek emergency care.")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .build()

        androidx.core.app.NotificationManagerCompat.from(context).notify(CRISIS_NOTIFICATION_ID, notification)
    }

    companion object {
        private const val CHANNEL_ID = "bp_crisis_alerts"
        private const val CRISIS_NOTIFICATION_ID = 1001
    }
}
