# Clean Architecture Implementation Guide for .NET Microservices

This guide provides detailed implementation examples for each layer of a microservice using Clean Architecture.

## Architecture Layers

```
┌─────────────────────────────────────────┐
│          API Layer (Presentation)        │ ← Controllers, Middleware
├─────────────────────────────────────────┤
│        Application Layer                 │ ← Use Cases, DTOs, Services
├─────────────────────────────────────────┤
│          Domain Layer                    │ ← Entities, Business Logic
├─────────────────────────────────────────┤
│       Infrastructure Layer               │ ← Data Access, External APIs
└─────────────────────────────────────────┘
```

---

## Example: Product Service Implementation

### 1. Domain Layer (Product.Domain)

#### Entities/Product.cs
```csharp
using BuildingBlocks.Common.Models;

namespace Product.Domain.Entities;

public class Product : AuditableEntity
{
    public Guid Id { get; private set; }
    public string Name { get; private set; }
    public string Description { get; private set; }
    public string SKU { get; private set; }
    public decimal Price { get; private set; }
    public ProductStatus Status { get; private set; }
    public Guid CategoryId { get; private set; }
    public Guid? BrandId { get; private set; }
    
    // Navigation properties
    public Category Category { get; private set; }
    public Brand Brand { get; private set; }
    public ICollection<ProductImage> Images { get; private set; }
    public ICollection<ProductVariant> Variants { get; private set; }
    
    // Domain events
    private readonly List<IDomainEvent> _domainEvents = new();
    public IReadOnlyCollection<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();

    private Product() { } // EF Core

    public static Product Create(
        string name,
        string description,
        string sku,
        decimal price,
        Guid categoryId,
        Guid? brandId = null)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("Product name is required");
        
        if (price <= 0)
            throw new DomainException("Price must be greater than zero");
        
        var product = new Product
        {
            Id = Guid.NewGuid(),
            Name = name,
            Description = description,
            SKU = sku,
            Price = price,
            Status = ProductStatus.Draft,
            CategoryId = categoryId,
            BrandId = brandId,
            Images = new List<ProductImage>(),
            Variants = new List<ProductVariant>()
        };
        
        product.AddDomainEvent(new ProductCreatedEvent(product.Id, product.Name, product.Price));
        
        return product;
    }

    public void UpdatePrice(decimal newPrice)
    {
        if (newPrice <= 0)
            throw new DomainException("Price must be greater than zero");
        
        var oldPrice = Price;
        Price = newPrice;
        
        AddDomainEvent(new ProductPriceUpdatedEvent(Id, oldPrice, newPrice));
    }

    public void Activate()
    {
        if (Status == ProductStatus.Active)
            return;
        
        Status = ProductStatus.Active;
        AddDomainEvent(new ProductStatusChangedEvent(Id, Status));
    }

    public void Deactivate()
    {
        Status = ProductStatus.Inactive;
        AddDomainEvent(new ProductStatusChangedEvent(Id, Status));
    }

    public void AddImage(string imageUrl, bool isPrimary = false)
    {
        var image = ProductImage.Create(Id, imageUrl, Images.Count, isPrimary);
        Images.Add(image);
    }

    private void AddDomainEvent(IDomainEvent eventItem)
    {
        _domainEvents.Add(eventItem);
    }

    public void ClearDomainEvents()
    {
        _domainEvents.Clear();
    }
}
```

#### Enums/ProductStatus.cs
```csharp
namespace Product.Domain.Enums;

public enum ProductStatus
{
    Draft = 0,
    Active = 1,
    Inactive = 2,
    Deleted = 3
}
```

#### Events/ProductCreatedEvent.cs
```csharp
using BuildingBlocks.Common.Models;

namespace Product.Domain.Events;

public record ProductCreatedEvent(
    Guid ProductId,
    string Name,
    decimal Price) : IDomainEvent;

public record ProductPriceUpdatedEvent(
    Guid ProductId,
    decimal OldPrice,
    decimal NewPrice) : IDomainEvent;

public record ProductStatusChangedEvent(
    Guid ProductId,
    ProductStatus Status) : IDomainEvent;
```

#### Interfaces/IProductRepository.cs
```csharp
namespace Product.Domain.Interfaces;

public interface IProductRepository
{
    Task<Product> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Product> GetBySkuAsync(string sku, CancellationToken cancellationToken = default);
    Task<PagedResult<Product>> GetAllAsync(
        int pageNumber, 
        int pageSize, 
        CancellationToken cancellationToken = default);
    Task<PagedResult<Product>> SearchAsync(
        string searchTerm,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default);
    Task AddAsync(Product product, CancellationToken cancellationToken = default);
    void Update(Product product);
    void Delete(Product product);
}
```

---

### 2. Application Layer (Product.Application)

