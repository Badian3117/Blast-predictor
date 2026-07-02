package com.bpguard.monitor.ui

import android.content.Intent
import android.provider.Settings
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.bpguard.monitor.accessibility.InfowearCaptureBus
import com.bpguard.monitor.accessibility.InfowearCapturePrefs

@Composable
fun SettingsScreen(healthConnectAvailable: Boolean, onRequestHealthConnectPermissions: () -> Unit) {
    val context = LocalContext.current
    val prefs = remember { InfowearCapturePrefs(context) }
    var targetPackage by remember { mutableStateOf(prefs.targetPackage ?: "") }
    var debugMode by remember { mutableStateOf(prefs.debugModeEnabled) }
    val lastForegroundPackage by InfowearCaptureBus.lastForegroundPackage.collectAsState()
    val lastRawCapture by InfowearCaptureBus.lastRawCapture.collectAsState()

    Column(modifier = Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {

        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Health Connect")
                Text(if (healthConnectAvailable) "Available on this phone" else "Not installed / not available")
                Button(onClick = onRequestHealthConnectPermissions) {
                    Text("Grant permissions")
                }
            }
        }

        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Infowear watch capture")
                Text(
                    "Infowear doesn't export its data, so this app reads BP/pulse values " +
                        "directly off Infowear's own screen using Android's Accessibility service. " +
                        "It only ever inspects the app you name below, and only while that app is open."
                )

                Button(onClick = {
                    context.startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
                }) {
                    Text("Open Accessibility settings to enable")
                }

                HorizontalDivider()

                Text("Step 1: find Infowear's package name")
                Row(verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
                    Switch(checked = debugMode, onCheckedChange = {
                        debugMode = it
                        prefs.debugModeEnabled = it
                    })
                    Text("Calibration mode (shows what's on screen right now)")
                }
                if (debugMode) {
                    Text("Currently in foreground: ${lastForegroundPackage ?: "unknown"}")
                    Text("Last text seen: ${lastRawCapture.joinToString(" | ").ifBlank { "(open Infowear's BP result screen)" }}")
                }

                HorizontalDivider()

                Text("Step 2: lock capture to that package")
                OutlinedTextField(
                    value = targetPackage,
                    onValueChange = { targetPackage = it },
                    label = { Text("Infowear package name, e.g. com.example.infowear") }
                )
                Button(onClick = { prefs.targetPackage = targetPackage.ifBlank { null } }) {
                    Text("Save")
                }
            }
        }

        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Important")
                Text(
                    "Optical (PPG) blood pressure estimates from consumer watches are not " +
                        "clinically validated and can be meaningfully wrong, especially without " +
                        "per-user calibration against a cuff. For managing your hypertension " +
                        "(medication decisions, doctor visits), rely on readings from a validated " +
                        "oscillometric cuff, entered here as \"Manual (cuff)\" -- that's the source " +
                        "this app always trusts most. Watch readings are useful for trend context, " +
                        "not diagnosis."
                )
            }
        }
    }
}
