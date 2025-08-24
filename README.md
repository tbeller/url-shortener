# URL Shortener

A simple URL shortening web application used to demo deployments to cloud infrastructure. This repository contains two implementations of the web app (Node.js and ASP.NET).

## Overview

This project is used to  showcase different deployment approaches for a web application. It contains two web application variants that provide the same basic functionality:

- Generate a short code for a given URL.
- Redirect from a short URL to the original URL.
- List all shortened URLs.

Implementations included:

- Node.js
- ASP.NET

The infrastructure-as-code examples that provision cloud resources for these apps are kept in a separate repository.

## Project Structure

- `dotnet/` — ASP.NET web app
  - `UrlShortener.Web/` — Razor Pages web frontend
  - `UrlShortener.Api/` — API backend

- `node/` — Node.js-based web app
  - `api/` — the Node/Express backend
  - `function/` — Azure Functions backend variant
  - `frontend/` — static frontend

## License

This project is licensed under the [MIT License](LICENSE).