# 🩸 Smart Blood Network System

A real-time, location-based blood donor platform connecting **Donors**, **Patients**, **Hospitals**, and **Government Admins**.

---

## 🚀 Quick Start

### Prerequisites
- Node.js v16+
- MongoDB (local or Atlas)

### 1. Install backend dependencies
```bash
cd backend
npm install
```

### 2. Seed the database with demo data
```bash
npm run seed
```

### 3. Start the server
```bash
npm run dev
```

### 4. Open in browser
```
http://localhost:5000
```

---

## 🔑 Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| 🛡️ Admin | admin@smartblood.gov | password123 |
| 🏥 Hospital (Approved) | hospital1@smartblood.com | password123 |
| 🏥 Hospital (Approved) | hospital2@smartblood.com | password123 |
| 🩸 Donor | donor1@smartblood.com | password123 |
| 👤 Patient | patient1@smartblood.com | password123 |

---

## 🌟 Features

| Feature | Description |
|---------|-------------|
| 🚨 Emergency Mode | One-click emergency request — notifies nearby donors via Socket.IO in real-time |
| 🧠 AI Donor Matching | Ranks donors by compatibility, distance, recency, and rating |
| 🗺️ Live Map | Leaflet.js map with donor pins, hospital markers, blood request markers |
| 🏥 Hospital Dashboard | Verify/reject donors, upload health records |
| 🛡️ Government Admin | Approve hospitals, block unsafe ones, schedule inspections |
| ✅ Eligibility System | Auto-checks age, weight, 56-day gap, health status |
| 🔔 Smart Notifications | Real-time Socket.IO alerts for all roles |
| ⭐ Reputation System | Patient ratings after successful donations |
| 🔐 Privacy Control | Donors control visibility (public/semi-private/private) |
| 📊 Analytics | Chart.js dashboard with monthly trends |

---

## 🏗️ Architecture

```
Smart-Blood-Network-System/
├── backend/          ← Node.js + Express + Socket.IO + MongoDB
│   ├── models/       ← User, BloodRequest, Donation, Notification
│   ├── routes/       ← auth, donors, patients, hospitals, admin, requests, notifications
│   ├── controllers/  ← Business logic
│   ├── utils/        ← AI matching, eligibility checker, geo utils
│   ├── middleware/   ← JWT auth, role check
│   ├── seed.js       ← Demo data seeder
│   └── server.js     ← Entry point
│
└── frontend/         ← Vanilla HTML + CSS + JS
    ├── index.html    ← Landing page
    ├── login.html
    ├── register.html
    ├── map.html      ← Live Leaflet.js map
    ├── donor/        ← Donor dashboard
    ├── patient/      ← Patient dashboard
    ├── hospital/     ← Hospital dashboard
    ├── admin/        ← Government admin dashboard
    ├── css/          ← Design system
    └── js/           ← API client, utilities
```

---

## 🧠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5 + CSS3 (Vanilla, no framework) |
| Maps | Leaflet.js + OpenStreetMap (free, no API key) |
| Charts | Chart.js |
| Backend | Node.js + Express.js |
| Real-time | Socket.IO |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| Geo Queries | MongoDB 2dsphere index + $near |

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login & get JWT |
| GET | `/api/donors/nearby?lat=&lng=&radius=&bloodGroup=` | Find nearby donors |
| POST | `/api/requests` | Create blood request |
| GET | `/api/requests/:id/matches` | AI-matched donors for request |
| PUT | `/api/requests/:id/respond` | Donor accepts/declines |
| PUT | `/api/hospitals/verify/:id` | Hospital verifies donor |
| PUT | `/api/admin/hospitals/:id/approve` | Admin approves hospital |
| GET | `/api/admin/analytics` | System stats |
| GET | `/api/notifications` | Get notifications |

---

## 💡 Innovation Highlights

1. **Real-time Emergency Broadcast** — Socket.IO broadcasts emergency to all donors in area
2. **AI Matching Algorithm** — Scores donors by 5 factors (distance, gap, rating, experience, blood type)
3. **Blood Group Compatibility Matrix** — Full donor-recipient compatibility lookup
4. **MongoDB Geospatial Queries** — Native `$near` queries with 2dsphere index
5. **Role-based JWT Auth** — 4 roles with separate dashboards and API protection
6. **Auto Eligibility Check** — 56-day gap, age 18-65, weight ≥50kg, health status

---

*Developed as part of a healthcare innovation project.*
