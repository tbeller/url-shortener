require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const DatabaseFactory = require('./db/DatabaseFactory');
const UrlService = require('./UrlService');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve static files (for combined deployments)
const staticPath = process.env.STATIC_PATH || path.join(__dirname, '../../frontend');
const resolvedStaticPath = path.resolve(staticPath);
console.log(`Serving static files from: ${resolvedStaticPath}`);
app.use(express.static(resolvedStaticPath));

// Initialize database and services
let database;
let urlService;

async function initializeServices() {
  try {
    database = DatabaseFactory.createDatabase();
    await database.initialize();
    urlService = new UrlService(database);
    console.log(`Database initialized: ${process.env.DB_TYPE || 'sqlite'}`);
  } catch (error) {
    console.error('Failed to initialize services:', error.message);
    process.exit(1);
  }
}

// API Routes

// Create a short URL
app.post('/api/shorten', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const result = await urlService.createShortUrl(url);
    res.json(result);
  } catch (error) {
    console.error('Error creating short URL:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get original URL by short code (for API access)
app.get('/api/expand/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;
    const result = await urlService.getOriginalUrl(shortCode);
    
    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }

    res.json(result);
  } catch (error) {
    console.error('Error getting original URL:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get all URLs
app.get('/api/urls', async (req, res) => {
  try {
    const result = await urlService.getAllUrls();
    res.json(result);
  } catch (error) {
    console.error('Error getting all URLs:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Redirect short URL to original URL
app.get('/api/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;
    const result = await urlService.getOriginalUrl(shortCode);
    
    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }

    // Redirect to the original URL
    res.redirect(result.originalUrl);
  } catch (error) {
    console.error('Error redirecting:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Catch-all handler for frontend routes (SPA support)
app.get('*', (req, res) => {
  const indexPath = path.join(resolvedStaticPath, 'index.html');
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ error: 'Frontend not found' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  if (database) {
    await database.close();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  if (database) {
    await database.close();
  }
  process.exit(0);
});

// Start server
async function startServer() {
  await initializeServices();
  
  app.listen(PORT, () => {
    console.log(`URL Shortener API running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Database: ${process.env.DB_TYPE || 'sqlite'}`);
  });
}

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

module.exports = app;
