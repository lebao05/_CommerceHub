using System.Data;
using System.Diagnostics;
using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using BuildingBlocks.Core.CQRS;
using BuildingBlocks.Infrastructure.EfCore;

namespace ProductCatalog.Infrastructure.Behaviors;

[DebuggerStepThrough]
public class TxBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull, IRequest<TResponse>
    where TResponse : notnull
{
    private readonly IDomainEventContext _domainEventContext;
    private readonly IDbFacadeResolver _dbFacadeResolver;
    private readonly IMediator _mediator;
    private readonly ILogger<TxBehavior<TRequest, TResponse>> _logger;

    public TxBehavior(
        IDbFacadeResolver dbFacadeResolver, 
        IDomainEventContext domainEventContext,
        IMediator mediator, 
        ILogger<TxBehavior<TRequest, TResponse>> logger)
    {
        _domainEventContext = domainEventContext ?? throw new ArgumentNullException(nameof(domainEventContext));
        _dbFacadeResolver = dbFacadeResolver ?? throw new ArgumentNullException(nameof(dbFacadeResolver));
        _mediator = mediator ?? throw new ArgumentNullException(nameof(mediator));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        if (request is not ITxRequest)
        {
            return await next();
        }

        _logger.LogInformation("Handling transactional command {MediatRRequest}", typeof(TRequest).FullName);
        
        var strategy = _dbFacadeResolver.Database.CreateExecutionStrategy();

        return await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await _dbFacadeResolver.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted, cancellationToken);

            _logger.LogDebug("Transaction started for {MediatRRequest}", typeof(TRequest).FullName);

            var response = await next();
            
            _logger.LogInformation("Executed {MediatRRequest} successfully", typeof(TRequest).FullName);

            var domainEvents = _domainEventContext.GetDomainEvents().ToList();
            
            if (domainEvents.Any())
            {
                _logger.LogInformation("Publishing {Count} domain events for {MediatRRequest}", domainEvents.Count, typeof(TRequest).FullName);
                
                var tasks = domainEvents.Select(async @event =>
                {
                    await _mediator.Publish(new EventWrapper(@event), cancellationToken);
                    _logger.LogDebug("Published domain event {DomainEvent}", @event.GetType().FullName);
                });

                await Task.WhenAll(tasks);
            }

            await transaction.CommitAsync(cancellationToken);
            
            _logger.LogInformation("Transaction committed for {MediatRRequest}", typeof(TRequest).FullName);

            return response;
        });
    }
}
