package com.badian.phonelink

import android.Manifest
import android.app.Activity
import android.app.AlertDialog
import android.content.pm.PackageManager
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
import com.badian.phonelink.core.PhoneNumbers
import com.badian.phonelink.core.RemoteCommand

class MainActivity : Activity() {

    private lateinit var prefs: Prefs
    private lateinit var status: TextView
    private lateinit var linkButton: Button
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
        val root = view<View>(R.id.root)
        root.setOnApplyWindowInsetsListener { v, insets ->
            @Suppress("DEPRECATION")
            v.setPadding(insets.systemWindowInsetLeft, insets.systemWindowInsetTop,
                insets.systemWindowInsetRight, insets.systemWindowInsetBottom)
            insets
        }
        prefs = Prefs(this)

        status = view(R.id.status)
        linkButton = view(R.id.link_button)
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
        modeGroup.setOnCheckedChangeListener { _, _ -> updateDelayVisibility() }
        remote.setOnCheckedChangeListener { _, on ->
            remoteBox.visibility = if (on) View.VISIBLE else View.GONE
            if (on) requestSmsPermissions()
        }

        linkButton.setOnClickListener { if (saveSettings()) toggleLink() }
        view<Button>(R.id.check_button).setOnClickListener { report(Forwarder.checkWithCarrier(this)) }
        view<Button>(R.id.save_button).setOnClickListener {
            if (saveSettings()) Toast.makeText(this, R.string.saved, Toast.LENGTH_SHORT).show()
        }
        view<Button>(R.id.remote_on).setOnClickListener { sendRemote(RemoteCommand.Action.ON) }
        view<Button>(R.id.remote_off).setOnClickListener { sendRemote(RemoteCommand.Action.OFF) }
        view<Button>(R.id.remote_status).setOnClickListener { sendRemote(RemoteCommand.Action.STATUS) }

        requestCorePermissions()
    }

    override fun onResume() {
        super.onResume()
        renderStatus()
    }

    private fun toggleLink() {
        val result = if (prefs.linked) Forwarder.unlink(this) else Forwarder.link(this)
        report(result)
        renderStatus()
    }

    private fun sendRemote(action: RemoteCommand.Action) {
        if (!saveSettings()) return
        if (!RemoteCommand.isValidPin(prefs.pin)) { toast(R.string.err_pin); return }
        if (!hasAll(SMS_PERMISSIONS)) { requestSmsPermissions(); return }
        val ok = Sms.send(this, PhoneNumbers.clean(prefs.partnerNumber), RemoteCommand.command(prefs.pin, action))
        toast(if (ok) R.string.remote_sent else R.string.err_sms)
    }

    private fun report(result: DialResult) {
        when (result) {
            DialResult.Sent -> toast(R.string.request_sent)
            is DialResult.Failed -> {
                toast(result.messageRes)
                if (result.messageRes == R.string.err_call_permission) requestCorePermissions()
            }
        }
    }

    private fun renderStatus() {
        if (prefs.linked) {
            val since = DateUtils.getRelativeTimeSpanString(prefs.linkedAt, System.currentTimeMillis(), DateUtils.MINUTE_IN_MILLIS)
            val mode = getString(modeLabel(prefs.linkedMode ?: prefs.mode))
            status.text = getString(R.string.status_linked, prefs.linkedTo, mode, since)
            status.setBackgroundResource(R.drawable.status_on)
            linkButton.setText(R.string.unlink)
        } else {
            status.setText(R.string.status_unlinked)
            status.setBackgroundResource(R.drawable.status_off)
            linkButton.setText(R.string.link)
        }
    }

    private fun loadSettings() {
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
        updateDelayVisibility()
        loadSims()
    }

    private fun selectedMode() = when (modeGroup.checkedRadioButtonId) {
        R.id.mode_no_answer -> ForwardMode.NO_ANSWER
        R.id.mode_always -> ForwardMode.ALWAYS
        else -> ForwardMode.CONDITIONAL
    }

    private fun updateDelayVisibility() {
        val show = if (selectedMode().supportsDelay) View.VISIBLE else View.GONE
        delay.visibility = show
        delayLabel.visibility = show
    }

    /** Validates and saves; returns false (with an error on the field) if something is wrong. */
    private fun saveSettings(): Boolean {
        val number = partner.text.toString()
        if (!PhoneNumbers.isDialable(number)) { partner.error = getString(R.string.err_no_partner); return false }
        val vm = voicemail.text.toString()
        if (vm.isNotBlank() && !PhoneNumbers.isDialable(vm)) { voicemail.error = getString(R.string.err_number); return false }
        val pinText = pin.text.toString()
        if (remote.isChecked && !RemoteCommand.isValidPin(pinText)) { pin.error = getString(R.string.err_pin); return false }

        prefs.partnerNumber = PhoneNumbers.clean(number)
        prefs.mode = selectedMode()
        prefs.delaySeconds = ForwardingCodes.DELAYS[delay.selectedItemPosition.coerceAtLeast(0)]
        prefs.voicemailNumber = if (vm.isBlank()) "" else PhoneNumbers.clean(vm)
        prefs.remoteEnabled = remote.isChecked
        prefs.pin = pinText
        prefs.phoneAccount = simKeys.getOrNull(sim.selectedItemPosition)
        partner.setText(prefs.partnerNumber)

        if (!PhoneNumbers.isInternational(prefs.partnerNumber)) toast(R.string.hint_international)
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
            add(Manifest.permission.CALL_PHONE)
            add(Manifest.permission.READ_PHONE_STATE)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) add(Manifest.permission.POST_NOTIFICATIONS)
            if (prefs.remoteEnabled) addAll(SMS_PERMISSIONS)
        }.filter { checkSelfPermission(it) != PackageManager.PERMISSION_GRANTED }
        if (wanted.isNotEmpty()) requestPermissions(wanted.toTypedArray(), REQ_CORE)
    }

    private fun requestSmsPermissions() {
        val wanted = SMS_PERMISSIONS.filter { checkSelfPermission(it) != PackageManager.PERMISSION_GRANTED }
        if (wanted.isNotEmpty()) requestPermissions(wanted.toTypedArray(), REQ_SMS)
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        loadSims()
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

    private fun <T : View> view(id: Int): T = checkNotNull(findViewById<T>(id)) { "Missing view $id" }

    private fun hasAll(perms: List<String>) = perms.all { checkSelfPermission(it) == PackageManager.PERMISSION_GRANTED }

    private fun toast(res: Int) = Toast.makeText(this, res, Toast.LENGTH_LONG).show()

    companion object {
        private const val REQ_CORE = 1
        private const val REQ_SMS = 2
        private val SMS_PERMISSIONS = listOf(Manifest.permission.SEND_SMS, Manifest.permission.RECEIVE_SMS)
    }
}
