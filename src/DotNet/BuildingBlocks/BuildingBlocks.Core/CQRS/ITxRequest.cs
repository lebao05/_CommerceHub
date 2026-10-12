namespace BuildingBlocks.Core.CQRS
{
    /// <summary>
    /// Marker interface to identify requests that should be wrapped inside a database transaction.
    /// </summary>
    public interface ITxRequest
    {
    }
}
