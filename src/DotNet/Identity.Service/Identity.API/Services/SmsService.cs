namespace Identity.API.Services;

/// <summary>
/// Sends the text messages used by two-factor enrolment and recovery.
/// </summary>
public interface ISmsService
{
    Task SendTwoFactorCodeAsync(string phoneNumber, string code, CancellationToken cancellationToken = default);
    Task SendSecurityAlertAsync(string phoneNumber, string message, CancellationToken cancellationToken = default);
}

/// <summary>
/// Writes text messages to the log instead of sending them, so two-factor can be exercised without
/// a Twilio account.
/// </summary>
public sealed class LoggingSmsService : ISmsService
{
    private readonly ILogger<LoggingSmsService> _logger;

    public LoggingSmsService(ILogger<LoggingSmsService> logger)
    {
        _logger = logger;
    }

    public Task SendTwoFactorCodeAsync(string phoneNumber, string code, CancellationToken cancellationToken = default)
    {
        _logger.LogWarning("SMS (not sent) two-factor code {Code} for {PhoneNumber}.", code, phoneNumber);
        return Task.CompletedTask;
    }

    public Task SendSecurityAlertAsync(string phoneNumber, string message, CancellationToken cancellationToken = default)
    {
        _logger.LogWarning("SMS (not sent) alert for {PhoneNumber}: {Message}", phoneNumber, message);
        return Task.CompletedTask;
    }
}
