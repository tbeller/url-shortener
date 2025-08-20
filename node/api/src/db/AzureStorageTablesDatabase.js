const { TableClient, AzureNamedKeyCredential } = require('@azure/data-tables');
const DatabaseInterface = require('./DatabaseInterface');

class AzureStorageTablesDatabase extends DatabaseInterface {
  constructor(accountName, accountKey, tableName = 'urls') {
    super();
    this.tableName = tableName;
    this.credential = new AzureNamedKeyCredential(accountName, accountKey);
    this.client = new TableClient(
      `https://${accountName}.table.core.windows.net`,
      tableName,
      this.credential
    );
  }

  async initialize() {
    try {
      // Create table if it doesn't exist
      await this.client.createTable();
    } catch (err) {
      if (err.statusCode !== 409) { // 409 = table already exists
        throw new Error(`Azure Storage Tables initialization failed: ${err.message}`);
      }
    }
  }

  async createUrl(shortCode, originalUrl) {
    try {
      const entity = {
        partitionKey: 'urls',
        rowKey: shortCode,
        shortCode: shortCode,
        originalUrl: originalUrl,
        createdAt: new Date().toISOString()
      };

      await this.client.createEntity(entity);
      return { shortCode, originalUrl, id: shortCode };
    } catch (err) {
      throw new Error(`Failed to create URL: ${err.message}`);
    }
  }

  async getUrl(shortCode) {
    try {
      const entity = await this.client.getEntity('urls', shortCode);
      return {
        shortCode: entity.shortCode,
        originalUrl: entity.originalUrl,
        createdAt: entity.createdAt
      };
    } catch (err) {
      if (err.statusCode === 404) {
        return null;
      }
      throw new Error(`Failed to get URL: ${err.message}`);
    }
  }

  async getAllUrls() {
    try {
      const entities = [];
      const entitiesIter = this.client.listEntities({
        queryOptions: { filter: "PartitionKey eq 'urls'" }
      });

      for await (const entity of entitiesIter) {
        entities.push({
          shortCode: entity.shortCode,
          originalUrl: entity.originalUrl,
          createdAt: entity.createdAt
        });
      }

      // Sort by createdAt descending (client-side since Azure Tables doesn't support ORDER BY)
      return entities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (err) {
      throw new Error(`Failed to get all URLs: ${err.message}`);
    }
  }

  async urlExists(shortCode) {
    const url = await this.getUrl(shortCode);
    return !!url;
  }

  async close() {
    // Azure Tables client doesn't need explicit closing
  }
}

module.exports = AzureStorageTablesDatabase;
