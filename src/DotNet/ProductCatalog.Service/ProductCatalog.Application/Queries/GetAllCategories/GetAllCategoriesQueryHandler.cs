using BuildingBlocks.Core.Domain.Shared;
using MediatR;
using ProductCatalog.Domain.Entities;
using ProductCatalog.Domain.Repositories;

namespace ProductCatalog.Application.Queries.GetAllCategories;

public class GetAllCategoriesQueryHandler : IRequestHandler<GetAllCategoriesQuery, Result<List<CategoryDto>>>
{
    private readonly ICategoryRepository _categoryRepository;

    public GetAllCategoriesQueryHandler(ICategoryRepository categoryRepository)
    {
        _categoryRepository = categoryRepository;
    }

    public async Task<Result<List<CategoryDto>>> Handle(GetAllCategoriesQuery request, CancellationToken cancellationToken)
    {
        var categories = await _categoryRepository.FindAsync(cancellationToken: cancellationToken);

        // FindAsync returns an empty list when nothing matches, which is a valid empty page rather
        // than a failure.
        var dtos = categories.Select(c => new CategoryDto
        {
            Id = c.Id,
            ParentId = c.ParentId,
            Name = c.Name,
            Description = c.Description,
            IsActive = c.IsActive,
            Created = c.Created,
            Updated = c.Updated
        }).ToList();

        return Result<List<CategoryDto>>.Success(dtos);
    }
}
