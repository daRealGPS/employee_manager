# Employee Manager Frontend

React + TypeScript frontend for the Employee Manager system.

This client is built for the employer role. It handles login, employee management, attendance review, and task assignment through the shared backend API.

The frontend keeps business rules light on purpose. It focuses on rendering, authenticated requests, routing, and user feedback, while the backend enforces validation, authorization, rate limits, and attendance rules.

## Stack

Core

- React 19
- TypeScript
- Vite

Routing

- React Router

Styling

- Tailwind CSS

Icons

- react-icons

## Architecture Overview

```
Browser
   │
   ▼
React SPA
   │
   ▼
API Client (useApi + useAuthFetch)
   │
   ▼
Node.js / Express API
```

The frontend does not contain business logic for:

- authorization
- validation
- rate limiting
- geofence verification

Those responsibilities live in the backend.

## Running Locally

Install dependencies:

```
npm install
```

Create an environment file:

```
.env.local
```

Add the backend URL:

```
VITE_API_BASE_URL=http://localhost:5000
```

Run the development server:

```
npm run dev
```

The app will start on:

```
http://localhost:5173
```

## Authentication Model

Employer login returns a JWT token.

After login the token is stored in:

```
sessionStorage
```

Each API request attaches the token:

```
Authorization: Bearer <token>
```

A custom authenticated fetch wrapper (`useAuthFetch`) ensures:

- requests always include the token
- invalid or expired tokens redirect the user to `/login`

If the API returns:

```
401
403
```

the session is cleared and the user is redirected.

## Token Storage Tradeoff

Tokens are stored in `sessionStorage`.

This was chosen for simplicity during development.

Important limitations:

- vulnerable to XSS access
- no refresh token support
- session is lost when the tab closes

For a production system a safer design would use:

- HttpOnly cookies
- refresh tokens with rotation

## Routing

| Route             | Description                   |
| ----------------- | ----------------------------- |
| `/login`          | Employer login                |
| `/dashboard`      | Employee management dashboard |
| `/attendance/:id` | Employee detail view          |
| `*`               | Redirect to `/login`          |

Routes that require authentication are wrapped with `ProtectedRoute`.

If a token is missing or expired the route redirects to login.

## API Client Design

All HTTP calls pass through a centralized client.

```
useApi()
```

Available methods:

```
get()
post()
put()
del()
```

These methods:

- prepend the API base URL
- attach authorization headers
- reuse the authenticated fetch wrapper
- clears the session and redirects to /login when the backend returns 401 or 403

That keeps request logic out of page components and avoids repeating fetch boilerplate across the app.

## Pages

### Login

Employer authentication form.

Inputs:

- username
- password

Behavior:

- sends credentials to `/auth/login`
- stores returned JWT in sessionStorage
- navigates to `/dashboard`

If authentication fails the error message from the API is shown.

### Dashboard (Employee Manager)

Main employer interface.

Responsibilities:

- create employees
- list employees
- update employees
- delete employees
- view daily attendance status

#### Create Employee

Form inputs:

- username
- password

On success:

- employee list refreshes
- form resets

#### Employee List

Displays:

- username
- attendance status for today
- actions

Actions available:

- view employee details
- edit employee
- delete employee

Attendance status comes from:

```
GET /attendance/today
```

Results are converted into a lookup map keyed by employee id for efficient rendering.

### Employee Detail View

Route:

```
/attendance/:id
```

Shows:

- today's attendance record
- employee tasks

#### Attendance Panel

Fetches:

```
GET /attendance/:id
```

Possible states:

- attendance marked today
- attendance not marked
- loading state

If present the UI displays:

- timestamp
- photo URL

#### Task Panel

Fetches tasks:

```
GET /tasks?id=<employeeId>
```

Actions:

Assign task:

```
POST /tasks/assign
```

Delete task:

```
DELETE /tasks/:taskId
```

Each task displays:

- description
- status
- delete action

## Component Structure

Reusable UI primitives:

```
components/
  ActionButton
  ButtonPrimary
  Card
  H1
  H2
  InputField
  PasswordInput
  StatusPill
  tableStyles
```

Design goal:

- keep page components focused on logic
- isolate Tailwind styling inside reusable components

## Error Handling Strategy

The UI assumes API responses follow two patterns:

Success:

```
{ message: string }
```

Failure:

```
{ error: string }
```

Each form tracks:

- message
- status (`success | error | idle`)

Forms reset only when an action succeeds.

This prevents accidental loss of input during errors.

## Loading State Handling

Pages track loading state separately for different data sources.

Example:

```
loading.employees
loading.attendance
```

This allows partial loading without blocking the entire page.

## Known Limitations

This project intentionally keeps scope limited.

Current gaps:

- no automated UI tests
- no refresh token flow
- token storage relies on sessionStorage
- no global error boundary
- API response contracts are loosely typed

These were tradeoffs to keep the system focused on backend design and API behavior.

## Possible Improvements

High value improvements for a larger system:

- OpenAPI contract shared between frontend and backend
- refresh token support
- centralized error boundary
- React Query or SWR for data fetching
- optimistic updates for tasks
- automated UI tests for authentication and employee flows
