# AgriSense 🌾 — Agricultural Intelligence & Farmer Decision Platform

AgriSense is a production-grade Agricultural Intelligence and Decision Platform designed for Indian farmers. It combines real-time APMC Mandi market rates, an ensemble Crop Yield Machine Learning model, an AI-powered Smart Crop Doctor, hyperlocal climate risk warnings, automated subsidy matching, and high-resolution satellite GIS land monitoring.

---

## 🚀 Quick Start (Local Development)

### 1. Backend (FastAPI + ML)
```bash
cd backend
# Create and activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux / macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI dev server
uvicorn main:app --reload --port 8000
```
FastAPI Swagger documentation available at: `http://localhost:8000/docs`

### 2. Frontend (Next.js 16)
```bash
cd agrisense
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 🐳 Production Deployment with Docker Compose (Recommended)

AgriSense is fully containerized with **Docker** and **Docker Compose**, orchestrating:
1. **Redis 7 Alpine**: High-performance caching container.
2. **FastAPI Backend**: Python 3.11 with scikit-learn ensemble models and SQLite/PostgreSQL persistence.
3. **Next.js Frontend**: Production build with static optimization and PWA service worker.

### Launch in 1 Command:
```bash
docker-compose up --build -d
```
- **Frontend App**: `http://localhost:3000`
- **Backend API**: `http://localhost:8000`
- **Redis Cache**: `localhost:6379`

To stop:
```bash
docker-compose down
```

---

## ☁️ Cloud Deployment Guide

### Option A: Free / Managed Cloud (Vercel + Render / Railway)

#### 1. Backend on Render or Railway
- Create a new **Web Service** pointing to the `backend/` directory.
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn main:app --host 0.0.0.0 --port 8000`
- Environment Variables:
  - `ENVIRONMENT=production`
  - `REDIS_URL` (optional: add a free Upstash Redis instance or let it use the built-in in-memory cache)
- Copy your deployed backend URL (e.g. `https://agrisense-api.onrender.com`).

#### 2. Frontend on Vercel
- Import the GitHub repository and set the **Root Directory** to `agrisense`.
- Framework Preset: **Next.js**.
- Add Environment Variables:
  - `NEXT_PUBLIC_API_URL=https://agrisense-api.onrender.com`
  - `NEXT_PUBLIC_BACKEND_URL=https://agrisense-api.onrender.com`
  - `NEXTAUTH_SECRET=your_secret_random_key`
  - `NEXTAUTH_URL=https://your-app.vercel.app`
- Click **Deploy**.

---

### Option B: VPS / Cloud Server (AWS EC2, DigitalOcean, Hetzner)

1. Clone the repository on your server:
   ```bash
   git clone https://github.com/your-username/AgriSense.git
   cd AgriSense
   ```
2. Copy and customize the environment file:
   ```bash
   cp .env.example .env
   ```
3. Run with Docker Compose:
   ```bash
   docker compose up --build -d
   ```
4. Optional: Set up Nginx reverse proxy with Certbot SSL for `https://yourdomain.com`.

---

## 🏗️ Architecture & Features

| Layer | Technology | Key Capabilities |
|---|---|---|
| **Frontend** | Next.js 16 (App Router), TypeScript, Vanilla Tailwind CSS | Voice-First AI Advisor, PWA offline caching, Multi-layer Satellite GIS |
| **Backend** | FastAPI, Python 3.11, Uvicorn | APMC Mandi sync, Crop Doctor diagnostics, Subsidies matching engine |
| **Machine Learning** | scikit-learn, Pandas, NumPy | Ensemble Yield Model ($R^2 = 0.9996$), 14-Day Mandi Price Forecaster |
| **Caching** | Dual-Mode (Redis 7 + In-Memory TTL) | Sub-10ms response caching for market rates and forecasts |
| **Data & Storage** | SQLite / SQLAlchemy | Relational DB for Farmer profiles, plots, and tracked subsidies |
| **Localization** | Custom Multilingual Context | English, Hindi (हिन्दी), Marathi (मराठी), and Tamil (தமிழ்) |

---

## 📄 License & Team Contributions
Developed as a comprehensive agricultural intelligence platform to empower farmers across India.
