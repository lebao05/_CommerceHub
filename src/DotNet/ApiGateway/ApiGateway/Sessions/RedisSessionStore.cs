using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;

namespace ApiGateway.Sessions;

/// <summary>
/// Stores sessions in Redis through <see cref="IDistributedCache"/>.
/// </summary>
/// <remarks>
/// <para>
/// The interface used, rather than <c>StackExchange.Redis</c> directly, is the standard
/// <c>IDistributedCache</c> abstraction. Going through it keeps the gateway from pinning the
/// Redis SDK across the codebase, and lets tests swap in <c>AddDistributedMemoryCache</c>
/// without code changes.
/// </para>
/// <para>
/// Expiry is set on the Redis key from <see cref="SessionRecord.AbsoluteExpiresAt"/>. Absolute
/// expiry cannot be moved by a renewal, so anchoring it on the key means a session cannot outlive
/// it even if the gateway process crashes between two requests.
/// </para>
/// <para>
/// Keys are prefixed with <c>ch:session:</c> so a single Redis instance can hold other tenants
/// without collision. The prefix is held here so callers do not have to know it.
/// </para>
/// </remarks>
public sealed class RedisSessionStore : ISessionStore
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly IDistributedCache _cache;
    private readonly SessionOptions _options;
    private readonly TimeProvider _time;
    private readonly ILogger<RedisSessionStore> _logger;

    /// <summary>The Redis key prefix, kept here so callers cannot disagree on it.</summary>
    private const string KeyPrefix = "ch:session:";

    public RedisSessionStore(
        IDistributedCache cache,
        SessionOptions options,
        TimeProvider time,
        ILogger<RedisSessionStore> logger)
    {
        _cache = cache;
        _options = options;
        _time = time;
        _logger = logger;
    }

    public async Task<SessionRecord?> GetAsync(string sessionId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(sessionId))
        {
            return null;
        }

        byte[]? bytes;

        try
        {
            bytes = await _cache.GetAsync(Key(sessionId), cancellationToken);
        }
        catch (Exception exception)
        {
            // A cache failure is treated as a miss, not as an error. Returning the exception up the
            // stack would turn a Redis outage into a 500 on every API call from a logged-in user,
            // and the right behaviour during an outage is "act as if not logged in", which is the
            // behaviour the next middleware in the chain already has for a missing principal.
            _logger.LogWarning(
                exception,
                "The session store is unavailable; treating the request as anonymous.");

            return null;
        }

        if (bytes is null || bytes.Length == 0)
        {
            return null;
        }

        SessionRecord? record;

        try
        {
            record = JsonSerializer.Deserialize<SessionRecord>(bytes, JsonOptions);
        }
        catch (JsonException exception)
        {
            // A corrupted record is treated as missing. The caller will be prompted to sign in
            // again, which will overwrite the corrupted entry with a fresh one.
            _logger.LogWarning(
                exception,
                "Discarded a corrupted session record for {SessionId}.",
                sessionId);

            return null;
        }

        if (record is null)
        {
            return null;
        }

        var now = _time.GetUtcNow();

        // Both timers checked here so the store does not rely on the caller to honour them. A
        // record that has reached either end is gone, regardless of which timer fires first.
        if (record.AbsoluteExpiresAt <= now || record.IdleExpiresAt <= now)
        {
            await DeleteAsync(sessionId, cancellationToken);
            return null;
        }

        return record;
    }

    public async Task SaveAsync(string sessionId, SessionRecord record, CancellationToken cancellationToken)
    {
        var now = _time.GetUtcNow();
        var idleExpiresAt = now + _options.IdleTimeout;

        // The absolute anchor is the original creation time plus the absolute timeout, not the
        // current time. Renewing the session inside the absolute window slides idle without
        // pushing the absolute end further out, which is what stops an actively-renewed session
        // from being kept alive forever.
        var absoluteExpiresAt = record.CreatedAt + _options.AbsoluteTimeout;

        var stored = record with
        {
            IdleExpiresAt = idleExpiresAt <= absoluteExpiresAt ? idleExpiresAt : absoluteExpiresAt
        };

        var bytes = JsonSerializer.SerializeToUtf8Bytes(stored, JsonOptions);

        var entryOptions = new DistributedCacheEntryOptions
        {
            // Anchored on the absolute end, so the key disappears from Redis at the same moment
            // the session stops existing in the application. Without this, a session that the
            // application has rejected could still be served from a Redis that has not been told
            // to expire it.
            AbsoluteExpiration = absoluteExpiresAt
        };

        await _cache.SetAsync(Key(sessionId), bytes, entryOptions, cancellationToken);
    }

    public async Task DeleteAsync(string sessionId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(sessionId))
        {
            return;
        }

        try
        {
            await _cache.RemoveAsync(Key(sessionId), cancellationToken);
        }
        catch (Exception exception)
        {
            // Removal failures are logged but not propagated. The next request that reads this
            // session id will see the record still present, which means the user has not yet been
            // logged out from the application's perspective. The window is the size of one request,
            // and the alternative is a logout endpoint that lies to the caller.
            _logger.LogWarning(
                exception,
                "Failed to remove session {SessionId} from the store.",
                sessionId);
        }
    }

    /// <summary>The full Redis key for <paramref name="sessionId"/>.</summary>
    private static string Key(string sessionId) => KeyPrefix + sessionId;
}