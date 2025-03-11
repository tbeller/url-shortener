# URL Shortener Web App

This is a simple URL Shortener web application built with Node.js and Express. It is designed as a practice project for deploying web applications to cloud infrastructure.

## Features

- **Shorten URLs:** Generate unique short codes for provided URLs.
- **Redirects:** Redirect short codes to their corresponding original URLs.
- **List URLs:** Display a list of all shortened URLs with creation timestamps.

## Purpose

This is intended to be a simple application that can be deployed to various cloud services.

## Directory Structure

- **index.html & list.html:** Frontend pages for URL shortening and listing.
- **server.js:** Entry point for the web server.
- **src/**
  - **app.js:** Main Express application.
  - **config/db.js:** Database configuration setup.
  - **models/url.js:** Database methods for URL operations.
  - **routes/**
    - **shorten.js:** Handles URL shortening.
    - **redirect.js:** Manages URL redirection.
    - **list.js:** Provides a list of shortened URLs.

## Deployment

The accompanying infrastructure-as-code examples in the `../infrastructure` directory provide templates for deploying this application to cloud environments.

## Local Testing

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Create a `.env` file for environment-specific settings.
   - **DB_PROVIDER:** Database provider (`sqlite` for local testing)
   - **DB_PATH:** Path to the SQLite database file.

3. **Run the Application:**
   ```bash
   npm start
   ```
   The server will start on port 8080 (or the port specified by the `PORT` environment variable).

## License

This project is licensed under the MIT License.