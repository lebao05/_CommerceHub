using BuildingBlocks.Core.CQRS;
using BuildingBlocks.Core.Domain.Shared;
using MediatR;
using ProductCatalog.Domain.Entities;
using ProductCatalog.Domain.Errors;
using ProductCatalog.Domain.Repositories;

namespace ProductCatalog.Application.Commands.CreateProduct;

public class CreateProductCommandHandler : IRequestHandler<CreateProductCommand, Result<Guid>>
{
    private readonly IProductRepository _productRepository;
    private readonly ICategoryRepository _categoryRepository;

    public CreateProductCommandHandler(
        IProductRepository productRepository,
        ICategoryRepository categoryRepository)
    {
        _productRepository = productRepository;
        _categoryRepository = categoryRepository;
    }

    public async Task<Result<Guid>> Handle(CreateProductCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return Result<Guid>.Failure(ProductErrors.NameRequired);
        }

        if (string.IsNullOrWhiteSpace(request.Slug))
        {
            return Result<Guid>.Failure(ProductErrors.SlugRequired);
        }

        if (!await _categoryRepository.AnyAsync(c => c.Id == request.CategoryId, cancellationToken))
        {
            return Result<Guid>.Failure(ProductErrors.CategoryNotFound);
        }

        if (await _productRepository.SlugExistsAsync(request.Slug, cancellationToken))
        {
            return Result<Guid>.Failure(ProductErrors.SlugAlreadyExists);
        }

        var product = Product.Create(
            request.Name,
            request.Slug,
            request.CategoryId,
            request.Description
        );

        await _productRepository.AddAsync(product, cancellationToken: cancellationToken);

        return Result<Guid>.Success(product.Id);
    }
}

public record CreateProductCommandTx(
    string Name,
    string Slug,
    Guid CategoryId,
    string? Description = null
) : CreateProductCommand(Name, Slug, CategoryId, Description), ITxRequest;
