namespace ApiGateway.Sessions;

/// <summary>
/// The contract a session store fulfils. The gateway uses this through <see cref="ISessionStore"/>;
/// the Redis implementation is in <see cref="RedisSessionStore"/>.
/// </summary>
public interface ISessionStore
{
    /// <summary>
    /// Returns the record for <paramref name="sessionId"/>, or <c>null</c> if no record exists, the
    /// record has expired, or the underlying store is unavailable.
    /// </summary>
    /// <remarks>
    /// <c>null</c> is the same answer for "never existed" and "expired" on purpose: a session that
    /// was deleted server-side must look the same to the caller as one that never existed, and a
    /// handler that distinguishes the two would have to also distinguish a store failure from a
    /// normal miss, which is not worth the test surface.
    /// </remarks>
    Task<SessionRecord?> GetAsync(string sessionId, CancellationToken cancellationToken);

    /// <summary>
    /// Persists <paramref name="record"/> under <see cref="SessionRecord.Subject"/> is not the key;
    /// the key is supplied separately because the cookie carries an opaque id and the record carries
    /// a subject.
    /// </summary>
    Task SaveAsync(string sessionId, SessionRecord record, CancellationToken cancellationToken);

    /// <summary>Removes the record, idempotent. Missing keys are not an error.</summary>
    Task DeleteAsync(string sessionId, CancellationToken cancellationToken);
}