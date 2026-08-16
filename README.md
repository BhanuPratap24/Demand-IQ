# 🎯 DemandIQ - AI-Powered Demand Forecasting Platform

![Status](https://img.shields.io/badge/status-active-success) ![License](https://img.shields.io/badge/license-MIT-blue) ![Node](https://img.shields.io/badge/node-18+-green) ![Python](https://img.shields.io/badge/python-3.8+-blue)

## 📖 Overview

**DemandIQ** is an intelligent demand forecasting platform that helps businesses optimize inventory management using AI/ML models. It predicts product demand, generates smart recommendations, and provides real-time alerts.

### ✨ Key Features

- 🔮 **AI-Powered Predictions** - Forecast demand for next 7-30 days
- 📦 **Inventory Optimization** - Automated stock level recommendations
- ⚠️ **Smart Alerts** - Get notified for low stock or unusual patterns
- 📊 **Analytics Dashboard** - Track trends and metrics
- 🔐 **Secure Authentication** - JWT-based user management
- 📱 **Responsive Design** - Works on desktop and mobile

---

## 🏗️ Project Structure

```
Demand/
├── backend/                 # Node.js + Express API
│   ├── controllers/        # Business logic
│   ├── models/             # Database models
│   ├── routes/             # API endpoints
│   ├── services/           # External service calls
│   ├── middleware/         # Auth & error handling
│   ├── config/             # Database configuration
│   ├── app.js              # Main application
│   ├── package.json        # Dependencies
│   └── .env                # Environment variables
│
├── frontend-new/           # React + Vite Frontend
│   ├── src/
│   │   ├── pages/         # Login, Dashboard, Signup
│   │   ├── services/      # API client (api.js)
│   │   ├── App.jsx        # Main component
│   │   └── main.jsx       # Entry point
│   ├── package.json       # Dependencies
│   └── vite.config.js     # Vite configuration
│
├── ml-service/            # Python + Flask ML
│   ├── main.py            # Flask application
│   ├── predict.py         # Prediction logic
│   ├── preprocessing.py   # Data preprocessing
│   ├── recommendation.py  # Recommendation engine
│   ├── train.py           # Model training
│   ├── requirements.txt   # Python dependencies
│   ├── data/              # Training data
│   ├── models/            # Trained ML models
│   └── .env               # Environment variables
│
├── database-setup.sql     # Database schema
├── SETUP_GUIDE.md         # Complete setup guide
└── README.md              # This file

```

---

## 🚀 Quick Start

### **Prerequisites**
- Node.js v18 or higher
- Python 3.8 or higher
- MySQL 8.0 or higher
- npm or yarn

### **1️⃣ Setup Database**

```bash
# Import database schema
mysql -u root -p < database-setup.sql

# Or use MySQL Workbench/PhpMyAdmin to run database-setup.sql
```

### **2️⃣ Start Backend (Node.js)**

```bash
cd backend
npm install
npm start

# ✅ Backend runs on http://localhost:5000
```

### **3️⃣ Start ML Service (Python)**

```bash
cd ml-service

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start service
python main.py

# ✅ ML Service runs on http://127.0.0.1:5000
```

### **4️⃣ Start Frontend (React)**

```bash
cd frontend-new
npm install
npm run dev

# ✅ Frontend runs on http://localhost:5173
```

---

## 🔄 How It Works

### **User Journey**

1. **Sign Up** → Create account with email & password
2. **Add Products** → Define products and categories
3. **Add Inventory** → Input current stock levels
4. **View Dashboard** → See all your data at a glance
5. **Get Predictions** → AI forecasts next 7 days demand
6. **Take Action** → Follow smart recommendations
7. **Monitor Alerts** → Get notified of critical issues

### **Architecture**

```
React Frontend (5173)
    ↓ (API calls)
Node.js Backend (5000)
    ├─ REST API
    ├─ JWT Authentication
    └─ Database Queries
    ↓
MySQL Database (3306)
    └─ Stores all data
    
    ├─ Calls ML Service
    ↓
Python Flask (5000)
    ├─ ML Models
    ├─ Predictions
    └─ Recommendations
```

---

## 📡 API Endpoints

### Authentication
```
POST   /api/auth/signup        - Register new user
POST   /api/auth/login         - Login user
GET    /api/auth/profile       - Get user profile
PUT    /api/auth/profile       - Update profile
```

### Products
```
GET    /api/products           - Get all products
POST   /api/products           - Create product
PUT    /api/products/:id       - Update product
DELETE /api/products/:id       - Delete product
```

### Inventory
```
GET    /api/inventory          - Get inventory
POST   /api/inventory          - Add inventory
PUT    /api/inventory/:id      - Update stock
```

### Predictions & Recommendations
```
GET    /api/recommendations    - Get predictions
POST   /api/recommendations/predict - Generate prediction
```

### Analytics
```
GET    /api/analytics/summary  - Sales summary
GET    /api/analytics/trends   - Trend data
GET    /api/analytics/metrics  - Key metrics
```

### Alerts
```
GET    /api/alerts             - Get all alerts
PUT    /api/alerts/:id/acknowledge - Mark alert read
```

---

## 📚 Frontend

```bash
cd ml-service
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

## Environment

Create a `.env` file in the project root and update the required values before running the app.
