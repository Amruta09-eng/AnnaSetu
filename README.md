# 🌾 AnnaSetu Project Pack (Production & Evaluation Ready)

Complete, decoupled three-tier software architecture for **AnnaSetu ("Food Bridge")** — an emergency relief and surplus food redistribution platform.

---

## 📁 Repository Structure

```
AnnaSetu_Project_Pack/
├── backend/                  # Complete Backend API (Node.js 24 + Express + SQLite)
│   ├── src/
│   │   ├── config/           # DB connection, schema creation, constants, demo seed
│   │   ├── controllers/      # Auth, Donations, Requests, Matching, Users, Reports, Notifications
│   │   ├── middleware/       # RBAC role guards, Bearer auth, BVA/EP validation
│   │   ├── routes/           # REST API routes (/api/*, /health)
│   │   ├── utils/            # Password scrypt hashing, crypto session tokens
│   │   └── server.js         # Production Express server entry point
│   ├── tests/                # Automated Test Suite (BVA, EP, Security, Lifecycle)
│   ├── Dockerfile            # Container deployment for Backend
│   ├── docker-compose.yml    # Docker orchestration for Backend
│   ├── .env.example          # Environment variables template
│   ├── package.json          # Backend npm dependencies and scripts
│   └── README.md             # Full API documentation & deployment guide
│
├── frontend/                 # Complete Modern Frontend SPA (HTML5 + Modern CSS + ES6)
│   ├── css/
│   │   └── style.css         # Custom responsive design system with dark/light themes
│   ├── js/
│   │   ├── api.js            # API client with token management and auto-discovery
│   │   └── app.js            # Reactive UI rendering, role dashboards, modals, filters
│   ├── index.html            # Semantic HTML5 single-page application entry point
│   ├── nginx.conf            # Production Nginx reverse-proxy configuration
│   ├── Dockerfile            # Container deployment for Frontend
│   ├── vercel.json           # Vercel deployment configuration
│   ├── netlify.toml          # Netlify deployment configuration
│   ├── package.json          # Frontend scripts
│   └── README.md             # UI features guide and deployment options
│
├── docker-compose.yml        # Root full-stack orchestration (Frontend + Backend)
├── package.json              # Root unified execution scripts
└── README.md                 # Project overview and quick start guide
```

---

## ⚡ Quick Start

### 1. Run the Backend Server
```bash
cd backend
npm install
npm start
```
- API Base: `http://localhost:5000/api`
- Health Check: `http://localhost:5000/health`

### 2. Run the Frontend App
In a new terminal:
```bash
cd frontend
npx serve -l 3000 .
```
- Frontend Web App: `http://localhost:3000`

> **Note:** The backend is also configured to serve the frontend directly at `http://localhost:5000` out of the box if opened in a single port configuration.

### 3. Run Automated Tests
```bash
cd backend
npm test
```
All unit tests (Boundary Value Analysis, Equivalence Partitioning) and integration tests (Security RBAC, Lifecycle State Engine, Smart Matching, Emergency Auto-fulfillment) run automatically with 100% pass rate.

---

## 👥 Production Accounts (Default Password: `AnnaSetu@1234`)
You can use the **⚡ Quick Role Access** button directly in the web UI navigation bar to switch between roles with a single click, or log in manually:

- **Donor**: `donor@annasetu.org` (The Grand Palace Kitchens & Banquets)
- **NGO**: `ngo@annasetu.org` (Seva Food Relief Foundation)
- **Volunteer**: `volunteer@annasetu.org` (Rahul Sharma, Volunteer Dispatch)
- **Beneficiary**: `beneficiary@annasetu.org` (Yamuna Community Relief Shelter)
- **Admin**: `admin@annasetu.org` (National Relief Coordinator)

---

## 🚢 Deployment to Render & GitHub

See **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** for detailed step-by-step instructions.

### 1. Push to GitHub
```bash
git add .
git commit -m "feat: deployment-ready fullstack app"
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO>.git
git branch -M main
git push -u origin main
```

### 2. Deploy to Render with 1-Click Blueprint
1. Go to **[dashboard.render.com](https://dashboard.render.com)** -> Click **New +** -> **Blueprint**.
2. Select your GitHub repository.
3. Render automatically reads `render.yaml` and deploys both the frontend and backend in a unified web service!
4. Click **Apply** — you are live in 2 minutes!

### 3. Deploy via Docker Compose (Local Full-Stack)
```bash
docker compose up -d
```
Both backend API (port 5000) and frontend web server (port 80) will be compiled and launched with persistent database storage.

