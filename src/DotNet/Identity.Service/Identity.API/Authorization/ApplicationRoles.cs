namespace Identity.API.Authorization;

/// <summary>
/// The role names this platform authorizes on, and the vocabulary every <c>RequireRole</c> call
/// matches against.
/// </summary>
public static class ApplicationRoles
{
    /// <summary>A shopper. Can browse, check out and manage their own account.</summary>
    public const string Customer = "Customer";

    /// <summary>A member of the selling team. Runs the storefront: products, categories, orders and inventory.</summary>
    public const string SalesAdmin = "SalesAdmin";

    /// <summary>
    /// A system administrator. Everything the sales team can do, plus administering accounts, roles
    /// and account status. The only role that reaches the identity server's own admin endpoints.
    /// </summary>
    public const string SystemAdmin = "SystemAdmin";

    /// <summary>
    /// A machine caller, not a person. Stamped onto a sign-in that has no user behind it — the
    /// client credentials grant — so that staff-only routes can admit a background worker explicitly
    /// rather than by accident.
    /// </summary>
    public const string ServiceAccount = "ServiceAccount";

    /// <summary>Every role the platform recognises, in ascending order of privilege.</summary>
    public static IReadOnlyList<string> All { get; } = [Customer, SalesAdmin, SystemAdmin, ServiceAccount];

    /// <summary>Reports whether <paramref name="role"/> is one the platform recognises.</summary>
    public static bool IsKnown(string? role) =>
        role is not null && All.Contains(role, StringComparer.OrdinalIgnoreCase);
}
