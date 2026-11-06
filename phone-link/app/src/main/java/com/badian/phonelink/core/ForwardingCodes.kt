package com.badian.phonelink.core

/**
 * GSM supplementary-service codes (3GPP TS 22.030) that the carrier network
 * understands. Forwarding happens in the network, so the call keeps full quality
 * and still reaches the other phone when this one is off or has no signal.
 */
enum class ForwardMode(val serviceCode: String, val supportsDelay: Boolean, val interrogationCode: String) {
    /** No answer + busy + unreachable, in one code. The default. */
    CONDITIONAL("004", true, "61"),

    /** No answer only. Use it if the carrier rejects *004*. */
    NO_ANSWER("61", true, "61"),

    /** Every call, without ringing this phone. */
    ALWAYS("21", false, "21"),
}

object ForwardingCodes {

    /** Values the network accepts for the no-reply timer. */
    val DELAYS = listOf(5, 10, 15, 20, 25, 30)
    const val DEFAULT_DELAY = 20

    /** Code that registers and activates forwarding to [number], e.g. "*004*+212600000000**20#". */
    fun activate(mode: ForwardMode, number: String, delaySeconds: Int? = DEFAULT_DELAY): String {
        val target = PhoneNumbers.clean(number)
        require(PhoneNumbers.isDialable(target)) { "Not a dialable number: $number" }
        return "*${mode.serviceCode}*$target${delaySuffix(mode, delaySeconds)}#"
    }

    /**
     * One code that ends the link.
     *
     * Most carriers keep voicemail as the conditional-forwarding target, and linking
     * overwrites it. If [voicemailNumber] is known, unlinking a conditional mode points
     * forwarding back at voicemail instead of erasing it, so voicemail keeps working.
     * Unconditional forwarding (*21*) is a separate registration and only needs erasing.
     */
    fun deactivate(mode: ForwardMode, voicemailNumber: String?, delaySeconds: Int? = DEFAULT_DELAY): String {
        val restoreVoicemail = mode != ForwardMode.ALWAYS &&
            voicemailNumber != null && PhoneNumbers.isDialable(voicemailNumber)
        return if (restoreVoicemail) activate(mode, voicemailNumber!!, delaySeconds) else "##${mode.serviceCode}#"
    }

    /** Asks the network for the current state; the phone shows the answer. */
    fun interrogate(mode: ForwardMode): String = "*#${mode.interrogationCode}#"

    private fun delaySuffix(mode: ForwardMode, delaySeconds: Int?): String {
        if (!mode.supportsDelay || delaySeconds == null) return ""
        require(delaySeconds in DELAYS) { "Delay must be one of $DELAYS" }
        return "**$delaySeconds"
    }
}
