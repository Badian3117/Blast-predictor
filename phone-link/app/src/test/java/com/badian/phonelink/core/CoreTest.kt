package com.badian.phonelink.core

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class PhoneNumbersTest {
    @Test fun cleansFormatting() {
        assertEquals("+212612345678", PhoneNumbers.clean(" +212 6 12-34-56-78 "))
        assertEquals("+33612345678", PhoneNumbers.clean("0033 6 12 34 56 78"))
        assertEquals("0612345678", PhoneNumbers.clean("06.12.34.56.78"))
    }

    @Test fun dialable() {
        assertTrue(PhoneNumbers.isDialable("+212612345678"))
        assertFalse(PhoneNumbers.isDialable("123"))
        assertFalse(PhoneNumbers.isDialable("+1234567890123456"))
    }

    @Test fun matchesNationalAndInternational() {
        assertTrue(PhoneNumbers.matches("+212612345678", "0612345678"))
        assertTrue(PhoneNumbers.matches("+33 6 12 34 56 78", "0033612345678"))
        assertFalse(PhoneNumbers.matches("+212612345678", "+212612345679"))
        assertFalse(PhoneNumbers.matches("+212612345678", null))
        assertFalse(PhoneNumbers.matches("12", "12"))
    }
}

class ForwardingCodesTest {
    @Test fun activateCodes() {
        assertEquals("*004*+212612345678**20#", ForwardingCodes.activate(ForwardMode.CONDITIONAL, "+212 612 345 678"))
        assertEquals("*61*0612345678**15#", ForwardingCodes.activate(ForwardMode.NO_ANSWER, "0612345678", 15))
        assertEquals("*21*+212612345678#", ForwardingCodes.activate(ForwardMode.ALWAYS, "+212612345678", 20))
        assertEquals("*004*+212612345678#", ForwardingCodes.activate(ForwardMode.CONDITIONAL, "+212612345678", null))
    }

    @Test(expected = IllegalArgumentException::class) fun rejectsBadDelay() {
        ForwardingCodes.activate(ForwardMode.NO_ANSWER, "+212612345678", 7)
    }

    @Test(expected = IllegalArgumentException::class) fun rejectsBadNumber() {
        ForwardingCodes.activate(ForwardMode.NO_ANSWER, "12")
    }

    @Test fun deactivateErasesWithoutVoicemail() {
        assertEquals("##004#", ForwardingCodes.deactivate(ForwardMode.CONDITIONAL, null))
        assertEquals("##61#", ForwardingCodes.deactivate(ForwardMode.NO_ANSWER, ""))
    }

    @Test fun deactivateRestoresVoicemail() {
        assertEquals("*004*+212600000123**20#", ForwardingCodes.deactivate(ForwardMode.CONDITIONAL, "+212600000123"))
        assertEquals("*61*+212600000123**10#", ForwardingCodes.deactivate(ForwardMode.NO_ANSWER, "+212600000123", 10))
    }

    @Test fun deactivateAlwaysOnlyErases() {
        assertEquals("##21#", ForwardingCodes.deactivate(ForwardMode.ALWAYS, "+212600000123"))
    }

    @Test fun interrogation() {
        assertEquals("*#61#", ForwardingCodes.interrogate(ForwardMode.CONDITIONAL))
        assertEquals("*#21#", ForwardingCodes.interrogate(ForwardMode.ALWAYS))
    }
}

class RemoteCommandTest {
    @Test fun roundTrip() {
        val text = RemoteCommand.command("4821", RemoteCommand.Action.ON)
        assertEquals("PHONELINK 4821 ON", text)
        assertEquals(RemoteCommand.Command("4821", RemoteCommand.Action.ON), RemoteCommand.parseCommand(text))
        assertEquals(RemoteCommand.Command("4821", RemoteCommand.Action.OFF), RemoteCommand.parseCommand("  phonelink 4821   off\n"))
    }

    @Test fun ignoresOtherMessages() {
        assertNull(RemoteCommand.parseCommand("Hi, call me back"))
        assertNull(RemoteCommand.parseCommand("PHONELINK 4821"))
        assertNull(RemoteCommand.parseCommand("PHONELINK 4821 DELETE"))
        assertNull(RemoteCommand.parseCommand("PHONELINK-ACK LINKED"))
    }

    @Test fun acks() {
        assertEquals(RemoteCommand.Ack.LINKED, RemoteCommand.parseAck(RemoteCommand.ack(RemoteCommand.Ack.LINKED)))
        assertNull(RemoteCommand.parseAck("PHONELINK 4821 ON"))
    }

    @Test fun pins() {
        assertTrue(RemoteCommand.pinMatches("4821", "4821"))
        assertFalse(RemoteCommand.pinMatches("4822", "4821"))
        assertFalse(RemoteCommand.pinMatches("48210", "4821"))
        assertFalse(RemoteCommand.pinMatches("", ""))
        assertFalse(RemoteCommand.isValidPin("12a4"))
    }
}
