using BuildingBlocks.Core.Domain.Shared;

namespace ProductCatalog.Domain.Errors;

/// <summary>
/// The set of failures a Product operation can report. Each is a single shared instance so that
/// callers can compare with <c>==</c> and tests can assert on a specific error.
/// Messages are deliberately fixed text with no interpolated values: <see cref="Error"/> compares on
/// code and message, so a per-id message would make every instance unequal to every other.
/// </summary>
public static class ProductErrors
{
    public static readonly Error NameRequired =
        new("Product.NameRequired", "Product name is required.");

    public static readonly Error SlugRequired =
        new("Product.SlugRequired", "Product slug is required.");

    public static readonly Error NotFound =
        new("Product.NotFound", "The requested product was not found.");

    public static readonly Error CategoryNotFound =
        new("Product.CategoryNotFound", "The specified category was not found.");

    public static readonly Error SlugAlreadyExists =
        new("Product.SlugAlreadyExists", "A product with the same slug already exists.");
}
