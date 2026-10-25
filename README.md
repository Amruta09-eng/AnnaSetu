# 🌾 AnnaSetu — Smart Food Redistribution & Disaster Relief Platform

**Bridging the gap between surplus food and empty plates.**

AnnaSetu is a web-based food redistribution platform that connects food donors, NGOs, volunteers, and beneficiaries to reduce food waste and deliver food to people in need. It also supports emergency food distribution during floods and other disasters.

🌐 **Live Website:** https://annasetu-813t.onrender.com/

---

## 📌 Project Overview

Food wastage and food insecurity are major challenges. While restaurants, hotels, and other organizations often have surplus food, many communities struggle to access sufficient meals.

AnnaSetu aims to bridge this gap through a centralized platform where donors can share available food, NGOs and beneficiaries can request assistance, and volunteers can coordinate collection and delivery.

The platform also supports emergency relief operations to help communities affected by floods and other disasters.

## 🎯 Objectives

* Reduce food wastage by redistributing surplus food.
* Connect donors with NGOs and people in need.
* Enable volunteers to coordinate food collection and delivery.
* Support emergency food distribution during natural disasters.
* Provide role-based access for different users.
* Improve transparency and coordination in food redistribution.

## 👥 User Roles

| Role          | Responsibilities                                    |
| ------------- | --------------------------------------------------- |
| Donor         | Lists available surplus food and manages donations. |
| NGO           | Coordinates food distribution and manages requests. |
| Volunteer     | Assists with food collection and delivery.          |
| Beneficiary   | Requests food assistance.                           |
| Administrator | Oversees platform activities and manages users.     |

*The availability of individual features depends on the implemented application functionality.*

## ✨ Key Features

* **Food Donation Management:** Record and manage surplus food donations.
* **Food Requests:** Allow eligible users or organizations to request food assistance.
* **Smart Matching:** Help connect available donations with suitable requests.
* **Volunteer Coordination:** Support the coordination of food collection and delivery.
* **Emergency Relief:** Support food redistribution during floods and other disasters.
* **Role-Based Access:** Provide different access permissions for different user roles.
* **Dashboard:** Present relevant information and activities to users.
* **Responsive Interface:** Provide a web interface designed for different screen sizes.

## 🛠️ Technology Stack

The project documentation describes the following architecture. Confirm that each component matches the code in the deployed version before presenting it as the final implementation.

### Frontend

* HTML5
* CSS3
* JavaScript (ES6)

### Backend

* Node.js
* Express.js
* REST API architecture

### Database

* SQLite

### Deployment and Infrastructure

* Render — live application hosting
* Docker and Docker Compose — containerization and local orchestration, if configured in the repository
* Git and GitHub — version control and source code management

## 🏗️ System Architecture

AnnaSetu follows a three-tier architecture.

### 1. Presentation Layer

The frontend provides the user interface for donors, NGOs, volunteers, beneficiaries, and administrators.

### 2. Application Layer

The backend handles authentication, authorization, donations, requests, matching, user management, and other implemented application operations.

### 3. Data Layer

The database stores application information, such as user records, donations, requests, and their associated statuses.

**Application flow:**

User → Frontend → Backend API → Database → Backend Response → Frontend

## 🚀 Live Demo

**Visit AnnaSetu:** https://annasetu-813t.onrender.com/

Open the deployed website to explore the application's available features.

## 💻 Running the Project Locally

If the repository contains the documented `backend` and `frontend` directories, follow these steps.

### Prerequisites

* Node.js
* npm
* Git

### Step 1: Clone the Repository

```bash
git clone https://github.com/<YOUR_USERNAME>/<YOUR_REPO>.git
cd <YOUR_REPO>
```

Replace the placeholders with your actual GitHub username and repository name.

### Step 2: Configure the Backend

```bash
cd backend
npm install
```

If the project provides an `.env.example` file, configure the required environment variables according to the backend README.

### Step 3: Start the Backend

```bash
npm start
```

Use the backend's configured port and environment settings.

### Step 4: Start the Frontend

Open another terminal:

```bash
cd frontend
npx serve -l 3000 .
```

Open the local frontend at:

http://localhost:3000

Ensure that the frontend API configuration points to the correct backend address.

### Step 5: Run Tests

If the backend defines an `npm test` script:

```bash
cd backend
npm test
```

The test results will indicate which implemented test cases pass or fail.

## 🧪 Software Testing

The project documentation describes the following testing approaches:

* **Unit Testing:** Tests individual functions or modules.
* **Integration Testing:** Checks interactions between application components.
* **Boundary Value Analysis (BVA):** Tests values near input boundaries.
* **Equivalence Partitioning (EP):** Tests representative inputs from different input classes.
* **Security Testing:** Checks authentication, authorization, and role-based access controls.
* **Lifecycle Testing:** Checks transitions between application states.

Report the actual test results obtained from running the test suite. Do not claim a particular pass rate unless it has been verified.

## 🌍 Social Impact

AnnaSetu aims to:

* Reduce avoidable food waste.
* Improve access to food for underserved communities.
* Strengthen collaboration between donors, NGOs, and volunteers.
* Support faster coordination during emergencies.
* Encourage responsible resource redistribution.

## 🔮 Future Enhancements

* Real-time donation notifications.
* Location-based donor and beneficiary matching.
* Food inventory and expiry tracking.
* Integration with maps and route optimization.
* Multilingual accessibility.
* Analytics for donation trends and community impact.
* Improved emergency relief coordination.

## 👩‍💻 Project Information

**Project Name:** AnnaSetu
**Project Category:** Web Application / Social Impact Platform
**Primary Domain:** Food Redistribution and Disaster Relief
**Live Deployment:** https://annasetu-813t.onrender.com/

## 📄 License

Add a suitable open-source license if you intend to distribute the project under one. Otherwise, specify the project's actual licensing terms.

---

**AnnaSetu — Bridging the gap between surplus food and empty plates.**
