package com.badian.phonelink

import android.Manifest
import android.app.Activity
import android.app.AlertDialog
import android.app.role.RoleManager
import android.content.ActivityNotFoundException
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.telecom.TelecomManager
import android.text.format.DateUtils
import android.view.View
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.EditText
import android.widget.RadioGroup
import android.widget.Spinner
import android.widget.Switch
import android.widget.TextView
import android.widget.Toast
import com.badian.phonelink.core.ForwardMode
import com.badian.phonelink.core.ForwardingCodes
import com.badian.phonelink.core.LinkMethod
import com.badian.phonelink.core.Ntfy
import com.badian.phonelink.core.PhoneNumbers
import com.badian.phonelink.core.RemoteCommand

class MainActivity : Activity() {

    private lateinit var prefs: Prefs
    private lateinit var status: TextView
    private lateinit var linkButton: Button
    private lateinit var methodGroup: RadioGroup
    private lateinit var alertBox: View
    private lateinit var forwardBox: View
    private lateinit var server: EditText
    private lateinit var topic: EditText
    private lateinit var detection: TextView
    private lateinit var detectionButton: Button
    private lateinit var smsFallback: Switch
    private lateinit var partner: EditText
    private lateinit var modeGroup: RadioGroup
    private lateinit var delay: Spinner
    private lateinit var delayLabel: TextView
    private lateinit var voicemail: EditText
    private lateinit var sim: Spinner
    private lateinit var remote: Switch
    private lateinit var pin: EditText
    private lateinit var remoteBox: View

    /** SIM choices: null = system default, else Forwarder.accountKey(handle). */
    private val simKeys = mutableListOf<String?>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        view<View>(R.id.root).setOnApplyWindowInsetsListener { v, insets ->
            @Suppress("DEPRECATION")
            v.setPadding(insets.systemWindowInsetLeft, insets.systemWindowInsetTop,
                insets.systemWindowInsetRight, insets.systemWindowInsetBottom)
            insets
        }
        prefs = Prefs(this)

        status = view(R.id.status)
        linkButton = view(R.id.link_button)
        methodGroup = view(R.id.method)
        alertBox = view(R.id.alert_box)
        forwardBox = view(R.id.forward_box)
        server = view(R.id.server)
        topic = view(R.id.topic)
        detection = view(R.id.detection)
        detectionButton = view(R.id.detection_button)
        smsFallback = view(R.id.sms_fallback)
        partner = view(R.id.partner)
        modeGroup = view(R.id.mode)
        delay = view(R.id.delay)
        delayLabel = view(R.id.delay_label)
        voicemail = view(R.id.voicemail)
        sim = view(R.id.sim)
        remote = view(R.id.remote)
        pin = view(R.id.pin)
        remoteBox = view(R.id.remote_box)

