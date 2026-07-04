package com.bpguard.monitor.data

/**
 * Where a single BP reading originated. Priority order matters for reconciliation:
 * a validated cuff reading should always outrank an optical/PPG watch estimate.
 */
enum class BpSource(val displayName: String, val trustPriority: Int) {
    MANUAL_CUFF("Manual (cuff)", 100),
    INFOWEAR_AUTO_CAPTURE("Watch (auto-captured)", 60),
    MANUAL_WATCH_ENTRY("Watch (typed in manually)", 55),
    HEALTH_CONNECT("Health Connect", 40)
}
