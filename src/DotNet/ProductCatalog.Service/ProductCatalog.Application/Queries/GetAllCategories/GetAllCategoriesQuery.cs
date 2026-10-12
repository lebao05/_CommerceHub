using BuildingBlocks.Core.Domain.Shared;
using MediatR;

namespace ProductCatalog.Application.Queries.GetAllCategories;

public record GetAllCategoriesQuery : IRequest<Result<List<CategoryDto>>>;
