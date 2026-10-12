namespace Identity.API.Models;

/// <summary>
/// Which kind of account this is. Drives the default role assigned at registration, so a client
/// cannot pick its own privilege level by choosing an account type.
/// </summary>
public enum AccountType
{
    Customer = 1,
    SalesAdmin = 2,
    SystemAdmin = 3
}
