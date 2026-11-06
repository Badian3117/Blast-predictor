package com.badian.phonelink.core

/** Phone-number helpers that stay pure Kotlin so they can be unit-tested on the JVM. */
object PhoneNumbers {

    /** Keeps a leading '+' and the digits; turns an international "00" prefix into '+'. */
    fun clean(raw: String): String {
        val trimmed = raw.trim()
        val digits = trimmed.filter { it.isDigit() }
        return when {
            trimmed.startsWith("+") -> "+$digits"
            digits.startsWith("00") && digits.length > 2 -> "+" + digits.drop(2)
            else -> digits
        }
    }

    /** E.164 allows at most 15 digits; anything under 6 is not a subscriber number. */
    fun isDialable(raw: String): Boolean = clean(raw).count { it.isDigit() } in 6..15

    fun isInternational(raw: String): Boolean = clean(raw).startsWith("+")

    /**
     * True when two numbers point at the same line, whether written in national
     * ("0612345678") or international ("+212612345678") form. Compares the last
     * nine digits, the length of a subscriber number in most numbering plans.
     */
    fun matches(a: String?, b: String?): Boolean {
        if (a == null || b == null) return false
        val da = a.filter { it.isDigit() }
        val db = b.filter { it.isDigit() }
        if (da.length < 6 || db.length < 6) return false
        val n = minOf(9, da.length, db.length)
        return da.takeLast(n) == db.takeLast(n)
    }
}
