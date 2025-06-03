package com.example.myapplication
import android.Manifest
import android.content.ContentValues.TAG
import android.content.Context
import android.content.pm.PackageManager
import android.util.Log
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

private suspend fun getCurrentLocationOrNull(context: Context): android.location.Location? {
    val permOk =
        ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) ==
                PackageManager.PERMISSION_GRANTED ||
                ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) ==
                PackageManager.PERMISSION_GRANTED

    if (!permOk) return null

    val fused = LocationServices.getFusedLocationProviderClient(context)

    return suspendCancellableCoroutine { cont ->
        try {
            fused.getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, null)
                .addOnSuccessListener { loc -> cont.resume(loc) }
                .addOnFailureListener { cont.resume(null) }
        } catch (se: SecurityException) {
            cont.resume(null)
        } catch (e: Exception) {
            cont.resume(null)
        }
    }
}

@Composable
fun AttendanceScreen(navController: NavController) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var status by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }
    val baseUrl = BuildConfig.BASE_URL
    val client = remember { OkHttpClient() }

    val hasLocationPermission = remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) ==
                    PackageManager.PERMISSION_GRANTED
        )
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { granted ->
        hasLocationPermission.value = granted
    }

    suspend fun sendAttendance(): Pair<Boolean, String> {
        return withContext(Dispatchers.IO) {
            try {
                val token = context.dataStore.data.first()[TOKEN_KEY] ?: return@withContext Pair(false, "Missing token")

                // 1) must have permission
                val permOk = ContextCompat.checkSelfPermission(
                    context,
                    Manifest.permission.ACCESS_FINE_LOCATION
                ) == PackageManager.PERMISSION_GRANTED

                if (!permOk) return@withContext Pair(false, "Location permission not granted")

                // 2) get location (switch to main-safe call using helper)
                val loc = withContext(Dispatchers.Main) {
                    getCurrentLocationOrNull(context)
                } ?: return@withContext Pair(false, "Could not fetch location")

                Log.d(TAG, loc.toString());
                val json = JSONObject().apply {
                    put("photo_url", "mock.jpg")
                    put("latitude", loc.latitude)
                    put("longitude", loc.longitude)
                    put("accuracy_m", loc.accuracy.toDouble())
                }

                val body = json.toString().toRequestBody("application/json".toMediaType())
                val request = Request.Builder()
                    .url("$baseUrl/attendance/mark")
                    .post(body)
                    .addHeader("Authorization", "Bearer $token")
                    .build()

                val response = client.newCall(request).execute()

                val ok = response.isSuccessful
                val msg = if (ok) "OK" else response.body?.string().orEmpty()
                return@withContext Pair(ok, msg)
            } catch (e: Exception) {
                return@withContext Pair(false, "Exception: ${e.message ?: "unknown"}")
            }
        }
    }


    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.Center
    ) {
        Text("Attendance Screen", style = MaterialTheme.typography.headlineSmall)
        Spacer(modifier = Modifier.height(24.dp))

        Button(
            onClick = {
                if (!hasLocationPermission.value) {
                    permissionLauncher.launch(Manifest.permission.ACCESS_FINE_LOCATION)
                    return@Button
                }

                scope.launch {
                    loading = true
                    status = ""
                    val (ok, msg) = sendAttendance()
                    status = if (ok) "Attendance marked!" else "Failed. $msg"
                    loading = false
                }
            },
            modifier = Modifier.fillMaxWidth(),
            enabled = !loading
        ) {
            Text(if (loading) "Submitting..." else "Mark Attendance")
        }

        Spacer(modifier = Modifier.height(12.dp))

        if (status.isNotEmpty()) {
            Text(status,
                color = if (status.contains("Failed")) MaterialTheme.colorScheme.error
                    else MaterialTheme.colorScheme.primary)
        }

        Spacer(modifier = Modifier.height(24.dp))

        OutlinedButton(
            onClick = { navController.popBackStack() },
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Back")
        }
    }
}
