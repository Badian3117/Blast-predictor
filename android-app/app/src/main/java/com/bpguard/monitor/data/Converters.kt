package com.bpguard.monitor.data

import androidx.room.TypeConverter

class Converters {
    @TypeConverter
    fun fromSource(source: BpSource): String = source.name

    @TypeConverter
    fun toSource(value: String): BpSource = BpSource.valueOf(value)

    @TypeConverter
    fun fromSourceList(sources: List<BpSource>): String = sources.joinToString(",") { it.name }

    @TypeConverter
    fun toSourceList(value: String): List<BpSource> =
        if (value.isBlank()) emptyList() else value.split(",").map { BpSource.valueOf(it) }
}
