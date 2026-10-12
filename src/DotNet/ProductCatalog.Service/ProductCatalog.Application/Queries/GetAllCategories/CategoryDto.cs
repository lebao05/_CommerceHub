namespace ProductCatalog.Application.Queries.GetAllCategories;

public class CategoryDto
{
    public Guid Id { get; set; }
    public Guid? ParentId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public DateTime Created { get; set; }
    public DateTime? Updated { get; set; }
}
