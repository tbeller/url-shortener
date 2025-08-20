using Npgsql;
using UrlShortener.Core.Interfaces;
using UrlShortener.Core.Models;

namespace UrlShortener.Core.Database;

public class PostgreSqlDatabase : IUrlDatabase
{
    private readonly string _connectionString;

    public PostgreSqlDatabase(string connectionString)
    {
        _connectionString = connectionString;
    }

    public async Task InitializeAsync()
    {
        using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync();

        var command = new NpgsqlCommand(@"
            CREATE TABLE IF NOT EXISTS urls (
                id SERIAL PRIMARY KEY,
                short_code VARCHAR(50) UNIQUE NOT NULL,
                original_url TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )", connection);

        await command.ExecuteNonQueryAsync();
    }

    public async Task<UrlMapping> CreateUrlAsync(string shortCode, string originalUrl)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync();

        var command = new NpgsqlCommand(@"
            INSERT INTO urls (short_code, original_url) 
            VALUES (@shortCode, @originalUrl) 
            RETURNING id", connection);
        
        command.Parameters.AddWithValue("shortCode", shortCode);
        command.Parameters.AddWithValue("originalUrl", originalUrl);

        var id = await command.ExecuteScalarAsync();

        return new UrlMapping
        {
            Id = Convert.ToInt32(id),
            ShortCode = shortCode,
            OriginalUrl = originalUrl,
            CreatedAt = DateTime.UtcNow
        };
    }

    public async Task<UrlMapping?> GetUrlAsync(string shortCode)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync();

        var command = new NpgsqlCommand("SELECT * FROM urls WHERE short_code = @shortCode", connection);
        command.Parameters.AddWithValue("shortCode", shortCode);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return new UrlMapping
            {
                Id = reader.GetInt32(0), // id
                ShortCode = reader.GetString(1), // short_code
                OriginalUrl = reader.GetString(2), // original_url
                CreatedAt = reader.GetDateTime(3) // created_at
            };
        }

        return null;
    }

    public async Task<List<UrlMapping>> GetAllUrlsAsync()
    {
        using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync();

        var urls = new List<UrlMapping>();
        var command = new NpgsqlCommand("SELECT * FROM urls ORDER BY created_at DESC", connection);

        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            urls.Add(new UrlMapping
            {
                Id = reader.GetInt32(0), // id
                ShortCode = reader.GetString(1), // short_code
                OriginalUrl = reader.GetString(2), // original_url
                CreatedAt = reader.GetDateTime(3) // created_at
            });
        }

        return urls;
    }

    public async Task<bool> UrlExistsAsync(string shortCode)
    {
        var url = await GetUrlAsync(shortCode);
        return url != null;
    }

    public Task CloseAsync()
    {
        // NpgsqlConnection implements IDisposable, connections are managed per request
        return Task.CompletedTask;
    }
}
