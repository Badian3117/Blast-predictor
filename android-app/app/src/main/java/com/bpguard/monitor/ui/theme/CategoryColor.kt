package com.bpguard.monitor.ui.theme

import androidx.compose.ui.graphics.Color
import com.bpguard.monitor.data.BpCategory

fun BpCategory.color(): Color = when (this) {
    BpCategory.NORMAL -> BpGreen
    BpCategory.ELEVATED -> BpAmber
    BpCategory.HYPERTENSION_STAGE_1 -> BpAmber
    BpCategory.HYPERTENSION_STAGE_2 -> BpRed
    BpCategory.HYPERTENSIVE_CRISIS -> BpCrisis
}
