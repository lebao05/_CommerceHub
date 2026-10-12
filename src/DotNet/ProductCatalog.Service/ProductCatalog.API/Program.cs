using MediatR;
using BuildingBlocks.Infrastructure.Responses;
using ProductCatalog.Application;
using ProductCatalog.Application.Commands.CreateCategory;
using ProductCatalog.Application.Commands.UpdateCategory;
using ProductCatalog.Application.Commands.DeleteCategory;
using ProductCatalog.Application.Queries.GetAllCategories;
using ProductCatalog.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
var connectionString = builder.Configuration.GetConnectionString("ProductCatalogDb")
    ?? throw new InvalidOperationException("Connection string 'ProductCatalogDb' not found.");

builder.Services.AddApplication();
builder.Services.AddInfrastructure(connectionString);

builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// Category Minimal APIs
var categories = app.MapGroup("/api/categories").WithTags("Categories");

categories.MapGet("/", async (IMediator mediator) =>
{
    var query = new GetAllCategoriesQuery();
    var result = await mediator.Send(query);

    return result.ToHttpResult();
})
.WithName("GetAllCategories")
.WithOpenApi();

categories.MapPost("/", async (CreateCategoryRequest request, IMediator mediator) =>
{
    var command = new CreateCategoryCommandTx(
        request.Name,
        request.ParentId,
        request.Description,
        request.IsActive
    );

    var result = await mediator.Send(command);

    return result.ToHttpResult(categoryId =>
        Results.Created($"/api/categories/{categoryId}", new { id = categoryId }));
})
.WithName("CreateCategory")
.WithOpenApi();

categories.MapPut("/{id}", async (Guid id, UpdateCategoryRequest request, IMediator mediator) =>
{
    var command = new UpdateCategoryCommandTx(
        id,
        request.Name,
        request.Description,
        request.IsActive
    );

    var result = await mediator.Send(command);

    return result.ToHttpResult();
})
.WithName("UpdateCategory")
.WithOpenApi();

categories.MapDelete("/{id}", async (Guid id, IMediator mediator) =>
{
    var command = new DeleteCategoryCommandTx(id);
    var result = await mediator.Send(command);

    return result.ToHttpResult();
})
.WithName("DeleteCategory")
.WithOpenApi();

app.Run();

// Request DTOs
public record CreateCategoryRequest(
    string Name,
    Guid? ParentId,
    string? Description,
    bool IsActive = true
);

public record UpdateCategoryRequest(
    string Name,
    string? Description,
    bool IsActive
);
