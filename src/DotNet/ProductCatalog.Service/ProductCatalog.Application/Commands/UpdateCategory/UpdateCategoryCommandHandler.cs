using BuildingBlocks.Core.CQRS;
using BuildingBlocks.Core.Domain.Shared;
using MediatR;
using ProductCatalog.Domain.Errors;
using ProductCatalog.Domain.Repositories;

namespace ProductCatalog.Application.Commands.UpdateCategory;

public class UpdateCategoryCommandHandler : IRequestHandler<UpdateCategoryCommand, Result>
{
    private readonly ICategoryRepository _categoryRepository;

    public UpdateCategoryCommandHandler(ICategoryRepository categoryRepository)
    {
        _categoryRepository = categoryRepository;
    }

    public async Task<Result> Handle(UpdateCategoryCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return Result.Failure(CategoryErrors.NameRequired);
        }

        var category = await _categoryRepository.FindById(request.Id, cancellationToken);

        if (category is null)
        {
            return Result.Failure(CategoryErrors.NotFound);
        }

        category.UpdateBasicInfo(request.Name, request.Description);
        category.SetActive(request.IsActive);

        await _categoryRepository.EditAsync(category, cancellationToken: cancellationToken);

        return Result.Success();
    }
}

public record UpdateCategoryCommandTx(
    Guid Id,
    string Name,
    string? Description,
    bool IsActive
) : UpdateCategoryCommand(Id, Name, Description, IsActive), ITxRequest;
