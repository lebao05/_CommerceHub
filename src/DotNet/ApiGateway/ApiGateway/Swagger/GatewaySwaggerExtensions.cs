using ApiGateway.Authorization;
using ApiGateway.Configuration;
// Microsoft.OpenApi v2 flattened Microsoft.OpenApi.Models into Microsoft.OpenApi. The v1 namespace
// still appears in most Swashbuckle examples on the internet, so it is worth naming explicitly.
using Microsoft.OpenApi;

namespace ApiGateway.Swagger;

/// <summary>
/// Builds the Swagger document for the gateway itself.
/// </summary>
/// <remarks>
/// <para>
/// The gateway has almost no endpoints of its own, because it forwards. What is worth documenting
/// is the security contract: which routes are anonymous, which policy guards the rest, and which
/// scope each policy needs. A developer reading this can work out what to ask the identity server
/// for without reading the route table.
/// </para>
/// <para>
/// The only OAuth flow offered is the password flow, because that is the one the identity server
/// grants to a confidential client, and <c>commercehub-firstparty</c> is that client. The browser
/// clients use the authorization code flow against the identity server directly and would need a
/// redirect URI, which a Swagger UI running on the gateway's own origin does not have.
/// </para>
/// <para>
/// The client secret is not configured. It is typed into the Swagger UI's authorize dialog, in the
/// browser, and never reaches this process or its configuration.
/// </para>
/// </remarks>
public static class GatewaySwaggerExtensions
{
    /// <summary>The name of the security definition shown in the Swagger UI's authorize dialog.</summary>
    private const string SecuritySchemeId = "oauth2";

    /// <summary>Adds Swagger with an OAuth2 password-flow definition pointing at the identity server.</summary>
    public static IServiceCollection AddGatewaySwagger(
        this IServiceCollection services,
        GatewayOptions options,
        IdentityEndpoints endpoints)
    {
        services.AddEndpointsApiExplorer();

        services.AddSwaggerGen(swagger =>
        {
            swagger.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "CommerceHub API gateway",
                Version = "v1",
                Description =
                    "The single entry point in front of the CommerceHub services. It validates the " +
                    "access token issued by the identity server, checks its scope and account state, " +
                    "and forwards the request. The services behind it authenticate nobody, so nothing " +
                    "should call them directly. Authorize as the first-party client '" +
                    options.Swagger.ClientId + "'; its secret is not in this repository."
            });

            swagger.AddSecurityDefinition(SecuritySchemeId, new OpenApiSecurityScheme
            {
                Type = SecuritySchemeType.OAuth2,
                Flows = new OpenApiOAuthFlows
                {
                    Password = new OpenApiOAuthFlow
                    {
                        TokenUrl = endpoints.TokenEndpoint,

                        // Listed so the authorize dialog offers exactly the scopes the policies
                        // require. A scope the identity server does not know is a request it will
                        // refuse, so this list is the useful one to show rather than a free-text box.
                        Scopes = new Dictionary<string, string>(
                            GatewayScopes.SwaggerScopeDescriptions,
                            StringComparer.Ordinal)
                    }
                }
            });

            // Swashbuckle 10 takes a factory, because Microsoft.OpenApi 2.x resolves references against
            // the document being built, so the requirement cannot be constructed until there is one.
            // The reference is a bare id: the definition is registered under the same id above.
            swagger.AddSecurityRequirement(_ => new OpenApiSecurityRequirement
            {
                [new OpenApiSecuritySchemeReference(SecuritySchemeId, null, null)] = []
            });
        });

        return services;
    }
}