#### DTOs/ProductDto.cs
```csharp
namespace Product.Application.DTOs;

public record ProductDto(
    Guid Id,
    string Name,
    string Description,
    string SKU,
    decimal Price,
    string Status,
    Guid CategoryId,
    string CategoryName,
    Guid? BrandId,
    string BrandName,
    List<ProductImageDto> Images,
    DateTime CreatedAt,
    DateTime? UpdatedAt);

public record ProductImageDto(
    Guid Id,
    string ImageUrl,
    int DisplayOrder,
    bool IsPrimary);

public record CreateProductRequest(
    string Name,
    string Description,
    string SKU,
    decimal Price,
    Guid CategoryId,
    Guid? BrandId);

public record UpdateProductRequest(
    string Name,
    string Description,
    decimal Price,
    Guid CategoryId,
    Guid? BrandId);

public record UpdateProductPriceRequest(
    decimal Price);
```

#### Commands/CreateProductCommand.cs
```csharp
using MediatR;

namespace Product.Application.Commands;

public record CreateProductCommand(
    string Name,
    string Description,
    string SKU,
    decimal Price,
    Guid CategoryId,
    Guid? BrandId) : IRequest<ProductDto>;

public class CreateProductCommandHandler : IRequestHandler<CreateProductCommand, ProductDto>
{
    private readonly IProductRepository _productRepository;
    private readonly ICategoryRepository _categoryRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ILogger<CreateProductCommandHandler> _logger;

    public CreateProductCommandHandler(
        IProductRepository productRepository,
        ICategoryRepository categoryRepository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ILogger<CreateProductCommandHandler> logger)
    {
        _productRepository = productRepository;
        _categoryRepository = categoryRepository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<ProductDto> Handle(
        CreateProductCommand request, 
        CancellationToken cancellationToken)
    {
        // Validate category exists
        var category = await _categoryRepository.GetByIdAsync(request.CategoryId, cancellationToken);
        if (category == null)
            throw new NotFoundException($"Category {request.CategoryId} not found");

        // Check SKU uniqueness
        var existingProduct = await _productRepository.GetBySkuAsync(request.SKU, cancellationToken);
        if (existingProduct != null)
            throw new BusinessException($"Product with SKU {request.SKU} already exists");

        // Create product entity
        var product = Domain.Entities.Product.Create(
            request.Name,
            request.Description,
            request.SKU,
            request.Price,
            request.CategoryId,
            request.BrandId);

        // Save to database
        await _productRepository.AddAsync(product, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Product created with ID {ProductId} and SKU {SKU}", 
            product.Id, 
            product.SKU);

        // Map to DTO and return
        return _mapper.Map<ProductDto>(product);
    }
}
```

#### Queries/GetProductByIdQuery.cs
```csharp
using MediatR;

namespace Product.Application.Queries;

public record GetProductByIdQuery(Guid ProductId) : IRequest<ProductDto>;

public class GetProductByIdQueryHandler : IRequestHandler<GetProductByIdQuery, ProductDto>
{
    private readonly IProductRepository _productRepository;
    private readonly ICacheService _cacheService;
    private readonly IMapper _mapper;

    public GetProductByIdQueryHandler(
        IProductRepository productRepository,
        ICacheService cacheService,
        IMapper mapper)
    {
        _productRepository = productRepository;
        _cacheService = cacheService;
        _mapper = mapper;
    }

    public async Task<ProductDto> Handle(
        GetProductByIdQuery request, 
        CancellationToken cancellationToken)
    {
        // Check cache first
        var cacheKey = $"product:{request.ProductId}";
        var cachedProduct = await _cacheService.GetAsync<ProductDto>(cacheKey);
        
        if (cachedProduct != null)
            return cachedProduct;

        // Get from database
        var product = await _productRepository.GetByIdAsync(request.ProductId, cancellationToken);
        
        if (product == null)
            throw new NotFoundException($"Product {request.ProductId} not found");

        var productDto = _mapper.Map<ProductDto>(product);

        // Cache for 5 minutes
        await _cacheService.SetAsync(cacheKey, productDto, TimeSpan.FromMinutes(5));

        return productDto;
    }
}
```

#### EventHandlers/ProductCreatedEventHandler.cs
```csharp
using MediatR;
using BuildingBlocks.EventBus.Abstractions;

namespace Product.Application.EventHandlers;

public class ProductCreatedEventHandler : INotificationHandler<ProductCreatedEvent>
{
    private readonly IEventBus _eventBus;
    private readonly ILogger<ProductCreatedEventHandler> _logger;

    public ProductCreatedEventHandler(
        IEventBus eventBus,
        ILogger<ProductCreatedEventHandler> logger)
    {
        _eventBus = eventBus;
        _logger = logger;
    }

    public async Task Handle(ProductCreatedEvent notification, CancellationToken cancellationToken)
    {
        // Publish integration event to message broker
        var integrationEvent = new ProductCreatedIntegrationEvent(
            notification.ProductId,
            notification.Name,
            notification.Price,
            DateTime.UtcNow);

        await _eventBus.PublishAsync(integrationEvent);

        _logger.LogInformation(
            "Published ProductCreatedIntegrationEvent for product {ProductId}", 
            notification.ProductId);
    }
}
```

