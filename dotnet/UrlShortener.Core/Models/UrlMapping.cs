namespace UrlShortener.Core.Models;

public class UrlMapping
{
    public string ShortCode { get; set; } = string.Empty;
    public string OriginalUrl { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int? Id { get; set; } // For databases that use integer IDs
}
