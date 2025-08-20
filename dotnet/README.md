# URL Shortener - ASP.NET Core Implementation

## Overview

This is a complete ASP.NET Core 8.0 implementation of the URL shortener application, separated into two independently deployable services:

- **API Service**: RESTful web API providing URL shortening functionality
- **Web Frontend**: Razor Pages application with a modern UI consuming the API

## Architecture

```
UrlShortener.Core/          # Shared business logic and database abstractions
├── Models/                 # Data models and DTOs
├── Interfaces/             # Service and database interfaces  
├── Services/               # Business logic (URL validation, short code generation)
├── Factories/              # Database factory for multiple providers
└── Database/               # Database implementations (SQLite, SQL Server, PostgreSQL, Cosmos DB, Azure Tables)

UrlShortener.Api/           # API Service (Port 5080)
├── Program.cs              # Minimal API endpoints and configuration
└── appsettings.json        # API configuration

UrlShortener.Web/           # Web Frontend (Port 5000)
├── Pages/                  # Razor Pages
├── wwwroot/                # Static assets (CSS, JS, images)
└── appsettings.json        # Web app configuration
```

## Prerequisites

- [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- Any modern web browser

## Quick Start

### 1. Build the Solution
```bash
cd /path/to/url-shortener/dotnet
dotnet build
```

### 2. Start the API Service
```bash
# Terminal 1 - API Service (Port 5080)
dotnet run --project UrlShortener.Api --urls="http://localhost:5080"
```

### 3. Start the Web Frontend  
```bash
# Terminal 2 - Web Frontend (Port 5000)
dotnet run --project UrlShortener.Web --urls="http://localhost:5000"
```

### 4. Access the Application
- **Web Interface**: http://localhost:5000
- **API Documentation**: http://localhost:5080/swagger
- **Health Check**: http://localhost:5080/health

## API Endpoints

### Core Operations
- `POST /api/shorten` - Create short URL
- `GET /api/expand/{shortCode}` - Get original URL
- `GET /api/urls` - List all URLs
- `GET /api/{shortCode}` - Redirect to original URL

### Health & Monitoring
- `GET /health` - Health check endpoint

### Example API Usage
```bash
# Create a short URL
curl -X POST http://localhost:5080/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Expand a short URL
curl http://localhost:5080/api/expand/abc123

# List all URLs
curl http://localhost:5080/api/urls

# Redirect (browser)
curl -L http://localhost:5080/api/abc123
```

## Configuration

### Database Configuration
The application supports multiple database providers. Configure via `appsettings.json`:

```json
{
  "DB_TYPE": "sqlite",
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=urls.db"
  }
}
```

**Supported Database Types:**
- `sqlite` (default) - Local SQLite database
- `sqlserver` - SQL Server
- `postgresql` - PostgreSQL  
- `cosmosdb` - Azure Cosmos DB
- `azuretables` - Azure Storage Tables

### CORS Configuration
API service supports configurable CORS:

```json
{
  "CORS_ORIGIN": "http://localhost:5000"
}
```

## Independent Deployment

### API Service Only
```bash
# Build and publish API
dotnet publish UrlShortener.Api -c Release -o ./publish/api

# Run published API
dotnet ./publish/api/UrlShortener.Api.dll --urls="http://0.0.0.0:5080"
```

### Web Frontend Only
```bash
# Build and publish Web
dotnet publish UrlShortener.Web -c Release -o ./publish/web

# Run published Web (configure API base URL)
dotnet ./publish/web/UrlShortener.Web.dll --urls="http://0.0.0.0:5000"
```

### Docker Deployment
Both services can be containerized independently:

```dockerfile
# API Service
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY ./publish/api .
EXPOSE 5080
ENTRYPOINT ["dotnet", "UrlShortener.Api.dll"]
```

## Development Workflow

### Running in Development
```bash
# Watch mode for API (auto-reload on changes)
dotnet watch run --project UrlShortener.Api --urls="http://localhost:5080"

# Watch mode for Web frontend
dotnet watch run --project UrlShortener.Web --urls="http://localhost:5000"
```

### Testing the Services
```bash
# Test API health
curl http://localhost:5080/health

# Test frontend connectivity
curl -I http://localhost:5000
```

### Database Management
```bash
# SQLite database is created automatically at: ./UrlShortener.Api/urls.db
# View data with any SQLite browser or:
sqlite3 ./UrlShortener.Api/urls.db "SELECT * FROM Urls;"
```

## Project Structure Details

### UrlShortener.Core
- **Purpose**: Shared business logic and database abstractions
- **Key Features**: Database-agnostic design, dependency injection ready
- **Dependencies**: Entity Framework Core, database drivers

### UrlShortener.Api  
- **Purpose**: RESTful API service using Minimal APIs
- **Key Features**: Swagger documentation, CORS support, health checks
- **Port**: 5080 (configurable)
- **Dependencies**: UrlShortener.Core

### UrlShortener.Web
- **Purpose**: Web frontend using Razor Pages
- **Key Features**: Responsive UI, API integration, static asset serving
- **Port**: 5000 (configurable) 
- **Dependencies**: None (calls API via HTTP)

## Production Considerations

### Security
- Configure specific CORS origins (not "*")
- Use HTTPS in production
- Secure database connections
- Environment-specific configuration files

### Performance  
- Enable response compression
- Configure caching headers
- Use production database (not SQLite)
- Consider load balancing for multiple instances

### Monitoring
- Health check endpoint available at `/health`
- Structured logging configured
- Application Insights ready (add configuration)

## Troubleshooting

### Common Issues
1. **Port conflicts**: Change ports using `--urls` parameter
2. **CORS errors**: Configure `CORS_ORIGIN` in API settings
3. **Database errors**: Check connection strings and permissions
4. **Build errors**: Ensure .NET 8.0 SDK is installed

### Logs Location
- Console output in development
- Configure file logging for production
- Database operations logged at Information level

## Next Steps

1. **Azure Deployment**: Both services ready for Azure App Service deployment
2. **Container Deployment**: Add Dockerfiles for container orchestration
3. **CI/CD Pipeline**: GitHub Actions workflow for automated deployment
4. **Monitoring**: Application Insights integration
5. **Authentication**: Add user authentication and authorization

---

*This implementation provides a production-ready, scalable URL shortener with clean separation of concerns and independent deployment capability.*
