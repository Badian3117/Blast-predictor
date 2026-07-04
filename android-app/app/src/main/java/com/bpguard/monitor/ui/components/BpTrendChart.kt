package com.bpguard.monitor.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.dp
import com.bpguard.monitor.data.BpReading
import com.bpguard.monitor.ui.theme.BpAmber
import com.bpguard.monitor.ui.theme.BpBlue

/** Minimal dependency-free line chart: systolic in blue, diastolic in amber, oldest-to-newest. */
@Composable
fun BpTrendChart(readings: List<BpReading>, modifier: Modifier = Modifier) {
    val chronological = readings.sortedBy { it.timestampEpochMillis }
    if (chronological.size < 2) return

    val minY = (chronological.minOf { it.diastolic } - 10).coerceAtLeast(0)
    val maxY = chronological.maxOf { it.systolic } + 10

    Canvas(
        modifier = modifier
            .fillMaxWidth()
            .height(180.dp)
    ) {
        val stepX = size.width / (chronological.size - 1)
        fun yFor(value: Int): Float {
            val fraction = (value - minY).toFloat() / (maxY - minY).toFloat()
            return size.height - fraction * size.height
        }

        fun drawSeries(values: List<Int>, color: androidx.compose.ui.graphics.Color) {
            val path = androidx.compose.ui.graphics.Path()
            values.forEachIndexed { index, value ->
                val point = Offset(index * stepX, yFor(value))
                if (index == 0) path.moveTo(point.x, point.y) else path.lineTo(point.x, point.y)
            }
            drawPath(path, color = color, style = Stroke(width = 4f))
        }

        drawSeries(chronological.map { it.systolic }, BpBlue)
        drawSeries(chronological.map { it.diastolic }, BpAmber)
    }
}
