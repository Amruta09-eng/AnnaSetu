# 🚀 AnnaSetu Complete Deployment Guide (GitHub + Render)

This step-by-step guide will walk you through deploying **AnnaSetu** from your local machine to **GitHub** and **Render** with zero errors.

---

## 📋 Table of Contents
1. [Overview & Architecture](#1-overview--architecture)
2. [Step 1: Push Project to GitHub](#step-1-push-project-to-github)
3. [Step 2: Deploy on Render](#step-2-deploy-on-render)
   - [Method A: 1-Click Blueprint (Recommended)](#method-a-1-click-blueprint-easiest--automatic)
   - [Method B: Manual Web Service Setup](#method-b-manual-web-service-setup)
4. [Step 3: Environment Variables & Database](#step-3-environment-variables--database)
5. [Step 4: Verify Your Live Deployment](#step-4-verify-your-live-deployment)
6. [Alternative: Decoupled Deployments](#alternative-decoupled-deployments)
7. [Troubleshooting & FAQ](#troubleshooting--faq)

---

## 1. Overview & Architecture

AnnaSetu is configured for **Unified Full-Stack Deployment** on Render:
- **Express Backend**: Serves RESTful API at `/api/*` and health probe at `/health`.
- **Frontend SPA**: Static assets (`index.html`, `css/`, `js/`) are served directly on the root `/` by Express.
- **Single Domain**: Both Frontend and Backend share the same URL (e.g. `https://annasetu.onrender.com`), eliminating CORS issues and staying 100% within Render's free tier!
- **Database**: Connects automatically to **Neon PostgreSQL** (cloud-persisted) with auto-fallback to SQLite.

---

## Step 1: Push Project to GitHub

### 1. Create a New Repository on GitHub
1. Go to [github.com](https://github.com) and log into your account.
2. Click the **+** (plus icon) in the top right corner and select **New repository**.
3. Name your repository (e.g., `annasetu` or `AnnaSetu_Project`).
4. Set visibility to **Public** (or **Private**).
5. **Do NOT** check "Add a README file", "Add .gitignore", or "Choose a license" (the project already includes them).
6. Click **Create repository**.
7. Copy your repository's Git URL (e.g., `https://github.com/<YOUR_USERNAME>/annasetu.git`).

### 2. Push Your Local Code to GitHub
Open PowerShell or Terminal inside this project folder:
```powershell
cd "c:\Users\AMRUTA M PATIL\Downloads\AnnaSetu_Project_Pack (1)"
```

Run these commands (replace `<YOUR_GITHUB_URL>` with your actual copied URL):
```bash
# Verify Git status
git status

# Commit the files
git commit -m "feat: complete deployment-ready AnnaSetu fullstack application"

# Add your GitHub remote repository
git remote add origin <YOUR_GITHUB_URL>

# Rename branch to main if not already
git branch -M main

# Push code to GitHub
git push -u origin main
```

---

## Step 2: Deploy on Render

### Method A: 1-Click Blueprint (Easiest & Automatic)

Render will read the included `render.yaml` configuration file and set up everything automatically!

1. Go to [dashboard.render.com](https://dashboard.render.com) and sign in (you can sign in with your GitHub account).
2. In the Render Dashboard, click the **New +** button in the top navigation bar.
3. Select **Blueprint**.
4. Connect your GitHub repository (`annasetu`).
5. Render will automatically detect `render.yaml` and show:
   - **Service Name**: `annasetu`
   - **Runtime**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
   - **Environment Variables**: `NODE_ENV`, `CORS_ORIGIN`, `DATABASE_URL`
6. Click **Apply**.
7. Render will now build and launch your application! Once the build finishes, your live link will appear (e.g., `https://annasetu.onrender.com`).

---

### Method B: Manual Web Service Setup

If you prefer to configure the service manually on Render:

1. In Render Dashboard, click **New +** -> **Web Service**.
2. Select **Build and deploy from a Git repository** -> Click **Next**.
3. Connect your GitHub repository (`annasetu`).
4. Fill in the following settings:
   - **Name**: `annasetu` (or your preferred name)
   - **Region**: Any (e.g., `Ohio (US East)` or `Frankfurt (EU)`)
   - **Branch**: `main`
   - **Root Directory**: *(leave blank)*
   - **Runtime**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. Click **Advanced** and add the following **Environment Variables**:
   | Key | Value | Notes |
   |---|---|---|
   | `NODE_ENV` | `production` | Enables production mode |
   | `NODE_VERSION` | `22.13.0` | Node.js version |
   | `CORS_ORIGIN` | `*` | Allows cross-origin requests |
   | `DATABASE_URL` | `postgresql://neondb_owner:npg_Tmvn9UPD3Gpy@ep-square-recipe-b4c9awo9-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require` | Live cloud PostgreSQL database |
6. Click **Create Web Service**.
7. Wait 2-3 minutes for the build to complete. Render will display your live URL!

---

## Step 3: Environment Variables & Database

The project is pre-configured with a live **Neon PostgreSQL** server:
```
postgresql://neondb_owner:npg_Tmvn9UPD3Gpy@ep-square-recipe-b4c9awo9-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### Want to use your own database?
You can replace `DATABASE_URL` with:
- Your own free database from [neon.tech](https://neon.tech)
- Render PostgreSQL (Click **New +** -> **PostgreSQL** in Render, and copy the Internal/External Database URL)
- Supabase PostgreSQL URL

> **Note on SQLite:** If `DATABASE_URL` is omitted, the app will automatically fall back to SQLite and auto-seed tables. However, on Render free tier, SQLite data resets when the container restarts. Using PostgreSQL keeps data permanently saved!

---

## Step 4: Verify Your Live Deployment

Open your Render URL (e.g. `https://annasetu.onrender.com`):

1. **Check Health Probe**:
   Visit `https://annasetu.onrender.com/health`
   You should see:
   ```json
   {
     "status": "healthy",
     "service": "AnnaSetu Backend"
   }
   ```

2. **Check API Status**:
   Visit `https://annasetu.onrender.com/api/health`
   You should see:
   ```json
   {
     "status": "ok",
     "service": "AnnaSetu REST API"
   }
   ```

3. **Check Frontend Web App**:
   Visit `https://annasetu.onrender.com`
   The full AnnaSetu interface will load seamlessly!

4. **Test Login with Demo Accounts** (Default Password: `AnnaSetu@1234`):
   - **Admin**: `admin@annasetu.org`
   - **Donor**: `donor@annasetu.org`
   - **NGO**: `ngo@annasetu.org`
   - **Volunteer**: `volunteer@annasetu.org`
   - **Beneficiary**: `beneficiary@annasetu.org`

   *(You can also use the **⚡ Quick Role Access** button in the top navigation bar to switch roles with a single click!)*

---

## Alternative: Decoupled Deployments

If you ever wish to deploy the Frontend and Backend separately:

### Backend on Render + Frontend on GitHub Pages
1. Deploy Backend on Render as a Web Service (URL: `https://annasetu-backend.onrender.com`).
2. In your GitHub repo settings, go to **Pages** -> Deploy from branch `main` -> folder `/frontend`.
3. Open your GitHub Pages site. Click **⚙️ API URL** in the footer and paste your Render backend URL:
   `https://annasetu-backend.onrender.com/api`

### Backend on Render + Frontend on Vercel / Netlify
1. Import repository into Vercel or Netlify.
2. Set Root Directory to `frontend`.
3. The included `vercel.json` and `netlify.toml` automatically configure single-page application routing.
4. Set `window.API_BASE_URL = 'https://annasetu-backend.onrender.com/api'` or configure it via the **⚙️ API URL** footer button.

---

## Troubleshooting & FAQ

### Q: Render free tier service spins down after inactivity?
Render's free tier spins down web services after 15 minutes of inactivity. When a new request arrives, it may take 30-50 seconds to wake up (cold start). This is normal behavior on free cloud platforms.

### Q: "Cannot reach backend API" error?
- Ensure the Render deployment shows **Live** (green status).
- Click the **⚙️ API URL** button in the footer to verify the API URL is set to `/api` (or your full backend URL).

### Q: How do I run the automated tests locally?
```bash
npm test
```
All Boundary Value Analysis (BVA), Equivalence Partitioning (EP), Security RBAC, and Lifecycle State Engine tests will run and pass.
