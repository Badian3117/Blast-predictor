package com.badian.phonelink.core

import java.security.SecureRandom
import java.util.Random

/** How "Link" connects the phones. */
enum class LinkMethod {
    /** Free: phone A announces incoming calls on phone B through a push notification. */
    ALERT,

    /** Carrier call forwarding: phone B can answer, but forwarded minutes may be billed. */
    FORWARD,
}

/**
 * Builds messages for ntfy (https://ntfy.sh), a free open-source push service.
 * Phone A publishes to a secret topic; phone B, subscribed in the ntfy app, gets the
 * notification instantly. Anyone who knows the topic name can read it, so the topic is
 * long and random. Messages are sent as JSON so contact names in any script survive
 * (HTTP headers only carry ASCII).
 */
object Ntfy {
    const val DEFAULT_SERVER = "https://ntfy.sh"
    private val TOPIC = Regex("^[A-Za-z0-9_-]{1,64}$")
    private const val ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789" // no look-alikes (l/1, o/0)

    /** About 100 bits of randomness: not guessable. */
    fun newTopic(random: Random = SecureRandom()): String =
        "phonelink-" + (1..20).map { ALPHABET[random.nextInt(ALPHABET.length)] }.joinToString("")

    fun isValidTopic(topic: String): Boolean = TOPIC.matches(topic)

    /** "https://host[/path]" without a trailing slash, or null if it is not an http(s) URL. */
    fun normalizeServer(raw: String): String? {
        val s = raw.trim().trimEnd('/')
        val ok = Regex("^https?://[A-Za-z0-9.-]+(:[0-9]{1,5})?(/[A-Za-z0-9._~/-]*)?$").matches(s)
        return if (ok) s else null
    }

    /**
     * JSON body for POST to the server root.
     * [number] null means a hidden/private number: then there is no "Call back" button.
     */
    fun incomingCall(
        topic: String,
        title: String,
        message: String,
        number: String?,
        callBackLabel: String,
    ): String {
        require(isValidTopic(topic)) { "Invalid topic" }
        val fields = mutableListOf(
            "\"topic\":${quote(topic)}",
            "\"title\":${quote(title)}",
            "\"message\":${quote(message)}",
            "\"priority\":5",
            "\"tags\":[\"telephone_receiver\"]",
        )
        if (number != null) {
            val tel = quote("tel:$number")
            fields += "\"click\":$tel"
            fields += "\"actions\":[{\"action\":\"view\",\"label\":${quote(callBackLabel)},\"url\":$tel,\"clear\":true}]"
        }
        return fields.joinToString(",", "{", "}")
    }

    /** JSON string literal (RFC 8259). */
    fun quote(s: String): String {
        val sb = StringBuilder(s.length + 2).append('"')
        for (c in s) {
            when (c) {
                '"' -> sb.append("\\\"")
                '\\' -> sb.append("\\\\")
                '\n' -> sb.append("\\n")
                '\r' -> sb.append("\\r")
                '\t' -> sb.append("\\t")
                else -> if (c < ' ') sb.append(String.format("\\u%04x", c.code)) else sb.append(c)
            }
        }
        return sb.append('"').toString()
    }
}
