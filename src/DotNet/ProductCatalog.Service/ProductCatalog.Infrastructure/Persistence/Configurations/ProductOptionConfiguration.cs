using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ProductCatalog.Domain.Entities;
using BuildingBlocks.Infrastructure.EfCore;

namespace ProductCatalog.Infrastructure.Persistence.Configurations;

public class ProductOptionConfiguration : IEntityTypeConfiguration<ProductOption>
{
    public void Configure(EntityTypeBuilder<ProductOption> builder)
    {
        builder.ToTable("product_options");

        builder.HasKey(po => po.Id);

        builder.Property(po => po.Id)
            .HasDefaultValueSql(Consts.UuidAlgorithm)
            .IsRequired();

        builder.Property(po => po.ProductId)
            .IsRequired();

        builder.Property(po => po.Name)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(po => po.Created)
            .HasDefaultValueSql(Consts.DateAlgorithm)
            .IsRequired();

        builder.Property(po => po.Updated)
            .IsRequired(false);

        builder.HasMany(po => po.Values)
            .WithOne()
            .HasForeignKey(pov => pov.ProductOptionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(po => po.ProductId);
    }
}
