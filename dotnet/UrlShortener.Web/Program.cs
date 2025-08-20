var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddRazorPages();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthorization();

app.MapRazorPages();

Console.WriteLine($"URL Shortener Web Frontend starting on port {builder.Configuration["PORT"] ?? "5000"}");
Console.WriteLine($"API Base URL: {builder.Configuration["ApiBaseUrl"] ?? "http://localhost:5080"}");
Console.WriteLine($"Environment: {app.Environment.EnvironmentName}");

app.Run();
