package com.bpguard.monitor.data

import android.content.Context
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.BloodPressureRecord
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import java.time.Instant

/**
 * Thin wrapper around the Health Connect client. Health Connect is the one place on Android
 * where the phone's own signals (step/exercise context) and any *other* app's data can live
 * side by side -- Infowear itself doesn't write here (see [com.bpguard.monitor.accessibility]
 * for how its readings are captured instead), but if a future firmware update or a different
 * companion app on this phone starts contributing BloodPressureRecord entries, they will show
 * up automatically through this same path with zero extra code.
 */
class HealthConnectManager(private val context: Context) {

    val client: HealthConnectClient? by lazy {
        if (HealthConnectClient.getSdkStatus(context) == HealthConnectClient.SDK_AVAILABLE) {
            HealthConnectClient.getOrCreate(context)
        } else {
            null
        }
    }

    val isAvailable: Boolean get() = client != null

    companion object {
        val REQUIRED_PERMISSIONS = setOf(
            HealthPermission.getReadPermission(HeartRateRecord::class),
            HealthPermission.getReadPermission(StepsRecord::class),
            HealthPermission.getReadPermission(ExerciseSessionRecord::class),
            HealthPermission.getReadPermission(BloodPressureRecord::class)
        )
    }

    fun permissionRequestContract() = PermissionController.createRequestPermissionResultContract()

    suspend fun hasAllPermissions(): Boolean {
        val c = client ?: return false
        val granted = c.permissionController.getGrantedPermissions()
        return granted.containsAll(REQUIRED_PERMISSIONS)
    }

    /** Any BloodPressureRecord written by *some other* app into Health Connect. */
    suspend fun readBloodPressure(from: Instant, to: Instant): List<BpReading> {
        val c = client ?: return emptyList()
        val response = c.readRecords(
            ReadRecordsRequest(
                recordType = BloodPressureRecord::class,
                timeRangeFilter = TimeRangeFilter.between(from, to)
            )
        )
        return response.records.map { record ->
            BpReading(
                systolic = record.systolic.inMillimetersOfMercury.toInt(),
                diastolic = record.diastolic.inMillimetersOfMercury.toInt(),
                pulseBpm = null,
                timestampEpochMillis = record.time.toEpochMilli(),
                primarySource = BpSource.HEALTH_CONNECT
            )
        }
    }

    suspend fun readHeartRateSamples(from: Instant, to: Instant): List<Pair<Instant, Long>> {
        val c = client ?: return emptyList()
        val response = c.readRecords(
            ReadRecordsRequest(
                recordType = HeartRateRecord::class,
                timeRangeFilter = TimeRangeFilter.between(from, to)
            )
        )
        return response.records.flatMap { record ->
            record.samples.map { it.time to it.beatsPerMinute }
        }
    }

    /**
     * Heuristic used to tag a reading as "resting" vs "post-activity": looks for any step
     * count or exercise session overlapping the 10 minutes before the given instant. Readings
     * taken shortly after activity are known to run high and are flagged so trends aren't
     * skewed by them.
     */
    suspend fun wasRestingAt(instant: Instant): Boolean? {
        val c = client ?: return null
        val windowStart = instant.minusSeconds(600)

        val steps = c.readRecords(
            ReadRecordsRequest(
                recordType = StepsRecord::class,
                timeRangeFilter = TimeRangeFilter.between(windowStart, instant)
            )
        ).records.sumOf { it.count }

        val exerciseSessions = c.readRecords(
            ReadRecordsRequest(
                recordType = ExerciseSessionRecord::class,
                timeRangeFilter = TimeRangeFilter.between(windowStart, instant)
            )
        ).records

        return steps < 50 && exerciseSessions.isEmpty()
    }
}
