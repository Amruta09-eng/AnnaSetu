# AnnaSetu Backend - Enterprise RESTful API

AnnaSetu ("Food Bridge") is a resource redistribution platform designed to bridge the gap between surplus food/essentials donors, verified NGOs, volunteer logistics, and community beneficiaries.

This backend provides a RESTful API built on **Node.js 24**, **Express**, and high-performance **SQLite (native DatabaseSync)** with cryptographic `scrypt` password hashing and a strict finite-state lifecycle management engine.

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: v22.13.0 or higher (v24.x recommended)
- **npm**: v10.x or higher

### 2. Installation
```bash
cd backend
npm install
```

### 3. Start the Server
```bash
# Production start
npm start

# Development mode with hot-reloading
npm run dev
```
The server will start at:
- **API Base**: `http://localhost:5000/api`
- **Health Check**: `http://localhost:5000/health`

### 4. Run Automated Tests
```bash
npm test
```
Executes:
- **Boundary Value Analysis (BVA)** unit tests (Quantity: 0, 1, 500, 501)
- **Equivalence Partitioning (EP)** unit tests (Categories, title lengths, decimal quantities, pickup addresses)
- **Integration & End-to-End** lifecycle tests (NGO verification, state transitions, smart matching, volunteer transit, emergency request auto-fulfillment, security RBAC)

---

## 🔐 Production Organizational Accounts
When initialized, the database is pre-configured with real verified relief organizations:

| Role | Email | Password | Organization / Entity | Capabilities |
|---|---|---|---|---|
| **Admin** | `admin@annasetu.org` | `AnnaSetu@1234` | National Disaster & Relief Authority | Verify NGOs/Volunteers, view analytics, cancel listings |
| **Donor** | `donor@annasetu.org` | `AnnaSetu@1234` | The Grand Palace Kitchens & Banquets | List surplus meals/water, edit listings, submit for review |
| **NGO** | `ngo@annasetu.org` | `AnnaSetu@1234` | Seva Food Relief Foundation | Review food quality, approve/reject, release to pool, assign volunteers |
| **Volunteer** | `volunteer@annasetu.org` | `AnnaSetu@1234` | Rahul Sharma (Volunteer Dispatch) | Accept assigned pickups, start transit, mark delivered |
| **Beneficiary** | `beneficiary@annasetu.org` | `AnnaSetu@1234` | Yamuna Community Relief Shelter | Raise emergency relief requests (water, food, blankets, medical) |

---

## 📡 API Reference Documentation

All protected routes require an HTTP header:
```
Authorization: Bearer <session_token>
```

### 1. System & Health
- `GET /health` - System health probe (returns status, uptime, timestamp)
- `GET /api/health` - Health probe via `/api` namespace

### 2. Authentication & Profile
- `POST /api/register`
  - Body: `{ name, email, password, role, phone?, address?, org_name? }`
  - Roles: `donor`, `ngo`, `volunteer`, `beneficiary`
  - Note: NGOs and Volunteers are registered with `verified = 0` until approved by Admin.
- `POST /api/login`
  - Body: `{ email, password }`
  - Returns: `{ token, user: { id, name, email, role, verified } }`
- `POST /api/logout` (Auth required)
  - Destroys active session token.
- `GET /api/me` (Auth required)
  - Returns current logged-in user profile.
- `GET /api/profile` (Auth required)
  - Returns full user profile.
- `POST /api/profile` (Auth required)
  - Body: `{ name, phone?, address?, org_name?, available? }`

### 3. Donations Lifecycle
State transitions:
```
Created -> Submitted -> UnderReview -> Approved -> Available -> Assigned -> InTransit -> Delivered
UnderReview -> Rejected -> Created (edit and resubmit)
Created / Submitted / Approved -> Cancelled
```

- `GET /api/donations` (Auth required)
  - Query parameters:
    - `search` (substring search on title)
    - `category` (filter by category)
    - `status` (filter by lifecycle status)
  - Filtered automatically based on role permissions.
- `POST /api/donations` (Role: `donor`)
  - Body: `{ title, category, quantity, servings?, prepared_at?, deadline?, description?, pickup, request_id? }`
  - Validation: title (3-100 chars), quantity (1-500 integer), servings (1-1000).
