using ApiGateway.Authentication;
using ApiGateway.Authorization;
using ApiGateway.Configuration;
using ApiGateway.Csrf;
using ApiGateway.Health;
using ApiGateway.Middleware;
using ApiGateway.OAuth;
using ApiGateway.Proxy;
using ApiGateway.Sessions;
using ApiGateway.Swagger;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Serilog;

// Serilog replaces the framework's logger provider, so it has to be attached while the host is being
// built. Reading the configuration rather than building the logger in code means an operator can
// turn a level up without a redeploy and without a rebuild.
var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((context, services, loggerConfiguration) => loggerConfiguration
    .ReadFrom.Configuration(context.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext());

// Bound once and shared, so the rate limiter, the route table, CORS and Swagger all read the same
// values. ValidateOnStart turns a missing section into a startup failure instead of a gateway that
// starts and then answers 401 to everybody.
var gatewayOptions = builder.Configuration
    .GetSection(GatewayOptions.SectionName)
    .Get<GatewayOptions>()
    ?? throw new InvalidOperationException(
        $"The '{GatewayOptions.SectionName}' configuration section is missing.");

builder.Services.AddSingleton(gatewayOptions);

var identityEndpoints = IdentityEndpoints.FromIssuer(gatewayOptions.Identity.Issuer);
builder.Services.AddSingleton(identityEndpoints);

// Token validation first: the rate limiter partitions on a claim the token carries, and the
// authorization policies below are evaluated against the principal it produces. AddGatewaySession
// must run after AddGatewayTokenValidation so the OpenIddict validation scheme is registered
// before the multi-auth policy scheme is built on top of it.
builder.Services.AddGatewayTokenValidation(identityEndpoints);
builder.Services.AddGatewaySession(builder.Configuration);
builder.Services.AddGatewayOAuthHttpClient(identityEndpoints);
builder.Services.AddGatewayAuthorization();
builder.Services.AddGatewayCors(gatewayOptions);
builder.Services.AddGatewayRateLimiting(gatewayOptions);
builder.Services.AddGatewayReverseProxy(gatewayOptions);

// Required so the OAuth controller's endpoints (and any future controllers) are reachable. The
// reverse proxy is mapped separately at the bottom of the pipeline and the controllers run on a
// separate branch, so the two do not race for the same routes.
builder.Services.AddControllers();

builder.Services.AddHealthChecks()
    .AddCheck("self", () => HealthCheckResult.Healthy("The gateway is running."), tags: ["live"])

    // failureStatus: null is what makes the identity check non-fatal. See the check's own remarks:
    // the gateway can still serve while the identity server is down, so it reports degraded and the
    // endpoint keeps answering 200. A liveness probe pointed here would restart a working gateway.
    .AddCheck<IdentityServerHealthCheck>(
        IdentityServerHealthCheck.Name,
        failureStatus: null,
        tags: ["ready"]);

// A named client rather than a raw HttpClient, so the handler is pooled and its timeouts are
// configurable. It is the same client OpenIddict's SystemNetHttp handler uses, and the one the
// identity health check uses, so neither opens a socket per probe.
builder.Services.AddHttpClient();

if (builder.Environment.IsDevelopment())
{
    builder.Services.AddGatewaySwagger(gatewayOptions, identityEndpoints);
}

var app = builder.Build();

// Outermost, so it can label everything below it, including a failure during routing.
app.UseMiddleware<CorrelationIdMiddleware>();

// Outside the exception handler, deliberately. A rejected access token throws out of
// UseAuthentication, and OpenIddict's validation failure is an OpenIddictValidationException that
// the ASP.NET Core authentication pipeline does not catch. If the exception handler were reached
// first it would answer 500 for what is, per RFC 6750, a 401. See the middleware's own remarks.
app.UseMiddleware<TokenValidationExceptionMiddleware>();

// Immediately after the correlation id and before anything that can throw, so that a failure
// anywhere downstream still produces the standard error body and a log line carrying the id.
app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseMiddleware<RequestLoggingMiddleware>();

// Explicit, because UseRateLimiter resolves a route's rate-limiting policy from the endpoint that
// UseRouting selected, and cannot do so if routing has not run.
app.UseRouting();

// After routing and before authentication, so a preflight is answered by CORS and never reaches
// the token endpoint or the rate limiter.
app.UseCors(CorsOptions.PolicyName);

// The multi-auth policy scheme picks bearer or session per request. See
// SessionAuthenticationExtensions for the selection logic.
app.UseAuthentication();

// After authentication, so the rate limiter can partition on the client id the token names instead
// of collapsing every caller behind one NAT address into a single bucket.
app.UseRateLimiter();

// CSRF runs after authentication so it can tell a browser request from a service-to-service one:
// a request with a session cookie is a browser request that needs the X-CSRF header on unsafe
// methods, a request with a bearer header does not.
app.UseMiddleware<CsrfProtectionMiddleware>();

app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapHealthChecks("/health");

// Last, and the only endpoint that forwards. A route's AuthorizationPolicy is enforced by
// UseAuthorization above against the metadata MapReverseProxy attaches here, which is why the two
// must be in this order: map first, authenticate, then authorize.
app.MapReverseProxy();

// /oauth/* endpoints live here. They are controller-mapped rather than reverse-proxied because
// they need access to the request, the session store, and the OpenIddict token endpoint as a
// client -- none of which YARP exposes.
app.MapControllers();

app.Run();

/// <summary>
/// Exposed so an integration test could reference this assembly's entry point. Not used by the
/// gateway itself.
/// </summary>
public partial class Program;