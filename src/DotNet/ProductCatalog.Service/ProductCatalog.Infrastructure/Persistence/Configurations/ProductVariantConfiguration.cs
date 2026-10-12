using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ProductCatalog.Domain.Entities;
using BuildingBlocks.Infrastructure.EfCore;

namespace ProductCatalog.Infrastructure.Persistence.Configurations;

public class ProductVariantConfiguration : IEntityTypeConfiguration<ProductVariant>
{
    public void Configure(EntityTypeBuilder<ProductVariant> builder)
    {
        builder.ToTable("product_variants");

        builder.HasKey(pv => pv.Id);

        builder.Property(pv => pv.Id)
            .HasDefaultValueSql(Consts.UuidAlgorithm)
            .IsRequired();

        builder.Property(pv => pv.ProductId)
            .IsRequired();

        builder.Property(pv => pv.Price)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(pv => pv.CompareAtPrice)
            .HasPrecision(18, 2);

        builder.Property(pv => pv.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(pv => pv.DisplayOrder)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(pv => pv.Created)
            .HasDefaultValueSql(Consts.DateAlgorithm)
            .IsRequired();

        builder.Property(pv => pv.Updated)
            .IsRequired(false);

        builder.HasMany(pv => pv.Options)
            .WithOne()
            .HasForeignKey(pvo => pvo.VariantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(pv => pv.ProductId);
        builder.HasIndex(pv => pv.IsActive);
    }
}
