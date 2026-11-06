package com.badian.phonelink.core

/**
 * The SMS protocol between the two phones. Works without internet or any server.
 *
 *   command:  PHONELINK <pin> ON | OFF | STATUS
 *   reply:    PHONELINK-ACK LINKED | UNLINKED | FAILED | BADPIN
 */
object RemoteCommand {
    const val PREFIX = "PHONELINK"
    const val ACK_PREFIX = "PHONELINK-ACK"

    enum class Action { ON, OFF, STATUS }
    enum class Ack { LINKED, UNLINKED, FAILED, BADPIN }

    data class Command(val pin: String, val action: Action)

    fun isValidPin(pin: String): Boolean = pin.length in 4..8 && pin.all { it.isDigit() }

    fun command(pin: String, action: Action): String = "$PREFIX $pin ${action.name}"

    fun ack(ack: Ack): String = "$ACK_PREFIX ${ack.name}"

    fun parseCommand(body: String): Command? {
        val parts = body.trim().split(Regex("\\s+"))
        if (parts.size != 3 || !parts[0].equals(PREFIX, ignoreCase = true)) return null
        val action = Action.entries.firstOrNull { it.name.equals(parts[2], ignoreCase = true) } ?: return null
        return Command(parts[1], action)
    }

    fun parseAck(body: String): Ack? {
        val parts = body.trim().split(Regex("\\s+"))
        if (parts.size != 2 || !parts[0].equals(ACK_PREFIX, ignoreCase = true)) return null
        return Ack.entries.firstOrNull { it.name.equals(parts[1], ignoreCase = true) }
    }

    /** Constant-time comparison, so the reply timing does not leak the PIN. */
    fun pinMatches(given: String, expected: String): Boolean {
        if (!isValidPin(expected) || given.length != expected.length) return false
        var diff = 0
        for (i in given.indices) diff = diff or (given[i].code xor expected[i].code)
        return diff == 0
    }
}
