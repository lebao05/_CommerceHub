namespace Identity.Server.Models;

public sealed class ConsentInputModel
{
    public string ReturnUrl { get; set; } = string.Empty;
    public string ClientName { get; set; } = string.Empty;
    public string[] RequestedScopes { get; set; } = [];
    public string[] SelectedScopes { get; set; } = [];
    public bool RememberConsent { get; set; } = true;
}
