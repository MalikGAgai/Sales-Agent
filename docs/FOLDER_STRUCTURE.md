# SalesAI Repository Folder Structure

SalesAI is engineered following **Clean Architecture** principles on the backend and modern component-driven Next.js 15 App Router architecture on the frontend.

---

## 📁 Repository Directory Map

```text
SalesAI/
├── .env                        # Active environment configuration
├── .env.example                # Template for environment configuration
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions CI/CD Pipeline
├── docker-compose.yml          # Multi-container production orchestration
├── INSTALLATION.md             # Local setup & docker compose guide
├── README.md                   # Main platform documentation
│
├── docs/                       # Architectural & operational documentation
│   ├── API_DOCUMENTATION.md    # REST API specification overview
│   ├── DATABASE.md             # Database schema ERD & Alembic migration guide
│   ├── DEPLOYMENT.md           # Production deployment & NGINX SSL setup
│   └── FOLDER_STRUCTURE.md     # Code layout & module map (this file)
│
├── nginx/                      # NGINX Reverse Proxy configuration
│   ├── conf.d/
│   │   └── default.conf        # Production site reverse proxy & security headers
│   ├── nginx.conf              # Global NGINX worker & tuning configuration
│   └── certs/                  # Mount directory for TLS/SSL certificates
│
├── backend/                    # FastAPI (Python 3.12) Backend Application
│   ├── alembic/                # Database migration scripts & env configuration
│   ├── app/
│   │   ├── api/                # API routing & versioning
│   │   │   ├── v1/
│   │   │   │   ├── endpoints/  # Feature endpoint controllers
│   │   │   │   │   ├── api_keys.py
│   │   │   │   │   ├── audit_logs.py
│   │   │   │   │   ├── auth.py
│   │   │   │   │   ├── organizations.py
│   │   │   │   │   ├── projects.py
│   │   │   │   │   └── settings.py
│   │   │   │   ├── health.py
│   │   │   │   └── router.py
│   │   │   └── deps.py         # Dependency injection providers & Auth guards
│   │   ├── config/             # Centralized settings management (Pydantic BaseSettings)
│   │   ├── controllers/        # Request orchestration & DTO response mapping
│   │   ├── core/               # Exception definitions, security (JWT/bcrypt), logging
│   │   ├── database/           # Async SQLAlchemy session provider & Redis pool
│   │   ├── middlewares/        # Custom ASGI middlewares (Request ID, Rate Limiter)
│   │   ├── models/             # SQLAlchemy 2.0 ORM Base & Mixins
│   │   ├── repositories/       # Generic & domain data persistence repositories
│   │   ├── schemas/            # Pydantic DTO request/response validation
│   │   ├── services/           # Domain business logic layer
│   │   └── utils/              # Shared helper functions
│   ├── tests/                  # Pytest async test suite
│   │   ├── test_api_keys.py
│   │   ├── test_audit_logs.py
│   │   ├── test_auth.py
│   │   ├── test_organization.py
│   │   ├── test_projects.py
│   │   └── test_settings.py
│   ├── alembic.ini             # Alembic configuration
│   ├── Dockerfile              # Multi-stage production container image
│   ├── main.py                 # FastAPI Application Factory entrypoint
│   └── requirements.txt        # Backend dependencies
│
└── frontend/                   # Next.js 15 TypeScript Frontend Application
    ├── public/                 # Static assets
    ├── src/
    │   ├── app/                # Next.js App Router pages
    │   │   ├── audit-logs/     # Audit Logging viewer dashboard
    │   │   ├── settings/       # Settings, Projects, Organizations, API Keys pages
    │   │   ├── layout.tsx      # Root layout
    │   │   └── page.tsx        # SaaS Overview Dashboard
    │   ├── components/         # UI component architecture
    │   │   ├── common/         # Navbar, Sidebar, NotificationsTray, ProfileMenu
    │   │   ├── dashboard/      # MetricCards, TrafficChart, ActivityFeed, LoginsTable
    │   │   ├── layouts/        # MainLayout container
    │   │   └── ui/             # shadcn/ui primitives (badge, button, card)
    │   ├── hooks/              # Custom React hooks (e.g. useHealth)
    │   ├── lib/                # Utility wrappers (cn, api-client)
    │   ├── services/           # API client services (apiKey, auditLog, project, settings)
    │   ├── store/              # Zustand global state store
    │   └── types/              # TypeScript DTO interfaces
    ├── Dockerfile              # Next.js standalone container image
    ├── package.json            # Node.js dependencies
    └── tailwind.config.ts      # TailwindCSS styling config
```

---

## 🏛️ Clean Architecture Principles

1. **Decoupled API Router Layer (`api/`)**: Declares FastAPI path routes and query parameter validation without containing core logic.
2. **Business Domain Service Layer (`services/`)**: Contains pure business rules independent of HTTP framework concerns.
3. **Data Persistence Repository Layer (`repositories/`)**: Encapsulates database queries using SQLAlchemy 2.0 Async Session abstractions.
4. **Data Transfer Objects (`schemas/`)**: Pydantic models enforcing strict request input and response output contracts.
