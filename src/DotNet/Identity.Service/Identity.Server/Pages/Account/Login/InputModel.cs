using System.ComponentModel.DataAnnotations;

namespace Identity.Server.Pages.Account.Login;

public class InputModel
{
    [Required]
    [Display(Name = "Username or email")]
    public string? Username { get; set; }
    [Required]
    public string? Password { get; set; }
    public bool RememberLogin { get; set; }
    public string? ReturnUrl { get; set; }
    public string? Button { get; set; }
}
