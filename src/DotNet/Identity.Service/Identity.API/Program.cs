using System.Security.Cryptography.X509Certificates;
using FluentValidation;
using Identity.API;
using Identity.API.Authorization;
using Identity.API.Data;
using Identity.API.Services;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using OpenIddict.Abstractions;
using OpenIddict.Server.AspNetCore;
using OpenIddict.Validation.AspNetCore;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((_, _, configuration) => configuration
        .Enrich.FromLogContext()
        .WriteTo.Console()
        .WriteTo.File(
            path: "logs/identity-.log",
            rollingInterval: RollingInterval.Day,
            retainedFileCountLimit: 7));

    var services = builder.Services;
    var configuration = builder.Configuration;

    // -------------------------------------------------------------------------
    // Persistence: the EF Core store that backs both ASP.NET Core Identity and OpenIddict.
    // -------------------------------------------------------------------------
    var connectionString = configuration.GetConnectionString("IdentityDb")
        ?? throw new InvalidOperationException("Connection string 'IdentityDb' not found.");

    services.AddDbContext<IdentityDbContext>(options =>
        options.UseNpgsql(
            connectionString,
            npgsql => npgsql.MigrationsAssembly(typeof(IdentityDbContext).Assembly.FullName)));

    // -------------------------------------------------------------------------
    // ASP.NET Core Identity: password, lockout, two-factor and user-store configuration.
    // -------------------------------------------------------------------------
    services
        .AddIdentity<ApplicationUser, ApplicationRole>(options =>
        {
            options.Password.RequiredLength = 10;
            options.Password.RequireDigit = true;
            options.Password.RequireLowercase = true;
            options.Password.RequireUppercase = true;
            options.Password.RequireNonAlphanumeric = true;

            options.Lockout.MaxFailedAccessAttempts = 5;
            options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
            options.Lockout.AllowedForNewUsers = true;

            options.User.RequireUniqueEmail = true;
            options.SignIn.RequireConfirmedEmail = false;
        })
        .AddEntityFrameworkStores<IdentityDbContext>()
        .AddDefaultTokenProviders();

    services.ConfigureApplicationCookie(options =>
    {
        options.Cookie.Name = "ch_identity";
        options.LoginPath = "/Account/Login";
        options.LogoutPath = "/Account/Logout";
        options.AccessDeniedPath = "/Account/AccessDenied";
        options.ExpireTimeSpan = TimeSpan.FromHours(8);
        options.SlidingExpiration = true;
    });

    services.Configure<SecurityStampValidatorOptions>(options =>
    {
        options.ValidationInterval = TimeSpan.FromMinutes(15);
    });

    // -------------------------------------------------------------------------
    // OpenIddict: as the token issuer (server) and as the validator for the
    // identity server's own controllers.
    //
    // Three flows are enabled:
    //   - password        : the first-party client logs a user in
    //   - refresh_token   : rotates the access/refresh pair
    //   - client_credentials : background workers and the API gateway
    //
    // The authorization-code / PKCE flow used by the SPAs is not enabled here on
    // purpose — those run through the API gateway, which brokers the code-for-token
    // exchange. Keep this server as a focused token issuer.
    // -------------------------------------------------------------------------
    services.AddOpenIddict()
        .AddCore(core => core
            .UseEntityFrameworkCore()
            .UseDbContext<IdentityDbContext>())
        .AddServer(server =>
        {
            server.SetTokenEndpointUris("/connect/token");

            server.AllowPasswordFlow()
                  .AllowRefreshTokenFlow()
                  .AllowClientCredentialsFlow();

            server.RegisterScopes(
                OpenIddictConstants.Scopes.OpenId,
                OpenIddictConstants.Scopes.Profile,
                OpenIddictConstants.Scopes.Email,
                OpenIddictConstants.Scopes.Roles,
                OpenIddictConstants.Scopes.OfflineAccess);

            // Every platform-specific scope is registered so it shows up in the
            // discovery document and clients can request it.
            server.RegisterScopes(Config.Scopes.All.ToArray());

            server.SetAccessTokenLifetime(TimeSpan.FromHours(1));
            server.SetRefreshTokenLifetime(TimeSpan.FromDays(7));

            // ---------------------------------------------------------------------------------
            // Signing and encryption certificates.
            //
            // Production: a PFX file on disk, path and password in configuration. The path and
            // password belong in user secrets or the environment, not in appsettings.json, because
            // a PFX committed to the repository is a published private key.
            //
            // Development: OpenIddict's development certificate, generated on first run and
            // cached in the user profile. Suitable for `dotnet run` and integration tests; never
            // acceptable outside a developer's machine.
            // ---------------------------------------------------------------------------------
            RegisterSigningCertificate(server, configuration, builder.Environment);
            RegisterEncryptionCertificate(server, configuration, builder.Environment);

            // Authorization-code storage is unnecessary here: only the password, refresh-token
            // and client-credentials grants are enabled, and none of them use authorization codes.
            server.DisableAuthorizationStorage();

            server.UseAspNetCore()
                  .EnableTokenEndpointPassthrough()
                  .DisableTransportSecurityRequirement();
        })
        .AddValidation(validation =>
        {
            // In-process validation: the issuer and the validator are the same process.
            validation.UseLocalServer();
            validation.UseAspNetCore();
        });

    services.AddAuthentication(options =>
    {
        options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    });

    // -------------------------------------------------------------------------
    // Authorization: policies and the role-based requirements.
    // -------------------------------------------------------------------------
    services.AddAuthorization(options =>
    {
        options.AddPolicy(AuthorizationPolicies.CustomerOnly, policy =>
        {
            policy.RequireAuthenticatedUser();
            policy.AddAuthenticationSchemes(OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme);
        });

        options.AddPolicy(AuthorizationPolicies.StaffOnly, policy =>
        {
            policy.RequireAuthenticatedUser();
            policy.AddAuthenticationSchemes(OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme);
            policy.RequireAssertion(context =>
                context.User.IsInRole(ApplicationRoles.SalesAdmin) ||
                context.User.IsInRole(ApplicationRoles.SystemAdmin) ||
                context.User.IsInRole(ApplicationRoles.ServiceAccount));
        });

        options.AddPolicy(AuthorizationPolicies.AdminFull, policy =>
        {
            policy.RequireAuthenticatedUser();
            policy.AddAuthenticationSchemes(OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme);
            policy.RequireRole(ApplicationRoles.SystemAdmin);
        });
    });

    // -------------------------------------------------------------------------
    // CORS, MVC, validators, mail/SMS stand-ins.
    // -------------------------------------------------------------------------
    services.AddCors(options => options.AddPolicy("commercehub-clients", policy =>
    {
        var origins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
        policy.WithOrigins(origins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    }));

    services.AddControllers();

    services.AddValidatorsFromAssemblyContaining<LoginRequestValidator>();
    services.AddScoped<IEmailService, LoggingEmailService>();
    services.AddScoped<ISmsService, LoggingSmsService>();

    // -------------------------------------------------------------------------
    // Build the app.
    // -------------------------------------------------------------------------
    var app = builder.Build();

    // Before the pipeline, so a missing connection string or a bad OpenIddict setup fails the
    // deployment rather than the first request. For this simple setup the schema is created
    // on first run; when the project graduates to migrations, replace EnsureCreatedAsync
    // with MigrateAsync() and add a Migrations folder under the IdentityDbContext.
    // await using (var scope = app.Services.CreateAsyncScope())
    // {
    //     var context = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();

    //     await context.Database.EnsureCreatedAsync();

    //     await SeedData.InitializeAsync(scope.ServiceProvider);
    // }

    app.UseSerilogRequestLogging();
    app.UseCors("commercehub-clients");
    app.UseRouting();

    app.UseAuthentication();
    app.UseAuthorization();

    app.MapControllers();

    app.Run();
}
catch (Exception exception)
{
    Log.Fatal(exception, "The identity server terminated unexpectedly.");
    return 1;
}
finally
{
    await Log.CloseAndFlushAsync();
}

