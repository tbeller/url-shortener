# URL Shortener - Node.js Implementation

## Overview

This folder contains a Node.js implementation of the URL shortener application. It provides a JavaScript/TypeScript-based API and an (optional) Azure Functions variant so the project can be run as a traditional Express-like API or as serverless functions. The README follows the same structure and developer-focused guidance as the `dotnet/README.md` in this repository.

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

### 2. Start the API Service (example)

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

### 3. Start the Azure Functions host (optional)

If you prefer the serverless implementation, run the Functions host locally (requires Functions Core Tools):

```bash
cd /path/to/url-shortener/node/function
func start
```

### 4. Access the application

- API root (example): http://localhost:3000
- Frontend integration: the UI should be configured to call the API base URL — see your frontend `ApiBaseUrl` or `staticwebapp.config.json`.

If your project includes the `frontend/` static site (plain HTML/JS), you can open it directly in a browser for local testing or serve it with a simple static server.

Serve the frontend locally (simple example using npm's http-server):

```bash
cd /path/to/url-shortener/node/frontend
npx http-server -p 5000
```

Then open: http://localhost:5000

## API Endpoints (typical)

The Node implementation mirrors the dotnet API interface. Confirm exact routes in `api/src` but expect these endpoints:

- `POST /api/shorten` - Create a short URL (body: { url: "https://example.com" })
- `GET /api/expand/:shortCode` - Retrieve original URL metadata
- `GET /api/urls` - List all stored mappings
- `GET /api/:shortCode` - Redirect to the original URL (browser)
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

## CORS

Configure the `CORS_ORIGIN` to allow the web frontend (for example `http://localhost:5000`) rather than using `*` in production.

## Independent Deployment

You can deploy the API or Functions independently.

API Service (example Docker/hosted deployment):

```bash
# Build and publish (example using a Dockerfile if present)
# Check `api/Dockerfile` or add one if you need containerization.
```

Azure Functions deployment:

- Use `func azure functionapp publish <APP_NAME>` or follow the Azure Static Web Apps workflow if the `function/` project is targeted by the static web app.

Static frontend deployment:

- For simple hosting, publish the `frontend/` folder to any static host (Netlify, GitHub Pages, Azure Static Web Apps, S3, etc.).
- If using Azure Static Web Apps, the `staticwebapp.config.json` at the repo root may already contain routing rules; point the app to the `frontend/` directory as the app artifact.

## Development Workflow

- Use `npm run dev` (or similar) for local auto-reload if the project includes nodemon or ts-node-dev.
- Run tests if `api/package.json` provides them: `npm test`.

## Database

Development usually uses a lightweight file-based store under `api/data/` (e.g. JSON or SQLite). For production, configure a managed DB (Postgres, Cosmos, etc.) and set `DATABASE_URL` accordingly.

## Monitoring & Health

- `GET /health` should return a 200 OK when services are healthy.
- Add logging and structured logs as needed; look for existing logger in `api/src`.

## Troubleshooting

1. Port conflicts: change `PORT` or stop the conflicting process.
2. CORS errors: set `CORS_ORIGIN` to the frontend origin.
3. DB errors: confirm the connection string and DB permissions.
4. Missing scripts: inspect `api/package.json` for available scripts.

## Notes & Assumptions

- I assumed `node/api` contains the primary HTTP API with `package.json` scripts like `start` and `dev` and that it reads `PORT` from the environment. If your implementation differs (for example, a different script name or a different port), update commands accordingly.
- I assumed `node/function` is an Azure Functions project (it contains `local.settings.json` in your workspace). If you don't use Azure Functions, you can ignore that folder.

## Next steps

- Verify `api/package.json` scripts and replace `npm run start`/`dev` with the exact script names if they differ.
- Add a short sample `curl` response example from your real API once you confirm routes.


## Completion

This README was added to `node/README.md` to match the structure and tone of the existing `dotnet/README.md` in the repository. It is intentionally conservative about implementation details; check `node/api/package.json` and `node/api/src` to tailor exact commands and endpoint names.
