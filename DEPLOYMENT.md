# Production Deployment Guide: OrderVoice AI

This guide covers deploying the **OrderVoice AI** full-stack SaaS orchestrator to a cloud environment (AWS, GCP, DigitalOcean, or Azure) using Docker Compose and Nginx.

## 1. System Requirements
- **Operating System**: Ubuntu 22.04 LTS or any Linux distributions supporting Docker.
- **Minimum hardware specs**: 2 vCPUs, 4GB RAM, 20GB SSD.
- **Required Packages**: Docker v24.0+, Docker Compose v2.20+.

## 2. Environment Configurations (`.env`)
Create a production `.env` folder on your server:

```env
# Server details
PORT=3000
NODE_ENV=production

# API Credentials (from AI Studio Secrets panel)
GEMINI_API_KEY=your_actual_live_gemini_key_here

# Postgres DB Secrets
POSTGRES_USER=ordervoice_user
POSTGRES_PASSWORD=your_highly_secure_db_password
POSTGRES_DB=ordervoice_db

# Twilio Credentials for Automated voice calls
TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_AUTH_TOKEN=your_twilio_auth_token_string
TWILIO_FROM_NUMBER=+1234567890
```

## 3. Deployment Steps

### Step A: Clone Repository
```bash
git clone https://github.com/your-org/ordervoice-ai.git /var/www/ordervoice
cd /var/www/ordervoice
```

### Step B: Configure Nginx Certificates
Place your SSL certificates inside `./certs` directory:
```bash
mkdir certs
cp /etc/letsencrypt/live/ordervoice.ai/fullchain.pem ./certs/ordervoice_live.crt
cp /etc/letsencrypt/live/ordervoice.ai/privkey.pem ./certs/ordervoice_live.key
```

### Step C: Build & Launch Services
Run Docker Compose in detached mode:
```bash
docker compose up -d --build
```
This boots 5 services in individual networked containers:
- `ordervoice-nginx` (routing requests, terminating TLS, rate limiting)
- `ordervoice-app` (Express server serving the NextJS builds & REST APIs)
- `ordervoice-postgres` (Relational persistent database storing users & calls)
- `ordervoice-redis` (Distributed cache and task broker)
- `ordervoice-celery` (Background asynchronous worker)

### Step D: Database Migrations
To initialize schemas or run seeders:
```bash
docker compose exec app npm run build
```

## 4. Operational Monitoring
- **Check Container Logs**:
  ```bash
  docker compose logs -f app
  ```
- **Database Backup Scheduler**:
  ```bash
  crontab -e
  # Add simple cron to dump postgres daily at 02:00 AM
  0 2 * * * docker exec ordervoice-postgres pg_dump -U ordervoice_user ordervoice_db > /backup/dev_db_$(date +\%F).sql
  ```
