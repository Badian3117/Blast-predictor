package com.bpguard.monitor.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Checkbox
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

/**
 * Fast manual entry. This is deliberately kept as the most frictionless path in the app: a
 * validated cuff reading typed in here always outranks an auto-captured watch estimate in the
 * reconciliation engine, so it's the most reliable way to keep the log accurate.
 */
@Composable
fun ManualEntryScreen(onSave: (systolic: Int, diastolic: Int, pulse: Int?, fromCuff: Boolean, note: String?) -> Unit) {
    var systolic by remember { mutableStateOf("") }
    var diastolic by remember { mutableStateOf("") }
    var pulse by remember { mutableStateOf("") }
    var note by remember { mutableStateOf("") }
    var fromCuff by remember { mutableStateOf(true) }

    Column(modifier = Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        OutlinedTextField(value = systolic, onValueChange = { systolic = it }, label = { Text("Systolic (mmHg)") })
        OutlinedTextField(value = diastolic, onValueChange = { diastolic = it }, label = { Text("Diastolic (mmHg)") })
        OutlinedTextField(value = pulse, onValueChange = { pulse = it }, label = { Text("Pulse (bpm, optional)") })
        OutlinedTextField(value = note, onValueChange = { note = it }, label = { Text("Note (optional)") })

        Row {
            Checkbox(checked = fromCuff, onCheckedChange = { fromCuff = it })
            Text("This came from a validated cuff (uncheck if it's a watch reading you're typing in)")
        }

        Button(onClick = {
            val s = systolic.toIntOrNull()
            val d = diastolic.toIntOrNull()
            if (s != null && d != null) {
                onSave(s, d, pulse.toIntOrNull(), fromCuff, note.ifBlank { null })
                systolic = ""; diastolic = ""; pulse = ""; note = ""
            }
        }) {
            Text("Save reading")
        }
    }
}
