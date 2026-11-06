package com.badian.phonelink

import android.app.PendingIntent
import android.content.Intent
import android.os.Build
import android.service.quicksettings.Tile
import android.service.quicksettings.TileService

/** One-tap toggle in the Quick Settings panel. */
class LinkTileService : TileService() {

    override fun onStartListening() = render()

    override fun onClick() {
        val result = if (Prefs(this).linked) Link.off(this) else Link.on(this)
        if (result is LinkResult.Failed) openApp()
        render()
    }

    private fun render() {
        val tile = qsTile ?: return
        val prefs = Prefs(this)
        tile.state = if (prefs.linked) Tile.STATE_ACTIVE else Tile.STATE_INACTIVE
        tile.label = getString(R.string.tile_label)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            tile.subtitle = getString(if (prefs.linked) R.string.tile_on else R.string.tile_off)
        }
        tile.updateTile()
    }

    private fun openApp() {
        val intent = Intent(this, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startActivityAndCollapse(PendingIntent.getActivity(this, 0, intent, PendingIntent.FLAG_IMMUTABLE))
        } else {
            @Suppress("DEPRECATION")
            startActivityAndCollapse(intent)
        }
    }
}
