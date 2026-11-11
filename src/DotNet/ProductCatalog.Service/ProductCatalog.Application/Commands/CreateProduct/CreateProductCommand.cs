using BuildingBlocks.Core.Domain.Shared;
using MediatR;

namespace ProductCatalog.Application.Commands.CreateProduct;

public record CreateProductCommand(
    string Name,
    string Slug,
    Guid CategoryId,
    string? Description = null
) : IRequest<Result<Guid>>;
