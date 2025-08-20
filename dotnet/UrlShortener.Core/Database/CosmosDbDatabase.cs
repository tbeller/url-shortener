using Microsoft.Azure.Cosmos;
using UrlShortener.Core.Interfaces;
using UrlShortener.Core.Models;
using System.Net;

namespace UrlShortener.Core.Database;

public class CosmosDbDatabase : IUrlDatabase
{
    private readonly string _databaseName;
    private readonly string _containerName;
    private CosmosClient? _cosmosClient;
    private Container? _container;

    public CosmosDbDatabase(string connectionString, string databaseName = "urlshortener", string containerName = "urls")
    {
        if (connectionString.Contains("AccountEndpoint="))
        {
            var parsed = ParseConnectionString(connectionString);
            _cosmosClient = new CosmosClient(parsed.endpoint, parsed.key);
            _databaseName = parsed.database ?? databaseName;
        }
        else
        {
            // Legacy format - assume first parameter is endpoint, second is key
            throw new ArgumentException("Connection string format not supported in this constructor. Use endpoint and key parameters.");
        }
        _containerName = containerName;
    }

    public CosmosDbDatabase(string endpoint, string key, string databaseName = "urlshortener", string containerName = "urls")
    {
        _cosmosClient = new CosmosClient(endpoint, key);
        _databaseName = databaseName;
        _containerName = containerName;
    }

    public async Task InitializeAsync()
    {
        if (_cosmosClient == null)
            throw new InvalidOperationException("Cosmos client not initialized");

        var database = await _cosmosClient.CreateDatabaseIfNotExistsAsync(_databaseName);
        _container = await database.Database.CreateContainerIfNotExistsAsync(_containerName, "/shortCode");
    }

    public async Task<UrlMapping> CreateUrlAsync(string shortCode, string originalUrl)
    {
        if (_container == null)
            throw new InvalidOperationException("Container not initialized");

        var urlMapping = new CosmosUrlMapping
        {
            Id = Guid.NewGuid().ToString(),
            ShortCode = shortCode,
            OriginalUrl = originalUrl,
            CreatedAt = DateTime.UtcNow
        };

        await _container.CreateItemAsync(urlMapping, new PartitionKey(shortCode));

        return new UrlMapping
        {
            ShortCode = urlMapping.ShortCode,
            OriginalUrl = urlMapping.OriginalUrl,
            CreatedAt = urlMapping.CreatedAt
        };
    }

    public async Task<UrlMapping?> GetUrlAsync(string shortCode)
    {
        if (_container == null)
            throw new InvalidOperationException("Container not initialized");

        try
        {
            var query = new QueryDefinition("SELECT * FROM c WHERE c.shortCode = @shortCode")
                .WithParameter("@shortCode", shortCode);

            var iterator = _container.GetItemQueryIterator<CosmosUrlMapping>(query);
            var results = await iterator.ReadNextAsync();

            var item = results.FirstOrDefault();
            if (item == null) return null;

            return new UrlMapping
            {
                ShortCode = item.ShortCode,
                OriginalUrl = item.OriginalUrl,
                CreatedAt = item.CreatedAt
            };
        }
        catch (CosmosException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
        {
            return null;
        }
    }

    public async Task<List<UrlMapping>> GetAllUrlsAsync()
    {
        if (_container == null)
            throw new InvalidOperationException("Container not initialized");

        var query = new QueryDefinition("SELECT * FROM c ORDER BY c.createdAt DESC");
        var iterator = _container.GetItemQueryIterator<CosmosUrlMapping>(query);

        var urls = new List<UrlMapping>();
        while (iterator.HasMoreResults)
        {
            var results = await iterator.ReadNextAsync();
            urls.AddRange(results.Select(item => new UrlMapping
            {
                ShortCode = item.ShortCode,
                OriginalUrl = item.OriginalUrl,
                CreatedAt = item.CreatedAt
            }));
        }

        return urls;
    }

    public async Task<bool> UrlExistsAsync(string shortCode)
    {
        var url = await GetUrlAsync(shortCode);
        return url != null;
    }

    public async Task CloseAsync()
    {
        if (_cosmosClient != null)
        {
            _cosmosClient.Dispose();
            _cosmosClient = null;
        }
        await Task.CompletedTask;
    }

    private static (string endpoint, string key, string? database) ParseConnectionString(string connectionString)
    {
        var parts = connectionString.Split(';', StringSplitOptions.RemoveEmptyEntries);
        string? endpoint = null, key = null, database = null;

        foreach (var part in parts)
        {
            var keyValue = part.Split('=', 2);
            if (keyValue.Length != 2) continue;

            var propertyName = keyValue[0].Trim();
            var propertyValue = keyValue[1].Trim();

            switch (propertyName)
            {
                case "AccountEndpoint":
                    endpoint = propertyValue;
                    break;
                case "AccountKey":
                    key = propertyValue;
                    break;
                case "Database":
                    database = propertyValue;
                    break;
            }
        }

        if (string.IsNullOrEmpty(endpoint) || string.IsNullOrEmpty(key))
        {
            throw new ArgumentException("Connection string must contain AccountEndpoint and AccountKey");
        }

        return (endpoint, key, database);
    }

    private class CosmosUrlMapping
    {
        public string Id { get; set; } = string.Empty;
        public string ShortCode { get; set; } = string.Empty;
        public string OriginalUrl { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
