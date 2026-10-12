using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ProductCatalog.Domain.Entities;
using BuildingBlocks.Infrastructure.EfCore;

namespace ProductCatalog.Infrastructure.Persistence.Configurations;

public class ProductOptionValueConfiguration : IEntityTypeConfiguration<ProductOptionValue>
{
    public void Configure(EntityTypeBuilder<ProductOptionValue> builder)
    {
        builder.ToTable("product_option_values");

        builder.HasKey(pov => pov.Id);

        builder.Property(pov => pov.Id)
            .HasDefaultValueSql(Consts.UuidAlgorithm)
            .IsRequired();

        builder.Property(pov => pov.ProductOptionId)
            .IsRequired();

        builder.Property(pov => pov.Value)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(pov => pov.Created)
            .HasDefaultValueSql(Consts.DateAlgorithm)
            .IsRequired();

        builder.Property(pov => pov.Updated)
            .IsRequired(false);

        builder.HasIndex(pov => pov.ProductOptionId);
    }
}