#### Validators/CreateProductCommandValidator.cs
```csharp
using FluentValidation;

namespace Product.Application.Validators;

public class CreateProductCommandValidator : AbstractValidator<CreateProductCommand>
{
    public CreateProductCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Product name is required")
            .MaximumLength(200).WithMessage("Product name cannot exceed 200 characters");

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Description is required")
            .MaximumLength(2000).WithMessage("Description cannot exceed 2000 characters");

        RuleFor(x => x.SKU)
            .NotEmpty().WithMessage("SKU is required")
            .MaximumLength(50).WithMessage("SKU cannot exceed 50 characters")
            .Matches("^[A-Z0-9-]+$").WithMessage("SKU must contain only uppercase letters, numbers, and hyphens");

        RuleFor(x => x.Price)
            .GreaterThan(0).WithMessage("Price must be greater than zero")
            .LessThan(1000000).WithMessage("Price cannot exceed 1,000,000");

        RuleFor(x => x.CategoryId)
            .NotEmpty().WithMessage("Category is required");
    }
}
```

---

### 3. Infrastructure Layer (Product.Infrastructure)

#### Data/ProductDbContext.cs
```csharp
using Microsoft.EntityFrameworkCore;
using Product.Domain.Entities;
using BuildingBlocks.Common.Models;

namespace Product.Infrastructure.Data;

public class ProductDbContext : DbContext
{
    public ProductDbContext(DbContextOptions<ProductDbContext> options) : base(options)
    {
    }

    public DbSet<Domain.Entities.Product> Products { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<Brand> Brands { get; set; }
    public DbSet<ProductImage> ProductImages { get; set; }
    public DbSet<OutboxMessage> OutboxMessages { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ProductDbContext).Assembly);
        
        base.OnModelCreating(modelBuilder);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        // Set audit fields
        foreach (var entry in ChangeTracker.Entries<AuditableEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = DateTime.UtcNow;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                    break;
            }
        }

        // Publish domain events to outbox
        var domainEntities = ChangeTracker.Entries<BaseEntity>()
            .Where(x => x.Entity.DomainEvents != null && x.Entity.DomainEvents.Any())
            .ToList();

        var domainEvents = domainEntities
            .SelectMany(x => x.Entity.DomainEvents)
            .ToList();

        domainEntities.ForEach(entity => entity.Entity.ClearDomainEvents());

        // Save changes
        var result = await base.SaveChangesAsync(cancellationToken);

        // Write events to outbox table
        foreach (var domainEvent in domainEvents)
        {
            var outboxMessage = new OutboxMessage
            {
                Id = Guid.NewGuid(),
                EventType = domainEvent.GetType().Name,
                Payload = JsonSerializer.Serialize(domainEvent, domainEvent.GetType()),
                CreatedAt = DateTime.UtcNow
            };

            await OutboxMessages.AddAsync(outboxMessage, cancellationToken);
        }

        await base.SaveChangesAsync(cancellationToken);

        return result;
    }
}
```

#### Data/Configurations/ProductConfiguration.cs
```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Product.Domain.Entities;

namespace Product.Infrastructure.Data.Configurations;

public class ProductConfiguration : IEntityTypeConfiguration<Domain.Entities.Product>
{
    public void Configure(EntityTypeBuilder<Domain.Entities.Product> builder)
    {
        builder.ToTable("Products");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(p => p.Description)
            .HasMaxLength(2000);

        builder.Property(p => p.SKU)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(p => p.SKU)
            .IsUnique();

        builder.Property(p => p.Price)
            .HasPrecision(18, 2);

        builder.Property(p => p.Status)
            .HasConversion<string>();

        // Relationships
        builder.HasOne(p => p.Category)
            .WithMany()
            .HasForeignKey(p => p.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.Brand)
            .WithMany()
            .HasForeignKey(p => p.BrandId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(p => p.Images)
            .WithOne()
            .HasForeignKey("ProductId")
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(p => p.Variants)
            .WithOne()
            .HasForeignKey("ProductId")
            .OnDelete(DeleteBehavior.Cascade);

        // Ignore domain events
        builder.Ignore(p => p.DomainEvents);

        // Audit fields
        builder.Property(p => p.CreatedAt)
            .IsRequired();

        builder.Property(p => p.UpdatedAt);
    }
}
```

