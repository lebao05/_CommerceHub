using System.Net;
using System.Security.Cryptography.X509Certificates;
using Duende.IdentityServer;
using Duende.IdentityServer.EntityFramework.DbContexts;
using Identity.Server.Data;
using Identity.Server.Services;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OAuth.Claims;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Rsk.TokenExchange.Configuration;
using Rsk.TokenExchange.DuendeIdentityServerV7;
using Rsk.TokenExchange.Validators.Adaptors;
using Serilog;

namespace Identity.Server;

internal static class HostingExtensions
{
    public static WebApplicationBuilder ConfigureLogging(this WebApplicationBuilder builder)
    {
        _ = builder.Services.AddSerilog((services, loggerConfiguration) => loggerConfiguration
            .ReadFrom.Configuration(builder.Configuration)
            .ReadFrom.Services(services)
            .Enrich.FromLogContext());
        return builder;
    }

    public static WebApplication ConfigureServices(this WebApplicationBuilder builder)
    {
        var connectionString = builder.Configuration.GetConnectionString("IdentityDb");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException("ConnectionStrings:IdentityDb must be configured.");
        }

        _ = builder.Services.AddControllers();
        _ = builder.Services.AddHealthChecks();
        _ = builder.Services.AddRazorPages();
        _ = builder.Services.AddHostedService<DatabaseInitializationHostedService>();
        _ = builder.Services.AddDbContext<ApplicationDbContext>(options => options.UseNpgsql(connectionString));
        _ = builder.Services
            .AddIdentity<ApplicationUser, IdentityRole>(options =>
            {
                options.User.RequireUniqueEmail = true;
                options.SignIn.RequireConfirmedEmail = !builder.Environment.IsDevelopment();
                options.Lockout.MaxFailedAccessAttempts = 5;
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
            })
            .AddEntityFrameworkStores<ApplicationDbContext>()
            .AddDefaultTokenProviders();

        var identityServer = builder.Services.AddIdentityServer(options =>
        {
            options.EmitStaticAudienceClaim = true;
            options.Events.RaiseErrorEvents = true;
            options.Events.RaiseFailureEvents = true;
            options.Events.RaiseInformationEvents = true;
            options.Events.RaiseSuccessEvents = true;
            options.Authentication.CookieSameSiteMode = builder.Environment.IsDevelopment()
                ? SameSiteMode.Lax
                : SameSiteMode.None;
            options.Authentication.CheckSessionCookieSameSiteMode = builder.Environment.IsDevelopment()
                ? SameSiteMode.Lax
                : SameSiteMode.None;
        })
            .AddAspNetIdentity<ApplicationUser>()
            .AddConfigurationStore(options =>
            {
                options.ConfigureDbContext = db => db.UseNpgsql(
                    connectionString,
                    sql => sql.MigrationsAssembly(typeof(Program).Assembly.GetName().Name));
            })
            .AddOperationalStore(options =>
            {
                options.ConfigureDbContext = db => db.UseNpgsql(
                    connectionString,
                    sql => sql.MigrationsAssembly(typeof(Program).Assembly.GetName().Name));
                options.EnableTokenCleanup = true;
                options.TokenCleanupInterval = 3600;
            })
            .AddProfileService<ProfileService>()
            .AddLicenseSummary();

        if (builder.Environment.IsDevelopment())
        {
            identityServer.AddDeveloperSigningCredential();
        }
        else
        {
            var certificatePath = builder.Configuration["SigningCertificate:Path"];
            var certificatePassword = builder.Configuration["SigningCertificate:Password"];
            if (string.IsNullOrWhiteSpace(certificatePath))
            {
                throw new InvalidOperationException(
                    "SigningCertificate:Path must point to a signing certificate outside Development.");
            }

            var certificate = X509CertificateLoader.LoadPkcs12FromFile(
                certificatePath,
                certificatePassword,
                X509KeyStorageFlags.EphemeralKeySet);
            if (!certificate.HasPrivateKey)
            {
                throw new InvalidOperationException("The configured signing certificate has no private key.");
            }

            identityServer.AddSigningCredential(certificate);
        }

