using System.Security.Claims;
using ApiGateway.Config;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;

namespace ApiGateway.Middleware;

public static class GatewayEndpoints
{
    public static void UseGatewayEndpoints(this WebApplication app)
    {
        app.UseUserInfoEndpoint();
        app.UseLoginEndpoint();
        app.UseLogoutEndpoint();
        app.UseGatewayStatusEndpoint();
    }

    private static void UseLogoutEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapGet("/logout", (string? redirectUrl, HttpContext ctx, GatewayConfig config) =>
        {
            redirectUrl = ResolveRedirectUrl(redirectUrl, config);

            ctx.Session.Clear();

            var authProps = new AuthenticationProperties
            {
                RedirectUri = redirectUrl
            };

            var authSchemes = new string[]
            {
                CookieAuthenticationDefaults.AuthenticationScheme,
                OpenIdConnectDefaults.AuthenticationScheme
            };

            return Results.SignOut(authProps, authSchemes);
        });
    }

    private static void UseLoginEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapGet("/login", async (string? redirectUrl, HttpContext ctx, GatewayConfig config) =>
        {
            redirectUrl = ResolveRedirectUrl(redirectUrl, config);

            await ctx.ChallengeAsync(OpenIdConnectDefaults.AuthenticationScheme, new AuthenticationProperties
            {
                RedirectUri = redirectUrl
            });
        });
    }

    private static void UseUserInfoEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapGet("/userinfo", (ClaimsPrincipal user) =>
        {
            if (user.Identity?.IsAuthenticated != true)
            {
                return Results.Unauthorized();
            }

            var claims = user.Claims;
            var dict = new Dictionary<string, string>();

            foreach (var entry in claims)
            {
                dict[entry.Type] = entry.Value;
            }

            return Results.Ok(dict);
        });
    }

    private static void UseGatewayStatusEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapGet("/gw-status", (ClaimsPrincipal user) =>
        {
            var dict = new Dictionary<string, string> {{"version", "1.0.0"}};

            return dict;
        });
    }

    private static string ResolveRedirectUrl(string? redirectUrl, GatewayConfig config)
    {
        if (string.IsNullOrWhiteSpace(redirectUrl))
        {
            return "/";
        }

        if (Uri.TryCreate(redirectUrl, UriKind.Absolute, out var absoluteUri))
        {
            var origin = absoluteUri.GetLeftPart(UriPartial.Authority);
            if (config.CorsOrigins.Any(allowedOrigin =>
                    Uri.TryCreate(allowedOrigin, UriKind.Absolute, out var allowedUri)
                    && string.Equals(
                        allowedUri.GetLeftPart(UriPartial.Authority),
                        origin,
                        StringComparison.OrdinalIgnoreCase)))
            {
                return absoluteUri.ToString();
            }
        }
        else if (redirectUrl.StartsWith('/')
            && !redirectUrl.StartsWith("//", StringComparison.Ordinal)
            && !redirectUrl.StartsWith("/\\", StringComparison.Ordinal))
        {
            return redirectUrl;
        }

        throw new BadHttpRequestException("The redirect URL is not allowed.");
    }
}
