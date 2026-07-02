package com.bpguard.monitor.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface BpReadingDao {

    @Query("SELECT * FROM bp_readings ORDER BY timestampEpochMillis DESC")
    fun observeAll(): Flow<List<BpReading>>

    @Query("SELECT * FROM bp_readings WHERE timestampEpochMillis >= :sinceEpochMillis ORDER BY timestampEpochMillis DESC")
    fun observeSince(sinceEpochMillis: Long): Flow<List<BpReading>>

    @Query(
        "SELECT * FROM bp_readings WHERE timestampEpochMillis BETWEEN :fromEpochMillis AND :toEpochMillis " +
            "ORDER BY timestampEpochMillis ASC"
    )
    suspend fun findInWindow(fromEpochMillis: Long, toEpochMillis: Long): List<BpReading>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(reading: BpReading): Long

    @Update
    suspend fun update(reading: BpReading)

    @Query("DELETE FROM bp_readings WHERE id = :id")
    suspend fun delete(id: Long)

    @Query("SELECT * FROM bp_readings ORDER BY timestampEpochMillis DESC LIMIT :limit")
    suspend fun mostRecent(limit: Int): List<BpReading>
}
