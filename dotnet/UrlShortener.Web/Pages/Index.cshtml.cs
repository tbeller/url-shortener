using Microsoft.AspNetCore.Mvc.RazorPages;

namespace UrlShortener.Web.Pages;

public class IndexModel : PageModel
{
    private readonly IConfiguration _configuration;

    public IndexModel(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string ApiBaseUrl { get; set; } = string.Empty;

    public void OnGet()
    {
        ApiBaseUrl = _configuration["ApiBaseUrl"] ?? "http://localhost:5080";
    }
}
