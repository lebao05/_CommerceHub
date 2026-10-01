# Folder Structure Refactoring Guide

## Overview

The CommerceHub project has been refactored to organize services and components by technology stack. This allows the project to support multiple programming languages and frameworks (e.g., .NET, Java, Node.js, Python) in a clean and maintainable way.

---

## New Folder Structure

```
src/
├── ApiGateway/
│   ├── DotNet/                          # .NET-based API Gateways
│   │   └── Ocelot.Gateway/
│   └── Java/                            # Java-based API Gateways (Spring Cloud Gateway)
│       └── SpringCloudGateway/
│
├── Services/
│   ├── DotNet/                          # .NET Microservices
│   │   ├── Product/                     # Product Service (Moved)
│   │   │   ├── Product.API/
│   │   │   ├── Product.Application/
│   │   │   ├── Product.Domain/
│   │   │   ├── Product.Infrastructure/
│   │   │   └── Product.Tests/
│   │   │
│   │   ├── Order/                       # Order Service (To be created)
│   │   │   ├── Order.API/
│   │   │   ├── Order.Application/
│   │   │   ├── Order.Domain/
│   │   │   ├── Order.Infrastructure/
│   │   │   └── Order.Tests/
│   │   │
│   │   ├── Identity/                    # Identity Service
│   │   │   ├── Identity.API/
│   │   │   ├── Identity.Domain/
│   │   │   ├── Identity.Infrastructure/
│   │   │   └── Identity.Tests/
│   │   │
│   │   ├── Cart/                        # Cart Service
│   │   ├── Payment/                     # Payment Service
│   │   ├── Notification/                # Notification Service
│   │   └── Review/                      # Review Service
│   │
│   ├── Java/                            # Java Microservices (Spring Boot)
│   │   ├── inventory/                   # Inventory Service
│   │   │   ├── src/
│   │   │   ├── pom.xml
│   │   │   └── README.md
│   │   │
│   │   ├── shipping/                    # Shipping Service
│   │   └── analytics/                   # Analytics Service
│   │
│   ├── NodeJS/                          # Node.js Microservices
│   │   ├── realtime-notifications/      # WebSocket-based notifications
│   │   └── media-processing/            # Image/Video processing
│   │
│   └── Python/                          # Python Microservices
│       ├── recommendation/              # ML-based recommendations
│       └── fraud-detection/             # Fraud detection service
│
├── BuildingBlocks/
│   ├── DotNet/                          # Shared .NET libraries
│   │   ├── Common/
│   │   │   ├── Domain/                  # Shared domain primitives
│   │   │   ├── Application/             # Shared application patterns
│   │   │   └── Infrastructure/          # Shared infrastructure code
│   │   │
│   │   ├── EventBus/                    # Event-driven messaging
│   │   │   ├── EventBus.Abstractions/
│   │   │   ├── EventBus.RabbitMQ/
│   │   │   └── EventBus.AzureServiceBus/
│   │   │
│   │   └── Logging/                     # Centralized logging
│   │       └── Serilog.Extensions/
│   │
│   ├── Java/                            # Shared Java libraries
│   │   ├── common-lib/
│   │   └── event-bus-kafka/
│   │
│   └── Shared/                          # Language-agnostic shared resources
│       ├── Contracts/                   # API contracts (OpenAPI/Proto)
│       ├── Docker/                      # Shared Dockerfiles
│       └── Scripts/                     # Build/deployment scripts
│
└── Web/
    ├── DotNet/                          # .NET web applications
    │   ├── Blazor.Admin/                # Blazor Admin Dashboard
    │   └── MVC.BackOffice/              # ASP.NET Core MVC
    │
    ├── Angular/                         # Angular frontend
    │   └── commercehub-web/
    │
    └── Mobile/                          # Mobile apps
        ├── ReactNative/
        └── Flutter/
```

---

## Migration Steps

### 1. Services Migration

The Product service has already been moved from:
```
src/Services/Product/
```

To:
```
src/Services/DotNet/Product/
```

### 2. Update Project References

After moving services, you need to update project references in `.csproj` files if they reference other projects by relative paths.

**Example: Product.API.csproj**

Before:
```xml
<ItemGroup>
  <ProjectReference Include="..\Product.Application\Product.Application.csproj" />
</ItemGroup>
```

After (if needed):
```xml
<ItemGroup>
  <ProjectReference Include="..\Product.Application\Product.Application.csproj" />
</ItemGroup>
```

The relative path stays the same because the structure within the Product folder hasn't changed.

### 3. Update Solution Files

If you have a `.sln` file, update the project paths:

