package com.bpguard.monitor.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.bpguard.monitor.data.BpReading
import com.bpguard.monitor.data.BpSource
import com.bpguard.monitor.data.repository.BpRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class BpViewModel(application: Application) : AndroidViewModel(application) {

    private val repository = BpRepository(application)

    val log: StateFlow<List<BpReading>> = repository.observeLog()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    private val _isSyncing = MutableStateFlow(false)
    val isSyncing: StateFlow<Boolean> = _isSyncing

    fun addManualEntry(systolic: Int, diastolic: Int, pulse: Int?, fromCuff: Boolean, note: String?) {
        viewModelScope.launch {
            repository.recordManualEntry(
                systolic = systolic,
                diastolic = diastolic,
                pulseBpm = pulse,
                source = if (fromCuff) BpSource.MANUAL_CUFF else BpSource.MANUAL_WATCH_ENTRY,
                note = note
            )
        }
    }

    fun syncNow() {
        viewModelScope.launch {
            _isSyncing.value = true
            repository.syncFromHealthConnect()
            _isSyncing.value = false
        }
    }

    /** Simple 7-day rolling average, the window most home BP monitoring guidance is based on. */
    fun sevenDayAverage(): Pair<Int, Int>? {
        val cutoff = System.currentTimeMillis() - 7L * 24 * 3600 * 1000
        val recent = log.value.filter { it.timestampEpochMillis >= cutoff }
        if (recent.isEmpty()) return null
        return recent.map { it.systolic }.average().toInt() to recent.map { it.diastolic }.average().toInt()
    }
}