        delay.adapter = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item,
            ForwardingCodes.DELAYS.map { getString(R.string.seconds, it) })

        loadSettings()
        methodGroup.setOnCheckedChangeListener { _, _ -> updateSections() }
        modeGroup.setOnCheckedChangeListener { _, _ -> updateSections() }
        remote.setOnCheckedChangeListener { _, on ->
            remoteBox.visibility = if (on) View.VISIBLE else View.GONE
            if (on) requestSmsPermissions()
        }
        smsFallback.setOnCheckedChangeListener { _, on -> if (on) requestSmsPermissions() }

        linkButton.setOnClickListener { if (saveSettings()) toggleLink() }
        view<Button>(R.id.check_button).setOnClickListener { report(Forwarder.checkWithCarrier(this)) }
        view<Button>(R.id.save_button).setOnClickListener {
            if (saveSettings()) Toast.makeText(this, R.string.saved, Toast.LENGTH_SHORT).show()
        }
        detectionButton.setOnClickListener { requestCallDetection() }
        view<Button>(R.id.subscribe_button).setOnClickListener { if (saveSettings()) openInNtfy() }
        view<Button>(R.id.copy_button).setOnClickListener { if (saveSettings()) copyTopic() }
        view<Button>(R.id.new_topic_button).setOnClickListener { confirmNewTopic() }
        view<Button>(R.id.test_button).setOnClickListener { if (saveSettings()) sendTest() }
        view<Button>(R.id.remote_on).setOnClickListener { sendRemote(RemoteCommand.Action.ON) }
        view<Button>(R.id.remote_off).setOnClickListener { sendRemote(RemoteCommand.Action.OFF) }
        view<Button>(R.id.remote_status).setOnClickListener { sendRemote(RemoteCommand.Action.STATUS) }

        requestCorePermissions()
    }

    override fun onResume() {
        super.onResume()
        renderStatus()
        renderDetection()
    }

    // --- Actions -----------------------------------------------------------

    private fun toggleLink() {
        val turningOff = prefs.linked
        val alerts = if (turningOff) prefs.linkedMethod == LinkMethod.ALERT else prefs.method == LinkMethod.ALERT
        val result = if (turningOff) Link.off(this) else Link.on(this)
        report(result, when {
            !alerts -> R.string.request_sent
            turningOff -> R.string.alerts_off_toast
            else -> R.string.alerts_on_toast
        })
        renderStatus()
    }

    private fun sendTest() {
        val app = applicationContext
        Thread {
            val ok = Alerts.announce(app, prefs.partnerNumber.ifBlank { null }, test = true)
            runOnUiThread { toast(if (ok) R.string.test_sent else R.string.err_test) }
        }.start()
    }

    private fun openInNtfy() {
        // The ntfy app handles ntfy://host/topic links and opens its subscribe screen.
        val host = prefs.ntfyServer.substringAfter("://")
        val link = Uri.parse("ntfy://$host/${prefs.ntfyTopic}")
        try {
            startActivity(Intent(Intent.ACTION_VIEW, link))
        } catch (e: ActivityNotFoundException) {
            AlertDialog.Builder(this)
                .setTitle(R.string.ntfy_missing_title)
                .setMessage(getString(R.string.ntfy_missing_body, prefs.ntfyServer, prefs.ntfyTopic))
                .setPositiveButton(R.string.ntfy_get) { _, _ ->
                    openUrl("https://play.google.com/store/apps/details?id=io.heckel.ntfy")
                }
                .setNegativeButton(android.R.string.cancel, null)
                .show()
        }
    }

    private fun copyTopic() {
        getSystemService(ClipboardManager::class.java)
            ?.setPrimaryClip(ClipData.newPlainText("ntfy topic", prefs.ntfyTopic))
        toast(R.string.copied)
    }

    private fun confirmNewTopic() {
        AlertDialog.Builder(this)
            .setTitle(R.string.new_topic)
            .setMessage(R.string.new_topic_body)
            .setPositiveButton(android.R.string.ok) { _, _ ->
                prefs.ntfyTopic = Ntfy.newTopic()
                topic.setText(prefs.ntfyTopic)
            }
            .setNegativeButton(android.R.string.cancel, null)
            .show()
    }

    private fun requestCallDetection() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val roles = getSystemService(RoleManager::class.java)
            if (roles != null && roles.isRoleAvailable(RoleManager.ROLE_CALL_SCREENING) &&
                !roles.isRoleHeld(RoleManager.ROLE_CALL_SCREENING)
            ) {
                startActivityForResult(roles.createRequestRoleIntent(RoleManager.ROLE_CALL_SCREENING), REQ_ROLE)
            }
            // Without contacts access, Android does not show calls from contacts to the service.
            requestMissing(listOf(Manifest.permission.READ_CONTACTS), REQ_CORE)
        } else {
            requestMissing(listOf(Manifest.permission.READ_PHONE_STATE, Manifest.permission.READ_CALL_LOG,
                Manifest.permission.READ_CONTACTS), REQ_CORE)
        }
    }

    @Deprecated("Activity result API is framework-only here")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        @Suppress("DEPRECATION")
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == REQ_ROLE) renderDetection()
    }

    private fun sendRemote(action: RemoteCommand.Action) {
        if (!saveSettings()) return
        if (!PhoneNumbers.isDialable(prefs.partnerNumber)) { partner.error = getString(R.string.err_no_partner); return }
        if (!RemoteCommand.isValidPin(prefs.pin)) { toast(R.string.err_pin); return }
        if (!hasAll(SMS_PERMISSIONS)) { requestSmsPermissions(); return }
        val ok = Sms.send(this, PhoneNumbers.clean(prefs.partnerNumber), RemoteCommand.command(prefs.pin, action))
        toast(if (ok) R.string.remote_sent else R.string.err_sms)
    }

    private fun report(result: LinkResult, successMessage: Int = R.string.request_sent) {
        when (result) {
            LinkResult.Sent -> toast(successMessage)
            is LinkResult.Failed -> {
                toast(result.messageRes)
                when (result.messageRes) {
                    R.string.err_call_permission -> requestCorePermissions()
                    R.string.err_call_detection -> requestCallDetection()
                }
            }
        }
    }

    // --- Rendering ---------------------------------------------------------

    private fun renderStatus() {
        if (prefs.linked) {
            val since = DateUtils.getRelativeTimeSpanString(prefs.linkedAt, System.currentTimeMillis(), DateUtils.MINUTE_IN_MILLIS)
            status.text = if (prefs.linkedMethod == LinkMethod.ALERT) {
                getString(R.string.status_alerts_on, since)
            } else {
                getString(R.string.status_linked, prefs.linkedTo, getString(modeLabel(prefs.linkedMode ?: prefs.mode)), since)
            }
            status.setBackgroundResource(R.drawable.status_on)
            linkButton.setText(R.string.unlink)
        } else {
            status.setText(R.string.status_unlinked)
            status.setBackgroundResource(R.drawable.status_off)
            linkButton.setText(R.string.link)
        }
    }

    private fun renderDetection() {
        val ok = Alerts.canDetectCalls(this)
        detection.setText(if (ok) R.string.detection_ok else R.string.detection_missing)
        detectionButton.visibility = if (ok) View.GONE else View.VISIBLE
    }

    private fun updateSections() {
        val alert = selectedMethod() == LinkMethod.ALERT
        alertBox.visibility = if (alert) View.VISIBLE else View.GONE
        forwardBox.visibility = if (alert) View.GONE else View.VISIBLE
        val showDelay = if (selectedMode().supportsDelay) View.VISIBLE else View.GONE
        delay.visibility = showDelay
        delayLabel.visibility = showDelay
    }

    // --- Settings ----------------------------------------------------------

    private fun loadSettings() {
        methodGroup.check(if (prefs.method == LinkMethod.ALERT) R.id.method_alert else R.id.method_forward)
        server.setText(prefs.ntfyServer)
        topic.setText(prefs.ntfyTopic)
        smsFallback.isChecked = prefs.smsFallback
        partner.setText(prefs.partnerNumber)
        modeGroup.check(when (prefs.mode) {
            ForwardMode.CONDITIONAL -> R.id.mode_conditional
            ForwardMode.NO_ANSWER -> R.id.mode_no_answer
            ForwardMode.ALWAYS -> R.id.mode_always
        })
        delay.setSelection(ForwardingCodes.DELAYS.indexOf(prefs.delaySeconds).coerceAtLeast(0))
        voicemail.setText(prefs.voicemailNumber)
        remote.isChecked = prefs.remoteEnabled
        remoteBox.visibility = if (prefs.remoteEnabled) View.VISIBLE else View.GONE
        pin.setText(prefs.pin)
        updateSections()
        loadSims()
    }

    private fun selectedMethod() =
        if (methodGroup.checkedRadioButtonId == R.id.method_forward) LinkMethod.FORWARD else LinkMethod.ALERT

    private fun selectedMode() = when (modeGroup.checkedRadioButtonId) {
        R.id.mode_no_answer -> ForwardMode.NO_ANSWER
        R.id.mode_always -> ForwardMode.ALWAYS
        else -> ForwardMode.CONDITIONAL
    }

    /** Validates and saves; returns false (with an error on the field) if something is wrong. */
    private fun saveSettings(): Boolean {
        val method = selectedMethod()
        val number = partner.text.toString()
        val needsNumber = method == LinkMethod.FORWARD || smsFallback.isChecked || remote.isChecked
        if ((needsNumber || number.isNotBlank()) && !PhoneNumbers.isDialable(number)) {
            partner.error = getString(R.string.err_no_partner); return false
        }
        val serverUrl = Ntfy.normalizeServer(server.text.toString())
        if (serverUrl == null) { server.error = getString(R.string.err_server); return false }
        val topicText = topic.text.toString().trim()
        if (!Ntfy.isValidTopic(topicText)) { topic.error = getString(R.string.err_topic); return false }
        val vm = voicemail.text.toString()
        if (vm.isNotBlank() && !PhoneNumbers.isDialable(vm)) { voicemail.error = getString(R.string.err_number); return false }
        val pinText = pin.text.toString()
        if (remote.isChecked && !RemoteCommand.isValidPin(pinText)) { pin.error = getString(R.string.err_pin); return false }

        // Switching method while linked would leave the old link running: end it first.
        if (prefs.linked && prefs.linkedMethod != method) Link.off(this)

        prefs.method = method
        prefs.ntfyServer = serverUrl
        prefs.ntfyTopic = topicText
        prefs.smsFallback = smsFallback.isChecked
        prefs.partnerNumber = if (number.isBlank()) "" else PhoneNumbers.clean(number)
        prefs.mode = selectedMode()
        prefs.delaySeconds = ForwardingCodes.DELAYS[delay.selectedItemPosition.coerceAtLeast(0)]
        prefs.voicemailNumber = if (vm.isBlank()) "" else PhoneNumbers.clean(vm)
        prefs.remoteEnabled = remote.isChecked
        prefs.pin = pinText
        prefs.phoneAccount = simKeys.getOrNull(sim.selectedItemPosition)
        partner.setText(prefs.partnerNumber)
        server.setText(prefs.ntfyServer)

        if (method == LinkMethod.FORWARD && !PhoneNumbers.isInternational(prefs.partnerNumber)) toast(R.string.hint_international)
        renderStatus()
        return true
    }

    private fun loadSims() {
        val labels = mutableListOf(getString(R.string.sim_default))
        simKeys.clear()
        simKeys.add(null)
        if (checkSelfPermission(Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED) {
            val telecom = getSystemService(TelecomManager::class.java)
            try {
                telecom?.callCapablePhoneAccounts?.forEach { handle ->
                    simKeys.add(Forwarder.accountKey(handle))
                    labels.add(telecom.getPhoneAccount(handle)?.label?.toString() ?: handle.id)
                }
            } catch (_: SecurityException) { }
        }
        sim.adapter = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, labels)
        sim.setSelection(simKeys.indexOf(prefs.phoneAccount).coerceAtLeast(0))
    }

    private fun modeLabel(mode: ForwardMode) = when (mode) {
        ForwardMode.CONDITIONAL -> R.string.mode_conditional
        ForwardMode.NO_ANSWER -> R.string.mode_no_answer
        ForwardMode.ALWAYS -> R.string.mode_always
    }

    // --- Permissions -------------------------------------------------------

    private fun requestCorePermissions() {
        val wanted = buildList {
            add(Manifest.permission.READ_PHONE_STATE)
            add(Manifest.permission.READ_CONTACTS)
            if (prefs.method == LinkMethod.FORWARD) add(Manifest.permission.CALL_PHONE)
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) add(Manifest.permission.READ_CALL_LOG)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) add(Manifest.permission.POST_NOTIFICATIONS)
            if (prefs.remoteEnabled || prefs.smsFallback) addAll(SMS_PERMISSIONS)
        }
        requestMissing(wanted, REQ_CORE)
    }

    private fun requestSmsPermissions() = requestMissing(SMS_PERMISSIONS, REQ_SMS)

    private fun requestMissing(perms: List<String>, code: Int) {
        val wanted = perms.filter { checkSelfPermission(it) != PackageManager.PERMISSION_GRANTED }
        if (wanted.isNotEmpty()) requestPermissions(wanted.toTypedArray(), code)
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        loadSims()
        renderDetection()
        val smsDenied = permissions.indices.any {
            permissions[it] in SMS_PERMISSIONS && grantResults[it] != PackageManager.PERMISSION_GRANTED
        }
        if (smsDenied) {
            // Android 13+ blocks SMS permissions for sideloaded apps until the user allows it.
            AlertDialog.Builder(this)
                .setTitle(R.string.restricted_title)
                .setMessage(R.string.restricted_body)
                .setPositiveButton(android.R.string.ok, null)
                .show()
        }
    }

    // --- Helpers -----------------------------------------------------------

    private fun openUrl(url: String) {
        try { startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url))) } catch (_: ActivityNotFoundException) { }
    }

    private fun <T : View> view(id: Int): T = checkNotNull(findViewById<T>(id)) { "Missing view $id" }

    private fun hasAll(perms: List<String>) = perms.all { checkSelfPermission(it) == PackageManager.PERMISSION_GRANTED }

    private fun toast(res: Int) = Toast.makeText(this, res, Toast.LENGTH_LONG).show()

    companion object {
        private const val REQ_CORE = 1
        private const val REQ_SMS = 2
        private const val REQ_ROLE = 3
        private val SMS_PERMISSIONS = listOf(Manifest.permission.SEND_SMS, Manifest.permission.RECEIVE_SMS)
    }
}
