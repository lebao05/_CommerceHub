namespace ApiGateway.Proxy;

/// <summary>
/// Names of the rate limiter policies, shared by the limiter registration and the route table.
/// </summary>
public static class RateLimitPolicies
{
    /// <summary>
    /// The tighter ceiling for the identity server's token, authorize and logout endpoints.
    /// Referenced from a route as YARP's <c>RateLimiterPolicy</c>, which puts the policy name in
    /// the endpoint's metadata where <c>UseRateLimiter</c> reads it. Using that key rather than
    /// matching on the path keeps the two concerns in one place: a route opts in by naming the
    /// policy, and moving a sensitive path elsewhere does not leave a rate limit behind pointing at
    /// nothing.
    /// </summary>
    public const string AuthenticationRoutes = "auth-routes";
}
