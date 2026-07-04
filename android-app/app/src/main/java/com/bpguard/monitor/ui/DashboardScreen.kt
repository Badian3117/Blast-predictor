package com.bpguard.monitor.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.bpguard.monitor.data.BpReading
import com.bpguard.monitor.ui.components.BpTrendChart
import com.bpguard.monitor.ui.theme.color
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun DashboardScreen(viewModel: BpViewModel, onAddReading: () -> Unit) {
    val readings by viewModel.log.collectAsState()
    val isSyncing by viewModel.isSyncing.collectAsState()
    val latest = readings.firstOrNull()
    val weekAverage = viewModel.sevenDayAverage()

    Column(modifier = Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        LatestReadingCard(latest)

        if (weekAverage != null) {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("7-day average", fontWeight = FontWeight.SemiBold)
                    Text("${weekAverage.first}/${weekAverage.second} mmHg")
                }
            }
        }

        if (readings.size >= 2) {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Trend (blue = systolic, amber = diastolic)", fontWeight = FontWeight.SemiBold)
                    BpTrendChart(readings.take(30))
                }
            }
        }

        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Button(onClick = onAddReading) { Text("Add reading") }
            Button(onClick = { viewModel.syncNow() }) {
                if (isSyncing) {
                    CircularProgressIndicator(modifier = Modifier.padding(end = 8.dp))
                }
                Text("Sync Health Connect")
            }
        }
    }
}

@Composable
private fun LatestReadingCard(latest: BpReading?) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = latest?.category?.color() ?: CardDefaults.cardColors().containerColor)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            if (latest == null) {
                Text("No readings yet", fontWeight = FontWeight.SemiBold)
                Text("Add a manual entry or enable Infowear capture in Settings to get started.")
                return@Column
            }
            Text(latest.category.label, fontWeight = FontWeight.Bold)
            Text("${latest.systolic}/${latest.diastolic} mmHg", fontWeight = FontWeight.Bold)
            latest.pulseBpm?.let { Text("Pulse: $it bpm") }
            Text("Source: ${latest.primarySource.displayName}")
            if (latest.mergedSources.size > 1) {
                Text("Combined from: ${latest.mergedSources.joinToString { it.displayName }}")
            }
            Text(SimpleDateFormat("EEE d MMM, HH:mm", Locale.getDefault()).format(Date(latest.timestampEpochMillis)))
            latest.note?.let { Text(it) }
        }
    }
}
