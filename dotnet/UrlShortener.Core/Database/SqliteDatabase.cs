using Microsoft.Data.Sqlite;
using UrlShortener.Core.Interfaces;
using UrlShortener.Core.Models;

namespace UrlShortener.Core.Database;

public class SqliteDatabase : IUrlDatabase
{
    private readonly string _connectionString;
    private SqliteConnection? _connection;

    public SqliteDatabase(string dbPath = "./urls.db")
    {
        _connectionString = $"Data Source={dbPath}";
    }

    public async Task InitializeAsync()
    {
        _connection = new SqliteConnection(_connectionString);
        await _connection.OpenAsync();

        var command = _connection.CreateCommand();
        command.CommandText = @"
            CREATE TABLE IF NOT EXISTS urls (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                short_code TEXT UNIQUE NOT NULL,
                original_url TEXT NOT NULL,
                created_at TEXT DEFAULT (datetime('now'))
            )";

        await command.ExecuteNonQueryAsync();
    }

    public async Task<UrlMapping> CreateUrlAsync(string shortCode, string originalUrl)
    {
        if (_connection == null)
            throw new InvalidOperationException("Database not initialized");

        var command = _connection.CreateCommand();
        command.CommandText = @"
            INSERT INTO urls (short_code, original_url) 
            VALUES ($shortCode, $originalUrl)";
        command.Parameters.AddWithValue("$shortCode", shortCode);
        command.Parameters.AddWithValue("$originalUrl", originalUrl);

        await command.ExecuteNonQueryAsync();

        return new UrlMapping
        {
            ShortCode = shortCode,
            OriginalUrl = originalUrl,
            CreatedAt = DateTime.UtcNow
        };
    }

    public async Task<UrlMapping?> GetUrlAsync(string shortCode)
    {
        if (_connection == null)
            throw new InvalidOperationException("Database not initialized");

        var command = _connection.CreateCommand();
        command.CommandText = "SELECT * FROM urls WHERE short_code = $shortCode";
        command.Parameters.AddWithValue("$shortCode", shortCode);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return new UrlMapping
            {
                Id = reader.GetInt32(0), // id
                ShortCode = reader.GetString(1), // short_code
                OriginalUrl = reader.GetString(2), // original_url
                CreatedAt = DateTime.Parse(reader.GetString(3)) // created_at
            };
        }

        return null;
    }

    public async Task<List<UrlMapping>> GetAllUrlsAsync()
    {
        if (_connection == null)
            throw new InvalidOperationException("Database not initialized");

        var urls = new List<UrlMapping>();
        var command = _connection.CreateCommand();
        command.CommandText = "SELECT * FROM urls ORDER BY created_at DESC";

        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            urls.Add(new UrlMapping
            {
                Id = reader.GetInt32(0), // id
                ShortCode = reader.GetString(1), // short_code
                OriginalUrl = reader.GetString(2), // original_url
                CreatedAt = DateTime.Parse(reader.GetString(3)) // created_at
            });
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
        if (_connection != null)
        {
            await _connection.CloseAsync();
            await _connection.DisposeAsync();
            _connection = null;
        }
    }
}
