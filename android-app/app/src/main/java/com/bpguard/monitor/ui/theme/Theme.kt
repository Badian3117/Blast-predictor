package com.bpguard.monitor.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val BpBlue = Color(0xFF2A6BC5)
val BpGreen = Color(0xFF2E9E5B)
val BpAmber = Color(0xFFE0A315)
val BpRed = Color(0xFFD84343)
val BpCrisis = Color(0xFF8E1E1E)

private val LightColors = lightColorScheme(primary = BpBlue)
private val DarkColors = darkColorScheme(primary = BpBlue)

@Composable
fun BpGuardTheme(content: @Composable () -> Unit) {
    val colors = if (isSystemInDarkTheme()) DarkColors else LightColors
    MaterialTheme(colorScheme = colors, content = content)
}
