using BuildingBlocks.Core.Domain.Shared;

namespace ProductCatalog.Domain.Errors;

/// <summary>
/// The set of failures a Category operation can report. Each is a single shared instance so that
/// callers can compare with <c>==</c> and tests can assert on a specific error.
/// Messages are deliberately fixed text with no interpolated values: <see cref="Error"/> compares on
/// code and message, so a per-id message would make every instance unequal to every other.
/// </summary>
public static class CategoryErrors
{
    public static readonly Error NameRequired =
        new("Category.NameRequired", "Category name is required.");

    public static readonly Error NotFound =
        new("Category.NotFound", "The requested category was not found.");

    public static readonly Error AlreadyExists =
        new("Category.AlreadyExists", "A category with the same name already exists.");

    public static readonly Error HasChildren =
        new("Category.HasChildren", "The category cannot be deleted because it still has child categories.");
}
