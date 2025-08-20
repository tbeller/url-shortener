using Azure;
using Azure.Data.Tables;
using UrlShortener.Core.Interfaces;
using UrlShortener.Core.Models;

namespace UrlShortener.Core.Database;

public class AzureStorageTablesDatabase : IUrlDatabase
{
    private readonly string _accountName;
    private readonly string _accountKey;
    private readonly string _tableName;
    private TableClient? _tableClient;

    public AzureStorageTablesDatabase(string accountName, string accountKey, string tableName = "urls")
    {
        _accountName = accountName;
        _accountKey = accountKey;
        _tableName = tableName;
    }

    public async Task InitializeAsync()
    {
        var serviceClient = new TableServiceClient(
            new Uri($"https://{_accountName}.table.core.windows.net"),
            new TableSharedKeyCredential(_accountName, _accountKey));

        _tableClient = serviceClient.GetTableClient(_tableName);
        await _tableClient.CreateIfNotExistsAsync();
    }

    public async Task<UrlMapping> CreateUrlAsync(string shortCode, string originalUrl)
    {
        if (_tableClient == null)
            throw new InvalidOperationException("Table client not initialized");

        var entity = new AzureTableEntity
        {
            PartitionKey = "urls",
            RowKey = shortCode,
            ShortCode = shortCode,
            OriginalUrl = originalUrl,
            CreatedAt = DateTime.UtcNow
        };

        await _tableClient.AddEntityAsync(entity);

        return new UrlMapping
        {
            ShortCode = entity.ShortCode,
            OriginalUrl = entity.OriginalUrl,
            CreatedAt = entity.CreatedAt
        };
    }

    public async Task<UrlMapping?> GetUrlAsync(string shortCode)
    {
        if (_tableClient == null)
            throw new InvalidOperationException("Table client not initialized");

        try
        {
            var response = await _tableClient.GetEntityAsync<AzureTableEntity>("urls", shortCode);
            var entity = response.Value;

            return new UrlMapping
            {
                ShortCode = entity.ShortCode,
                OriginalUrl = entity.OriginalUrl,
                CreatedAt = entity.CreatedAt
            };
        }
        catch (RequestFailedException ex) when (ex.Status == 404)
        {
            return null;
        }
    }

    public async Task<List<UrlMapping>> GetAllUrlsAsync()
    {
        if (_tableClient == null)
            throw new InvalidOperationException("Table client not initialized");

        var urls = new List<UrlMapping>();

        await foreach (var entity in _tableClient.QueryAsync<AzureTableEntity>(filter: "PartitionKey eq 'urls'"))
        {
            urls.Add(new UrlMapping
            {
                ShortCode = entity.ShortCode,
                OriginalUrl = entity.OriginalUrl,
                CreatedAt = entity.CreatedAt
            });
        }

        // Sort by created date descending (Azure Tables doesn't support ORDER BY)
        return urls.OrderByDescending(u => u.CreatedAt).ToList();
    }

    public async Task<bool> UrlExistsAsync(string shortCode)
    {
        var url = await GetUrlAsync(shortCode);
        return url != null;
    }

    public Task CloseAsync()
    {
        // TableClient doesn't require explicit cleanup
        return Task.CompletedTask;
    }

    private class AzureTableEntity : ITableEntity
    {
        public string PartitionKey { get; set; } = string.Empty;
        public string RowKey { get; set; } = string.Empty;
        public DateTimeOffset? Timestamp { get; set; }
        public ETag ETag { get; set; }

        public string ShortCode { get; set; } = string.Empty;
        public string OriginalUrl { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
