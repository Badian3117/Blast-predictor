package com.bpguard.monitor.accessibility

import android.view.accessibility.AccessibilityNodeInfo

/**
 * Infowear (like most white-label Chinese fitness-band apps) exposes no API, no export, and
 * no Health Connect integration -- the only way to get a reading out of it short of reverse
 * engineering the watch's private BLE protocol is to read what's already drawn on screen via
 * the Accessibility tree. This is inherently best-effort: it depends on Infowear's current
 * layout and will need re-tuning if an app update changes it (see [InfowearCaptureService]'s
 * "raw capture" debug mode for collecting fresh text samples when parsing stops matching).
 */
object InfowearParser {

    data class ParsedReading(val systolic: Int, val diastolic: Int, val pulseBpm: Int?)

    private val SYS_LABELS = listOf("sys", "systolic", "收缩压")
    private val DIA_LABELS = listOf("dia", "diastolic", "舒张压")
    private val PULSE_LABELS = listOf("pulse", "heart rate", "hr", "心率", "脉搏")

    fun collectText(root: AccessibilityNodeInfo?, into: MutableList<String>) {
        if (root == null) return
        root.text?.toString()?.trim()?.takeIf { it.isNotEmpty() }?.let { into.add(it) }
        for (i in 0 until root.childCount) {
            collectText(root.getChild(i), into)
        }
    }

    /**
     * Two strategies, tried in order:
     *  1. Label-adjacent: a recognized label ("SYS", "DIA", "Pulse"/"HR") immediately followed
     *     by a plausible number in the flattened text list.
     *  2. Positional fallback: the first three numbers on screen that fall in plausible
     *     physiological ranges for systolic/diastolic/pulse, in that order -- this is how most
     *     of these watch apps lay out their "big number" results screen.
     */
    fun parse(texts: List<String>): ParsedReading? {
        val lower = texts.map { it.lowercase() }

        val labelMatch = parseByLabel(texts, lower)
        if (labelMatch != null) return labelMatch

        return parseByPosition(texts)
    }

    private fun parseByLabel(texts: List<String>, lower: List<String>): ParsedReading? {
        var systolic: Int? = null
        var diastolic: Int? = null
        var pulse: Int? = null

        for (i in texts.indices) {
            val line = lower[i]
            when {
                SYS_LABELS.any { line.contains(it) } -> systolic = systolic ?: extractNumberNear(texts, i, 70..250)
                DIA_LABELS.any { line.contains(it) } -> diastolic = diastolic ?: extractNumberNear(texts, i, 40..150)
                PULSE_LABELS.any { line.contains(it) } -> pulse = pulse ?: extractNumberNear(texts, i, 30..220)
            }
        }

        return if (systolic != null && diastolic != null) {
            ParsedReading(systolic, diastolic, pulse)
        } else {
            null
        }
    }

    /** Looks at the label's own text first (e.g. "SYS 128"), then the next couple of nodes. */
    private fun extractNumberNear(texts: List<String>, labelIndex: Int, range: IntRange): Int? {
        val candidates = listOfNotNull(
            texts.getOrNull(labelIndex),
            texts.getOrNull(labelIndex + 1),
            texts.getOrNull(labelIndex + 2)
        )
        for (candidate in candidates) {
            val number = Regex("\\d+").find(candidate)?.value?.toIntOrNull()
            if (number != null && number in range) return number
        }
        return null
    }

    private fun parseByPosition(texts: List<String>): ParsedReading? {
        val numbers = texts.mapNotNull { text ->
            if (Regex("^\\d{2,3}$").matches(text.trim())) text.trim().toIntOrNull() else null
        }

        val systolic = numbers.firstOrNull { it in 70..250 }
        val remaining = numbers.filterNot { it == systolic }
        val diastolic = remaining.firstOrNull { it in 40..150 && (systolic == null || it < systolic) }
        val pulse = remaining.filterNot { it == diastolic }.firstOrNull { it in 30..220 }

        return if (systolic != null && diastolic != null) {
            ParsedReading(systolic, diastolic, pulse)
        } else {
            null
        }
    }
}
