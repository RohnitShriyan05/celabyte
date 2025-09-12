# Deployment Guide

## Prerequisites

1. **Docker & Docker Compose**: Make sure you have Docker and Docker Compose installed
2. **Environment Variables**: Copy `.env.prod.example` to `.env.prod` and fill in your values
3. **API Keys**: Ensure you have your OpenAI API key ready

## Quick Start

1. **Setup Environment**:

   ```bash
   cp .env.prod.example .env.prod
   # Edit .env.prod with your actual values
   ```

2. **Deploy**:
   ```bash
   ./deploy.sh
   ```

## Manual Deployment

If you prefer to run commands manually:

1. **Build Images**:

   ```bash
   docker-compose -f docker-compose.prod.yml build
   ```

2. **Start Database**:

   ```bash
   docker-compose -f docker-compose.prod.yml up -d db
   ```

3. **Run Migrations**:

   ```bash
   cd server
   npx prisma migrate deploy
   cd ..
   ```

4. **Start All Services**:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

## Service URLs

- **Dashboard**: http://localhost (port 80)
- **API Server**: http://localhost:9090
- **Database**: localhost:5432

## Environment Variables

### Required Variables in `.env.prod`:

- `POSTGRES_PASSWORD`: Secure password for PostgreSQL
- `JWT_HS256_SECRET`: Secret key for JWT signing
- `OPENAI_API_KEY`: Your OpenAI API key
- `JWT_ISSUER`: Your domain (e.g., https://yourdomain.com)
- `JWT_AUDIENCE`: Your API domain (e.g., https://api.yourdomain.com)
- `CORS_ORIGIN`: Allowed CORS origins (your frontend domain)

### Optional Variables:

- `SECRETS_BACKEND`: Backend for secrets management (default: env)
- `TENANT_CONN_DEK_BASE64`: Base64 encoded encryption key (for development)

## Monitoring & Maintenance

### Check Logs:

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f server
docker-compose -f docker-compose.prod.yml logs -f dashboard
docker-compose -f docker-compose.prod.yml logs -f db
```

### Restart Services:

```bash
# Restart all
docker-compose -f docker-compose.prod.yml restart

# Restart specific service
docker-compose -f docker-compose.prod.yml restart server
```

### Stop Services:

```bash
docker-compose -f docker-compose.prod.yml down
```

### Update Application:

```bash
# Pull latest changes
git pull origin main

# Rebuild and redeploy
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

## Cloud Deployment

### For Production Cloud Deployment:

1. **Use a cloud provider** (AWS, GCP, Azure, DigitalOcean)
2. **Use managed database** instead of Docker PostgreSQL
3. **Set up SSL/TLS** with a reverse proxy (nginx, Cloudflare)
4. **Use environment-specific secrets** management
5. **Set up CI/CD pipeline** for automated deployments

### Example Cloud Deployment Services:

- **Heroku**: Easy deployment with buildpacks
- **Railway**: Simple container deployment
- **DigitalOcean App Platform**: Managed container platform
- **AWS ECS/Fargate**: Scalable container orchestration
- **Google Cloud Run**: Serverless containers

## Troubleshooting

### Common Issues:

1. **Port conflicts**: Change ports in docker-compose.prod.yml if 80 or 9090 are taken
2. **Database connection issues**: Ensure PostgreSQL is running and accessible
3. **Environment variables**: Double-check .env.prod file exists and has correct values
4. **Build failures**: Check Docker logs for specific error messages

### Health Checks:

```bash
# Check if services are running
docker-compose -f docker-compose.prod.yml ps

# Check service health
curl http://localhost:9090/health  # API health check
curl http://localhost              # Dashboard health check
```
