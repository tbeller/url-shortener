# URL Shortener - Node.js Implementation

## Overview

This folder contains a Node.js implementation of the URL shortener application. It provides a JavaScript/TypeScript-based API and an (optional) Azure Functions variant so the project can be run as a traditional Express-like API or as serverless functions.

## Architecture

```
node/                      # Node.js app root
├── api/                    # Primary REST API (package.json, src/, data/)
│   ├── package.json
│   ├── src/                # API implementation (routes, controllers, services)
│   └── data/               # Local data (file/DB) used in development
├── function/               # Azure Functions implementation (host.json, local.settings.json)
├── frontend/               # Static frontend (index.html, script.js, styles.css)
├── staticwebapp.config.json# (Optional) Azure Static Web Apps config for local/deploy routing
└── README.md               # This file
```

- `api/` is the primary HTTP API used by the web frontend.
- `function/` contains an alternative Azure Functions host for serverless deployment.
- Local data is stored under `api/data/` (or configured storage) for development.

> Note: Implementation details (Express vs Fastify vs custom) live in `api/src/`. Check `api/package.json` for scripts.

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm or yarn
- (Optional) Azure Functions Core Tools if you plan to run the `function/` project locally
- (Optional) sqlite3 CLI or DB client if the project uses a SQLite file under `api/data/`

## Quick Start

### 1. Install dependencies

Open a terminal and install dependencies for the API project.

```bash
cd /path/to/url-shortener/node/api
npm install
```

If you also want to run the Azure Functions variant:

```bash
cd /path/to/url-shortener/node/function
npm install
```

### 2. Start the API Service

The API usually reads the port from the `PORT` environment variable or a `package.json` script.

```bash
# Terminal 1 - API Service (example: 3000)
cd /path/to/url-shortener/node/api
# start or dev depending on package.json
npm run start
# or
npm run dev
```

If the API listens on `PORT`, you can override it:

```bash
PORT=3000 npm run start
```

### 4. Access the application

- API root (example): http://localhost:3000
- Frontend integration: the UI should be configured to call the API base URL — see your frontend `ApiBaseUrl` or `staticwebapp.config.json`.

Serve the frontend locally (simple example using npm's http-server):

```bash
cd /path/to/url-shortener/node/frontend
npx http-server -p 5000
```

Then open: http://localhost:5000

## API Endpoints

The Node implementation mirrors the dotnet API interface. Confirm exact routes in `api/src` but expect these endpoints:

- `POST /api/shorten` - Create a short URL (body: { url: "https://example.com" })
- `GET /api/expand/:shortCode` - Retrieve original URL metadata
- `GET /api/urls` - List all stored mappings
- `GET /api/:shortCode` - Redirect to the original URL
- `GET /health` - Health check endpoint

Example usage:

```bash
# Create a short URL
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Expand
curl http://localhost:3000/api/expand/abc123

# Redirect (follow)
curl -L http://localhost:3000/api/abc123
```

## Configuration

Look for environment-driven configuration in `api/` (for example: `PORT`, `DB_TYPE`, `DATABASE_URL`, `CORS_ORIGIN`). Common patterns you may find:

- `PORT` — port to bind the API
- `DB_TYPE` — `sqlite` | `memory` | `postgres` (implementation-dependent)
- `DATABASE_URL` or connection string — for non-file databases
- `CORS_ORIGIN` — allowed origin for the frontend during development

If the repo uses a `.env` file or a config file in `api/src/config`, prefer that during local development.

## Monitoring & Health

- `GET /health` should return a 200 OK when services are healthy.
- Add logging and structured logs as needed; look for existing logger in `api/src`.

## Troubleshooting

1. Port conflicts: change `PORT` or stop the conflicting process.
2. CORS errors: set `CORS_ORIGIN` to the frontend origin.
3. DB errors: confirm the connection string and DB permissions.
4. Missing scripts: inspect `api/package.json` for available scripts.
