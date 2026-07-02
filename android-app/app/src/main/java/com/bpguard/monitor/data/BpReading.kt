package com.bpguard.monitor.data

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * A single, already-reconciled blood pressure entry as it appears in the user-facing log.
 * `mergedSources` records every raw source that contributed to this entry (e.g. an Infowear
 * auto-capture that landed within the merge window of a manual cuff entry), so the origin of
 * a value is never lost even after reconciliation.
 */
@Entity(tableName = "bp_readings")
data class BpReading(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val systolic: Int,
    val diastolic: Int,
    val pulseBpm: Int?,
    val timestampEpochMillis: Long,
    val primarySource: BpSource,
    val mergedSources: List<BpSource> = listOf(primarySource),
    val restingContext: Boolean? = null,
    val note: String? = null
) {
    val category: BpCategory get() = BpCategory.classify(systolic, diastolic)
}
