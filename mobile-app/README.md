# Employee Manager Mobile (Android)

Android (Jetpack Compose) client for the Employee Manager system.

This app is the **employee-side** client. It supports:

- Employee login (JWT)
- Viewing assigned tasks
- Updating task status (pending ↔ done)
- Marking attendance with GPS location (geofence enforced by backend)

The app is intentionally minimal. It demonstrates a real mobile client consuming a role-protected backend API, with location permission flow and authenticated requests.

## Stack

- Kotlin
- Jetpack Compose (Material 3)
- Navigation Compose
- OkHttp
- Google Play Services Location (FusedLocationProvider)
- DataStore Preferences (JWT persistence)
- Accompanist Permissions

## Architecture Overview

The current app uses a small MVP structure:

- screens are written as Compose functions
- navigation is handled by a lightweight `NavHost`
- the JWT is stored in DataStore
- API calls are made directly with OkHttp using the stored token

There is no ViewModel or repository layer yet. That was a speed tradeoff to get the end-to-end login, task, and attendance flow working first.

## Environments

The base API URL is defined via `BuildConfig.BASE_URL` per build type.

### Debug (Android Emulator)

```kotlin
buildConfigField("String", "BASE_URL", "\"http://10.0.2.2:5000\"")
```

`10.0.2.2` is the special emulator alias for your host machine’s localhost.

### Release

```kotlin
buildConfigField("String", "BASE_URL", "\<YOUR BACKEND\>")
```

## Run Locally

### Prereqs

- Android Studio
- Android Emulator (recommended)
- Backend running locally on `http://localhost:5000`

### Steps

1. Open the project in Android Studio
2. Select the **debug** build variant
3. Start an emulator
4. Run the app

## Permissions

The app requires location permission:

- `ACCESS_FINE_LOCATION`

This is used in two places:

1. Login screen uses location before making the login request
2. Attendance screen fetches high accuracy location before submitting attendance

If permission is not granted, the app triggers the runtime permission request.

## Token Storage

JWT is stored in **DataStore Preferences**:

- Store name: `auth`
- Key: `jwt`

This allows the employee session to persist across app restarts.

Logout clears this key.

## Navigation

Navigation is defined in `AppNavGraph`:

| Route        | Screen             |
| ------------ | ------------------ |
| `login`      | Employee login     |
| `dashboard`  | Task list + logout |
| `attendance` | Mark attendance    |

Start destination: `login`

## Screens

### 1) LoginScreen

Purpose:

- collect employee credentials
- request location permission
- fetch last known location
- call backend login endpoint
- store JWT into DataStore
- navigate to dashboard

Request:

- `POST /auth/login`

Behavior:

- If location permission is missing, permission request is triggered first
- If location cannot be retrieved, login fails with a visible error message
- On success, token is persisted and the user is sent to the dashboard

Note:
This screen currently sends `lat` and `lon` in the login request body. Backend enforcement for location-based login depends on your backend implementation.

---

### 2) DashboardScreen

Purpose:

- display a task list for the logged-in employee
- allow toggling a task between `pending` and `done`
- allow navigation to Attendance screen
- allow logout

Requests:

- `GET /tasks` (employee scope)
- `PUT /tasks/:taskId/status` (employee scope)

Task update behavior:

- The UI disables the button while a specific task is being updated
- Updates are applied locally after a successful response
- Errors are displayed inline

Logout behavior:

- removes token from DataStore
- navigates to `login` and clears the back stack

---

### 3) AttendanceScreen

Purpose:

- request location permission if missing
- fetch current high accuracy GPS location
- send attendance submission request
- display success or failure feedback

Request:

- `POST /attendance/mark`

Request body includes:

- `photo_url` (currently mocked)
- `latitude`
- `longitude`
- `accuracy_m`

Backend enforcement:

- The backend validates GPS accuracy and checks the user is within the configured geofence radius.
- The backend enforces “mark once per day” via a unique constraint.

## Error Handling

The app is defensive but intentionally simple:

- Network calls are wrapped in try/catch
- API error responses are parsed as JSON when possible
- UI shows short user-facing error messages without exposing stack traces

The current MVP does not yet have a shared authenticated client that automatically handles 401 or 403 responses by clearing the token and redirecting to login.

## Security Notes

This is an MVP implementation and does not claim hardened security.

Current limitations:

- JWT is stored in DataStore (not encrypted storage)
- No refresh token support
- No certificate pinning
- Attendance photo is mocked and not uploaded through a secure pipeline
- Login currently uses last-known location. Attendance uses current high accuracy location.

## Project Gaps

Not implemented yet:

- ViewModel + repository layer
- Retrofit client + structured API models
- Shared API contract types with backend
- UI tests or instrumentation tests
- WorkManager for retries/offline handling

## Next Steps

High-impact upgrades if expanding this app:

- Centralize API calls into a single authenticated client
- auto-handle 401/403 by clearing token and redirecting to login
- Add ViewModels for screen state and lifecycle safety
- Replace mocked attendance photo with a real camera flow (CameraX) and secure upload
- Add basic instrumentation tests for login and task update flow
- Add a stricter “location freshness” strategy (avoid last known for login if enforcing location-based login)