return 0;

/// <summary>
/// Registers the signing certificate OpenIddict uses to sign access tokens (JWS). Production
/// reads the path and password from <c>OpenIddict:Production:SigningCertificatePath</c> and
/// <c>OpenIddict:Production:SigningCertificatePassword</c>; the development certificate is the
/// fallback and is what a developer gets from <c>dotnet run</c> on a fresh checkout.
/// </summary>
static void RegisterSigningCertificate(
    OpenIddictServerBuilder builder,
    IConfiguration configuration,
    IHostEnvironment environment)
{
    var path = configuration["OpenIddict:Production:SigningCertificatePath"];

    if (!string.IsNullOrWhiteSpace(path))
    {
        var password = configuration["OpenIddict:Production:SigningCertificatePassword"];

        // The PFX has to be loaded as an X509Certificate2 because OpenIddict's AddSigningCertificate
        // overloads do not accept a path directly: they take either a certificate instance or a
        // resource embedded in an assembly. MachineKeySet is required on Linux where the default
        // key set is unavailable, and is also the right flag for a service account on Windows.
        using var certificate = X509CertificateLoader.LoadPkcs12FromFile(
            path,
            password,
            X509KeyStorageFlags.MachineKeySet | X509KeyStorageFlags.PersistKeySet);

        builder.AddSigningCertificate(certificate);
        return;
    }

    if (!environment.IsDevelopment())
    {
        // Failing loud is the honest behaviour here. The development certificate is generated
        // in the developer profile; a deployed instance falling back to it would issue tokens
        // that any other machine on the same image can forge, and a silent warning is the kind
        // of line that ships to production unread.
        throw new InvalidOperationException(
            "OpenIddict:Production:SigningCertificatePath is not set, and the environment is " +
            "not Development. A deployed identity server cannot fall back to the development " +
            "signing certificate. Set the path and password in user secrets, the environment, " +
            "or a key vault before starting.");
    }

    builder.AddDevelopmentSigningCertificate();
}

/// <summary>
/// Registers the encryption certificate OpenIddict uses for JWE. The fallback rules and the
/// production-vs-development split are the same as the signing certificate: production reads
/// the path from configuration, Development uses OpenIddict's built-in fallback.
/// </summary>
static void RegisterEncryptionCertificate(
    OpenIddictServerBuilder builder,
    IConfiguration configuration,
    IHostEnvironment environment)
{
    var path = configuration["OpenIddict:Production:EncryptionCertificatePath"];

    if (!string.IsNullOrWhiteSpace(path))
    {
        var password = configuration["OpenIddict:Production:EncryptionCertificatePassword"];

        using var certificate = X509CertificateLoader.LoadPkcs12FromFile(
            path,
            password,
            X509KeyStorageFlags.MachineKeySet | X509KeyStorageFlags.PersistKeySet);

        builder.AddEncryptionCertificate(certificate);
        return;
    }

    if (!environment.IsDevelopment())
    {
        throw new InvalidOperationException(
            "OpenIddict:Production:EncryptionCertificatePath is not set, and the environment is " +
            "not Development. Configure the production encryption certificate before starting.");
    }

    builder.AddDevelopmentEncryptionCertificate();
}

// Exposed so the WebApplicationFactory in tests can reach the entry point.
public partial class Program;
