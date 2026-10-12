using BuildingBlocks.Core.Domain.Shared;
using MediatR;

namespace ProductCatalog.Application.Commands.DeleteCategory;

public record DeleteCategoryCommand(Guid Id) : IRequest<Result>;
