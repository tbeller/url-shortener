namespace UrlShortener.Core.Models;

public class CreateUrlRequest
{
    public string Url { get; set; } = string.Empty;
}

public class CreateUrlResponse
{
    public bool Success { get; set; }
    public string ShortCode { get; set; } = string.Empty;
    public string OriginalUrl { get; set; } = string.Empty;
    public string ShortUrl { get; set; } = string.Empty;
    public string? Error { get; set; }
}

public class GetUrlResponse
{
    public bool Success { get; set; }
    public string ShortCode { get; set; } = string.Empty;
    public string OriginalUrl { get; set; } = string.Empty;
    public DateTime? CreatedAt { get; set; }
    public string? Error { get; set; }
}

public class GetAllUrlsResponse
{
    public bool Success { get; set; }
    public List<UrlItem> Urls { get; set; } = new();
    public string? Error { get; set; }
}

public class UrlItem
{
    public string ShortCode { get; set; } = string.Empty;
    public string OriginalUrl { get; set; } = string.Empty;
    public string ShortUrl { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class HealthResponse
{
    public string Status { get; set; } = "OK";
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
