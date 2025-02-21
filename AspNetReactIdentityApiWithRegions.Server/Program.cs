using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddSwaggerGen(); // Add this line
								  // Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
	options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddAuthorization();
builder.Services.AddIdentityApiEndpoints<IdentityUser>()
	.AddEntityFrameworkStores<ApplicationDbContext>();

var app = builder.Build();

var apiGroup = app.MapGroup("/api");
var identityGroup = apiGroup.MapGroup("/identity");

identityGroup.MapIdentityApi<IdentityUser>();

app.UseDefaultFiles();
app.MapStaticAssets();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
	app.UseSwagger(); // Ensure this is before MapOpenApi
	app.UseSwaggerUI();
	app.MapOpenApi();
}

app.UseHttpsRedirection();

var summaries = new[]
{
	"Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

apiGroup.MapGet("/weatherforecast", () =>
{
	var forecast = Enumerable.Range(1, 5).Select(index =>
		new WeatherForecast
		(
			DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
			Random.Shared.Next(-20, 55),
			summaries[Random.Shared.Next(summaries.Length)]
		))
		.ToArray();
	return forecast;
})
.WithName("GetWeatherForecast")
.RequireAuthorization();

identityGroup.MapPost("/logout", async (SignInManager<IdentityUser> signInManager,
	[FromBody] object empty) =>
{
	if (empty != null)
	{
		await signInManager.SignOutAsync();
		return Results.Ok();
	}
	return Results.Unauthorized();
})
.WithOpenApi()
.RequireAuthorization();

identityGroup.MapGet("/user", async (ClaimsPrincipal user) =>
{
	return Results.Json(new
	{
		email = user.FindFirstValue(ClaimTypes.Email),
	});
})
.WithOpenApi()
.RequireAuthorization();

apiGroup.MapGet("/appsettings", (IConfiguration config) =>
{
	var region = config["AppRegion"] ?? "Undefined";
	var regions = config.GetSection("AvailableRegions").Get<Dictionary<string, string>>() ?? new Dictionary<string, string>();
	var appSettings = new AppSettings(region, regions);
	return Results.Ok(appSettings);
});

app.MapFallbackToFile("/index.html");

app.Run();

internal record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
	public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}

// Define AppSettings record type
internal record AppSettings(string Region, Dictionary<string, string> Regions);
