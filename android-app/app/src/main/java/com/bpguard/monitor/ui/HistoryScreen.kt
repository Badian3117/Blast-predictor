package com.bpguard.monitor.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.bpguard.monitor.data.BpReading
import com.bpguard.monitor.ui.theme.color
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun HistoryScreen(viewModel: BpViewModel) {
    val readings by viewModel.log.collectAsState()
    val formatter = remember { SimpleDateFormat("EEE d MMM, HH:mm", Locale.getDefault()) }

    LazyColumn(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp)) {
        items(readings) { reading ->
            HistoryRow(reading, formatter)
            HorizontalDivider()
        }
    }
}

@Composable
private fun HistoryRow(reading: BpReading, formatter: SimpleDateFormat) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 10.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Column {
            Text("${reading.systolic}/${reading.diastolic} mmHg", fontWeight = FontWeight.SemiBold)
            Text(formatter.format(Date(reading.timestampEpochMillis)))
            Text(reading.primarySource.displayName)
        }
        Column(horizontalAlignment = Alignment.End) {
            Box(
                modifier = Modifier
                    .size(14.dp)
                    .clip(CircleShape)
                    .background(reading.category.color())
            )
            Text(reading.category.label)
        }
    }
}
