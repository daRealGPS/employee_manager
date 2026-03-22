# Employee Manager

A full-stack employee management system demonstrating **secure backend design, geofenced attendance verification, role-based access control, and multi-client API consumption**.

The system includes:

- **Backend API** (Node.js / Express / PostgreSQL)
- **Employer Web Dashboard** (React + TypeScript)
- **Employee Mobile App** (Android / Kotlin / Jetpack Compose)

The project models a small-business workflow: employers create employees, assign tasks, and review attendance, while employees use the mobile app to view tasks and submit attendance from a real location.

The emphasis is on backend enforcement and multi-client integration. The API handles role checks, rate limits, validation, audit logging, and geofence verification, while both clients consume the same backend with role-specific behavior.

## Live Demo

Demo credentials:

Employer (Web Dashboard) at [https://employee-manager-liard.vercel.app/login](https://employee-manager-liard.vercel.app/login)

- Username: demo
- Password: demo123

Employee (Android App) can be found in github releases

- Use any employee from the dashboard employee list after logging in
- Password: employee123

Notes before trying the demo:

- The backend is hosted on Render free tier. The first request may take up to a minute while the service wakes up.
- Attendance submission depends on device GPS accuracy. If the reported accuracy is too low or the location is slightly outside the configured radius, the request may be rejected.
- Public registration is disabled. Only demo accounts are available.
- The demo environment is shared. Data may be modified by other users and can be reset from the dashboard.
- API endpoints are rate limited and validated to prevent abuse and uncontrolled usage in a public demo environment.
- The system uses a separate demo database and does not expose any real user data or credentials.

## Why this is more than a CRUD demo

This project goes beyond basic CRUD because the main work is in enforcement, traceability, and real request flow.

Notable design choices:

- Both the web dashboard and Android app call the same backend API, but the server decides what each role is allowed to do.
- Attendance is not just a form submit. The backend checks GPS accuracy, calculates distance from the configured work location, and rejects duplicate submissions for the same day through a PostgreSQL unique index.
- Sensitive actions are traceable. Requests carry a request ID, structured request logs are emitted for every call, and audit log entries record actions such as login attempts, task assignment, attendance submission, and rate-limit violations.
- Abuse controls exist at multiple layers. Input is validated and sanitized, login is rate limited by IP and username, and task status updates are rate limited per user.
- The backend test suite runs against a local Dockerized PostgreSQL database instead of the hosted Neon database so the tests exercise real SQL behavior without exposing shared credentials or consuming hosted credits.

## System Overview

```text
Employer Web Dashboard ─┐
                        │
                        ▼
                   Express API
                  /     |     \
                 /      |      \
                ▼       ▼       ▼
          PostgreSQL  Audit   Android Employee App
        (Neon / local  Logging    (API consumer)
           test DB)
```

Both clients talk to the same API. The web dashboard focuses on employer operations, and the Android app focuses on employee task updates and attendance submission. Business rules are enforced on the server rather than duplicated across clients.

## Core Features

### Role-based system

Two roles exist:

Employer

- manage employees
- assign tasks
- monitor attendance

Employee

- view assigned tasks
- update task completion status
- mark attendance through the mobile app

### Geofenced attendance verification

Employees mark attendance from the Android app.

The mobile client sends:

- GPS latitude
- GPS longitude
- GPS accuracy
- photo reference

The backend then:

1. calculates distance from the configured work location
2. verifies the user is within the geofence radius
3. validates GPS accuracy
4. records the attendance event

Attendance is enforced **once per day** via a PostgreSQL unique index.

### Task management

Employers can assign tasks to employees.

Employees can:

- mark tasks as `done`
- reopen tasks to `pending`

Abuse prevention rules exist:

- task completion count is limited
- task reopen count is limited
- per-user rate limits prevent spamming

### Security controls

The backend includes several protections often missing in demo projects.

#### Authentication

JWT tokens with expiration.

#### Authorization

Role-based middleware enforces access control.

#### Rate limiting

Endpoints protected by rate limits:

- login attempts
- attendance submissions
- task status updates

#### Input validation

All request bodies validated using `express-validator`.

#### Sanitization

User text inputs are sanitized before use.

#### Audit logging

Security-relevant actions are recorded in a database audit log:

- login success/failure
- employee creation/update
- task assignment
- attendance submissions
- rate limit violations

Audit records include:

- actor ID
- action type
- request ID
- IP address
- metadata

#### Request tracing

Each request receives a unique request ID.

Logs can be correlated across:

- request logs
- audit logs
- database actions

## Repository Structure

```text
employee-manager/
│
├── backend/
│   Node.js / Express API
│   PostgreSQL integration
│   authentication and authorization
│
├── frontend/
│   React + TypeScript employer dashboard
│   employee management UI
│
├── mobile/
│   Android employee client
│   location-aware attendance submission
│
└── database/
    PostgreSQL schema and design
```

Each component contains its own README explaining internal details.

### Documentation Map

More detailed documentation is available in the component READMEs:

- `backend/README.md` for API design, auth, validation, logging, and testing
- `frontend/README.md` for employer dashboard behavior and API consumption
- `mobile/README.md` for Android client details and attendance flow
- `db/README.md` for schema design, constraints, indexes, and local test database setup

## Backend Highlights

Tech stack:

- Node.js
- Express
- PostgreSQL
- JWT authentication
- express-rate-limit
- express-validator

What the backend is responsible for:

- authenticating users and enforcing employer versus employee permissions
- managing employees and tasks
- validating attendance submissions against geofence distance and reported GPS accuracy
- recording structured request logs and persistent audit logs
- enforcing core data rules through PostgreSQL constraints, including unique usernames and one attendance record per employee per day

A few implementation details matter here. Login attempts are rate limited by both IP and username. Task status updates are rate limited per user. Requests carry a request ID so request logs and audit logs can be correlated when tracing a problem or investigating an action.

## Web Dashboard

Tech stack:

- React
- TypeScript
- Vite
- Tailwind CSS

The dashboard is designed for the **employer role**.

Features:

- employee management
- attendance monitoring
- task assignment
- employee detail view

The frontend deliberately keeps business logic minimal and relies on the backend for enforcement.

## Android Employee App

Tech stack:

- Kotlin
- Jetpack Compose
- OkHttp
- Google Play Services Location
- DataStore for JWT storage

Features:

- employee login
- task viewing and completion
- geofenced attendance submission

The mobile client demonstrates real-world concerns such as:

- runtime permission handling
- GPS location retrieval
- authenticated API calls

## Running the System Locally

#### 1. Backend

```
cd backend
npm install
npm start
```

Server runs on:

```
http://localhost:5000
```

Create a `.env` file in `backend/` with the required values before starting the server.

For schema details and local test database setup, see `db/README.md`.

- `PORT`
- `JWT_SECRET`
- `DATABASE_URL`
- `NODE_ENV`
- `FRONTEND_URL_DEV`
- `FRONTEND_URL_PROD`
- `GEOFENCE_LAT`
- `GEOFENCE_LNG`
- `GEOFENCE_RADIUS_M`
- `GEOFENCE_MAX_ACCURACY_M`

#### 2. Web dashboard

```
cd frontend
npm install
npm run dev
```

Configure:

```
VITE_API_BASE_URL=http://localhost:5000
```

#### 3. Android app

Open the `mobile` project in Android Studio.

Use the debug build variant.

The debug configuration points to:

```
http://10.0.2.2:5000
```

which allows the Android emulator to access the host machine backend.

## Testing

The project includes automated backend tests focused on authentication, authorization, validation, and employee-management flows.

### Current coverage

Backend automated coverage currently includes:

- login success and failure cases
- JWT-protected route access
- employer-only authorization checks
- employee creation validation
- authenticated employee-management workflow tests
- unauthorized access rejection
- regression coverage for previously fixed controller error paths

### Test strategy

The backend test suite is layered:

- unit tests for isolated controller and middleware behavior
- route and integration tests using Supertest against the Express app
- database-backed integration tests using a local seeded PostgreSQL instance

Tests intentionally run against a **local Dockerized PostgreSQL test database**, not the hosted Neon database.

This avoids:

- consuming hosted credits
- polluting development data
- exposing shared public test credentials
- flaky tests caused by shared remote state

### Running backend tests

```bash
cd backend
npm run test
```

For local test database setup and schema notes, see `db/README.md`.

## Production Deployment

Frontend is deployed on:

```
Vercel
```

Backend is deployed on:

```
Render
```

Database is hosted on:

```
Neon (serverless PostgreSQL)
```

The Android release build targets the deployed backend automatically via `BuildConfig`.

## Known Limitations

This is still an MVP and some parts are deliberately unfinished.

Current limitations:

- automated test coverage is strongest around authentication and employee-management flows
- attendance and task flows still need broader automated tests
- no refresh token flow
- attendance photo handling is still mocked
- mobile networking is functional but not yet centralized behind a stronger client layer
- the frontend does not use a state management library

## Next Technical Priorities

- expand automated coverage for attendance, task, and mobile flows
- define a shared API contract, likely with OpenAPI
- centralize mobile networking and response handling
- add refresh-token-based authentication
- replace mocked attendance photo handling with a secure upload flow
- support background sync or retry behavior on mobile where it makes sense