#### Repositories/ProductRepository.cs
```csharp
using Microsoft.EntityFrameworkCore;
using Product.Domain.Entities;
using Product.Domain.Interfaces;
using Product.Infrastructure.Data;

namespace Product.Infrastructure.Repositories;

public class ProductRepository : IProductRepository
{
    private readonly ProductDbContext _context;

    public ProductRepository(ProductDbContext context)
    {
        _context = context;
    }

    public async Task<Domain.Entities.Product> GetByIdAsync(
        Guid id, 
        CancellationToken cancellationToken = default)
    {
        return await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
    }

    public async Task<Domain.Entities.Product> GetBySkuAsync(
        string sku, 
        CancellationToken cancellationToken = default)
    {
        return await _context.Products
            .FirstOrDefaultAsync(p => p.SKU == sku, cancellationToken);
    }

    public async Task<PagedResult<Domain.Entities.Product>> GetAllAsync(
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Products
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .Where(p => p.Status == ProductStatus.Active)
            .OrderByDescending(p => p.CreatedAt);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<Domain.Entities.Product>(
            items,
            totalCount,
            pageNumber,
            pageSize);
    }

    public async Task<PagedResult<Domain.Entities.Product>> SearchAsync(
        string searchTerm,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Products
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .Where(p => p.Status == ProductStatus.Active &&
                       (p.Name.Contains(searchTerm) ||
                        p.Description.Contains(searchTerm) ||
                        p.SKU.Contains(searchTerm)));

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<Domain.Entities.Product>(
            items,
            totalCount,
            pageNumber,
            pageSize);
    }

    public async Task AddAsync(
        Domain.Entities.Product product, 
        CancellationToken cancellationToken = default)
    {
        await _context.Products.AddAsync(product, cancellationToken);
    }

    public void Update(Domain.Entities.Product product)
    {
        _context.Products.Update(product);
    }

    public void Delete(Domain.Entities.Product product)
    {
        product.Deactivate();
        _context.Products.Update(product);
    }
}
```

---

### 4. API Layer (Product.API)

#### Controllers/ProductsController.cs
```csharp
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Product.Application.Commands;
using Product.Application.Queries;
using Product.Application.DTOs;

namespace Product.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<ProductsController> _logger;

    public ProductsController(IMediator mediator, ILogger<ProductsController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Get product by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProductDto>> GetById(Guid id)
    {
        var query = new GetProductByIdQuery(id);
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Get all products (paginated)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<ProductDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<ProductDto>>> GetAll(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20)
    {
        var query = new GetProductsQuery(pageNumber, pageSize);
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Create new product
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin,Seller")]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ProductDto>> Create([FromBody] CreateProductRequest request)
    {
        var command = new CreateProductCommand(
            request.Name,
            request.Description,
            request.SKU,
            request.Price,
            request.CategoryId,
            request.BrandId);

        var result = await _mediator.Send(command);

        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    /// <summary>
    /// Update product
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Seller")]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProductDto>> Update(
        Guid id,
        [FromBody] UpdateProductRequest request)
    {
        var command = new UpdateProductCommand(
            id,
            request.Name,
            request.Description,
            request.Price,
            request.CategoryId,
            request.BrandId);

        var result = await _mediator.Send(command);

        return Ok(result);
    }

    /// <summary>
    /// Update product price
    /// </summary>
    [HttpPatch("{id}/price")]
    [Authorize(Roles = "Admin,Seller")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> UpdatePrice(
        Guid id,
        [FromBody] UpdateProductPriceRequest request)
    {
        var command = new UpdateProductPriceCommand(id, request.Price);
        await _mediator.Send(command);
        return NoContent();
    }

    /// <summary>
    /// Delete product (soft delete)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var command = new DeleteProductCommand(id);
        await _mediator.Send(command);
        return NoContent();
    }
}
```

#### Program.cs
```csharp
using Product.API.Extensions;
using Product.Application;
using Product.Infrastructure;
using BuildingBlocks.EventBus;
using BuildingBlocks.Logging;
using BuildingBlocks.Observability;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add application services
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration);

// Add Building Blocks
builder.Services.AddEventBus(builder.Configuration);
builder.Services.AddCaching(builder.Configuration);
builder.Services.AddCustomLogging();
builder.Services.AddObservability(builder.Configuration);

// Add authentication
builder.Services.AddJwtAuthentication(builder.Configuration);

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

// Custom middleware
app.UseCorrelationId();
app.UseExceptionHandling();

app.MapControllers();

// Run migrations
await app.RunMigrationsAsync();

app.Run();
```

---

This provides a complete Clean Architecture implementation. Would you like me to continue with:

1. Building Blocks implementations?
2. Angular service examples?
3. Complete Docker setup?
4. Integration patterns between services?