```powershell
# Remove old paths
dotnet sln remove src/Services/Product/Product.API/Product.API.csproj

# Add new paths
dotnet sln add src/Services/DotNet/Product/Product.API/Product.API.csproj
dotnet sln add src/Services/DotNet/Product/Product.Application/Product.Application.csproj
dotnet sln add src/Services/DotNet/Product/Product.Domain/Product.Domain.csproj
dotnet sln add src/Services/DotNet/Product/Product.Infrastructure/Product.Infrastructure.csproj
dotnet sln add src/Services/DotNet/Product/Product.Tests/Product.Tests.csproj
```

### 4. Update Docker Compose

If using Docker Compose, update the build context paths:

**Before:**
```yaml
services:
  product-api:
    build:
      context: ./src/Services/Product
      dockerfile: Product.API/Dockerfile
```

**After:**
```yaml
services:
  product-api:
    build:
      context: ./src/Services/DotNet/Product
      dockerfile: Product.API/Dockerfile
```

### 5. Update CI/CD Pipelines

Update any build scripts or CI/CD pipeline configurations that reference the old paths.

**GitHub Actions Example:**
```yaml
# Before
- name: Build Product Service
  run: dotnet build src/Services/Product/Product.API/Product.API.csproj

# After
- name: Build Product Service
  run: dotnet build src/Services/DotNet/Product/Product.API/Product.API.csproj
```

---

## Benefits of This Structure

### 1. **Multi-Technology Support**
- Easily add services in different languages
- Each technology has its own isolated folder
- Clear separation of concerns

### 2. **Scalability**
- Add new technology stacks without affecting existing ones
- Independent versioning per technology
- Technology-specific build tools and configurations

### 3. **Team Organization**
- Teams can specialize in specific technology stacks
- Easier onboarding for developers familiar with specific technologies
- Clear ownership boundaries

### 4. **Flexibility**
- Choose the best technology for each service
- Gradually migrate services between technologies if needed
- Experiment with new technologies without disrupting existing services

### 5. **Maintenance**
- Technology-specific dependencies are isolated
- Easier to upgrade frameworks (e.g., .NET 8 → .NET 9)
- Shared libraries are grouped by technology

---

## Naming Conventions

### .NET Services
- Use **PascalCase** for folder names: `Product`, `Order`, `Identity`
- Follow Clean Architecture pattern with standard layer names

### Java Services
- Use **lowercase-with-hyphens** for folder names: `inventory`, `shipping`, `analytics`
- Follow Spring Boot conventions

### Node.js Services
- Use **lowercase-with-hyphens**: `realtime-notifications`, `media-processing`
- Follow npm package naming conventions

### Python Services
- Use **lowercase-with-underscores**: `recommendation`, `fraud_detection`
- Follow Python package naming conventions

---

## Example: Creating a New Java Service

```bash
# Navigate to Java services folder
cd src/Services/Java

# Create new Spring Boot service
mkdir inventory
cd inventory

# Initialize Spring Boot project
spring init --dependencies=web,data-jpa,postgresql \
  --group-id=com.commercehub \
  --artifact-id=inventory-service \
  --name=InventoryService \
  --package-name=com.commercehub.inventory \
  .

# Project structure
inventory/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/commercehub/inventory/
│   │   │       ├── InventoryServiceApplication.java
│   │   │       ├── controller/
│   │   │       ├── service/
│   │   │       ├── repository/
│   │   │       └── model/
│   │   └── resources/
│   │       ├── application.yml
│   │       └── application-dev.yml
│   └── test/
├── pom.xml
├── Dockerfile
└── README.md
```

---

## Example: Creating a New .NET Service

```powershell
# Navigate to .NET services folder
cd src/Services/DotNet

# Create new service folder
mkdir Cart
cd Cart

# Create projects
dotnet new webapi -n Cart.API
dotnet new classlib -n Cart.Application
dotnet new classlib -n Cart.Domain
dotnet new classlib -n Cart.Infrastructure
dotnet new xunit -n Cart.Tests

# Add project references
cd Cart.API
dotnet add reference ../Cart.Application/Cart.Application.csproj

cd ../Cart.Application
dotnet add reference ../Cart.Domain/Cart.Domain.csproj

cd ../Cart.Infrastructure
dotnet add reference ../Cart.Domain/Cart.Domain.csproj
dotnet add reference ../Cart.Application/Cart.Application.csproj

cd ../Cart.Tests
dotnet add reference ../Cart.API/Cart.API.csproj
dotnet add reference ../Cart.Application/Cart.Application.csproj
dotnet add reference ../Cart.Domain/Cart.Domain.csproj
```

---

## Docker Support

### Multi-Technology Docker Compose