        _ = builder.Services.AddTokenExchangeCore();
        _ = builder.Services.AddTransient<ITokenValidatorAdaptor, IdentityServerSubjectTokenValidator>();
        identityServer.AddExtensionGrantValidator<CompatibleTokenExchangeExtensionGrantValidator>();

        var googleClientId = builder.Configuration["Authentication:Google:ClientId"];
        var googleClientSecret = builder.Configuration["Authentication:Google:ClientSecret"];
        if (!string.IsNullOrWhiteSpace(googleClientId) && !string.IsNullOrWhiteSpace(googleClientSecret))
        {
            _ = builder.Services.AddAuthentication()
                .AddGoogle("Google", options =>
                {
                    options.ClientId = googleClientId;
                    options.ClientSecret = googleClientSecret;
                    options.SignInScheme = IdentityServerConstants.ExternalCookieAuthenticationScheme;
                    options.Scope.Add("email");
                    options.ClaimActions.Add(
                        new JsonKeyClaimAction(
                            "email_verified",
                            System.Security.Claims.ClaimValueTypes.Boolean,
                            "verified_email"));
                });
        }

        var corsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
        if (corsOrigins.Length > 0)
        {
            _ = builder.Services.AddCors(options => options.AddPolicy("identity", policy =>
                policy.WithOrigins(corsOrigins).AllowAnyHeader().AllowAnyMethod()));
        }

        _ = builder.Services.Configure<ForwardedHeadersOptions>(options =>
        {
            options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
            options.ForwardLimit = 1;
            var knownProxies = builder.Configuration.GetSection("ForwardedHeaders:KnownProxies").Get<string[]>() ?? [];
            foreach (var proxy in knownProxies)
            {
                if (!IPAddress.TryParse(proxy, out var address))
                {
                    throw new InvalidOperationException($"Forwarded proxy address '{proxy}' is not a valid IP address.");
                }

                options.KnownProxies.Add(address);
            }
        });

        _ = builder.Services.AddDataProtection()
            .SetApplicationName("CommerceHub.IdentityServer");

        builder.Services.PostConfigure<CookieAuthenticationOptions>(
            IdentityConstants.ApplicationScheme,
            options =>
            {
                options.Cookie.Name = "commercehub.identity";
                options.Cookie.HttpOnly = true;
                options.Cookie.SameSite = SameSiteMode.Lax;
                options.Cookie.SecurePolicy = builder.Environment.IsDevelopment()
                    ? CookieSecurePolicy.SameAsRequest
                    : CookieSecurePolicy.Always;
                options.LoginPath = "/Account/Login";
            });

        return builder.Build();
    }

    public static WebApplication ConfigurePipeline(this WebApplication app)
    {
        _ = app.UseForwardedHeaders();
        _ = app.UseSerilogRequestLogging();

        if (!app.Environment.IsDevelopment())
        {
            _ = app.UseHsts();
        }
        else
        {
            _ = app.UseDeveloperExceptionPage();
        }

        _ = app.Use(async (context, next) =>
        {
            context.Response.OnStarting(() =>
            {
                context.Response.Headers["X-Content-Type-Options"] = "nosniff";
                context.Response.Headers["X-Frame-Options"] = "DENY";
                context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
                if (!context.Request.Path.StartsWithSegments("/connect")
                    && !context.Response.Headers.ContainsKey("Content-Security-Policy"))
                {
                    context.Response.Headers["Content-Security-Policy"] =
                        "default-src 'self'; style-src 'self' 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'self'";
                }

                return Task.CompletedTask;
            });

            await next();
        });

        _ = app.UseStaticFiles();
        _ = app.UseRouting();
        if (app.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() is { Length: > 0 })
        {
            _ = app.UseCors("identity");
        }

        _ = app.UseIdentityServer();
        _ = app.UseAuthorization();

        _ = app.MapControllers();
        _ = app.MapHealthChecks("/health");
        _ = app.MapRazorPages().RequireAuthorization();

        return app;
    }
}
