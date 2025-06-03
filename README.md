# Employee Manager

A full-stack employee management system demonstrating **secure backend design, geofenced attendance verification, role-based access control, and multi-client API consumption**.

The system includes:

- **Backend API** (Node.js / Express / PostgreSQL)
- **Employer Web Dashboard** (React + TypeScript)
- **Employee Mobile App** (Android / Kotlin / Jetpack Compose)

Together they simulate a real small-business workflow where employers assign work and employees verify attendance through a location-aware mobile client.

## Why this is more than a CRUD demo

This project is designed to demonstrate system behavior, defensive backend design, and multi-client integration rather than just basic create-read-update-delete operations.

Key architectural choices include:

- **backend as source of truth**, with both web and mobile clients consuming the same API
- **database-enforced invariants**, such as unique usernames and one attendance record per employee per day
- **defensive API design**, including validation, sanitization, rate limiting, and audit logging
- **traceable operations**, using request IDs to correlate request logs and audit logs
- **multi-client integration**, where different frontends consume the same backend with role-specific behavior
- **geofenced attendance verification**, adding real-world constraints beyond ordinary CRUD flows

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

The backend is the **source of truth**.
Both clients consume the same API and rely on the backend to enforce security and business rules.

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

Responsibilities:

- authentication
- authorization
- task management
- attendance verification
- geofence calculations
- audit logging
- request tracing

The database enforces key invariants such as:

- unique usernames
- one attendance record per user per day

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

The project intentionally focuses on backend architecture and system integration.

Current gaps:

- automated coverage is currently strongest around backend authentication and employee flows
- attendance and task flows need broader automated test coverage
- no refresh token support
- attendance photo pipeline is mocked
- mobile networking is not yet centralized
- frontend does not use a state management library

## Future Improvements

Possible extensions include:

- broader automated coverage for attendance, task, and mobile flows
- OpenAPI specification for shared API contracts
- centralized mobile networking layer
- refresh token authentication flow
- secure photo uploads for attendance verification
- background task synchronization on mobile