- `POST /api/donations/edit` (Role: `donor`)
  - Body: `{ id, title, category, quantity, servings?, deadline?, description?, pickup }`
  - Allowed only while donation is in `Created` state.
- `POST /api/donations/action` (Roles: `donor`, `ngo`, `volunteer`, `admin`)
  - Body: `{ id, action, volunteer_id?, delivery_location? }`
  - Actions:
    - `submit` (donor)
    - `review` (verified NGO)
    - `approve` (reviewing NGO)
    - `reject` (reviewing NGO)
    - `reopen` (donor)
    - `release` (reviewing NGO -> marks Available)
    - `assign` (reviewing NGO -> assigns volunteer and delivery location)
    - `start` (assigned volunteer -> marks InTransit)
    - `deliver` (assigned volunteer -> marks Delivered and auto-fulfills linked request)
    - `cancel` (donor or admin)
- `GET /api/history?donation_id=<id>` (Roles: `donor`, `ngo`, `admin`)
  - Returns audit log array: `[{ status, at }]`

### 4. Emergency & Relief Requests
- `GET /api/requests` (Roles: `beneficiary`, `ngo`, `admin`, `donor`)
  - Beneficiaries see their own requests.
  - Donors see active open requests (fulfilled are hidden).
  - NGOs/Admins see all requests prioritized by urgency (`Critical` -> `High` -> `Medium` -> `Low`).
- `POST /api/requests` (Roles: `beneficiary`, `ngo`)
  - Body: `{ category, quantity, location, description?, urgency }`
  - Urgency levels: `Low`, `Medium`, `High`, `Critical`
- `POST /api/requests/status` (Roles: `ngo`, `admin`)
  - Body: `{ id, status }`
  - Allowed progression: `Open -> In Progress -> Fulfilled`

### 5. Smart Matching Engine
- `GET /api/matches` (Roles: `ngo`, `admin`)
  - Pairs open/available donations with active relief requests sharing identical categories.
  - Sorts by urgency and closest matching quantities.

### 6. Administration & Volunteers
- `GET /api/volunteers` (Roles: `ngo`, `admin`)
  - Lists verified, available volunteers for dispatching tasks.
- `GET /api/users` (Role: `admin`)
  - Lists all users with verification status.
- `POST /api/users/verify` (Role: `admin`)
  - Body: `{ id }`
  - Verifies an NGO or Volunteer account.
- `GET /api/reports` (Role: `admin`)
  - Returns platform counts: donations created/delivered, active requests, completed tasks, total delivered units, total users.

### 7. Notification Center
- `GET /api/notifications` (Auth required)
  - Returns up to 30 most recent in-app notifications.
- `POST /api/notifications/read` (Auth required)
  - Marks all notifications as read.

---

## 🚢 Deployment Guide

### Option 1: Docker / Docker Compose
1. Build and run container:
```bash
docker compose up -d
```
2. Check container status:
```bash
docker ps
curl http://localhost:5000/health
```

### Option 2: Render.com
1. Create a **New Web Service** connected to your GitHub repo.
2. Root Directory: `backend`
3. Environment: `Node`
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Add Disk (for persistent SQLite):
   - Mount Path: `/app/data`
   - Size: 1 GB
7. Add Environment Variable:
   - `DB_FILE`: `/app/data/annasetu.db`
   - `PORT`: `10000`

### Option 3: Railway.app
1. Deploy from GitHub repo -> select `backend` folder.
2. Railway detects `package.json` automatically.
3. Attach a persistent volume to `/app/data`.
4. Set environment variable `DB_FILE=/app/data/annasetu.db`.

---

## 🔒 Security & Architecture Properties
1. **Three-Tier Separation**: Clean distinction between presentation tier (Frontend), application logic (Express + Finite State Engine), and persistence tier (SQLite).
2. **Zero Plaintext Passwords**: Password hashing using standard Node.js cryptographic primitive `crypto.scryptSync` with high-entropy salt and constant-time equality validation.
3. **Strict RBAC Enforcement**: Role-based access control tested at every endpoint with non-repudiation and ownership validation.
4. **Resilient Data Persistence**: Data is persisted across restarts and crashes using SQLite ACID transactions.
