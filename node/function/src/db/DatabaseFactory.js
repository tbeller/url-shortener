const SQLiteDatabase = require('./SQLiteDatabase');
const SQLServerDatabase = require('./SQLServerDatabase');
const PostgreSQLDatabase = require('./PostgreSQLDatabase');
const CosmosDBDatabase = require('./CosmosDBDatabase');
const AzureStorageTablesDatabase = require('./AzureStorageTablesDatabase');

class DatabaseFactory {
  static createDatabase() {
    const dbType = process.env.DB_TYPE || 'sqlite';
    
    switch (dbType.toLowerCase()) {
      case 'sqlite':
        return new SQLiteDatabase(process.env.DB_PATH || './urls.db');
      
      case 'sqlserver':
        if (!process.env.DB_CONNECTION_STRING) {
          throw new Error('DB_CONNECTION_STRING is required for SQL Server');
        }
        return new SQLServerDatabase(process.env.DB_CONNECTION_STRING);
      
      case 'postgresql':
        if (!process.env.DB_CONNECTION_STRING) {
          throw new Error('DB_CONNECTION_STRING is required for PostgreSQL');
        }
        return new PostgreSQLDatabase(process.env.DB_CONNECTION_STRING);
      
      case 'cosmosdb':
        if (!process.env.DB_CONNECTION_STRING && (!process.env.COSMOS_DB_ENDPOINT || !process.env.COSMOS_DB_KEY)) {
          throw new Error('Either DB_CONNECTION_STRING or both COSMOS_DB_ENDPOINT and COSMOS_DB_KEY are required for Cosmos DB');
        }
        
        if (process.env.DB_CONNECTION_STRING) {
          // Use connection string format
          return new CosmosDBDatabase(
            process.env.DB_CONNECTION_STRING,
            process.env.COSMOSDB_DATABASE || process.env.COSMOS_DB_DATABASE || 'urlshortener',
            process.env.COSMOSDB_CONTAINER || process.env.COSMOS_DB_CONTAINER || 'urls'
          );
        } else {
          // Use legacy individual parameters
          return new CosmosDBDatabase(
            process.env.COSMOS_DB_ENDPOINT,
            process.env.COSMOS_DB_KEY,
            process.env.COSMOSDB_DATABASE || process.env.COSMOS_DB_DATABASE || 'urlshortener',
            process.env.COSMOSDB_CONTAINER || process.env.COSMOS_DB_CONTAINER || 'urls'
          );
        }
      
      case 'azurestorage':
        if (!process.env.AZURE_STORAGE_ACCOUNT_NAME || !process.env.AZURE_STORAGE_ACCOUNT_KEY) {
          throw new Error('AZURE_STORAGE_ACCOUNT_NAME and AZURE_STORAGE_ACCOUNT_KEY are required for Azure Storage Tables');
        }
        return new AzureStorageTablesDatabase(
          process.env.AZURE_STORAGE_ACCOUNT_NAME,
          process.env.AZURE_STORAGE_ACCOUNT_KEY,
          process.env.AZURE_STORAGE_TABLE_NAME || 'urls'
        );
      
      default:
        throw new Error(`Unsupported database type: ${dbType}. Supported types: sqlite, sqlserver, postgresql, cosmosdb, azurestorage`);
    }
  }
}

module.exports = DatabaseFactory;
