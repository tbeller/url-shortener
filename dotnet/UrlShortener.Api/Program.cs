using UrlShortener.Core.Factories;
using UrlShortener.Core.Interfaces;
using UrlShortener.Core.Models;
using UrlShortener.Core.Services;

var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args = args,
    WebRootPath = null // Disable static web assets
});

// Add services to the container
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        var origins = builder.Configuration["CORS_ORIGIN"] ?? "*";
        if (origins == "*")
        {
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        }
        else
        {
            policy.WithOrigins(origins.Split(','))
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        }
    });
});

// Register database and services
builder.Services.AddSingleton<IUrlDatabase>(provider =>
{
    var configuration = provider.GetRequiredService<IConfiguration>();
    return DatabaseFactory.CreateDatabase(configuration);
});
builder.Services.AddScoped<IUrlService, UrlService>();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");

// Initialize database on startup
using (var scope = app.Services.CreateScope())
{
    var database = scope.ServiceProvider.GetRequiredService<IUrlDatabase>();
    await database.InitializeAsync();
    
    var dbType = builder.Configuration["DB_TYPE"] ?? "sqlite";
    Console.WriteLine($"Database initialized: {dbType}");
}

// Health check endpoint
app.MapGet("/health", () => new HealthResponse());

// API Routes
app.MapPost("/api/shorten", async (CreateUrlRequest request, IUrlService urlService) =>
{
    if (string.IsNullOrWhiteSpace(request.Url))
    {
        return Results.BadRequest(new { error = "URL is required" });
    }

    var result = await urlService.CreateShortUrlAsync(request.Url);
    return result.Success ? Results.Ok(result) : Results.BadRequest(new { error = result.Error });
});

app.MapGet("/api/expand/{shortCode}", async (string shortCode, IUrlService urlService) =>
{
    var result = await urlService.GetOriginalUrlAsync(shortCode);
    return result.Success ? Results.Ok(result) : Results.NotFound(new { error = result.Error });
});

app.MapGet("/api/urls", async (IUrlService urlService) =>
{
    var result = await urlService.GetAllUrlsAsync();
    return result.Success ? Results.Ok(result) : Results.BadRequest(new { error = result.Error });
});

app.MapGet("/api/{shortCode}", async (string shortCode, IUrlService urlService) =>
{
    var result = await urlService.GetOriginalUrlAsync(shortCode);
    if (!result.Success)
    {
        return Results.NotFound(new { error = result.Error });
    }

    return Results.Redirect(result.OriginalUrl);
});

// Graceful shutdown
var lifetime = app.Services.GetRequiredService<IHostApplicationLifetime>();
lifetime.ApplicationStopping.Register(async () =>
{
    using var scope = app.Services.CreateScope();
    var database = scope.ServiceProvider.GetRequiredService<IUrlDatabase>();
    await database.CloseAsync();
});

Console.WriteLine($"URL Shortener API starting on port {builder.Configuration["PORT"] ?? "5000"}");
Console.WriteLine($"Environment: {app.Environment.EnvironmentName}");

app.Run();
