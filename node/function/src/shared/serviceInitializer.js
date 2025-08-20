const DatabaseFactory = require('../db/DatabaseFactory');
const UrlService = require('../UrlService');

// Global instances to reuse across function invocations
let database = null;
let urlService = null;

async function initializeServices() {
  if (!database || !urlService) {
    try {
      database = DatabaseFactory.createDatabase();
      await database.initialize();
      urlService = new UrlService(database);
      console.log(`Database initialized: ${process.env.DB_TYPE || 'sqlite'}`);
    } catch (error) {
      console.error('Failed to initialize services:', error.message);
      throw error;
    }
  }
  return { database, urlService };
}

module.exports = { initializeServices };
