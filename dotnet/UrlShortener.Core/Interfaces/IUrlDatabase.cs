using UrlShortener.Core.Models;

namespace UrlShortener.Core.Interfaces;

public interface IUrlDatabase
{
    Task InitializeAsync();
    Task<UrlMapping> CreateUrlAsync(string shortCode, string originalUrl);
    Task<UrlMapping?> GetUrlAsync(string shortCode);
    Task<List<UrlMapping>> GetAllUrlsAsync();
    Task<bool> UrlExistsAsync(string shortCode);
    Task CloseAsync();
}
