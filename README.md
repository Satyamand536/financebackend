# Finance Dashboard API

A robust, role-based backend API for a finance dashboard system. Built with **Node.js**, **Express**, and **MongoDB**, it supports financial record management, RBAC-enforced access control, and aggregated analytics for a frontend dashboard.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Seeding Demo Data](#seeding-demo-data)
- [API Reference](#api-reference)
  - [Auth](#auth)
  - [Users](#users)
  - [Finance Records](#finance-records)
  - [Dashboard](#dashboard)
- [Access Control Matrix](#access-control-matrix)
- [Design Decisions & Assumptions](#design-decisions--assumptions)

---

## Tech Stack

| Layer        | Technology                         |
|--------------|------------------------------------|
| Runtime      | Node.js (CommonJS)                 |
| Framework    | Express v5                         |
| Database     | MongoDB via Mongoose v9            |
| Auth         | JWT (jsonwebtoken)                 |
| Validation   | Joi                                |
| Security     | Helmet, express-rate-limit         |
| Password     | bcryptjs (cost factor 12)          |
| Dev tooling  | Nodemon                            |

---

## Architecture

The project follows a **layered, module-first architecture**. Each feature (auth, finance, dashboard, user) is a self-contained module with its own routes, controller, service, repository, model, and validation.

```
src/
├── config/
│   └── db.config.js          # MongoDB connection
├── core/
│   ├── errors/
│   │   └── AppError.js       # Custom operational error class
│   ├── middlewares/
│   │   ├── auth.middleware.js # JWT protect + role-based restrictTo
│   │   ├── error.middleware.js# Global error handler
│   │   └── validate.middleware.js # Joi schema validation wrapper
│   └── utils/
│       ├── ApiResponse.js    # Standardized response format
│       └── catchAsync.js     # Async error boundary wrapper
├── modules/
│   ├── auth/                 # Registration & login
│   ├── user/                 # User management (Admin CRUD + /me)
│   ├── finance/              # Financial records CRUD + filtering
│   └── dashboard/            # Aggregated analytics
├── scripts/
│   └── seed.js               # Demo data seeder
├── app.js                    # Express app, middlewares, routes
└── server.js                 # HTTP server + graceful shutdown
```

**Data flow:** `Route → Controller → Service → Repository → Model`

- **Routes** apply authentication + authorization middleware and input validation.
- **Controllers** are thin — they call the service layer and send HTTP responses.
- **Services** contain all business logic (access rules, data transformation).
- **Repositories** encapsulate all database queries (no Mongoose calls in services).
- **Models** define schema, indexes, and Mongoose hooks.

---

## Setup & Installation

### Prerequisites

- Node.js >= 18
- MongoDB running locally (or a MongoDB Atlas URI)

### Steps

```bash
# 1. Clone and navigate to the project
cd assignmentzorvyn

# 2. Install dependencies
npm install

# 3. Configure environment variables
# Copy the example below into a .env file at the project root

# 4. Start the development server
npm run dev

# 5. (Optional) Seed the database with demo data
npm run seed
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/finance_dashboard
JWT_SECRET=your_super_secret_key_minimum_32_characters_long
JWT_EXPIRES_IN=7d
```

> **Note:** `JWT_SECRET` must be at least 32 characters for adequate security.

---

## Seeding Demo Data

Run `npm run seed` to populate the database with realistic demo data:

- 4 users across all roles
- ~60 financial records spread over the last 6 months

**Test Credentials (after seeding):**

| Role    | Email                     | Password      |
|---------|---------------------------|---------------|
| ADMIN   | admin@financeapp.dev      | Admin@12345   |
| ANALYST | analyst@financeapp.dev    | Analyst@12345 |
| VIEWER  | viewer@financeapp.dev     | Viewer@12345  |

> ⚠️ The seeder will wipe all existing data before inserting. Never run in production.

---

## API Reference

All protected endpoints require the `Authorization: Bearer <token>` header.

Base URL: `http://localhost:5000/api/v1`

---

### Auth

#### `POST /auth/register`

Register a new user. Only `VIEWER` role is created by default. Admins should use the User management endpoints to change roles.

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securepassword123",
  "role": "VIEWER"
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "<jwt>",
  "data": { "user": { ... } }
}
```

---

#### `POST /auth/login`

Authenticate and receive a JWT token.

**Request Body:**
```json
{
  "email": "admin@financeapp.dev",
  "password": "Admin@12345"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "<jwt>",
  "data": { "user": { ... } }
}
```

---

### Users

> All `/users` routes require authentication. Most require ADMIN role.

#### `GET /users/me`
Get the currently authenticated user's profile. Any role.

#### `GET /users` *(ADMIN only)*
List all users with optional filters.

**Query Params:**
| Param  | Description              | Example        |
|--------|--------------------------|----------------|
| status | Filter by status         | `ACTIVE`       |
| role   | Filter by role           | `ANALYST`      |
| page   | Page number (default: 1) | `2`            |
| limit  | Results per page (def 10)| `20`           |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "docs": [ ... ],
    "meta": { "total": 4, "page": 1, "limit": 10, "totalPages": 1 }
  }
}
```

#### `GET /users/:id` *(ADMIN only)*
Get a specific user by ID.

#### `PATCH /users/:id` *(ADMIN only)*
Update a user's name and/or role.

**Request Body (at least one field required):**
```json
{
  "name": "New Name",
  "role": "ANALYST"
}
```

#### `PATCH /users/:id/status` *(ADMIN only)*
Activate or deactivate a user account.

**Request Body:**
```json
{ "status": "INACTIVE" }
```

> An admin cannot deactivate their own account to prevent lockout.

---

### Finance Records

> All routes require authentication. Write operations (POST, PUT, DELETE) are ADMIN only.

#### `GET /finance`

List all financial records with pagination and filtering.

**Query Params:**
| Param     | Description                           | Example        |
|-----------|---------------------------------------|----------------|
| type      | Filter by type                        | `INCOME`       |
| category  | Filter by category                    | `Salary`       |
| startDate | Filter records from this date         | `2025-01-01`   |
| endDate   | Filter records until this date        | `2025-12-31`   |
| page      | Page number (default: 1)              | `2`            |
| limit     | Results per page (default: 10)        | `20`           |
| sort      | Sort field, prefix `-` for descending | `-date`        |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "docs": [
      {
        "_id": "...",
        "amount": 5000,
        "type": "INCOME",
        "category": "Salary",
        "date": "2025-04-01T00:00:00.000Z",
        "note": "April salary",
        "createdBy": { "name": "Alice Admin", "email": "admin@..." }
      }
    ],
    "meta": { "total": 62, "page": 1, "limit": 10, "totalPages": 7 }
  }
}
```

#### `GET /finance/:id`
Get a single financial record by ID. (Any authenticated role)

#### `POST /finance` *(ADMIN only)*

**Request Body:**
```json
{
  "amount": 5000,
  "type": "INCOME",
  "category": "Salary",
  "date": "2025-04-01",
  "note": "April salary"
}
```

#### `PUT /finance/:id` *(ADMIN only)*

Update a financial record. All fields optional (min 1 required).

#### `DELETE /finance/:id` *(ADMIN only)*

Soft-deletes the record (`isDeleted: true`). Data is preserved in the database and excluded from all queries and aggregations automatically.

---

### Dashboard

> Accessible by all authenticated roles (VIEWER, ANALYST, ADMIN).

#### `GET /dashboard/summary`

Returns comprehensive analytics for the dashboard. Optionally filter by date range.

**Query Params:**
| Param     | Description                    | Example      |
|-----------|--------------------------------|--------------|
| startDate | Filter results from this date  | `2025-01-01` |
| endDate   | Filter results until this date | `2025-12-31` |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalIncome": 45000,
      "totalExpense": 18500,
      "netBalance": 26500,
      "recordCount": 62
    },
    "categoryBreakdown": [
      { "category": "Salary", "type": "INCOME", "total": 30000, "count": 6 },
      { "category": "Rent",   "type": "EXPENSE", "total": 9000,  "count": 3 }
    ],
    "monthlyTrends": [
      { "period": "2024-11", "income": 7000, "expense": 2500 },
      { "period": "2024-12", "income": 8200, "expense": 3100 }
    ],
    "weeklyTrends": [
      { "date": "2025-03-15", "type": "INCOME",  "total": 5000 },
      { "date": "2025-03-18", "type": "EXPENSE", "total": 800  }
    ],
    "recentActivity": [ ... ]
  }
}
```

---

## Access Control Matrix

| Action                      | VIEWER | ANALYST | ADMIN |
|-----------------------------|--------|---------|-------|
| Login / Register            | ✅     | ✅      | ✅    |
| View own profile (`/me`)    | ✅     | ✅      | ✅    |
| View finance records        | ✅     | ✅      | ✅    |
| View dashboard summary      | ✅     | ✅      | ✅    |
| Create finance record       | ❌     | ❌      | ✅    |
| Update finance record       | ❌     | ❌      | ✅    |
| Delete finance record       | ❌     | ❌      | ✅    |
| List all users              | ❌     | ❌      | ✅    |
| Update user role/name       | ❌     | ❌      | ✅    |
| Toggle user status          | ❌     | ❌      | ✅    |

---

## Design Decisions & Assumptions

### 1. Soft Deletes on Financial Records
Finance records are never hard-deleted. A `DELETE /finance/:id` call sets `isDeleted: true`. This is intentional — financial audit trails should be preserved. All list queries and aggregations automatically exclude soft-deleted records via a repository-level filter.

### 2. Analyst Read Access
The spec says analysts "may be allowed to read records and access summaries." This is implemented as full read access across all finance records (not just their own), plus full access to the dashboard. This makes sense for an analyst persona who needs visibility across the organization.

### 3. Registration Opens with VIEWER Default
The public `/auth/register` endpoint defaults new users to the `VIEWER` role. This is the least-privilege principle. An admin can then elevate the user's role via `PATCH /users/:id`. The role field in the register body is accepted but should be restricted to admin-only use in a production system — a note in the codebase reflects this.

### 4. Self-Deactivation Guard
An admin cannot deactivate their own account via the API. This prevents a complete system lockout where no admin can log in.

### 5. Parallel Aggregation in Dashboard
The dashboard's `getSummary` method runs four MongoDB aggregation pipelines concurrently using `Promise.all`. This is intentional — each pipeline is independent, and running them in parallel significantly reduces response time.

### 6. Compound Indexes on FinanceRecord
Two compound indexes are defined:
- `{ type: 1, date: -1 }` — optimizes the type + date filter common in list queries.
- `{ createdBy: 1, date: -1 }` — optimizes user-specific record lookups.

### 7. Rate Limiting
- Auth routes (`/api/v1/auth/**`): 20 requests per 15 minutes per IP.
- All other API routes: 200 requests per 15 minutes per IP.

---

## Error Response Format

All errors follow a consistent structure:

```json
{
  "success": false,
  "message": "A human-readable description of what went wrong"
}
```

In development mode (`NODE_ENV=development`), errors also include a `stack` trace and the full `error` object for debugging.

| Status | Meaning                              |
|--------|--------------------------------------|
| 400    | Bad request / validation failure     |
| 401    | Unauthenticated (no/invalid token)   |
| 403    | Unauthorized (insufficient role)     |
| 404    | Resource not found                   |
| 429    | Rate limit exceeded                  |
| 500    | Internal server error                |
