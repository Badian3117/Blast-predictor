package com.bpguard.monitor

import android.app.Application
import com.bpguard.monitor.accessibility.InfowearCaptureBus
import com.bpguard.monitor.data.repository.BpRepository
import com.bpguard.monitor.work.HealthConnectSyncWorker
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

class BpGuardApplication : Application() {

    private val appScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    override fun onCreate() {
        super.onCreate()

        val repository = BpRepository(this)

        // Every Infowear reading the accessibility service manages to parse off-screen flows
        // here and gets merged into the same reconciled log as manual/Health Connect entries.
        appScope.launch {
            InfowearCaptureBus.parsedReadings.collect { parsed ->
                repository.recordInfowearCapture(parsed.systolic, parsed.diastolic, parsed.pulseBpm)
            }
        }

        HealthConnectSyncWorker.schedule(this)
    }
}
