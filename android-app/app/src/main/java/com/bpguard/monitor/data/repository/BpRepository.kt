package com.bpguard.monitor.data.repository

import android.content.Context
import android.content.SharedPreferences
import com.bpguard.monitor.data.AppDatabase
import com.bpguard.monitor.data.BpCategory
import com.bpguard.monitor.data.BpReading
import com.bpguard.monitor.data.BpSource
import com.bpguard.monitor.data.HealthConnectManager
import com.bpguard.monitor.data.ReconciliationEngine
import com.bpguard.monitor.notifications.BpAlertNotifier
import java.time.Instant
import kotlinx.coroutines.flow.Flow

/**
 * Single entry point the UI and background workers use to get a blood pressure reading into
 * (or out of) the log. Every write funnels through [ReconciliationEngine] so the phone and the
 * watch never produce two contradictory entries for the same moment.
 */
class BpRepository(context: Context) {

    private val appContext = context.applicationContext
    private val dao = AppDatabase.get(appContext).bpReadingDao()
    private val healthConnectManager = HealthConnectManager(appContext)
    private val alertNotifier = BpAlertNotifier(appContext)
    private val prefs: SharedPreferences =
        appContext.getSharedPreferences("bp_repository_prefs", Context.MODE_PRIVATE)

    fun observeLog(): Flow<List<BpReading>> = dao.observeAll()

    suspend fun recordManualEntry(
        systolic: Int,
        diastolic: Int,
        pulseBpm: Int?,
        source: BpSource,
        timestampEpochMillis: Long = System.currentTimeMillis(),
        note: String? = null
    ): ReconciliationEngine.Result {
        val candidate = BpReading(
            systolic = systolic,
            diastolic = diastolic,
            pulseBpm = pulseBpm,
            timestampEpochMillis = timestampEpochMillis,
            primarySource = source,
            mergedSources = listOf(source),
            restingContext = healthConnectManager.wasRestingAt(Instant.ofEpochMilli(timestampEpochMillis)),
            note = note
        )
        return recordCandidate(candidate)
    }

    /** Called from [com.bpguard.monitor.accessibility.InfowearCaptureBus] collectors. */
    suspend fun recordInfowearCapture(systolic: Int, diastolic: Int, pulseBpm: Int?): ReconciliationEngine.Result {
        val now = System.currentTimeMillis()
        val candidate = BpReading(
            systolic = systolic,
            diastolic = diastolic,
            pulseBpm = pulseBpm,
            timestampEpochMillis = now,
            primarySource = BpSource.INFOWEAR_AUTO_CAPTURE,
            mergedSources = listOf(BpSource.INFOWEAR_AUTO_CAPTURE),
            restingContext = healthConnectManager.wasRestingAt(Instant.ofEpochMilli(now))
        )
        return recordCandidate(candidate)
    }

    /** Pulls any BloodPressureRecord entries Health Connect has that this app hasn't seen yet. */
    suspend fun syncFromHealthConnect(lookbackHours: Long = 24): Int {
        if (!healthConnectManager.isAvailable) return 0
        val lastSynced = Instant.ofEpochMilli(prefs.getLong(KEY_LAST_HC_SYNC, 0L))
        val from = maxOf(lastSynced, Instant.now().minusSeconds(lookbackHours * 3600))
        val to = Instant.now()

        val records = healthConnectManager.readBloodPressure(from, to)
        for (record in records) {
            recordCandidate(record)
        }
        prefs.edit().putLong(KEY_LAST_HC_SYNC, to.toEpochMilli()).apply()
        return records.size
    }

    private suspend fun recordCandidate(candidate: BpReading): ReconciliationEngine.Result {
        val windowStart = candidate.timestampEpochMillis - ReconciliationEngine.MERGE_WINDOW_MILLIS
        val windowEnd = candidate.timestampEpochMillis + ReconciliationEngine.MERGE_WINDOW_MILLIS
        val nearby = dao.findInWindow(windowStart, windowEnd)

        val result = ReconciliationEngine.reconcile(candidate, nearby)
        val finalReading = when (result) {
            is ReconciliationEngine.Result.Insert -> {
                val id = dao.insert(result.reading)
                result.reading.copy(id = id)
            }
            is ReconciliationEngine.Result.Update -> {
                val updated = result.merged.copy(id = result.existingId)
                dao.update(updated)
                updated
            }
            is ReconciliationEngine.Result.Rejected -> null
        }

        if (finalReading != null && finalReading.category == BpCategory.HYPERTENSIVE_CRISIS) {
            alertNotifier.notifyCrisis(finalReading)
        }

        return result
    }

    companion object {
        private const val KEY_LAST_HC_SYNC = "last_health_connect_sync_epoch_millis"
    }
}
