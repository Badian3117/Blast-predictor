package com.bpguard.monitor

import android.Manifest
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.bpguard.monitor.data.HealthConnectManager
import com.bpguard.monitor.ui.BpViewModel
import com.bpguard.monitor.ui.DashboardScreen
import com.bpguard.monitor.ui.HistoryScreen
import com.bpguard.monitor.ui.ManualEntryScreen
import com.bpguard.monitor.ui.SettingsScreen
import com.bpguard.monitor.ui.theme.BpGuardTheme

private sealed class Destination(val route: String, val label: String) {
    data object Dashboard : Destination("dashboard", "Dashboard")
    data object History : Destination("history", "History")
    data object AddEntry : Destination("add", "Add")
    data object Settings : Destination("settings", "Settings")
}

private val destinations = listOf(Destination.Dashboard, Destination.History, Destination.AddEntry, Destination.Settings)

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val healthConnectManager = HealthConnectManager(this)

        setContent {
            BpGuardTheme {
                val navController = rememberNavController()
                val viewModel: BpViewModel = viewModel()

                val permissionLauncher = rememberLauncherForActivityResult(
                    contract = healthConnectManager.permissionRequestContract()
                ) { /* granted set is inferred by re-checking hasAllPermissions() on next sync */ }

                val notificationPermissionLauncher = rememberLauncherForActivityResult(
                    contract = ActivityResultContracts.RequestPermission()
                ) { }

                LaunchedEffect(Unit) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                    }
                }

                Scaffold(
                    bottomBar = {
                        val backStackEntry by navController.currentBackStackEntryAsState()
                        NavigationBar {
                            destinations.forEach { destination ->
                                val selected = backStackEntry?.destination?.hierarchy
                                    ?.any { it.route == destination.route } == true
                                NavigationBarItem(
                                    selected = selected,
                                    onClick = {
                                        navController.navigate(destination.route) {
                                            popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                                            launchSingleTop = true
                                            restoreState = true
                                        }
                                    },
                                    icon = {},
                                    label = { Text(destination.label) }
                                )
                            }
                        }
                    }
                ) { padding ->
                    NavHost(
                        navController = navController,
                        startDestination = Destination.Dashboard.route,
                        modifier = Modifier.padding(padding)
                    ) {
                        composable(Destination.Dashboard.route) {
                            DashboardScreen(viewModel) { navController.navigate(Destination.AddEntry.route) }
                        }
                        composable(Destination.History.route) {
                            HistoryScreen(viewModel)
                        }
                        composable(Destination.AddEntry.route) {
                            ManualEntryScreen { systolic, diastolic, pulse, fromCuff, note ->
                                viewModel.addManualEntry(systolic, diastolic, pulse, fromCuff, note)
                                navController.popBackStack(Destination.Dashboard.route, inclusive = false)
                            }
                        }
                        composable(Destination.Settings.route) {
                            SettingsScreen(
                                healthConnectAvailable = healthConnectManager.isAvailable,
                                onRequestHealthConnectPermissions = {
                                    permissionLauncher.launch(HealthConnectManager.REQUIRED_PERMISSIONS)
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}
