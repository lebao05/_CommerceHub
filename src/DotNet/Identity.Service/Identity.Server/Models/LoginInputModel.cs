using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace Identity.Server.Models;

public sealed class LoginInputModel
{
    [Required]
    [Display(Name = "Username or email")]
    public string Username { get; set; } = string.Empty;

    [Required]
    [DataType(DataType.Password)]
    public string Password { get; set; } = string.Empty;

    [Display(Name = "Remember me")]
    public bool RememberLogin { get; set; }

    [Required]
    public string ReturnUrl { get; set; } = string.Empty;

    [BindNever]
    public bool GoogleLoginEnabled { get; set; }
}
