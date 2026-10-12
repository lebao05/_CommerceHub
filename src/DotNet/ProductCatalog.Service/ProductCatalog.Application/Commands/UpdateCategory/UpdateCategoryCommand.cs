using BuildingBlocks.Core.Domain.Shared;
using MediatR;

namespace ProductCatalog.Application.Commands.UpdateCategory;

public record UpdateCategoryCommand(
    Guid Id,
    string Name,
    string? Description,
    bool IsActive
) : IRequest<Result>;
