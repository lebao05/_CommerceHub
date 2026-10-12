using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ProductCatalog.Domain.Entities;
using BuildingBlocks.Infrastructure.EfCore;

namespace ProductCatalog.Infrastructure.Persistence.Configurations;

public class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.ToTable("categories");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Id)
            .HasDefaultValueSql(Consts.UuidAlgorithm)
            .IsRequired();

        builder.Property(c => c.Name)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(c => c.Description)
            .HasMaxLength(500);

        builder.Property(c => c.ParentId)
            .IsRequired(false);

        builder.Property(c => c.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(c => c.Created)
            .HasDefaultValueSql(Consts.DateAlgorithm)
            .IsRequired();

        builder.Property(c => c.Updated)
            .IsRequired(false);

        builder.HasIndex(c => c.Name);
        builder.HasIndex(c => c.ParentId);
        builder.HasIndex(c => c.IsActive);
    }
}
