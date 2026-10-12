CREATE TABLE Categories (
    Id UNIQUEIDENTIFIER PRIMARY KEY,

    ParentId UNIQUEIDENTIFIER NULL,

    Name NVARCHAR(200) NOT NULL,
    Slug NVARCHAR(200) NOT NULL UNIQUE,

    Description NVARCHAR(1000) NULL,

    Level INT NOT NULL,

    IsActive BIT NOT NULL DEFAULT 1,

    DisplayOrder INT NOT NULL DEFAULT 0,

    CreatedAt DATETIME2 NOT NULL,
    UpdatedAt DATETIME2 NOT NULL,

    CONSTRAINT FK_Categories_Parent
        FOREIGN KEY (ParentId)
        REFERENCES Categories(Id),

    CONSTRAINT CK_Categories_Level
        CHECK (Level BETWEEN 1 AND 3)
);
1. Products
CREATE TABLE Products (
    Id UNIQUEIDENTIFIER PRIMARY KEY,
    Name NVARCHAR(500) NOT NULL,
    Slug NVARCHAR(500) NOT NULL UNIQUE,
    Description NVARCHAR(MAX) NULL,
    CategoryId UNIQUEIDENTIFIER NOT NULL,

    Status INT NOT NULL,
    IsFeatured BIT NOT NULL DEFAULT 0,

    Rating DECIMAL(3,2) NOT NULL DEFAULT 0,
    ReviewCount INT NOT NULL DEFAULT 0,

    CreatedAt DATETIME2 NOT NULL,
    UpdatedAt DATETIME2 NOT NULL
);

Example:

Product
--------------------------------
Id          = P001
Name        = Nike T-Shirt
2. ProductOptions

This defines what dimensions/options a product has.

CREATE TABLE ProductOptions (
    Id UNIQUEIDENTIFIER PRIMARY KEY,

    ProductId UNIQUEIDENTIFIER NOT NULL,
    Name NVARCHAR(100) NOT NULL,

    DisplayOrder INT NOT NULL DEFAULT 0,

    CreatedAt DATETIME2 NOT NULL,

    CONSTRAINT FK_ProductOptions_Product
        FOREIGN KEY (ProductId)
        REFERENCES Products(Id),

    CONSTRAINT UQ_ProductOptions_Product_Name
        UNIQUE(ProductId, Name)
);

For Nike T-Shirt:

ProductOptions
--------------------------------
Id       ProductId     Name
O001     P001          Color
O002     P001          Size

So:

Product
   │
   ├── Color
   └── Size
3. ProductOptionValues

This contains the possible values for each option.

CREATE TABLE ProductOptionValues (
    Id UNIQUEIDENTIFIER PRIMARY KEY,

    ProductOptionId UNIQUEIDENTIFIER NOT NULL,

    Value NVARCHAR(200) NOT NULL,

    DisplayOrder INT NOT NULL DEFAULT 0,

    CreatedAt DATETIME2 NOT NULL,

    CONSTRAINT FK_ProductOptionValues_ProductOption
        FOREIGN KEY (ProductOptionId)
        REFERENCES ProductOptions(Id),

    CONSTRAINT UQ_ProductOptionValues_Option_Value
        UNIQUE(ProductOptionId, Value)
);

For example:

ProductOptionValues
-----------------------------------------
Id       OptionId       Value
V001     O001           Red
V002     O001           Blue
V003     O001           Black

V004     O002           S
V005     O002           M
V006     O002           L
V007     O002           XL

Therefore:

Color
 ├── Red
 ├── Blue
 └── Black

Size
 ├── S
 ├── M
 ├── L
 └── XL
4. ProductVariants

This represents the actual sellable combination.

CREATE TABLE ProductVariants (
    Id UNIQUEIDENTIFIER PRIMARY KEY,

    ProductId UNIQUEIDENTIFIER NOT NULL,

    SKU NVARCHAR(100) NOT NULL,

    Price DECIMAL(18,2) NOT NULL,
    CompareAtPrice DECIMAL(18,2) NULL,

    IsActive BIT NOT NULL DEFAULT 1,

    DisplayOrder INT NOT NULL DEFAULT 0,

    CreatedAt DATETIME2 NOT NULL,
    UpdatedAt DATETIME2 NOT NULL,

    CONSTRAINT FK_ProductVariants_Product
        FOREIGN KEY (ProductId)
        REFERENCES Products(Id),

    CONSTRAINT UQ_ProductVariants_SKU
        UNIQUE(SKU)
);

For example:

ProductVariants
------------------------------------------------
Id       ProductId    SKU             Price

PV001    P001         NIKE-RED-S      20.00
PV002    P001         NIKE-RED-M      20.00
PV003    P001         NIKE-RED-L      20.00
PV004    P001         NIKE-RED-XL     22.00

PV005    P001         NIKE-BLUE-S     20.00
PV006    P001         NIKE-BLUE-M     20.00
PV007    P001         NIKE-BLUE-L     20.00
PV008    P001         NIKE-BLUE-XL    22.00

Each row is a specific combination.

5. ProductVariantOptions

This is the most important table.

It connects:

Variant
   ↓
Option Values
CREATE TABLE ProductVariantOptions (
    VariantId UNIQUEIDENTIFIER NOT NULL,
    OptionValueId UNIQUEIDENTIFIER NOT NULL,

    PRIMARY KEY (VariantId, OptionValueId),

    CONSTRAINT FK_ProductVariantOptions_Variant
        FOREIGN KEY (VariantId)
        REFERENCES ProductVariants(Id),

    CONSTRAINT FK_ProductVariantOptions_OptionValue
        FOREIGN KEY (OptionValueId)
        REFERENCES ProductOptionValues(Id)
);