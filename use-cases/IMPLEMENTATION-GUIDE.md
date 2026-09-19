# Use Case Implementation Guide

This guide provides practical implementation guidance for the key use cases in the E-Commerce Microservices Platform.

## Table of Contents
1. [Order Checkout Flow Implementation](#order-checkout-flow)
2. [Payment Processing Implementation](#payment-processing)
3. [Inventory Management Implementation](#inventory-management)
4. [Saga Pattern Implementation](#saga-pattern)
5. [Outbox Pattern Implementation](#outbox-pattern)
6. [Idempotency Implementation](#idempotency)
7. [Event Publishing Implementation](#event-publishing)
8. [API Gateway Implementation](#api-gateway)
9. [Circuit Breaker Implementation](#circuit-breaker)
10. [Testing Strategies](#testing-strategies)

---

## Order Checkout Flow

### Implementation Steps

#### 1. Order Service - Create Order

```csharp
// Controller
[HttpPost("checkout")]
public async Task<IActionResult> Checkout([FromBody] CheckoutRequest request)
{
    var correlationId = HttpContext.Request.Headers["X-Correlation-Id"];
    
    // Validate cart
    var cart = await _cartService.ValidateCart(request.CustomerId);
    if (!cart.IsValid)
        return BadRequest(cart.ValidationErrors);
    
    // Create order
    var order = new Order
    {
        Id = Guid.NewGuid(),
        CustomerId = request.CustomerId,
        Status = OrderStatus.Pending,
        Total = cart.Total,
        Items = cart.Items.Select(i => new OrderItem
        {
            ProductId = i.ProductId,
            Quantity = i.Quantity,
            Price = i.Price // Price snapshot
        }).ToList(),
        ShippingAddress = request.ShippingAddress,
        CreatedAt = DateTime.UtcNow
    };
    
    using var transaction = await _dbContext.Database.BeginTransactionAsync();
    try
    {
        // Save order
        await _dbContext.Orders.AddAsync(order);
        
        // Write to outbox
        var outboxEvent = new OutboxMessage
        {
            Id = Guid.NewGuid(),
            EventType = "OrderCreated",
            AggregateId = order.Id.ToString(),
            Payload = JsonSerializer.Serialize(new OrderCreatedEvent
            {
                OrderId = order.Id,
                CustomerId = order.CustomerId,
                Items = order.Items,
                Total = order.Total,
                ShippingAddress = order.ShippingAddress
            }),
            CreatedAt = DateTime.UtcNow,
            CorrelationId = correlationId
        };
        await _dbContext.OutboxMessages.AddAsync(outboxEvent);
        
        // Commit atomically
        await _dbContext.SaveChangesAsync();
        await transaction.CommitAsync();
        
        return Ok(new { orderId = order.Id });
    }
    catch (Exception ex)
    {
        await transaction.RollbackAsync();
        _logger.LogError(ex, "Failed to create order");
        throw;
    }
}
```

#### 2. Outbox Publisher - Background Service

```csharp
public class OutboxPublisher : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IMessageBroker _messageBroker;
    private readonly ILogger<OutboxPublisher> _logger;
    
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessOutboxMessages();
                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing outbox messages");
            }
        }
    }
    
    private async Task ProcessOutboxMessages()
    {
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<OrderDbContext>();
        
        var messages = await dbContext.OutboxMessages
            .Where(m => m.ProcessedAt == null)
            .OrderBy(m => m.CreatedAt)
            .Take(100)
            .ToListAsync();
        
        foreach (var message in messages)
        {
            try
            {
                // Publish to broker
                await _messageBroker.PublishAsync(
                    eventType: message.EventType,
                    payload: message.Payload,
                    headers: new Dictionary<string, string>
                    {
                        ["EventId"] = message.Id.ToString(),
                        ["CorrelationId"] = message.CorrelationId
                    }
                );
                
                // Mark as processed
                message.ProcessedAt = DateTime.UtcNow;
                await dbContext.SaveChangesAsync();
                
                _logger.LogInformation(
                    "Published event {EventType} with ID {EventId}",
                    message.EventType, message.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, 
                    "Failed to publish message {MessageId}", message.Id);
                // Will retry in next iteration
            }
        }
    }
}
```

#### 3. Inventory Service - Reserve Stock

```csharp
public class OrderCreatedEventHandler : IEventHandler<OrderCreatedEvent>
{
    private readonly InventoryDbContext _dbContext;
    private readonly IMessageBroker _messageBroker;
    private readonly ILogger<OrderCreatedEventHandler> _logger;
    
    public async Task HandleAsync(OrderCreatedEvent @event, EventMetadata metadata)
    {
        // Check idempotency
        var alreadyProcessed = await _dbContext.ProcessedEvents
            .AnyAsync(e => e.EventId == metadata.EventId);
        
        if (alreadyProcessed)
        {
            _logger.LogInformation("Event {EventId} already processed", metadata.EventId);
            return; // Idempotent - skip
        }
        
        using var transaction = await _dbContext.Database.BeginTransactionAsync();
        try
        {
            var reservations = new List<InventoryReservation>();
            
            foreach (var item in @event.Items)
            {
                // Lock row for update
                var inventory = await _dbContext.Inventories
                    .FromSqlRaw("SELECT * FROM Inventories WHERE ProductId = {0} FOR UPDATE", 
                        item.ProductId)
                    .FirstOrDefaultAsync();
                
                if (inventory == null || inventory.AvailableQuantity < item.Quantity)
                {
                    // Insufficient stock
                    await PublishInventoryReservationFailedAsync(@event.OrderId, metadata);
                    await transaction.RollbackAsync();
                    return;
                }
                
                // Reserve stock
                inventory.AvailableQuantity -= item.Quantity;
                inventory.ReservedQuantity += item.Quantity;
                
                reservations.Add(new InventoryReservation
                {
                    Id = Guid.NewGuid(),
                    OrderId = @event.OrderId,
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    Status = ReservationStatus.Reserved,
                    ExpiresAt = DateTime.UtcNow.AddMinutes(30),
                    CreatedAt = DateTime.UtcNow
                });
            }
            
            await _dbContext.Reservations.AddRangeAsync(reservations);
            
            // Store processed event ID
            await _dbContext.ProcessedEvents.AddAsync(new ProcessedEvent
            {
                EventId = metadata.EventId,
                EventType = metadata.EventType,
                ProcessedAt = DateTime.UtcNow
            });
            
            await _dbContext.SaveChangesAsync();
            await transaction.CommitAsync();
            
            // Publish success event
            await _messageBroker.PublishAsync("InventoryReserved", new
            {
                OrderId = @event.OrderId,
                Reservations = reservations.Select(r => new
                {
                    r.ProductId,
                    r.Quantity
                })
            });
            
            _logger.LogInformation("Inventory reserved for order {OrderId}", @event.OrderId);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Failed to reserve inventory for order {OrderId}", 
                @event.OrderId);
            throw;
        }
    }
}
```

---

## Payment Processing

### Stripe Payment Provider Implementation

```csharp
public class StripePaymentProvider : IPaymentProvider
{
    private readonly StripeClient _stripeClient;
    private readonly ILogger<StripePaymentProvider> _logger;
    
    public async Task<PaymentResult> ProcessPaymentAsync(PaymentRequest request)
    {
        try
        {
            var options = new PaymentIntentCreateOptions
            {
                Amount = (long)(request.Amount * 100), // Convert to cents
                Currency = request.Currency.ToLower(),
                PaymentMethod = request.PaymentMethodId,
                Confirm = true,
                IdempotencyKey = request.IdempotencyKey, // Prevent duplicate charges
                Metadata = new Dictionary<string, string>
                {
                    ["OrderId"] = request.OrderId.ToString(),
                    ["CustomerId"] = request.CustomerId.ToString()
                }
            };
            
            var service = new PaymentIntentService(_stripeClient);
            var intent = await service.CreateAsync(options);
            
            if (intent.Status == "succeeded")
            {
                return new PaymentResult
                {
                    Success = true,
                    TransactionId = intent.Id,
                    Status = PaymentStatus.Completed,
                    ProcessedAt = DateTime.UtcNow
                };
            }
            else
            {
                return new PaymentResult
                {
                    Success = false,
                    Status = PaymentStatus.Failed,
                    FailureReason = $"Payment status: {intent.Status}"
                };
            }
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe payment failed for order {OrderId}", 
                request.OrderId);
            
            return new PaymentResult
            {
                Success = false,
                Status = PaymentStatus.Failed,
                FailureReason = ex.StripeError.Message
            };
        }
    }
}
```

### Payment Service with Retry

```csharp
public class PaymentService
{
    private readonly IPaymentProviderFactory _providerFactory;
    private readonly PaymentDbContext _dbContext;
    private readonly ILogger<PaymentService> _logger;
    
    public async Task<PaymentResult> ProcessPaymentWithRetryAsync(
        PaymentRequest request, 
        int maxRetries = 3)
    {
        var provider = _providerFactory.GetProvider(request.PaymentMethod);
        
        for (int attempt = 1; attempt <= maxRetries; attempt++)
        {
            try
            {
                var result = await provider.ProcessPaymentAsync(request);
                
                if (result.Success)
                {
                    await SavePaymentRecordAsync(request, result);
                    return result;
                }
                
                // Check if error is retryable
                if (!IsRetryableError(result.FailureReason))
                {
                    await SavePaymentRecordAsync(request, result);
                    return result;
                }
                
                // Exponential backoff
                if (attempt < maxRetries)
                {
                    var delay = TimeSpan.FromSeconds(Math.Pow(2, attempt));
                    _logger.LogWarning(
                        "Payment attempt {Attempt} failed, retrying in {Delay}s",
                        attempt, delay.TotalSeconds);
                    await Task.Delay(delay);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Payment attempt {Attempt} threw exception", attempt);
                
                if (attempt == maxRetries)
                    throw;
            }
        }
        
        return new PaymentResult
        {
            Success = false,
            Status = PaymentStatus.Failed,
            FailureReason = "Max retries exceeded"
        };
    }
}
```

---

## Inventory Management

### Prevent Overselling with Pessimistic Locking

```csharp
public class InventoryService
{
    public async Task<ReservationResult> ReserveInventoryAsync(
        Guid orderId, 
        List<OrderItem> items)
    {
        using var transaction = await _dbContext.Database
            .BeginTransactionAsync(IsolationLevel.Serializable);
        
        try
        {
            foreach (var item in items)
            {
                // Pessimistic lock: SELECT FOR UPDATE
                var inventory = await _dbContext.Inventories
                    .FromSqlRaw(@"
                        SELECT * FROM Inventories 
                        WHERE ProductId = {0} 
                        FOR UPDATE", item.ProductId)
                    .FirstOrDefaultAsync();
                
                if (inventory == null)
                {
                    return ReservationResult.Failure("Product not found");
                }
                
                // Check availability
                if (inventory.AvailableQuantity < item.Quantity)
                {
                    return ReservationResult.Failure(
                        $"Insufficient stock for product {item.ProductId}. " +
                        $"Available: {inventory.AvailableQuantity}, " +
                        $"Requested: {item.Quantity}");
                }
                
                // Update atomically
                inventory.AvailableQuantity -= item.Quantity;
                inventory.ReservedQuantity += item.Quantity;
            }
            
            await _dbContext.SaveChangesAsync();
            await transaction.CommitAsync();
            
            return ReservationResult.Success(orderId);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Failed to reserve inventory for order {OrderId}", orderId);
            throw;
        }
    }
}
```

### Handle Reservation Expiration

```csharp
public class ReservationExpirationService : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ReleaseExpiredReservationsAsync();
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error releasing expired reservations");
            }
        }
    }
    
    private async Task ReleaseExpiredReservationsAsync()
    {
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<InventoryDbContext>();
        
        var expiredReservations = await dbContext.Reservations
            .Where(r => r.Status == ReservationStatus.Reserved && 
                       r.ExpiresAt < DateTime.UtcNow)
            .ToListAsync();
        
        foreach (var reservation in expiredReservations)
        {
            using var transaction = await dbContext.Database.BeginTransactionAsync();
            try
            {
                var inventory = await dbContext.Inventories
                    .FirstOrDefaultAsync(i => i.ProductId == reservation.ProductId);
                
                if (inventory != null)
                {
                    inventory.ReservedQuantity -= reservation.Quantity;
                    inventory.AvailableQuantity += reservation.Quantity;
                }
                
                reservation.Status = ReservationStatus.Expired;
                reservation.UpdatedAt = DateTime.UtcNow;
                
                await dbContext.SaveChangesAsync();
                await transaction.CommitAsync();
                
                // Publish event
                await _messageBroker.PublishAsync("ReservationExpired", new
                {
                    reservation.OrderId,
                    reservation.ProductId,
                    reservation.Quantity
                });
                
                _logger.LogInformation(
                    "Released expired reservation for order {OrderId}", 
                    reservation.OrderId);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, 
                    "Failed to release reservation {ReservationId}", 
                    reservation.Id);
            }
        }
    }
}
```

---

## Saga Pattern

### Choreography-Based Saga

Already demonstrated in the Order Checkout flow above. Each service publishes events and reacts to others' events.

### Orchestration-Based Saga

```csharp
public class OrderSagaOrchestrator
{
    private readonly ISagaRepository _sagaRepository;
    private readonly IMessageBroker _messageBroker;
    private readonly ILogger<OrderSagaOrchestrator> _logger;
    
    public async Task<SagaResult> ExecuteOrderSagaAsync(Order order)
    {
        var saga = new OrderSaga
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            State = SagaState.Started,
            Steps = new List<SagaStep>
            {
                new SagaStep { Name = "ReserveInventory", Status = StepStatus.Pending },
                new SagaStep { Name = "ProcessPayment", Status = StepStatus.Pending },
                new SagaStep { Name = "CreateShipment", Status = StepStatus.Pending }
            },
            CreatedAt = DateTime.UtcNow
        };
        
        await _sagaRepository.SaveAsync(saga);
        
        try
        {
            // Step 1: Reserve Inventory
            saga.CurrentStep = "ReserveInventory";
            await UpdateSagaStepAsync(saga, "ReserveInventory", StepStatus.InProgress);
            
            var inventoryResult = await SendCommandAsync<ReserveInventoryCommand, InventoryReserved>(
                new ReserveInventoryCommand
                {
                    OrderId = order.Id,
                    Items = order.Items
                },
                timeout: TimeSpan.FromSeconds(30));
            
            if (!inventoryResult.Success)
            {
                await CompensateSagaAsync(saga);
                return SagaResult.Failure("Inventory reservation failed");
            }
            
            await UpdateSagaStepAsync(saga, "ReserveInventory", StepStatus.Completed);
            
            // Step 2: Process Payment
            saga.CurrentStep = "ProcessPayment";
            await UpdateSagaStepAsync(saga, "ProcessPayment", StepStatus.InProgress);
            
            var paymentResult = await SendCommandAsync<ProcessPaymentCommand, PaymentCompleted>(
                new ProcessPaymentCommand
                {
                    OrderId = order.Id,
                    Amount = order.Total,
                    PaymentMethod = order.PaymentMethod
                },
                timeout: TimeSpan.FromSeconds(60));
            
            if (!paymentResult.Success)
            {
                await CompensateSagaAsync(saga);
                return SagaResult.Failure("Payment failed");
            }
            
            await UpdateSagaStepAsync(saga, "ProcessPayment", StepStatus.Completed);
            
            // Step 3: Create Shipment
            saga.CurrentStep = "CreateShipment";
            await UpdateSagaStepAsync(saga, "CreateShipment", StepStatus.InProgress);
            
            var shipmentResult = await SendCommandAsync<CreateShipmentCommand, ShipmentCreated>(
                new CreateShipmentCommand
                {
                    OrderId = order.Id,
                    ShippingAddress = order.ShippingAddress
                },
                timeout: TimeSpan.FromSeconds(30));
            
            if (!shipmentResult.Success)
            {
                await CompensateSagaAsync(saga);
                return SagaResult.Failure("Shipment creation failed");
            }
            
            await UpdateSagaStepAsync(saga, "CreateShipment", StepStatus.Completed);
            
            // Saga completed successfully
            saga.State = SagaState.Completed;
            saga.CompletedAt = DateTime.UtcNow;
            await _sagaRepository.UpdateAsync(saga);
            
            return SagaResult.Success(saga.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Saga {SagaId} failed", saga.Id);
            await CompensateSagaAsync(saga);
            return SagaResult.Failure(ex.Message);
        }
    }
    
    private async Task CompensateSagaAsync(OrderSaga saga)
    {
        saga.State = SagaState.Compensating;
        await _sagaRepository.UpdateAsync(saga);
        
        // Compensate in reverse order
        var completedSteps = saga.Steps
            .Where(s => s.Status == StepStatus.Completed)
            .Reverse();
        
        foreach (var step in completedSteps)
        {
            try
            {
                switch (step.Name)
                {
                    case "ReserveInventory":
                        await SendCommandAsync<ReleaseInventoryCommand, InventoryReleased>(
                            new ReleaseInventoryCommand { OrderId = saga.OrderId });
                        break;
                    
                    case "ProcessPayment":
                        await SendCommandAsync<RefundPaymentCommand, PaymentRefunded>(
                            new RefundPaymentCommand { OrderId = saga.OrderId });
                        break;
                    
                    case "CreateShipment":
                        await SendCommandAsync<CancelShipmentCommand, ShipmentCancelled>(
                            new CancelShipmentCommand { OrderId = saga.OrderId });
                        break;
                }
                
                step.Status = StepStatus.Compensated;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, 
                    "Failed to compensate step {StepName} for saga {SagaId}", 
                    step.Name, saga.Id);
                step.Status = StepStatus.CompensationFailed;
            }
        }
        
        saga.State = SagaState.Compensated;
        saga.CompletedAt = DateTime.UtcNow;
        await _sagaRepository.UpdateAsync(saga);
    }
}
```

---

## Circuit Breaker Implementation

```csharp
public class CircuitBreaker
{
    private readonly CircuitBreakerOptions _options;
    private CircuitState _state = CircuitState.Closed;
    private int _failureCount = 0;
    private DateTime _lastFailureTime;
    private DateTime _openedAt;
    
    public async Task<T> ExecuteAsync<T>(Func<Task<T>> operation)
    {
        if (_state == CircuitState.Open)
        {
            var openDuration = DateTime.UtcNow - _openedAt;
            if (openDuration < _options.OpenTimeout)
            {
                throw new CircuitBreakerOpenException("Circuit breaker is open");
            }
            
            // Transition to half-open
            _state = CircuitState.HalfOpen;
        }
        
        try
        {
            var result = await operation();
            
            // Success - reset or close circuit
            if (_state == CircuitState.HalfOpen)
            {
                _state = CircuitState.Closed;
                _failureCount = 0;
            }
            
            return result;
        }
        catch (Exception ex)
        {
            RecordFailure();
            
            if (ShouldOpenCircuit())
            {
                _state = CircuitState.Open;
                _openedAt = DateTime.UtcNow;
            }
            
            throw;
        }
    }
    
    private void RecordFailure()
    {
        _failureCount++;
        _lastFailureTime = DateTime.UtcNow;
    }
    
    private bool ShouldOpenCircuit()
    {
        var threshold = _options.FailureThreshold;
        var window = _options.SamplingWindow;
        
        if (_failureCount >= threshold)
        {
            var windowStart = DateTime.UtcNow - window;
            return _lastFailureTime >= windowStart;
        }
        
        return false;
    }
}
```

This implementation guide covers the essential patterns. Continue with testing strategies?

