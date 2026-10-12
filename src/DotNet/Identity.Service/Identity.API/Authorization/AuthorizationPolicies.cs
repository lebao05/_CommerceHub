namespace Identity.API.Authorization;

/// <summary>
/// Names of the authorization policies this API declares.
/// </summary>
public static class AuthorizationPolicies
{
    /// <summary>
    /// Any signed-in user with an active account. Used for the caller's own profile, password
    /// change and similar self-service endpoints.
    /// </summary>
    public const string CustomerOnly = "customer-only";

    /// <summary>
    /// A staff member. Used for storefront operations: products, categories, orders and inventory.
    /// </summary>
    public const string StaffOnly = "staff-only";

    /// <summary>
    /// A system administrator. Used for operations on other people's accounts. A sales administrator
    /// is not an administrator in this sense: this is the one power the selling team does not have.
    /// </summary>
    public const string AdminFull = "admin-full";
}
