const { CosmosClient } = require('@azure/cosmos');
const DatabaseInterface = require('./DatabaseInterface');

class CosmosDBDatabase extends DatabaseInterface {
  constructor(connectionString, databaseName = 'urlshortener', containerName = 'urls') {
    super();
    
    // Parse connection string or use individual parameters for backward compatibility
    if (connectionString.includes('AccountEndpoint=')) {
      // Connection string format: "AccountEndpoint=https://your-account.documents.azure.com:443/;AccountKey=your-key;Database=urlshortener;"
      const parsed = this.parseConnectionString(connectionString);
      this.client = new CosmosClient({ endpoint: parsed.endpoint, key: parsed.key });
      this.databaseName = parsed.database || databaseName;
    } else {
      // Legacy format - assume first parameter is endpoint, second is key
      this.client = new CosmosClient({ endpoint: connectionString, key: databaseName });
      this.databaseName = containerName || 'urlshortener';
    }
    
    this.containerName = containerName || 'urls';
    this.database = null;
    this.container = null;
  }

  parseConnectionString(connectionString) {
    const parts = connectionString.split(';').filter(part => part.trim());
    const config = {};
    
    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key && value) {
        switch (key.trim()) {
          case 'AccountEndpoint':
            config.endpoint = value.trim();
            break;
          case 'AccountKey':
            config.key = value.trim();
            break;
          case 'Database':
            config.database = value.trim();
            break;
        }
      }
    }
    
    if (!config.endpoint || !config.key) {
      throw new Error('Connection string must contain AccountEndpoint and AccountKey');
    }
    
    return config;
  }

  async initialize() {
    try {
      // Create database if it doesn't exist
      const { database } = await this.client.databases.createIfNotExists({
        id: this.databaseName
      });
      this.database = database;

      // Create container if it doesn't exist
      const { container } = await this.database.containers.createIfNotExists({
        id: this.containerName,
        partitionKey: { paths: ['/shortCode'] }
      });
      this.container = container;
    } catch (err) {
      throw new Error(`Cosmos DB initialization failed: ${err.message}`);
    }
  }

  async createUrl(shortCode, originalUrl) {
    try {
      const item = {
        id: shortCode, // Use shortCode as the document ID
        shortCode: shortCode,
        originalUrl: originalUrl,
        createdAt: new Date().toISOString()
      };

      const { resource } = await this.container.items.create(item);
      return { shortCode, originalUrl, id: resource.id };
    } catch (err) {
      throw new Error(`Failed to create URL: ${err.message}`);
    }
  }

  async getUrl(shortCode) {
    try {
      const { resource } = await this.container.item(shortCode, shortCode).read();
      if (resource) {
        return {
          shortCode: resource.shortCode,
          originalUrl: resource.originalUrl,
          createdAt: resource.createdAt
        };
      }
      return null;
    } catch (err) {
      if (err.code === 404) {
        return null;
      }
      throw new Error(`Failed to get URL: ${err.message}`);
    }
  }

  async getAllUrls() {
    try {
      const { resources } = await this.container.items
        .query('SELECT * FROM c ORDER BY c.createdAt DESC')
        .fetchAll();
      
      return resources.map(item => ({
        shortCode: item.shortCode,
        originalUrl: item.originalUrl,
        createdAt: item.createdAt
      }));
    } catch (err) {
      throw new Error(`Failed to get all URLs: ${err.message}`);
    }
  }

  async urlExists(shortCode) {
    const url = await this.getUrl(shortCode);
    return !!url;
  }

  async close() {
    // Cosmos DB client doesn't need explicit closing
  }
}

module.exports = CosmosDBDatabase;
