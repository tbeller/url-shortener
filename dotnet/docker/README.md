# URL Shortener - Docker Development Environment

## Quick Start

### Option 1: SQLite (Default - Simplest)
```bash
# From the dotnet/ directory
cd docker
docker compose -f docker-compose.dev.yml up --build
```

### Option 2: PostgreSQL Database
```bash
# From the dotnet/ directory  
cd docker
docker compose -f docker-compose.dev.yml -f docker-compose.postgres.yml up --build
```

### Option 3: With Redis Cache
```bash
# From the dotnet/ directory
cd docker
docker compose -f docker-compose.dev.yml --profile redis up --build
```

## Access the Application

- **Web Frontend**: http://localhost:5000
- **API Service**: http://localhost:5080
- **API Documentation**: http://localhost:5080/swagger
- **Health Check**: http://localhost:5080/health

## Services Overview

### urlshortener-api (Port 5080)
- ASP.NET Core Web API
- Swagger documentation enabled
- Health checks configured
- SQLite database by default (persisted in `./data/`)

### urlshortener-web (Port 5000)  
- ASP.NET Core Razor Pages frontend
- Configured to call API service
- Responsive UI with modern design

### postgres (Port 5432) - Optional
- PostgreSQL 15 database
- Pre-configured with sample data
- Credentials: `urlshortener/dev_password_123`

### redis (Port 6379) - Optional
- Redis cache for future features
- Available with `--profile redis`

## Development Commands

### Build and Start
```bash
# Build and start all services
docker compose -f docker-compose.dev.yml up --build

# Start in background
docker compose -f docker-compose.dev.yml up -d --build

# Start specific services only
docker compose -f docker-compose.dev.yml up urlshortener-api
```

### Logs and Debugging
```bash
# View logs
docker compose -f docker-compose.dev.yml logs -f

# View specific service logs
docker compose -f docker-compose.dev.yml logs -f urlshortener-api

# Execute commands in running containers
docker compose -f docker-compose.dev.yml exec urlshortener-api bash
```

### Database Management
```bash
# SQLite (default)
# Database file: ./data/urls.db
sqlite3 ./data/urls.db "SELECT * FROM Urls;"

# PostgreSQL (when using postgres profile)
docker compose -f docker-compose.dev.yml -f docker-compose.postgres.yml exec postgres psql -U urlshortener -d urlshortener -c "SELECT * FROM urls;"
```

### Stop and Cleanup
```bash
# Stop services
docker compose -f docker-compose.dev.yml down

# Stop and remove volumes (clears data)
docker compose -f docker-compose.dev.yml down -v

# Remove built images
docker compose -f docker-compose.dev.yml down --rmi all
```

## Configuration

### Environment Variables
Services can be configured via environment variables in the compose file:

**API Service:**
- `DB_TYPE`: Database type (sqlite, postgresql, sqlserver, cosmosdb, azuretables)
- `ConnectionStrings__DefaultConnection`: Database connection string
- `CORS_ORIGIN`: Allowed CORS origins
- `ASPNETCORE_ENVIRONMENT`: Environment (Development, Production)

**Web Frontend:**
- `ApiSettings__BaseUrl`: API service base URL
- `ASPNETCORE_ENVIRONMENT`: Environment setting

### Volume Mounts
- `./data`: SQLite database persistence
- Source code volumes for hot reload (development)

## Development Features

### Hot Reload
Source code is mounted as read-only volumes for development. Restart containers to see changes:
```bash
docker compose -f docker-compose.dev.yml restart urlshortener-api
```

### Health Checks
All services include health checks:
```bash
# Check service health
docker compose -f docker-compose.dev.yml ps

# Manual health check
curl http://localhost:5080/health
curl http://localhost:5000
```

### Networking
- Services communicate via internal network `urlshortener-dev-network`
- API accessible internally as `http://urlshortener-api:5080`
- PostgreSQL accessible as `postgres:5432`

## Testing the Setup

### API Tests
```bash
# Health check
curl http://localhost:5080/health

# Create short URL
curl -X POST http://localhost:5080/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# List all URLs
curl http://localhost:5080/api/urls

# Test redirect
curl -L http://localhost:5080/api/demo123
```

### Web Frontend Tests
```bash
# Access web interface
curl -I http://localhost:5000

# Test static assets
curl -I http://localhost:5000/css/styles.css
```

## Troubleshooting

### Common Issues

**Port conflicts:**
```bash
# Check what's using the ports
lsof -i :5000
lsof -i :5080

# Use different ports
docker compose -f docker-compose.dev.yml up --build \
  -p "HOST_API_PORT:5080" \
  -p "HOST_WEB_PORT:5000"
```

**Database connection issues:**
```bash
# Check database logs
docker compose -f docker-compose.dev.yml logs postgres

# Reset database
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up --build
```

**Build issues:**
```bash
# Force rebuild without cache
docker compose -f docker-compose.dev.yml build --no-cache

# Remove all containers and images
docker system prune -a
```
