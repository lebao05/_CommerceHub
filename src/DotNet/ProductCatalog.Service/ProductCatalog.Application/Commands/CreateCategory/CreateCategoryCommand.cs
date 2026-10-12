using BuildingBlocks.Core.Domain.Shared;
using MediatR;

namespace ProductCatalog.Application.Commands.CreateCategory;

public record CreateCategoryCommand(
    string Name,
    Guid? ParentId,
    string? Description,
    bool IsActive = true
) : IRequest<Result<Guid>>;
