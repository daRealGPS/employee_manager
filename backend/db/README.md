# Database README

The Employee Manager backend uses PostgreSQL, with Neon for the hosted development environment and a local Dockerized PostgreSQL instance for automated tests.

The schema is intentionally small and designed around four responsibilities:

1. Identity and role management (`users`)
2. Task assignment and tracking (`tasks`)
3. Attendance recording with geofence validation (`attendance`)
4. Security and operational traceability (`audit_logs`)

The database enforces several critical invariants through **constraints and indexes** so the backend cannot accidentally violate them.

## Schema

All tables live in the `public` schema.

### users

Stores application identities.

Columns:

- id (primary key)
- username (unique)
- password (bcrypt hash)
- role (`employer` or `employee`)
- created_at

Design notes:

- Username uniqueness is enforced by a **database unique index**, not just application logic.
- Passwords are stored only as bcrypt hashes.

Indexes:

- `users_pkey`
- `users_username_unique`

### tasks

Tracks work assigned to employees.

Columns:

- id
- user_id (FK → users)
- description
- status (`pending` or `done`)
- completed_count
- reopened_count
- updated_at

Design notes:

The application allows employees to toggle task status, but guardrails exist to prevent abuse.

Two counters track behavior:

- `completed_count`
- `reopened_count`

Database constraints enforce upper limits so the backend cannot accidentally allow unlimited toggling.

Indexes:

- `tasks_pkey`

### attendance

Stores employee attendance submissions.

Columns:

- id
- user_id (FK → users)
- photo_url
- timestamp
- attendance_day
- latitude
- longitude
- accuracy_m
- distance_m
- geofence_ok

#### Geofence metadata

Attendance rows store:

- the distance from the configured geofence center
- the reported GPS accuracy
- whether the geofence check passed

This allows later auditing or investigation if attendance records look suspicious.

#### Once-per-day enforcement

The database enforces **one attendance record per employee per day**.

Unique index:

```
(user_id, attendance_day)
```

If the backend attempts to insert a second record for the same day, PostgreSQL raises a unique-constraint error which the API converts into a **409 conflict response**.

This protects against race conditions or repeated client submissions.

Indexes:

- `attendance_pkey`
- `attendance_day_idx`
- `attendance_one_per_day_ist`

### audit_logs

Append-only table recording security-relevant events.

Columns include:

- request_id
- actor_user_id
- actor_role
- action
- target_type
- target_id
- success
- status_code
- ip
- user_agent
- metadata_json
- created_at

Examples of logged events:

- login success or failure
- employee creation or update
- task assignment
- task status changes
- attendance submission attempts
- rate limit violations

#### Why audit logs exist

Audit logs allow operators to answer questions such as:

- Who assigned this task?
- When did an employee mark attendance?
- Did someone attempt repeated logins?
- Was a request rejected due to rate limiting?

#### Index strategy

Indexes support common investigation queries.

| Index                            | Purpose                             |
| -------------------------------- | ----------------------------------- |
| audit_logs_request_id_idx        | correlate logs for a single request |
| audit_logs_action_created_at_idx | investigate specific actions        |
| audit_logs_actor_created_at_idx  | investigate activity by user        |
| audit_logs_created_at_idx        | timeline queries                    |

Indexes:

- `audit_logs_pkey`
- `audit_logs_request_id_idx`
- `audit_logs_action_created_at_idx`
- `audit_logs_actor_created_at_idx`
- `audit_logs_created_at_idx`

## Trigger helpers

The database contains a trigger helper function:

```
employee_manager.set_updated_at()
```

This function sets:

```
NEW.updated_at = now()
```

on updates.

It allows tables such as `tasks` to maintain accurate update timestamps without relying on application code.

## Design philosophy

The database intentionally enforces several invariants that the backend also checks:

| Invariant                    | Enforcement           |
| ---------------------------- | --------------------- |
| usernames are unique         | database unique index |
| one attendance per day       | database unique index |
| task toggle abuse prevention | database constraints  |
| referential integrity        | foreign keys          |

Application logic may fail or be bypassed, but database invariants cannot.

## Environments

The project uses PostgreSQL in two different ways depending on context:

### Development / hosted environment

The main application database is hosted on **Neon**.

Advantages include:

- automatic scaling
- PostgreSQL compatibility
- standard connection string support
- convenient hosted development workflow

### Local test environment

Automated backend tests use a **local PostgreSQL instance in Docker**, not Neon.

This keeps tests:

- isolated
- repeatable
- fast
- free from hosted usage costs
- independent from shared remote state

## Local test database with Docker

Start a local PostgreSQL container for tests:

```bash
docker run --name employee-manager-test-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=employee_manager_test \
  -p 5433:5432 \
  -d postgres:16
```

Typical test connection string:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/employee_manager_test
```

### Why port 5433?

Port `5433` is used to avoid conflicts with any existing local PostgreSQL instance already using the default host port `5432`.

## Test database workflow

The automated test suite uses the local database with a simple lifecycle:

1. create required tables
2. clear previous test data
3. seed known test users
4. run tests against the isolated database

Typical seeded users include:

- one employer account for authenticated employer flows
- one employee account for authorization and employee-specific scenarios

This allows integration tests to exercise real SQL behavior, unique constraints, and route/controller interactions without touching hosted infrastructure.

## Production considerations

Recommended improvements for larger deployments:

- partition `audit_logs` by time for retention control
- move attendance photos to controlled object storage
- enforce stricter role types using PostgreSQL enums
- add partial indexes if audit log volume becomes large
