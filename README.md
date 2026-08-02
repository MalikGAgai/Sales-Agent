# SalesAI - Enterprise SaaS Platform Architecture

SalesAI is a production-ready enterprise SaaS repository architecture engineered with **Clean Architecture** principles on the backend and modern component-driven patterns on the frontend.

---

## 🚀 Tech Stack

### Frontend
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Standalone Build)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [TailwindCSS](https://tailwindcss.com/)
- **Component System**: [shadcn/ui](https://ui.shadcn.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **HTTP Client**: Native `fetch` with typed API wrapper services

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.12)
- **Architecture**: Clean Architecture (API, Controllers, Services, Repositories, Models, Schemas)
- **ORM**: [SQLAlchemy 2.0](https://www.sqlalchemy.org/) (Async Engine with Alembic Migrations)
- **Cache & Message Broker**: [Redis 7](https://redis.io/)
- **Database**: [PostgreSQL 16](https://www.postgresql.org/)

### Infrastructure & Reverse Proxy
- **Reverse Proxy**: [NGINX 1.25](https://nginx.org/) with SSL/TLS readiness, rate limiting, and security headers
- **Containerization**: Multi-stage Docker containers for frontend, backend, NGINX, PostgreSQL, Redis
- **Orchestration**: Docker Compose with healthchecks and restart policies
- **CI/CD**: GitHub Actions workflow (`.github/workflows/ci.yml`)

---

## 📁 Repository Directory Structure

```text
SalesAI/
├── .env.example                # Template for environment configuration
├── docker-compose.yml          # Multi-container Docker Compose orchestration
├── README.md                   # Platform documentation (this file)
├── INSTALLATION.md             # Local setup & container guide
│
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions CI/CD automated pipeline
├── nginx/                      # NGINX reverse proxy configs & TLS cert mounts
│   ├── conf.d/default.conf
│   └── nginx.conf
├── docs/                       # Platform guides & API specifications
│   ├── API_DOCUMENTATION.md
│   ├── DATABASE.md
│   ├── DEPLOYMENT.md
│   └── FOLDER_STRUCTURE.md
├── backend/                    # FastAPI Clean Architecture application
└── frontend/                   # Next.js 15 App Router TypeScript application
```

---

## ⚡ Key Modules & Enterprise Features

1. **Multi-Tenant Authentication & Session Management**:
   - JWT access & refresh token rotation, bcrypt password hashing, active session tracking (IP & User-Agent), and remote session revocation.
2. **Organization & Team Access Control (RBAC)**:
   - Multi-tenant workspace isolation with roles (`Owner`, `Admin`, `Manager`, `Developer`, `Viewer`), email invitations, and ownership transfer.
3. **Client Website Projects Management**:
   - Provisioning, search, multi-attribute filtering (status, industry, country), pagination, soft deletion, and activity timeline logs.
4. **Developer API Keys Integration System**:
   - Prefix token generation (`sk_live_...`), SHA-256 storage hashing, single-view plain token reveal, rate limiting per minute, key rotation, and public key validation.
5. **Comprehensive Settings & Preferences**:
   - General regional localization (languages & timezones), Dark/Light mode appearance, email notification digests, profile management, and **2FA TOTP setup placeholder**.
6. **Immutable Audit Logging**:
   - Detailed security and action auditing capturing user actor, action event, resource type, IP address, user agent, UTC timestamp, and CSV/JSON export capability.
7. **SaaS Overview Dashboard**:
   - Live metrics summary cards, interactive API traffic throughput chart (`24h`, `7d`, `30d`, `90d`), real-time activity stream, recent login audit table, and notifications tray.

---

## 🚦 Quick Start

For detailed step-by-step setup options, refer to [INSTALLATION.md](file:///d:/Projects/Sales%20Agent/INSTALLATION.md).

### Using Docker Compose (Recommended)
```bash
# Clone environment configuration
cp .env.example .env

# Build and launch all 5 containers (NGINX, Frontend, Backend, PostgreSQL, Redis)
docker compose up --build -d

# Apply database migrations
docker compose exec backend alembic upgrade head
```

- **SaaS Application**: `http://localhost`
- **FastAPI OpenAPI Docs**: `http://localhost:8000/api/v1/docs`
- **Health Check Endpoint**: `http://localhost/healthz`

---

## 📜 Production Deployment

Refer to the [Production Deployment Guide](file:///d:/Projects/Sales%20Agent/docs/DEPLOYMENT.md) for instructions on deploying to cloud virtual private servers with Let's Encrypt SSL/TLS certificates and automated backups.

---

## 📜 License
Internal SaaS Architecture Platform &copy; SalesAI. All rights reserved.
