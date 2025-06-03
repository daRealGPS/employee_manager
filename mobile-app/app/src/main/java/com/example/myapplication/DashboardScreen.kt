package com.example.myapplication

import android.util.Log
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.*
import androidx.datastore.preferences.core.edit
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

@Composable
fun DashboardScreen(navController: NavController) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.Center
    ) {
        Text("Welcome to the Dashboard", style = MaterialTheme.typography.headlineSmall)
        Spacer(modifier = Modifier.height(20.dp))

        Button(
            onClick = { navController.navigate("attendance") },
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Mark Attendance")
        }

        Spacer(modifier = Modifier.height(12.dp))
        Text("Your Tasks", style = MaterialTheme.typography.titleMedium)
        Spacer(modifier = Modifier.height(8.dp))

        TaskList()

        Spacer(modifier = Modifier.height(12.dp))

        Button(
            onClick = {
                scope.launch {
                    context.dataStore.edit { it.remove(TOKEN_KEY) }
                    navController.navigate("login") {
                        popUpTo("dashboard") { inclusive = true }
                    }
                }
            },
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
        ) {
            Text("Logout", color = MaterialTheme.colorScheme.onError)
        }
    }
}

data class Task(
    val id: Int,
    val description: String,
    val status: String
)

@Composable
fun TaskList() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val client = remember { OkHttpClient() }
    val baseUrl = BuildConfig.BASE_URL

    var tasks by remember { mutableStateOf<List<Task>>(emptyList()) }
    var error by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(false) }
    var updatingTaskIds by remember { mutableStateOf<Set<Int>>(emptySet()) }

    LaunchedEffect(Unit) {
        loading = true
        error = null
        try {
            val token = context.dataStore.data.first()[TOKEN_KEY] ?: return@LaunchedEffect

            val request = Request.Builder()
                .url("$baseUrl/tasks")
                .get()
                .addHeader("Authorization", "Bearer $token")
                .build()

            val response = withContext(Dispatchers.IO) {
                client.newCall(request).execute()
            }

            if (response.isSuccessful) {
                val body = response.body.string()
                val json = JSONObject(body)
                val arr = json.getJSONArray("tasks")

                tasks = (0 until arr.length()).map { i ->
                    val t = arr.getJSONObject(i)
                    Task(
                        t.getInt("id"),
                        t.getString("description"),
                        t.getString("status")
                    )
                }
            } else {
                val body = response.body.string().orEmpty()
                val json = JSONObject(body.ifEmpty { "{}" })
                error = json.optString("error", "Failed to load tasks")
            }
        } catch (e: Exception) {
            e.printStackTrace()
            error = "Failed to load tasks"
        } finally {
            loading = false
        }
    }

    fun updateTaskStatusLocally(taskId: Int, newStatus: String) {
        tasks = tasks.map { t ->
            if (t.id == taskId) t.copy(status = newStatus) else t
        }
    }

    Column(modifier = Modifier.fillMaxWidth()) {
        if (loading && tasks.isEmpty() && error == null) {
            CircularProgressIndicator()
            Spacer(Modifier.height(8.dp))
        }

        if (error != null) {
            Text("Error: $error", color = MaterialTheme.colorScheme.error)
        } else {
            tasks.forEach { task ->
                val isUpdating = updatingTaskIds.contains(task.id)
                val isDone = task.status == "done"
                val buttonLabel = if (isDone) "Mark Pending" else "Mark Done"

                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    elevation = CardDefaults.cardElevation(2.dp)
                ) {
                    Row(modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                        ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = task.description,
                                style = MaterialTheme.typography.bodyLarge,
                                maxLines = 5,
                                overflow = TextOverflow.Ellipsis
                            )
                            Text(
                                text = "Status: ${task.status}",
                                style = MaterialTheme.typography.labelSmall
                            )
                        }
                        
                        Spacer(Modifier.width(12.dp))

                        Button(
                            onClick = {
                                Log.d("DEBUG", "HERE \"$baseUrl/tasks/${task.id}\"")
                                if (isUpdating) return@Button
                                val newStatus = if (isDone) "pending" else "done"

                                scope.launch {
                                    updatingTaskIds = updatingTaskIds + task.id
                                    try {
                                        val token = context.dataStore.data.first()[TOKEN_KEY]
                                            ?: return@launch

                                        val jsonBody = JSONObject()
                                            .put("status", newStatus)
                                            .toString()

                                        val mediaType =
                                            "application/json; charset=utf-8".toMediaType()
                                        val requestBody = jsonBody.toRequestBody(mediaType)

                                        val request = Request.Builder()
                                            .url("$baseUrl/tasks/${task.id}/status")
                                            .put(requestBody)
                                            .addHeader("Authorization", "Bearer $token")
                                            .build()

                                        val response = withContext(Dispatchers.IO) {
                                            client.newCall(request).execute()
                                        }

                                        if (response.isSuccessful) {
                                            updateTaskStatusLocally(task.id, newStatus)
                                        } else {
                                            val body = response.body?.string().orEmpty()
                                            val json = JSONObject(body.ifEmpty { "{}" })
                                            val msg =
                                                json.optString("error", "Failed to update task")
                                            error = msg
                                        }
                                    } catch (e: Exception) {
                                        e.printStackTrace()
                                        error = "Failed to update task"
                                    } finally {
                                        updatingTaskIds = updatingTaskIds - task.id
                                    }
                                }
                            },
                            enabled = !isUpdating
                        ) {
                            Text(buttonLabel)
                        }
                    }
                }
            }
        }
    }
}

