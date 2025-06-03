# Employee Manager Backend

Node.js + Express API powering a small employer / employee management system.

The backend provides:

- JWT authentication
- role-based authorization
- employee management
- task assignment and tracking
- geofenced attendance recording
- structured request logging
- persistent audit logging
- rate limiting and input validation

The goal is a **defensive API** that records important actions and protects itself against common misuse patterns.

## Stack

Runtime

- Node.js
- Express

Security

- jsonwebtoken
- bcrypt
- express-rate-limit

Validation

- express-validator
- sanitize-html

Database

- PostgreSQL
- Neon for hosted development
- Dockerized local PostgreSQL for test isolation

# Server startup

Install dependencies:

```
npm install
```

Start server:

```
npm start
```

Default port:
[http://localhost:5000](http://localhost:5000)

## Environment variables

Required variables:

```
PORT
JWT_SECRET
DATABASE_URL
NODE_ENV
```

CORS allowlist:

```
FRONTEND_URL_DEV
FRONTEND_URL_PROD
```

Geofence configuration:

```
GEOFENCE_LAT
GEOFENCE_LNG
GEOFENCE_RADIUS_M
GEOFENCE_MAX_ACCURACY_M
```

Attendance submission fails if the geofence is not configured.

## Authentication

Authentication uses **JWT tokens**.

Login endpoint:

```
POST /auth/login
```

Body:

```
{
"username": "alice",
"password": "password"
}
```

On success the server returns:

```
{
"token": "<JWT>"
}
```

Token payload contains:

```
userId
role
```

Expiration: 15 minutes

## Authorization

Two roles exist:

| Role     | Capabilities                                    |
| -------- | ----------------------------------------------- |
| employer | manage employees, assign tasks, view attendance |
| employee | update tasks, mark attendance                   |

Authorization middleware verifies the token and attaches the decoded user to `req.user`.

Employer-only routes use an additional guard middleware.

## API Overview

### Auth

```
POST /auth/login
```

Rate limited:

- per IP
- per username

Audit logs record both success and failure.

### Employees (employer only)

Create employee:

```
POST /employees/create
```

List employees:

```
GET /employees/list
```

Update employee:

```
PUT /employees/update
```

Delete employee:

```
DELETE /employees/delete
```

### Tasks

Assign task (employer):

```
POST /tasks/assign
```

Fetch tasks:

```
GET /tasks
```

Employees fetch their own tasks.

Employers can fetch tasks for a specific employee.

Update task status (employee):

```
PUT /tasks/:taskId/status
```

Allowed transitions:

```
pending
done
```

Guardrails:

- tasks can only be toggled a limited number of times
- per-user rate limits prevent spamming

Delete task (employer):

```
DELETE /tasks/:taskId
```

### Attendance

Mark attendance:

```
POST /attendance/mark
```

Body:

```
photo_url
latitude
longitude
accuracy_m
```

Server behavior:

1. validates coordinates
2. checks GPS accuracy
3. calculates distance using the Haversine formula
4. verifies the user is inside the geofence
5. inserts attendance record

The database enforces **one attendance record per employee per day**.

If a duplicate insert is attempted the API returns:

```
409 Attendance already marked today
```

Employer endpoints:

```
GET /attendance/today
GET /attendance/:id
```

These allow employers to review attendance records.

## Request tracing

Each request receives a unique request ID.

Behavior:

- if the client sends `X-Request-Id`, it is reused
- otherwise the server generates a UUID

The ID is returned in the response header and included in all logs.

This allows operators to correlate:

- request logs
- audit logs
- database actions

## Request logging

A request logger records a JSON log entry for every request.

Fields include:

- request_id
- route
- method
- status_code
- latency_ms
- user_id

This makes the logs machine-parseable and easy to ingest into log systems.

## Audit logging

The API records security-relevant events to the `audit_logs` table.

Examples:

- login success
- login failure
- employee creation
- task assignment
- attendance submission
- rate limit violations

Audit entries contain:

- request ID
- actor ID and role
- action
- success flag
- HTTP status code
- IP address
- user agent
- optional metadata JSON

This creates a traceable history of sensitive operations.

## Input validation

User input is validated using:

```
express-validator
```

Checks include:

- numeric bounds for coordinates
- required fields
- task status enumeration
- integer IDs

Invalid requests return:

```
400 Bad Request
```

## Sanitization

Text fields pass through HTML sanitization to remove tags and attributes.

This prevents injection into downstream systems or logs.

## Rate limiting

Rate limits reduce brute force and abuse.

Login:

- per IP
- per username

Attendance:

- per user

Task updates:

- per user

Rate limit violations return HTTP 429 and are logged to the audit log.

## Error handling

Errors use a central `AppError` class.

Behavior:

- known errors return their defined status code
- unknown errors return HTTP 500
- server errors generate structured error logs

The response format is consistent:

```
{ "error": "message" }
```

## Testing

The backend includes automated tests for authentication, authorization, validation, and employee-management flows.

### Current test coverage

The current test suite covers:

- login success
- login failure
- JWT-protected route access
- employer-only authorization checks
- employee creation validation
- authenticated employee-management flow
- unauthorized access rejection
- regression coverage for previously fixed controller error paths

### Test philosophy

The project does not expose public shared test credentials against hosted infrastructure.
Tests are intentionally run against a **local isolated PostgreSQL test database** rather than the hosted Neon database.

This avoids:

- consuming hosted credits
- polluting development data
- exposing shared public test credentials
- flaky tests caused by shared remote state

### Test stack

- Mocha
- Chai
- Supertest
- Sinon
- local PostgreSQL in Docker

### Running tests

```bash
npm run test
```

### Test environment

Tests require a local PostgreSQL instance configured through environment variables.

Typical test configuration:

```env
NODE_ENV=test
JWT_SECRET=test-secret
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/employee_manager_test
FRONTEND_URL_DEV=http://localhost:5173
FRONTEND_URL_PROD=https://example.com
GEOFENCE_LAT=45.4215
GEOFENCE_LNG=-75.6972
GEOFENCE_RADIUS_M=150
GEOFENCE_MAX_ACCURACY_M=80
```

### Seeded test data

Tests seed a small local dataset before execution, typically including:

- one employer account
- one employee account

This allows route-level integration tests to exercise real middleware, JWT handling, validation, and SQL behavior without depending on external services.

### Test layers

The backend test strategy is layered:

- **unit tests** for isolated controller and middleware behavior
- **route/integration tests** using Supertest against the Express app
- **database-backed integration tests** using a local seeded PostgreSQL instance

This keeps the suite fast while still validating real request flow and database behavior where it matters.

For local test database setup and schema notes, see `db/README.md`.

## Known gaps

This project intentionally keeps scope small.

Current gaps:

- test coverage is still strongest around authentication and employee flows
- tasks and attendance need broader automated coverage
- no refresh token flow
- secure photo upload pipeline is not implemented
- stronger anti-location-spoofing protections are still needed
- timezone handling is not yet configurable
