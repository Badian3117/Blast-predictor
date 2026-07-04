package com.bpguard.monitor.accessibility

import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityEvent
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

/**
 * Best-effort capture of BP/pulse values Infowear draws on screen. This is opt-in (the user
 * must explicitly enable it under Android's Accessibility settings) and only ever reads
 * content from the single app the user points it at in-app Settings -- see the README's
 * "How Infowear capture works" section for the tradeoffs of this approach versus a validated
 * cuff, which remains the source of truth in the reconciliation engine.
 */
class InfowearCaptureService : AccessibilityService() {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    private lateinit var prefs: InfowearCapturePrefs
    private var lastWalkAtMillis = 0L
    private val minWalkIntervalMillis = 1500L

    override fun onServiceConnected() {
        super.onServiceConnected()
        prefs = InfowearCapturePrefs(this)
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        val pkg = event?.packageName?.toString() ?: return
        InfowearCaptureBus.updateForegroundPackage(pkg)

        val target = prefs.targetPackage
        val shouldInspect = when {
            target != null -> pkg == target
            prefs.debugModeEnabled -> true // no target configured yet: help the user identify it
            else -> false
        }
        if (!shouldInspect) return

        val eventType = event.eventType
        if (eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED &&
            eventType != AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED
        ) {
            return
        }

        val now = System.currentTimeMillis()
        if (now - lastWalkAtMillis < minWalkIntervalMillis) return
        lastWalkAtMillis = now

        val root = rootInActiveWindow ?: return
        val texts = mutableListOf<String>()
        InfowearParser.collectText(root, texts)
        root.recycle()

        if (texts.isEmpty()) return

        if (prefs.debugModeEnabled) {
            InfowearCaptureBus.updateRawCapture(texts)
        }

        if (target == null) return // still calibrating: don't try to parse an unconfirmed app

        val parsed = InfowearParser.parse(texts) ?: return
        scope.launch { InfowearCaptureBus.publish(parsed) }
    }

    override fun onInterrupt() = Unit
}
