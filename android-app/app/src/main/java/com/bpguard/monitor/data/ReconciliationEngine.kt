package com.bpguard.monitor.data

import kotlin.math.abs

/**
 * Merges a freshly-arrived candidate reading (from a manual entry, an Infowear auto-capture,
 * or Health Connect) against whatever the log already has nearby in time. This is the one
 * place in the app that decides what "the" blood pressure was at a given moment when the
 * phone and the watch don't agree.
 *
 * Rules, in priority order:
 *  1. Physiologically implausible values are rejected outright (protects against a bad OCR/
 *     text-scrape read from Infowear, e.g. picking up a step count instead of a BP number).
 *  2. If nothing else falls within [MERGE_WINDOW_MILLIS] of the candidate, it becomes its own
 *     log entry.
 *  3. If something does fall within the window, the entry with the higher [BpSource.trustPriority]
 *     wins as the *displayed* systolic/diastolic/pulse, but every contributing source is kept
 *     in `mergedSources` so nothing is silently discarded.
 *  4. When the two sources are close enough to agree (within [AGREEMENT_THRESHOLD_MMHG]), the
 *     values are averaged instead of just picking one -- this is what actually improves
 *     accuracy over either source alone, since watch-vs-cuff/repeat-reading noise partially
 *     cancels out.
 */
object ReconciliationEngine {

    const val MERGE_WINDOW_MILLIS = 5 * 60 * 1000L
    private const val AGREEMENT_THRESHOLD_MMHG = 12

    private val PLAUSIBLE_SYSTOLIC = 60..260
    private val PLAUSIBLE_DIASTOLIC = 30..160

    sealed class Result {
        data class Insert(val reading: BpReading) : Result()
        data class Update(val existingId: Long, val merged: BpReading) : Result()
        data class Rejected(val reason: String) : Result()
    }

    fun isPlausible(systolic: Int, diastolic: Int): Boolean =
        systolic in PLAUSIBLE_SYSTOLIC && diastolic in PLAUSIBLE_DIASTOLIC && systolic > diastolic

    /**
     * @param nearbyExisting readings already in the log within [MERGE_WINDOW_MILLIS] of the
     *        candidate's timestamp (caller fetches these from Room; kept out of this function
     *        so the merge logic itself stays a pure, easily-tested unit).
     */
    fun reconcile(candidate: BpReading, nearbyExisting: List<BpReading>): Result {
        if (!isPlausible(candidate.systolic, candidate.diastolic)) {
            return Result.Rejected(
                "Systolic ${candidate.systolic}/diastolic ${candidate.diastolic} outside plausible range"
            )
        }

        val closest = nearbyExisting
            .filter { abs(it.timestampEpochMillis - candidate.timestampEpochMillis) <= MERGE_WINDOW_MILLIS }
            .minByOrNull { abs(it.timestampEpochMillis - candidate.timestampEpochMillis) }
            ?: return Result.Insert(candidate)

        val agree = abs(closest.systolic - candidate.systolic) <= AGREEMENT_THRESHOLD_MMHG &&
            abs(closest.diastolic - candidate.diastolic) <= AGREEMENT_THRESHOLD_MMHG

        val merged = if (agree) {
            averageMerge(closest, candidate)
        } else {
            priorityMerge(closest, candidate)
        }

        return Result.Update(closest.id, merged)
    }

    private fun averageMerge(existing: BpReading, candidate: BpReading): BpReading {
        val winner = if (existing.primarySource.trustPriority >= candidate.primarySource.trustPriority) existing else candidate
        return existing.copy(
            systolic = (existing.systolic + candidate.systolic) / 2,
            diastolic = (existing.diastolic + candidate.diastolic) / 2,
            pulseBpm = averageNullable(existing.pulseBpm, candidate.pulseBpm),
            primarySource = winner.primarySource,
            mergedSources = (existing.mergedSources + candidate.mergedSources).distinct(),
            restingContext = existing.restingContext ?: candidate.restingContext,
            note = null
        )
    }

    private fun priorityMerge(existing: BpReading, candidate: BpReading): BpReading {
        val winner = if (candidate.primarySource.trustPriority > existing.primarySource.trustPriority) candidate else existing
        return existing.copy(
            systolic = winner.systolic,
            diastolic = winner.diastolic,
            pulseBpm = winner.pulseBpm ?: existing.pulseBpm ?: candidate.pulseBpm,
            primarySource = winner.primarySource,
            mergedSources = (existing.mergedSources + candidate.mergedSources).distinct(),
            restingContext = existing.restingContext ?: candidate.restingContext,
            note = "Sources disagreed (>${AGREEMENT_THRESHOLD_MMHG} mmHg); kept ${winner.primarySource.displayName}"
        )
    }

    private fun averageNullable(a: Int?, b: Int?): Int? = when {
        a != null && b != null -> (a + b) / 2
        else -> a ?: b
    }
}
