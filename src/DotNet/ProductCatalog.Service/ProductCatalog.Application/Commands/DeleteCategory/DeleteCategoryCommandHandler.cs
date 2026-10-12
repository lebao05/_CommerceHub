using BuildingBlocks.Core.CQRS;
using BuildingBlocks.Core.Domain.Shared;
using MediatR;
using ProductCatalog.Domain.Errors;
using ProductCatalog.Domain.Repositories;

namespace ProductCatalog.Application.Commands.DeleteCategory;

public class DeleteCategoryCommandHandler : IRequestHandler<DeleteCategoryCommand, Result>
{
    private readonly ICategoryRepository _categoryRepository;

    public DeleteCategoryCommandHandler(ICategoryRepository categoryRepository)
    {
        _categoryRepository = categoryRepository;
    }

    public async Task<Result> Handle(DeleteCategoryCommand request, CancellationToken cancellationToken)
    {
        var category = await _categoryRepository.FindById(request.Id, cancellationToken);

        if (category is null)
        {
            return Result.Failure(CategoryErrors.NotFound);
        }

        // Deleting a parent would orphan its children, so refuse instead of leaving dangling rows.
        if (await _categoryRepository.AnyAsync(c => c.ParentId == request.Id, cancellationToken))
        {
            return Result.Failure(CategoryErrors.HasChildren);
        }

        await _categoryRepository.DeleteAsync(category, cancellationToken: cancellationToken);

        return Result.Success();
    }
}

public record DeleteCategoryCommandTx(Guid Id) : DeleteCategoryCommand(Id), ITxRequest;
