using ApiGateway.Config;
using ApiGateway.Services;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OAuth.Claims;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;

namespace ApiGateway.Middleware;

public static class GatewaySetup
{
    public static void AddGateway(this WebApplicationBuilder builder, GatewayConfig config)
    {
        builder.Services.AddReverseProxy()
            .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

        builder.Services.AddSingleton(config);
        builder.Services.AddSingleton<TokenRefreshService>();
        // builder.Services.AddSingleton<TokenExchangeService>();

        var sessionTimeoutInMin = config.SessionTimeoutInMin;
        builder.Services.AddSession(options => { options.IdleTimeout = TimeSpan.FromMinutes(sessionTimeoutInMin); });

        builder.Services.AddAntiforgery(setup =>
        {
            setup.HeaderName = "X-XSRF-TOKEN";
        });

        builder.Services.AddHttpContextAccessor();

        builder.Services.AddAuthorization(options =>
        {
            options.AddPolicy("authPolicy", policy => { policy.RequireAuthenticatedUser(); });
        });

        builder.Services.AddAuthentication(options =>
        {
            options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = OpenIdConnectDefaults.AuthenticationScheme;
        })
        .AddCookie(options =>
        {
            options.ExpireTimeSpan = TimeSpan.FromMinutes(sessionTimeoutInMin);
            options.SlidingExpiration = true;
            options.Cookie.Name = "commercehub.gateway";
            options.Cookie.HttpOnly = true;
            options.Cookie.SameSite = SameSiteMode.Lax;
            options.Cookie.SecurePolicy = builder.Environment.IsDevelopment()
                ? CookieSecurePolicy.SameAsRequest
                : CookieSecurePolicy.Always;
        })
        .AddOpenIdConnect(options =>
        {
            options.SignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
            options.Authority = config.Authority;
            options.ClientId = config.ClientId;
            options.ClientSecret = config.ClientSecret;
            options.UsePkce = true;
            options.ResponseType = OpenIdConnectResponseType.Code;
            options.SaveTokens = true;
            options.GetClaimsFromUserInfoEndpoint = true;
            options.MapInboundClaims = false;
            options.ClaimActions.Add(new JsonKeyClaimAction(
                "role",
                System.Security.Claims.ClaimValueTypes.String,
                "role"));
            options.ClaimActions.Add(new JsonKeyClaimAction(
                "preferred_username",
                System.Security.Claims.ClaimValueTypes.String,
                "preferred_username"));
            options.CorrelationCookie.SecurePolicy = builder.Environment.IsDevelopment()
                ? CookieSecurePolicy.SameAsRequest
                : CookieSecurePolicy.Always;
            options.CorrelationCookie.SameSite = builder.Environment.IsDevelopment()
                ? SameSiteMode.Lax
                : SameSiteMode.None;
            options.NonceCookie.SecurePolicy = builder.Environment.IsDevelopment()
                ? CookieSecurePolicy.SameAsRequest
                : CookieSecurePolicy.Always;
            options.NonceCookie.SameSite = builder.Environment.IsDevelopment()
                ? SameSiteMode.Lax
                : SameSiteMode.None;
            options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();

            var scopes = config.Scopes;
            var scopeArray = scopes.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            foreach (var scope in scopeArray)
            {
                options.Scope.Add(scope);
            }

            options.Events.OnTokenValidated = (context) =>
            {
                TokenHandler.HandleToken(context);
                return Task.FromResult(0);
            };

            options.Events.OnRedirectToIdentityProviderForSignOut = (context) =>
            {
                LogoutHandler.HandleLogout(context, config);
                return Task.CompletedTask;
            };
        });
    }

    private static void UseYarp(this IEndpointRouteBuilder app)
    {
        app.MapReverseProxy(pipeline => { pipeline.UseGatewayPipeline(); });
    }

    public static void UseGateway(this WebApplication app)
    {
        app.UseRouting();
        app.UseCors("api");
        app.UseCookiePolicy();
        app.UseSession();
        app.UseAuthentication();
        app.UseAuthorization();
        app.UseXsrfCookie();
        app.UseGatewayEndpoints();
        app.UseYarp();
    }
}
