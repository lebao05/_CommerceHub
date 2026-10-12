namespace Identity.API.Services;

/// <summary>
/// Sends the transactional mail that account flows depend on: address confirmation, password reset and
/// password-change notices.
/// </summary>
public interface IEmailService
{
    Task SendEmailConfirmationAsync(string recipient, string confirmationLink, CancellationToken cancellationToken = default);
    Task SendPasswordResetAsync(string recipient, string resetLink, CancellationToken cancellationToken = default);
    Task SendPasswordChangedAsync(string recipient, CancellationToken cancellationToken = default);
}

/// <summary>
/// Writes outbound mail to the application log instead of sending it. This is the registered
/// implementation whenever no mail provider is configured.
/// </summary>
public sealed class LoggingEmailService : IEmailService
{
    private readonly ILogger<LoggingEmailService> _logger;

    public LoggingEmailService(ILogger<LoggingEmailService> logger)
    {
        _logger = logger;
    }

    public Task SendEmailConfirmationAsync(string recipient, string confirmationLink, CancellationToken cancellationToken = default)
    {
        _logger.LogWarning(
            "EMAIL (not sent) confirmation for {Recipient}. Confirm at: {ConfirmationLink}",
            recipient, confirmationLink);
        return Task.CompletedTask;
    }

    public Task SendPasswordResetAsync(string recipient, string resetLink, CancellationToken cancellationToken = default)
    {
        _logger.LogWarning(
            "EMAIL (not sent) password reset for {Recipient}. Reset at: {ResetLink}",
            recipient, resetLink);
        return Task.CompletedTask;
    }

    public Task SendPasswordChangedAsync(string recipient, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("EMAIL (not sent) password-changed notice for {Recipient}.", recipient);
        return Task.CompletedTask;
    }
}
