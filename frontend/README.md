# AnnaSetu Frontend - Web Application

A modern single-page application (SPA) built for the AnnaSetu Food & Resource Redistribution Platform.

Designed with **Vanilla JavaScript (ES6+)**, **Custom CSS Design System**, dark/light theme switching, and responsive design for desktop, tablet, and mobile browsers.

---

## 🌟 Key Features

1. **Role-Tailored Dashboards**:
   - **Donor**: Create surplus food listings, validate quantities (1-500 BVA), edit created items, submit for review, view delivery status & history timeline.
   - **NGO**: Review queue for incoming donations, approve/reject, release to available pool, assign verified volunteers with turn-by-turn delivery locations, view smart matches.
   - **Volunteer**: Active delivery task assignments with pickup & drop-off locations, turn-by-turn workflow (`Accept & Start Delivery` -> `Mark Delivered`), availability toggle.
   - **Beneficiary**: Emergency relief request forms with urgency ratings (`Critical`, `High`, `Medium`, `Low`), real-time fulfillment status tracking.
   - **Admin**: System-wide performance reports, user management, and one-click NGO/volunteer verification.

2. **Universal Experience**:
   - **One-Click Demo Switcher**: Instant switching between all 5 demo roles without typing credentials.
   - **Dark / Light Mode**: Smooth theme toggling persisted to localStorage.
   - **In-App Notification Center**: Unread badge count with toast alerts.
   - **Search & Filtering**: Real-time filtering by keyword title, category, and status.
   - **Audit Timeline Modal**: Visual finite-state history log for all donations.

---

## 🚀 Running Locally

### Option 1: Zero-Config Static Server
```bash
cd frontend
npx serve -l 3000 .
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Option 2: Python HTTP Server (Built-in)
```bash
cd frontend
python -m http.server 3000
```

### Option 3: Unified Backend Serving
When running `npm start` inside the `backend` folder, the backend automatically detects and serves the frontend at [http://localhost:5000](http://localhost:5000)!

---

## 🚢 Deployment Guide

### Deploy to Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run from `frontend` folder:
```bash
vercel --prod
```
The included `vercel.json` ensures all routes route cleanly to `index.html`.

### Deploy to Netlify
1. Drag and drop the `frontend` folder into the [Netlify App](https://app.netlify.com/drop).
2. Or use Netlify CLI: `netlify deploy --prod --dir=.`
The included `netlify.toml` handles redirects.

### Deploy to Docker
```bash
docker build -t annasetu-frontend .
docker run -d -p 80:80 annasetu-frontend
```

---

## ⚙️ Configuration
The frontend automatically connects to `http://localhost:5000/api` or relative `/api`.
To customize the backend API endpoint at runtime, open browser console:
```javascript
Api.setBaseUrl('https://your-production-backend.com/api');
```
Or set `window.API_BASE_URL = 'https://your-production-backend.com/api'` in `index.html`.
