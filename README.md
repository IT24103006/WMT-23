# 🛒 Click Buy - Grocery Shop Manager

**Click Buy** is a modern full-stack **mobile application** designed to streamline inventory management, sales tracking, and customer credit handling for small to medium-sized grocery stores.

It provides a powerful POS-like experience, real-time insights, and a clean, premium user interface built using **React Native (Bare CLI) with TypeScript**.

---

## 🚀 Key Features

* 🔐 Multi-tenant architecture with secure `ownerId` isolation
* 📦 Real-time inventory management with stock alerts
* 🧾 Supplier & purchase tracking with debt management
* 💳 Customer credit management system
* 📄 Invoice history with PDF generation
* 💾 Server-side database backup system
* 📡 UDP-based automatic backend discovery (local network)
* 🧹 Full data wipeout system (admin-controlled)
* 🧑‍💼 Admin dashboard for system monitoring
* 🐞 Built-in error diagnostics system
* 🎨 Modern and responsive mobile UI

---

## 🛠 Tech Stack

### 📱 Frontend (Mobile Application)

| Category         | Technology                                                     |
| ---------------- | -------------------------------------------------------------- |
| Framework        | React Native (Bare CLI)                                        |
| Language         | TypeScript                                                     |
| State Management | Context API + useReducer                                       |
| Navigation       | React Navigation v6 (Stack + Bottom Tabs)                      |
| HTTP Client      | Axios                                                          |
| Image Upload     | react-native-image-picker + Cloudinary                         |
| UI Components    | Custom components (GlassCard, AppButton, InputField, StatCard) |
| OTP Input        | react-native-otp-entry                                         |

---

### ⚙️ Backend

| Category     | Technology               |
| ------------ | ------------------------ |
| Runtime      | Node.js                  |
| Framework    | Express.js               |
| Database     | MongoDB Atlas (Mongoose) |
| Hosting      | Replit                   |
| Architecture | Clean Architecture       |

---

## 🏗 System Architecture

The system follows **Clean Architecture principles** to ensure scalability and maintainability.

### 🔹 Backend Layers

* **Domain Layer** – Entities and business rules
* **Use Case Layer** – Application logic
* **Infrastructure Layer** – Database & external services
* **Interface Layer** – Controllers and API routes

---

### 🔹 Frontend Structure (React Native)

* **Core Layer** – API client, configuration, utilities
* **Features Layer** (Modular):

  * Authentication (Login, Register, OTP, Reset Password)
  * Products
  * Sales
  * Credit
  * Suppliers
  * Notifications
  * Reports
  * Admin Panel
* **Shared Layer** – Reusable UI components

---

### 🔄 Data Flow

```
UI → State (Context API) → API Client → Backend → MongoDB
MongoDB → Backend → API Response → State Update → UI Re-render
```

---

## 📂 Project Structure

```
small_store_app/
│
├── frontend/                 # React Native (Bare CLI)
│   ├── src/
│   │   ├── core/             # API, configs, utilities
│   │   ├── features/         # Feature-based modules
│   │   └── shared/           # Reusable components
│
├── backend/                  # Node.js + Express API
│   ├── src/
│   │   ├── config/
│   │   ├── domain/
│   │   ├── usecases/
│   │   ├── infrastructure/
│   │   ├── interfaces/
│   │   └── middlewares/
│
└── README.md
```

---

## 🔗 API Endpoints (Core)

| Method | Endpoint           | Description      |
| ------ | ------------------ | ---------------- |
| POST   | /api/auth/login    | User login       |
| POST   | /api/auth/register | Register user    |
| GET    | /api/products      | Get all products |
| POST   | /api/products      | Add product      |
| PUT    | /api/products/:id  | Update product   |
| DELETE | /api/products/:id  | Delete product   |

> Note: Additional endpoints exist for Sales, Credit, Suppliers, Purchases, Reports, and Admin operations.

---

## ⚙️ Getting Started

### ✅ Prerequisites

* Node.js (v18+)
* Android Studio
* MongoDB Atlas account
* React Native CLI

---

### 🔑 Environment Setup

Create `.env` file inside `backend/`:

```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PORT=5000
```

---

## ▶️ Running the Project

### 🔧 Backend

```
cd backend
npm install
npm start
```

---

### 📱 Frontend (React Native)

```
cd frontend
npm install
npx react-native run-android
```

---

## 🌍 Production API

```
https://your-production-api-url/api
```

---

## 📡 Special Features

### 🔍 UDP Auto Discovery

Automatically detects backend server IP within the same local network.

### 🧠 Smart Error Handling

Displays backend error responses (e.g., 404, 500) clearly in the mobile UI.

### 💾 Database Backup

Allows admin users to export full database backups.

---

## 🔥 Core Modules

* 🛍 Product & Inventory Management
* 💳 Customer Credit System
* 🧾 Sales & Invoice Management
* 🚚 Supplier Management
* 🔔 Notifications & Reporting
* 🔐 Authentication & Admin Panel

---

## 📊 System Capabilities

* ⚡ API Response Time: ~40ms – 85ms (local testing)
* 📄 PDF Generation: < 400ms
* 🧪 Core functionality tested (manual & API testing)

---

## 📖 Documentation

* System Architecture Diagram
* Data Flow Diagram (DFD)
* ER Diagram
* Use Case Diagram

---

## 👥 Team Members

| Name                          | Student ID |
| ----------------------------- | ---------- |
| D. M. R. H. Dissanayake       | IT24103006 |
| H. M. D. H. Herath            | IT24102741 |
| L. G. W. P. Gamage            | IT24102438 |
| H. M. P. S. R. K. Herath      | IT24102503 |
| R. P. H. L. Rajapaksha        | IT24102254 |
| B. P. P. G. D. S. Gunawardana | IT24102905 |

---

## 🎯 Project Aim

To develop a scalable and user-friendly mobile POS system that supports:

* Real-time inventory tracking
* Credit management
* Sales processing
* Business insights

---

## 📄 License

This project is developed for academic purposes only.

---

## 👨‍💻 Developed By

**WMT-23 – SLIIT Kandy Campus**
