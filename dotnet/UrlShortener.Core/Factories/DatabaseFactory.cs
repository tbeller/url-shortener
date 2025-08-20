using Microsoft.Extensions.Configuration;
using UrlShortener.Core.Interfaces;
using UrlShortener.Core.Database;

namespace UrlShortener.Core.Factories;

public static class DatabaseFactory
{
    public static IUrlDatabase CreateDatabase(IConfiguration configuration)
    {
        var dbType = configuration["DB_TYPE"] ?? configuration["DbType"] ?? "sqlite";

        return dbType.ToLowerInvariant() switch
        {
            "sqlite" => new SqliteDatabase(
                configuration["DB_PATH"] ?? configuration["DbPath"] ?? "./urls.db"
            ),
            "sqlserver" => new SqlServerDatabase(
                GetRequiredConnectionString(configuration, "SQL Server")
            ),
            "postgresql" => new PostgreSqlDatabase(
                GetRequiredConnectionString(configuration, "PostgreSQL")
            ),
            "cosmosdb" => CreateCosmosDatabase(configuration),
            "azurestorage" => CreateAzureStorageDatabase(configuration),
            _ => throw new NotSupportedException($"Unsupported database type: {dbType}. Supported types: sqlite, sqlserver, postgresql, cosmosdb, azurestorage")
        };
    }

    private static string GetRequiredConnectionString(IConfiguration configuration, string dbType)
    {
        var connectionString = configuration["DB_CONNECTION_STRING"] ?? 
                             configuration["DbConnectionString"] ?? 
                             configuration.GetConnectionString("DefaultConnection");
        
        if (string.IsNullOrEmpty(connectionString))
        {
            throw new InvalidOperationException($"DB_CONNECTION_STRING is required for {dbType}");
        }
        
        return connectionString;
    }

    private static CosmosDbDatabase CreateCosmosDatabase(IConfiguration configuration)
    {
        var connectionString = configuration["DB_CONNECTION_STRING"] ?? configuration["DbConnectionString"];
        
        if (!string.IsNullOrEmpty(connectionString))
        {
            // Use connection string format
            return new CosmosDbDatabase(
                connectionString,
                configuration["COSMOSDB_DATABASE"] ?? configuration["CosmosDbDatabase"] ?? "urlshortener",
                configuration["COSMOSDB_CONTAINER"] ?? configuration["CosmosDbContainer"] ?? "urls"
            );
        }

        // Use legacy individual parameters
        var endpoint = configuration["COSMOS_DB_ENDPOINT"] ?? configuration["CosmosDbEndpoint"];
        var key = configuration["COSMOS_DB_KEY"] ?? configuration["CosmosDbKey"];
        
        if (string.IsNullOrEmpty(endpoint) || string.IsNullOrEmpty(key))
        {
            throw new InvalidOperationException("Either DB_CONNECTION_STRING or both COSMOS_DB_ENDPOINT and COSMOS_DB_KEY are required for Cosmos DB");
        }

        return new CosmosDbDatabase(
            endpoint,
            key,
            configuration["COSMOSDB_DATABASE"] ?? configuration["CosmosDbDatabase"] ?? "urlshortener",
            configuration["COSMOSDB_CONTAINER"] ?? configuration["CosmosDbContainer"] ?? "urls"
        );
    }

    private static AzureStorageTablesDatabase CreateAzureStorageDatabase(IConfiguration configuration)
    {
        var accountName = configuration["AZURE_STORAGE_ACCOUNT_NAME"] ?? configuration["AzureStorageAccountName"];
        var accountKey = configuration["AZURE_STORAGE_ACCOUNT_KEY"] ?? configuration["AzureStorageAccountKey"];
        
        if (string.IsNullOrEmpty(accountName) || string.IsNullOrEmpty(accountKey))
        {
            throw new InvalidOperationException("AZURE_STORAGE_ACCOUNT_NAME and AZURE_STORAGE_ACCOUNT_KEY are required for Azure Storage Tables");
        }

        return new AzureStorageTablesDatabase(
            accountName,
            accountKey,
            configuration["AZURE_STORAGE_TABLE_NAME"] ?? configuration["AzureStorageTableName"] ?? "urls"
        );
    }
}
