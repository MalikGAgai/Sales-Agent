# SalesAI Installation & Developer Guide

This guide covers local environment installation, Docker Compose setup, database migrations, and testing workflows for **SalesAI**.

---

## 💻 System Prerequisites

* **Docker & Docker Compose**: Docker v24.0+ & Docker Compose v2.20+
* **Python**: Python 3.12 (for local backend development)
* **Node.js**: Node.js 20+ (for local frontend development)
* **PostgreSQL**: PostgreSQL 16 (if running database locally outside Docker)
* **Redis**: Redis 7 (if running cache locally outside Docker)

---

## 🐳 Option 1: Quick Start with Docker Compose (Recommended)

Docker Compose orchestrates all 5 system services (`nginx`, `frontend`, `backend`, `db`, `redis`).

### 1. Clone Environment Configuration
```bash
cp .env.example .env
```

### 2. Launch Services
```bash
docker compose up --build -d
```

### 3. Apply Database Migrations
```bash
docker compose exec backend alembic upgrade head
```

### 4. Verify Active Containers
```bash
docker compose ps
```

Access services:
* **Web Dashboard**: `http://localhost`
* **Backend API Docs**: `http://localhost:8000/api/v1/docs`
* **Health Check**: `http://localhost/healthz`

---

## 🛠️ Option 2: Local Developer Setup (Without Docker)

### 1. Database & Cache Services
Ensure local PostgreSQL and Redis servers are running:
* PostgreSQL listening on `localhost:5432` with database `salesai_db`.
* Redis listening on `localhost:6379`.

### 2. Backend Setup (FastAPI)
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start FastAPI dev server
python main.py
```
Backend will be available at `http://localhost:8000`.

### 3. Frontend Setup (Next.js 15)
```bash
cd frontend

# Install Node dependencies
npm install

# Start Next.js development server
npm run dev
```
Frontend will be available at `http://localhost:3000`.

---

## 🧪 Running Unit Test Suite

Execute Pytest inside the backend directory or container:

```bash
# Inside Docker
docker compose exec backend pytest -v

# Local Virtualenv
cd backend
pytest -v
```

---

## 📚 Additional Documentation
* [Production Deployment & SSL Guide](file:///d:/Projects/Sales%20Agent/docs/DEPLOYMENT.md)
* [Folder Structure & Architecture Layout](file:///d:/Projects/Sales%20Agent/docs/FOLDER_STRUCTURE.md)
* [API Specification & Endpoints](file:///d:/Projects/Sales%20Agent/docs/API_DOCUMENTATION.md)
* [Database Schema ERD](file:///d:/Projects/Sales%20Agent/docs/DATABASE.md)
