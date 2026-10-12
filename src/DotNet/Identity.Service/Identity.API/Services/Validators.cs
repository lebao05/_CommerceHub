using FluentValidation;
using Identity.API.Models;

namespace Identity.API.Services;

/// <summary>
/// Shape rules for the auth and account requests. Anything to do with password strength is left to
/// ASP.NET Core Identity instead, which already has a configurable policy.
/// </summary>
public sealed class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(request => request.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(request => request.Password).NotEmpty();
    }
}

public sealed class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(request => request.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(request => request.Password).NotEmpty();
        RuleFor(request => request.FirstName).NotEmpty().MaximumLength(128);
        RuleFor(request => request.LastName).NotEmpty().MaximumLength(128);
        RuleFor(request => request.PhoneNumber).MaximumLength(32);
    }
}

public sealed class ForgotPasswordRequestValidator : AbstractValidator<ForgotPasswordRequest>
{
    public ForgotPasswordRequestValidator()
    {
        RuleFor(request => request.Email).NotEmpty().EmailAddress();
    }
}

public sealed class ResetPasswordRequestValidator : AbstractValidator<ResetPasswordRequest>
{
    public ResetPasswordRequestValidator()
    {
        RuleFor(request => request.Email).NotEmpty().EmailAddress();
        RuleFor(request => request.Token).NotEmpty();
        RuleFor(request => request.NewPassword).NotEmpty();
    }
}

public sealed class ChangePasswordRequestValidator : AbstractValidator<ChangePasswordRequest>
{
    public ChangePasswordRequestValidator()
    {
        RuleFor(request => request.CurrentPassword).NotEmpty();
        RuleFor(request => request.NewPassword).NotEmpty();
    }
}

public sealed class UpdateProfileRequestValidator : AbstractValidator<UpdateProfileRequest>
{
    public UpdateProfileRequestValidator()
    {
        RuleFor(request => request.FirstName).NotEmpty().MaximumLength(128);
        RuleFor(request => request.LastName).NotEmpty().MaximumLength(128);
        RuleFor(request => request.PhoneNumber).MaximumLength(32);
        RuleFor(request => request.ProfilePictureUrl).MaximumLength(512);
    }
}

public sealed class ChangeUserRoleRequestValidator : AbstractValidator<ChangeUserRoleRequest>
{
    public ChangeUserRoleRequestValidator()
    {
        RuleFor(request => request.Email).NotEmpty().EmailAddress();
        RuleFor(request => request.Role).NotEmpty().MaximumLength(256);
    }
}

public sealed class ChangeUserStatusRequestValidator : AbstractValidator<ChangeUserStatusRequest>
{
    public ChangeUserStatusRequestValidator()
    {
        RuleFor(request => request.Email).NotEmpty().EmailAddress();
        RuleFor(request => request.Status)
            .NotEmpty()
            .Must(status => Enum.TryParse<UserStatus>(status, ignoreCase: true, out _))
            .WithMessage("Status must be one of Active, Inactive, Suspended or Deleted.");
    }
}
