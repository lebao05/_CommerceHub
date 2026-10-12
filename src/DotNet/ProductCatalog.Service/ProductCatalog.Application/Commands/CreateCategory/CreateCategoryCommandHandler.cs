using BuildingBlocks.Core.CQRS;
using BuildingBlocks.Core.Domain.Shared;
using MediatR;
using ProductCatalog.Domain.Entities;
using ProductCatalog.Domain.Errors;
using ProductCatalog.Domain.Repositories;

namespace ProductCatalog.Application.Commands.CreateCategory;

public class CreateCategoryCommandHandler : IRequestHandler<CreateCategoryCommand, Result<Guid>>
{
    private readonly ICategoryRepository _categoryRepository;

    public CreateCategoryCommandHandler(ICategoryRepository categoryRepository)
    {
        _categoryRepository = categoryRepository;
    }

    public async Task<Result<Guid>> Handle(CreateCategoryCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return Result<Guid>.Failure(CategoryErrors.NameRequired);
        }

        if (request.ParentId.HasValue &&
            !await _categoryRepository.AnyAsync(c => c.Id == request.ParentId, cancellationToken))
        {
            return Result<Guid>.Failure(CategoryErrors.NotFound);
        }

        var category = Category.Create(
            request.Name,
            request.ParentId,
            request.Description,
            request.IsActive
        );

        await _categoryRepository.AddAsync(category, cancellationToken: cancellationToken);

        return Result<Guid>.Success(category.Id);
    }
}

public record CreateCategoryCommandTx(
    string Name,
    Guid? ParentId,
    string? Description,
    bool IsActive = true
) : CreateCategoryCommand(Name, ParentId, Description, IsActive), ITxRequest;
