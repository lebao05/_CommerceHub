using System.Security.Claims;
using Duende.IdentityServer.Models;
using Duende.IdentityServer.Validation;
using Rsk.TokenExchange;
using Rsk.TokenExchange.Exceptions;
using Rsk.TokenExchange.Validators;

namespace Identity.Server.Services;

public sealed class CompatibleTokenExchangeExtensionGrantValidator(
    ITokenExchangeRequestParser requestParser,
    ITokenExchangeRequestValidator requestValidator,
    ITokenExchangeClaimsParser claimsParser,
    IExtensionGrantValidatorClaimsFilter claimsFilter) : IExtensionGrantValidator
{
    private static readonly Dictionary<string, object> ResponseParameters =
        new Dictionary<string, object>
        {
            [TokenExchangeConstants.ResponseParameters.IssuedTokenType] =
                TokenExchangeConstants.TokenTypes.AccessToken
        };

    public string GrantType => TokenExchangeConstants.GrantType;

    public async Task ValidateAsync(
        ExtensionGrantValidationContext context,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        ITokenExchangeRequest request;
        try
        {
            request = requestParser.Parse(context.Request.ClientId, context.Request.Raw);
        }
        catch (TokenExchangeException exception)
        {
            context.Result = InvalidGrant(exception.Message);
            return;
        }

        var validation = await requestValidator.Validate(request);
        if (!validation.IsValid)
        {
            context.Result = InvalidGrant("The subject token is invalid or is not intended for this client.");
            return;
        }

        string? subject;
        List<Claim> claims;
        try
        {
            subject = await claimsParser.ParseSubject(validation.Claims, request);
            claims = (await claimsParser.ParseClaims(validation.Claims, request))
                .Where(claimsFilter.ShouldIncludeClaim)
                .ToList();
        }
        catch (TokenExchangeException exception)
        {
            context.Result = InvalidGrant($"Unable to create exchanged token claims: {exception.Message}");
            return;
        }

        if (string.IsNullOrWhiteSpace(subject))
        {
            context.Result = InvalidGrant("The subject token does not contain a subject.");
            return;
        }

        var originalClientId = claims.FirstOrDefault(claim => claim.Type == "client_id")?.Value;
        if (string.IsNullOrWhiteSpace(originalClientId))
        {
            context.Result = InvalidGrant("The subject token does not contain a client identifier.");
            return;
        }

        context.Request.ClientId = originalClientId;
        context.Result = new GrantValidationResult(
            subject,
            GrantType,
            claims,
            customResponse: ResponseParameters);
    }

    private GrantValidationResult InvalidGrant(string description) =>
        new(TokenRequestErrors.InvalidGrant, description);
}