```yaml
version: '3.8'

services:
  # .NET Services
  product-api:
    build:
      context: ./src/Services/DotNet/Product
      dockerfile: Product.API/Dockerfile
    ports:
      - "5010:80"
    environment:
      - ASPNETCORE_ENVIRONMENT=Development

  order-api:
    build:
      context: ./src/Services/DotNet/Order
      dockerfile: Order.API/Dockerfile
    ports:
      - "5020:80"

  # Java Services
  inventory-service:
    build:
      context: ./src/Services/Java/inventory
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=dev

  # Node.js Services
  realtime-notifications:
    build:
      context: ./src/Services/NodeJS/realtime-notifications
      dockerfile: Dockerfile
    ports:
      - "3000:3000"

  # Python Services
  recommendation-service:
    build:
      context: ./src/Services/Python/recommendation
      dockerfile: Dockerfile
    ports:
      - "5000:5000"

  # Infrastructure
  postgres:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: your_password

  redis:
    image: redis:7-alpine

  rabbitmq:
    image: rabbitmq:3-management
```

---

## Build Scripts

### Build All .NET Services

```powershell
# build-dotnet-services.ps1

Write-Host "Building .NET Services..." -ForegroundColor Green

$services = Get-ChildItem -Path "src/Services/DotNet" -Directory

foreach ($service in $services) {
    Write-Host "Building $($service.Name)..." -ForegroundColor Yellow
    
    $apiProject = Get-ChildItem -Path $service.FullName -Filter "*.API.csproj" -Recurse | Select-Object -First 1
    
    if ($apiProject) {
        dotnet build $apiProject.FullName
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ $($service.Name) built successfully" -ForegroundColor Green
        } else {
            Write-Host "✗ $($service.Name) build failed" -ForegroundColor Red
        }
    }
}

Write-Host "`nAll .NET services processed!" -ForegroundColor Green
```

### Build All Java Services

```bash
#!/bin/bash
# build-java-services.sh

echo "Building Java Services..."

for service in src/Services/Java/*; do
    if [ -d "$service" ]; then
        echo "Building $(basename $service)..."
        
        cd "$service"
        
        if [ -f "pom.xml" ]; then
            mvn clean install
        elif [ -f "build.gradle" ]; then
            ./gradlew build
        fi
        
        cd -
    fi
done

echo "All Java services processed!"
```

---

## Technology Stack Recommendations

### When to Use Each Technology

| Technology | Best For | Use Cases |
|------------|----------|-----------|
| **.NET (C#)** | Enterprise services, Complex business logic | Product, Order, Identity, Payment services |
| **Java (Spring Boot)** | High-performance services, Legacy integration | Inventory, Shipping, Analytics services |
| **Node.js** | Real-time communication, I/O-intensive | WebSocket notifications, Chat, Streaming |
| **Python** | Data science, ML/AI, Scripting | Recommendations, Fraud detection, Data processing |
| **Go** | High-concurrency, Low-latency | API Gateway, Load balancer, Proxy services |

---

## Migration Checklist

- [x] Create technology-specific folders
- [x] Move Product service to DotNet folder
- [ ] Update solution file (.sln)
- [ ] Update project references in .csproj files
- [ ] Update Docker Compose file paths
- [ ] Update CI/CD pipeline paths
- [ ] Update documentation references
- [ ] Test build process
- [ ] Test Docker builds
- [ ] Update team documentation
- [ ] Update deployment scripts

---

## Next Steps

1. **Update Solution File**: Run the commands in section "Update Solution Files"
2. **Test Build**: Ensure all projects build successfully
3. **Create Additional Services**: Use the examples provided to create Order, Cart, and other services
4. **Set Up Java Services**: When ready, create Java services following the structure
5. **Update Documentation**: Update all references to old paths in documentation

---

## Support for Future Technologies

The structure is designed to be extensible. To add a new technology:

1. Create a new folder under the appropriate category:
   - `src/Services/[Technology]/`
   - `src/BuildingBlocks/[Technology]/`
   - `src/ApiGateway/[Technology]/`

2. Follow the naming conventions for that technology

3. Update build scripts to include the new technology

4. Add technology-specific shared libraries to `BuildingBlocks`

---

## Additional Resources

- [Clean Architecture in .NET](../CLEAN-ARCHITECTURE-IMPLEMENTATION.md)
- [Identity Server & API Gateway Design](../IDENTITY-AND-GATEWAY-DESIGN.md)
- [Project Structure Overview](../PROJECT-STRUCTURE.md)
- [Setup Scripts](../SETUP-SCRIPTS.md)

---

**Last Updated**: September 26, 2026  
**Version**: 1.0
