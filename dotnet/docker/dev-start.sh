#!/bin/bash

# URL Shortener - Development Environment Startup Script

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🚀 URL Shortener Development Environment"
echo "======================================="

# Function to display usage
usage() {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  --sqlite     Use SQLite database (default)"
    echo "  --postgres   Use PostgreSQL database"
    echo "  --redis      Include Redis cache"
    echo "  --build      Force rebuild containers"
    echo "  --down       Stop and remove containers"
    echo "  --logs       Show logs after starting"
    echo "  --help       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                    # Start with SQLite"
    echo "  $0 --postgres --redis # Start with PostgreSQL and Redis"
    echo "  $0 --build           # Force rebuild and start"
    echo "  $0 --down           # Stop all services"
}

# Default values
USE_POSTGRES=false
USE_REDIS=false
FORCE_BUILD=false
SHOW_LOGS=false
STOP_SERVICES=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --postgres)
            USE_POSTGRES=true
            shift
            ;;
        --redis)
            USE_REDIS=true
            shift
            ;;
        --build)
            FORCE_BUILD=true
            shift
            ;;
        --logs)
            SHOW_LOGS=true
            shift
            ;;
        --down)
            STOP_SERVICES=true
            shift
            ;;
        --help)
            usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Change to docker directory
cd "$SCRIPT_DIR"

# Stop services if requested
if [ "$STOP_SERVICES" = true ]; then
    echo "🛑 Stopping URL Shortener services..."
    
    if [ "$USE_POSTGRES" = true ]; then
        docker compose -f docker-compose.dev.yml -f docker-compose.postgres.yml down
    else
        docker compose -f docker-compose.dev.yml down
    fi
    
    echo "✅ Services stopped successfully!"
    exit 0
fi

# Prepare docker-compose command
COMPOSE_FILES="-f docker-compose.dev.yml"
PROFILES=""

if [ "$USE_POSTGRES" = true ]; then
    COMPOSE_FILES="$COMPOSE_FILES -f docker-compose.postgres.yml"
    echo "📦 Using PostgreSQL database"
else
    echo "📦 Using SQLite database"
fi

if [ "$USE_REDIS" = true ]; then
    PROFILES="--profile redis"
    echo "🔴 Including Redis cache"
fi

# Build command
BUILD_FLAG=""
if [ "$FORCE_BUILD" = true ]; then
    BUILD_FLAG="--build"
    echo "🔨 Force rebuilding containers"
fi

echo ""
echo "Starting services..."
echo "==================="

# Start services
if [ "$SHOW_LOGS" = true ]; then
    echo "📋 Starting with logs..."
    docker compose $COMPOSE_FILES $PROFILES up $BUILD_FLAG
else
    echo "🔄 Starting in background..."
    docker compose $COMPOSE_FILES $PROFILES up -d $BUILD_FLAG
    
    # Wait for services to be healthy
    echo ""
    echo "⏳ Waiting for services to be ready..."
    
    # Check API health
    for i in {1..30}; do
        if curl -sf http://localhost:5080/health > /dev/null 2>&1; then
            echo "✅ API service is healthy"
            break
        fi
        if [ $i -eq 30 ]; then
            echo "❌ API service failed to start"
            exit 1
        fi
        sleep 2
    done
    
    # Check Web health
    for i in {1..30}; do
        if curl -sf http://localhost:5000 > /dev/null 2>&1; then
            echo "✅ Web service is healthy"
            break
        fi
        if [ $i -eq 30 ]; then
            echo "❌ Web service failed to start"
            exit 1
        fi
        sleep 2
    done
    
    echo ""
    echo "🎉 URL Shortener is ready!"
    echo "=========================="
    echo "📱 Web Frontend:     http://localhost:5000"
    echo "🔧 API Service:      http://localhost:5080"
    echo "📚 API Docs:         http://localhost:5080/swagger"
    echo "❤️  Health Check:    http://localhost:5080/health"
    
    if [ "$USE_POSTGRES" = true ]; then
        echo "🐘 PostgreSQL:       localhost:5432 (urlshortener/dev_password_123)"
    fi
    
    if [ "$USE_REDIS" = true ]; then
        echo "🔴 Redis Cache:      localhost:6379"
    fi
    
    echo ""
    echo "📋 View logs:        docker compose -f docker-compose.dev.yml logs -f"
    echo "🛑 Stop services:    $0 --down"
    echo ""
fi
