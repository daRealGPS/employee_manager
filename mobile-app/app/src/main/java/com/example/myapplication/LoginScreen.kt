package com.example.myapplication

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.location.Location
import android.util.Log
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import androidx.navigation.NavController
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.rememberPermissionState
import com.google.android.gms.location.LocationServices
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import com.google.accompanist.permissions.isGranted

val Context.dataStore by preferencesDataStore(name = "auth")
val TOKEN_KEY = stringPreferencesKey("jwt")

@SuppressLint("MissingPermission")
@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun LoginScreen(navController: NavController) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val fusedLocationClient = remember {
        LocationServices.getFusedLocationProviderClient(context)
    }

    val permissionState = rememberPermissionState(Manifest.permission.ACCESS_FINE_LOCATION)

    var username by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var error by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }

    val getLocationAndLogin = getLnL@ {
        if (!permissionState.status.isGranted) {
            println("Permission not granted. Launching request.")
            permissionState.launchPermissionRequest()
            return@getLnL
        }

        loading = true
        fusedLocationClient.lastLocation
            .addOnSuccessListener { location: Location? ->
                if (location != null) {
                    scope.launch {
                        val loginResult = sendLoginRequest(
                            context = context,
                            username = username,
                            password = password,
                            lat = location.latitude,
                            lon = location.longitude
                        )
                        loading = false
                        if (loginResult.first) {
                            navController.navigate("dashboard")
                        } else {
                            error = loginResult.second ?: "Login failed"
                        }
                    }
                } else {
                    loading = false
                    error = "Could not get location"
                }
            }
            .addOnFailureListener {
                loading = false
                error = "Location error: ${it.message}"
            }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.Center
    ) {
        Text("Employee Login", style = MaterialTheme.typography.headlineSmall)

        Spacer(modifier = Modifier.height(16.dp))

        OutlinedTextField(
            value = username,
            onValueChange = { username = it },
            label = { Text("Username") },
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(8.dp))

        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Password") },
            visualTransformation = PasswordVisualTransformation(),
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(8.dp))

        Button(
            onClick = { getLocationAndLogin() },
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(if (loading) "Logging in..." else "Login")
        }

        if (error.isNotEmpty()) {
            Spacer(modifier = Modifier.height(12.dp))
            Text(text = error, color = MaterialTheme.colorScheme.error)
        }
    }
}

suspend fun sendLoginRequest(
    context: Context,
    username: String,
    password: String,
    lat: Double,
    lon: Double
): Pair<Boolean, String?> {
    val baseUrl = BuildConfig.BASE_URL

    return withContext(Dispatchers.IO) {
        try {
            val json = JSONObject().apply {
                put("username", username)
                put("password", password)
                put("lat", lat)
                put("lon", lon)
            }

            val body = json.toString().toRequestBody("application/json".toMediaType())
            val request = Request.Builder()
                .url("$baseUrl/auth/login")
                .post(body)
                .build()

            val client = OkHttpClient()
            val response = client.newCall(request).execute()

            if (response.isSuccessful) {
                val responseBody = response.body.string()
                val token = JSONObject(responseBody ?: "").optString("token")
                context.dataStore.edit { it[TOKEN_KEY] = token }
                return@withContext Pair(true, null)
            } else {
                val responseBody = response.body.string()
                val error = JSONObject(responseBody ?: "").optString("error")
                return@withContext Pair(false, error)
            }
        } catch (e: Exception) {
            return@withContext Pair(false, e.localizedMessage ?: "Unknown error")
        }
    }
}
