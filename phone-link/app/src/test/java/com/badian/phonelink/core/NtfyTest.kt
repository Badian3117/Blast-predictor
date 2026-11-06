package com.badian.phonelink.core

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.util.Random

class NtfyTest {
    @Test fun topicsAreValidAndRandom() {
        val a = Ntfy.newTopic()
        val b = Ntfy.newTopic()
        assertTrue(Ntfy.isValidTopic(a))
        assertEquals(30, a.length)
        assertNotEquals(a, b)
        assertEquals(Ntfy.newTopic(Random(1)), Ntfy.newTopic(Random(1)))
    }

    @Test fun topicValidation() {
        assertTrue(Ntfy.isValidTopic("phonelink-abc_DEF-123"))
        assertFalse(Ntfy.isValidTopic(""))
        assertFalse(Ntfy.isValidTopic("has space"))
        assertFalse(Ntfy.isValidTopic("slash/topic"))
        assertFalse(Ntfy.isValidTopic("x".repeat(65)))
    }

    @Test fun servers() {
        assertEquals("https://ntfy.sh", Ntfy.normalizeServer(" https://ntfy.sh/ "))
        assertEquals("http://192.168.1.5:8080", Ntfy.normalizeServer("http://192.168.1.5:8080"))
        assertEquals("https://example.com/ntfy", Ntfy.normalizeServer("https://example.com/ntfy/"))
        assertNull(Ntfy.normalizeServer("ntfy.sh"))
        assertNull(Ntfy.normalizeServer("ftp://ntfy.sh"))
        assertNull(Ntfy.normalizeServer("https://ntfy.sh?x=1"))
    }

    @Test fun messageWithNumber() {
        val json = Ntfy.incomingCall("phonelink-abc", "Call", "Ahmed (+212612345678)", "+212612345678", "Call back")
        assertEquals(
            "{\"topic\":\"phonelink-abc\",\"title\":\"Call\",\"message\":\"Ahmed (+212612345678)\"," +
                "\"priority\":5,\"tags\":[\"telephone_receiver\"],\"click\":\"tel:+212612345678\"," +
                "\"actions\":[{\"action\":\"view\",\"label\":\"Call back\",\"url\":\"tel:+212612345678\",\"clear\":true}]}",
            json,
        )
    }

    @Test fun messageWithoutNumberHasNoAction() {
        val json = Ntfy.incomingCall("phonelink-abc", "Call", "Private number", null, "Call back")
        assertFalse(json.contains("actions"))
        assertFalse(json.contains("click"))
    }

    @Test fun escaping() {
        assertEquals("\"a\\\"b\\\\c\\nd\\u0001\"", Ntfy.quote("a\"b\\c\nd\u0001"))
        assertEquals("\"أحمد ☎\"", Ntfy.quote("أحمد ☎"))
    }
}
