# SalesAI Enterprise SaaS Production Deployment Guide

This guide details step-by-step instructions for deploying SalesAI to a cloud virtual private server (e.g. AWS EC2, DigitalOcean Droplet, Hetzner, GCP Compute Engine) using Docker Compose, NGINX, and Let's Encrypt SSL/TLS certificates.

---

## 📋 Prerequisites

Before deploying to production, ensure your target server meets the following requirements:
* **Operating System**: Ubuntu 22.04 LTS or Debian 12
* **Hardware**: Minimum 2 vCPUs, 4 GB RAM, 20 GB SSD
* **Software Installed**:
  * [Docker Engine](https://docs.docker.com/engine/install/ubuntu/) (v24.0+)
  * [Docker Compose Plugin](https://docs.docker.com/compose/install/) (v2.20+)
  * `git`, `curl`
* **DNS Configuration**: Domain A Record pointing to your server's public IPv4 address (e.g., `app.yourdomain.com -> 203.0.113.10`).

---

## 🚀 1. Server Initialization & Security Hardening

Connect to your server via SSH and execute basic firewall hardening:

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Configure Uncomplicated Firewall (UFW)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 📥 2. Clone Repository & Environment Setup

Clone the SalesAI repository to `/opt/salesai`:

```bash
sudo mkdir -p /opt/salesai
sudo chown -R $USER:$USER /opt/salesai
git clone https://github.com/your-org/sales-agent.git /opt/salesai
cd /opt/salesai

# Create production environment file
cp .env.example .env
```

Edit `.env` to set strong production secrets:

```env
PROJECT_NAME=SalesAI
ENVIRONMENT=production
DEBUG=False

# Strong random secret key (Generate via: openssl rand -hex 32)
SECRET_KEY=e8394b9f29104821a...

# Production Database Credentials
POSTGRES_USER=salesai_prod
POSTGRES_PASSWORD=SuperStrongProductionPassword123!
POSTGRES_DB=salesai_production
DATABASE_URL=postgresql+asyncpg://salesai_prod:SuperStrongProductionPassword123!@db:5432/salesai_production

# Redis Settings
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_URL=redis://redis:6379/0

# Production CORS & Host
BACKEND_CORS_ORIGINS=["https://app.yourdomain.com"]
HOST=0.0.0.0
PORT=8000
```

---

## 🔐 3. NGINX SSL / HTTPS Setup with Certbot

To obtain free Let's Encrypt SSL certificates for your domain:

```bash
# Install Certbot
sudo apt install -y certbot

# Obtain certificate
sudo certbot certonly --standalone -d app.yourdomain.com

# Copy certificates into SalesAI NGINX certs directory
mkdir -p ./nginx/certs
sudo cp /etc/letsencrypt/live/app.yourdomain.com/fullchain.pem ./nginx/certs/
sudo cp /etc/letsencrypt/live/app.yourdomain.com/privkey.pem ./nginx/certs/
sudo chown -R $USER:$USER ./nginx/certs
```

Uncomment the HTTPS `server` block inside [`nginx/conf.d/default.conf`](file:///d:/Projects/Sales%20Agent/nginx/conf.d/default.conf) and replace `yourdomain.com` with your real domain.

---

## 🐳 4. Build & Launch Containers

Run Docker Compose in detached production mode:

```bash
# Build and start all 5 containers (NGINX, Frontend, Backend, Postgres, Redis)
docker compose up --build -d

# Verify container status & health
docker compose ps
```

All 5 containers should show `healthy` or `running`:
* `salesai-nginx` (Port 80/443)
* `salesai-frontend` (Port 3000)
* `salesai-backend` (Port 8000)
* `salesai-db` (Port 5432)
* `salesai-redis` (Port 6379)

---

## 🗄️ 5. Run Database Migrations

Apply Alembic migrations inside the running backend container:

```bash
docker compose exec backend alembic upgrade head
```

---

## 🔍 6. Health Checks & Verification

Verify endpoints:

```bash
# Test backend health check endpoint
curl -f http://localhost:8000/api/v1/health

# Test NGINX proxy endpoint
curl -f http://localhost/healthz
```

Expected JSON response:
```json
{
  "status": "healthy",
  "database": "healthy",
  "redis": "healthy",
  "environment": "production"
}
```

---

## 🔄 7. Automated Database Backups

Create a daily PostgreSQL backup cron job:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2:00 AM
0 2 * * * docker compose -f /opt/salesai/docker-compose.yml exec -T db pg_dump -U salesai_prod salesai_production | gzip > /opt/salesai/backups/salesai_backup_$(date +\%Y\%m\%d).sql.gz
```

---

## 📈 Summary

SalesAI is now deployed with:
* Multi-stage Docker containers with healthchecks.
* NGINX reverse proxy with TLS/SSL, rate limiting, and security headers.
* PostgreSQL 16 database with volume persistence.
* Redis cache & session broker.
* Automated CI/CD readiness.
