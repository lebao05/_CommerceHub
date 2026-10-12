using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ProductCatalog.Domain.Entities;

namespace ProductCatalog.Infrastructure.Persistence.Configurations;

public class ProductVariantOptionConfiguration : IEntityTypeConfiguration<ProductVariantOption>
{
    public void Configure(EntityTypeBuilder<ProductVariantOption> builder)
    {
        builder.ToTable("product_variant_options");

        builder.HasKey(pvo => new { pvo.VariantId, pvo.OptionValueId });

        builder.Property(pvo => pvo.VariantId)
            .IsRequired();

        builder.Property(pvo => pvo.OptionValueId)
            .IsRequired();

        builder.HasIndex(pvo => pvo.VariantId);
        builder.HasIndex(pvo => pvo.OptionValueId);
    }
}
