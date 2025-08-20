using UrlShortener.Core.Models;

namespace UrlShortener.Core.Interfaces;

public interface IUrlService
{
    Task<CreateUrlResponse> CreateShortUrlAsync(string originalUrl);
    Task<GetUrlResponse> GetOriginalUrlAsync(string shortCode);
    Task<GetAllUrlsResponse> GetAllUrlsAsync();
}
