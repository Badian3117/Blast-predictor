package com.bpguard.monitor.data

/**
 * Categories per the AHA/ACC 2017 blood pressure guideline. Classification uses whichever
 * of systolic/diastolic falls into the higher-severity band, as the guideline specifies.
 */
enum class BpCategory(val label: String) {
    NORMAL("Normal"),
    ELEVATED("Elevated"),
    HYPERTENSION_STAGE_1("Hypertension Stage 1"),
    HYPERTENSION_STAGE_2("Hypertension Stage 2"),
    HYPERTENSIVE_CRISIS("Hypertensive Crisis — seek care");

    companion object {
        fun classify(systolic: Int, diastolic: Int): BpCategory = when {
            systolic >= 180 || diastolic >= 120 -> HYPERTENSIVE_CRISIS
            systolic >= 140 || diastolic >= 90 -> HYPERTENSION_STAGE_2
            systolic >= 130 || diastolic >= 80 -> HYPERTENSION_STAGE_1
            systolic >= 120 && diastolic < 80 -> ELEVATED
            else -> NORMAL
        }
    }
}
