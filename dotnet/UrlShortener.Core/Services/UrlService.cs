using Microsoft.Extensions.Configuration;
using UrlShortener.Core.Interfaces;
using UrlShortener.Core.Models;

namespace UrlShortener.Core.Services;

public class UrlService : IUrlService
{
    private readonly IUrlDatabase _database;
    private readonly IConfiguration _configuration;

    public UrlService(IUrlDatabase database, IConfiguration configuration)
    {
        _database = database;
        _configuration = configuration;
    }

    public async Task<CreateUrlResponse> CreateShortUrlAsync(string originalUrl)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(originalUrl) || !IsValidUrl(originalUrl))
            {
                return new CreateUrlResponse { Success = false, Error = "Invalid URL provided" };
            }

            var shortCode = GenerateShortCode();
            var attempts = 0;
            const int maxAttempts = 5;

            // Ensure the short code is unique
            while (await _database.UrlExistsAsync(shortCode) && attempts < maxAttempts)
            {
                shortCode = GenerateShortCode();
                attempts++;
            }

            if (attempts >= maxAttempts)
            {
                return new CreateUrlResponse { Success = false, Error = "Unable to generate unique short code" };
            }

            var result = await _database.CreateUrlAsync(shortCode, originalUrl);
            var baseUrl = _configuration["BaseUrl"] ?? "http://localhost:5000";

            return new CreateUrlResponse
            {
                Success = true,
                ShortCode = result.ShortCode,
                OriginalUrl = result.OriginalUrl,
                ShortUrl = $"{baseUrl}/api/{result.ShortCode}"
            };
        }
        catch (Exception ex)
        {
            return new CreateUrlResponse { Success = false, Error = $"Failed to create short URL: {ex.Message}" };
        }
    }

    public async Task<GetUrlResponse> GetOriginalUrlAsync(string shortCode)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(shortCode))
            {
                return new GetUrlResponse { Success = false, Error = "Short code is required" };
            }

            var url = await _database.GetUrlAsync(shortCode);
            if (url == null)
            {
                return new GetUrlResponse { Success = false, Error = "Short URL not found" };
            }

            return new GetUrlResponse
            {
                Success = true,
                ShortCode = url.ShortCode,
                OriginalUrl = url.OriginalUrl,
                CreatedAt = url.CreatedAt
            };
        }
        catch (Exception ex)
        {
            return new GetUrlResponse { Success = false, Error = $"Failed to get original URL: {ex.Message}" };
        }
    }

    public async Task<GetAllUrlsResponse> GetAllUrlsAsync()
    {
        try
        {
            var urls = await _database.GetAllUrlsAsync();
            var baseUrl = _configuration["BaseUrl"] ?? "http://localhost:5000";

            var urlItems = urls.Select(url => new UrlItem
            {
                ShortCode = url.ShortCode,
                OriginalUrl = url.OriginalUrl,
                ShortUrl = $"{baseUrl}/api/{url.ShortCode}",
                CreatedAt = url.CreatedAt
            }).ToList();

            return new GetAllUrlsResponse
            {
                Success = true,
                Urls = urlItems
            };
        }
        catch (Exception ex)
        {
            return new GetAllUrlsResponse { Success = false, Error = $"Failed to get all URLs: {ex.Message}" };
        }
    }

    private static string GenerateShortCode()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        var random = new Random();
        return new string(Enumerable.Repeat(chars, 4)
            .Select(s => s[random.Next(s.Length)]).ToArray());
    }

    private static bool IsValidUrl(string url)
    {
        return Uri.TryCreate(url, UriKind.Absolute, out _);
    }
}
