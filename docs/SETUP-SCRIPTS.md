# Project Setup Scripts

This document provides PowerShell scripts to automatically create the complete project structure.

## Prerequisites

- .NET 8.0 SDK
- Node.js 18+ and npm
- Angular CLI (`npm install -g @angular/cli`)
- Docker Desktop (optional)

---

## 1. Create Complete .NET Solution Structure

Save this as `setup-backend.ps1`:

```powershell
# Setup E-Commerce Microservices Backend Structure
# Run from project root: .\scripts\setup-backend.ps1

Write-Host "Creating E-Commerce Microservices Solution Structure..." -ForegroundColor Green

# Create root directory
$rootDir = "ecommerce-microservices"
New-Item -ItemType Directory -Force -Path $rootDir | Out-Null
Set-Location $rootDir

# Create solution file
dotnet new sln -n ECommerceMicroservices

# Create directory structure
$directories = @(
    "src/Services",
    "src/ApiGateway",
    "src/BuildingBlocks/Common",
    "src/BuildingBlocks/Infrastructure",
    "src/Web",
    "tests/E2E",
    "tests/Performance",
    "docker/services",
    "docker/infrastructure",
    "k8s/services",
    "k8s/infrastructure",
    "scripts",
    "docs"
)

foreach ($dir in $directories) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
}

Write-Host "Creating microservices..." -ForegroundColor Yellow

# Microservices list
$services = @(
    "Identity",
    "Product",
    "Cart",
    "Order",
    "Inventory",
    "Payment",
    "Shipping",
    "Notification",
    "Search",
    "Review",
    "Promotion"
)

foreach ($service in $services) {
    Write-Host "  - Creating $service Service..." -ForegroundColor Cyan
    
    $serviceDir = "src/Services/$service"
    
    # Create project structure (Clean Architecture)
    $layers = @("API", "Application", "Domain", "Infrastructure", "Tests")
    
    foreach ($layer in $layers) {
        $projectName = "$service.$layer"
        $projectPath = "$serviceDir/$projectName"
        
        # Determine project type
        $template = switch ($layer) {
            "API" { "webapi" }
            "Domain" { "classlib" }
            "Application" { "classlib" }
            "Infrastructure" { "classlib" }
            "Tests" { "xunit" }
        }
        
        # Create project
        dotnet new $template -n $projectName -o $projectPath
        
        # Add to solution
        dotnet sln add $projectPath/$projectName.csproj
    }
    
    # Create folder structure within projects
    # API Layer
    $apiFolders = @("Controllers", "Middleware", "Filters", "Extensions")
    foreach ($folder in $apiFolders) {
        New-Item -ItemType Directory -Force -Path "$serviceDir/$service.API/$folder" | Out-Null
    }
    
    # Application Layer
    $appFolders = @("Commands", "Queries", "DTOs", "Services", "Validators", "Interfaces", "Mappings", "EventHandlers")
    foreach ($folder in $appFolders) {
        New-Item -ItemType Directory -Force -Path "$serviceDir/$service.Application/$folder" | Out-Null
    }
    
    # Domain Layer
    $domainFolders = @("Entities", "ValueObjects", "Events", "Interfaces", "Enums", "Exceptions")
    foreach ($folder in $domainFolders) {
        New-Item -ItemType Directory -Force -Path "$serviceDir/$service.Domain/$folder" | Out-Null
    }
    
    # Infrastructure Layer
    $infraFolders = @("Data", "Data/Configurations", "Data/Migrations", "Repositories", "Services", "External")
    foreach ($folder in $infraFolders) {
        New-Item -ItemType Directory -Force -Path "$serviceDir/$service.Infrastructure/$folder" | Out-Null
    }
    
    # Tests
    $testFolders = @("Unit", "Integration", "Fixtures")
    foreach ($folder in $testFolders) {
        New-Item -ItemType Directory -Force -Path "$serviceDir/$service.Tests/$folder" | Out-Null
    }
}

Write-Host "Creating API Gateway..." -ForegroundColor Yellow
dotnet new webapi -n ApiGateway -o src/ApiGateway/ApiGateway
dotnet sln add src/ApiGateway/ApiGateway/ApiGateway.csproj

$gatewayFolders = @("Middleware", "Filters", "Configuration")
foreach ($folder in $gatewayFolders) {
    New-Item -ItemType Directory -Force -Path "src/ApiGateway/ApiGateway/$folder" | Out-Null
}

Write-Host "Creating Building Blocks..." -ForegroundColor Yellow

$buildingBlocks = @(
    "BuildingBlocks.Common",
    "BuildingBlocks.EventBus",
    "BuildingBlocks.Outbox",
    "BuildingBlocks.Saga",
    "BuildingBlocks.Idempotency",
    "BuildingBlocks.Resilience",
    "BuildingBlocks.Logging",
    "BuildingBlocks.Caching",
    "BuildingBlocks.Observability",
    "BuildingBlocks.Infrastructure"
)

foreach ($block in $buildingBlocks) {
    $blockPath = "src/BuildingBlocks/Common/$block"
    dotnet new classlib -n $block -o $blockPath
    dotnet sln add $blockPath/$block.csproj
}

# Create folder structure for Building Blocks
New-Item -ItemType Directory -Force -Path "src/BuildingBlocks/Common/BuildingBlocks.Common/Models" | Out-Null
New-Item -ItemType Directory -Force -Path "src/BuildingBlocks/Common/BuildingBlocks.Common/Exceptions" | Out-Null
New-Item -ItemType Directory -Force -Path "src/BuildingBlocks/Common/BuildingBlocks.Common/Constants" | Out-Null

New-Item -ItemType Directory -Force -Path "src/BuildingBlocks/Common/BuildingBlocks.EventBus/Abstractions" | Out-Null
New-Item -ItemType Directory -Force -Path "src/BuildingBlocks/Common/BuildingBlocks.EventBus/Events" | Out-Null
New-Item -ItemType Directory -Force -Path "src/BuildingBlocks/Common/BuildingBlocks.EventBus/RabbitMQ" | Out-Null

New-Item -ItemType Directory -Force -Path "src/BuildingBlocks/Common/BuildingBlocks.Resilience/CircuitBreaker" | Out-Null
New-Item -ItemType Directory -Force -Path "src/BuildingBlocks/Common/BuildingBlocks.Resilience/RetryPolicies" | Out-Null

Write-Host "Creating test projects..." -ForegroundColor Yellow
dotnet new xunit -n E2E.Tests -o tests/E2E/E2E.Tests
dotnet sln add tests/E2E/E2E.Tests/E2E.Tests.csproj

Write-Host "`nSolution structure created successfully!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Run: dotnet restore"
Write-Host "2. Run: dotnet build"
Write-Host "3. Add NuGet packages to each project"
Write-Host "4. Set up Docker Compose"
Write-Host "5. Create Angular applications"

# Create basic .gitignore
@"
## Ignore Visual Studio temporary files, build results, and
## files generated by popular Visual Studio add-ons.

# User-specific files
*.suo
*.user
*.userosscache
*.sln.docstates

# Build results
[Dd]ebug/
[Dd]ebugPublic/
[Rr]elease/
[Rr]eleases/
x64/
x86/
build/
bld/
[Bb]in/
[Oo]bj/

# Visual Studio 2015 cache/options directory
.vs/

# MSTest test Results
[Tt]est[Rr]esult*/
[Bb]uild[Ll]og.*

# NuGet Packages
*.nupkg
**/packages/*

# Visual Studio cache files
*.cache
*.cachefile

# Others
*.log
*.vspscc
*.vssscc
.builds
*.pidb
*.svclog
*.scc

# Node.js
node_modules/
npm-debug.log
yarn-error.log

# Angular
dist/
tmp/
.angular/

# Docker
docker-compose.override.yml

# IDE
.idea/
.vscode/
*.swp
*.swo

# Environment
.env
appsettings.Development.json
"@ | Out-File -FilePath .gitignore -Encoding utf8

# Create README
@"
# E-Commerce Microservices Platform

## Architecture
- **Backend**: .NET 8.0 Microservices
- **Frontend**: Angular 17+
- **Message Broker**: RabbitMQ/Kafka
- **Databases**: PostgreSQL (per service)
- **Cache**: Redis
- **Search**: Elasticsearch

## Services
1. Identity Service - Authentication & Authorization
2. Product Service - Product Catalog
3. Cart Service - Shopping Cart
4. Order Service - Order Management
5. Inventory Service - Stock Management
6. Payment Service - Payment Processing
7. Shipping Service - Shipment Management
8. Notification Service - Email/SMS/Push
9. Search Service - Product Search
10. Review Service - Product Reviews
11. Promotion Service - Coupons & Promotions

## Getting Started

### Prerequisites
- .NET 8.0 SDK
- Node.js 18+
- Docker Desktop
- PostgreSQL / SQL Server
- RabbitMQ
- Redis

### Run Locally
\`\`\`bash
# Start infrastructure
docker-compose up -d

# Run API Gateway
cd src/ApiGateway/ApiGateway
dotnet run

# Run individual services
cd src/Services/Product/Product.API
dotnet run

# Run frontend
cd src/Web/ecommerce-web
npm install
ng serve
\`\`\`

## Documentation
- [Architecture](docs/architecture/)
- [Use Cases](docs/use-cases/)
- [API Documentation](docs/api/)

"@ | Out-File -FilePath README.md -Encoding utf8

Write-Host "`nProject structure created at: $(Get-Location)" -ForegroundColor Green
```

---

## 2. Create Angular Frontend Structure

Save this as `setup-frontend.ps1`:

```powershell
# Setup Angular Frontend Applications
# Run from project root: .\scripts\setup-frontend.ps1

Write-Host "Creating Angular Frontend Applications..." -ForegroundColor Green

# Navigate to Web directory
Set-Location src/Web

# Create Customer Web App
Write-Host "`nCreating Customer Web Application..." -ForegroundColor Yellow
ng new ecommerce-web --routing --style=scss --skip-git=true

Set-Location ecommerce-web

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Cyan
npm install @angular/material @angular/cdk @ngrx/store @ngrx/effects @ngrx/store-devtools
npm install rxjs lodash
npm install --save-dev @types/lodash

# Generate core structure
Write-Host "Generating core structure..." -ForegroundColor Cyan

# Core
ng generate module core
ng generate service core/services/auth
ng generate service core/services/http
ng generate service core/services/notification
ng generate interceptor core/interceptors/auth
ng generate interceptor core/interceptors/error
ng generate interceptor core/interceptors/correlation-id
ng generate guard core/guards/auth

# Shared
ng generate module shared
ng generate component shared/components/header
ng generate component shared/components/footer
ng generate component shared/components/sidebar
ng generate component shared/components/loading-spinner

# Features
Write-Host "Generating feature modules..." -ForegroundColor Cyan

# Auth Feature
ng generate module features/auth --routing
ng generate component features/auth/login
ng generate component features/auth/register
ng generate component features/auth/forgot-password

# Products Feature
ng generate module features/products --routing
ng generate component features/products/product-list
ng generate component features/products/product-detail
ng generate component features/products/product-search
ng generate service features/products/services/product

# Cart Feature
ng generate module features/cart --routing
ng generate component features/cart/cart-view
ng generate component features/cart/cart-item
ng generate service features/cart/services/cart

# Checkout Feature
ng generate module features/checkout --routing
ng generate component features/checkout/checkout-summary
ng generate component features/checkout/shipping-address
ng generate component features/checkout/payment
ng generate component features/checkout/order-confirmation

# Orders Feature
ng generate module features/orders --routing
ng generate component features/orders/order-list
ng generate component features/orders/order-detail
ng generate component features/orders/order-tracking

# Profile Feature
ng generate module features/profile --routing
ng generate component features/profile/account-info
ng generate component features/profile/addresses
ng generate component features/profile/payment-methods

# Reviews Feature
ng generate module features/reviews --routing
ng generate component features/reviews/review-list
ng generate component features/reviews/write-review

Write-Host "`nCustomer Web App created successfully!" -ForegroundColor Green

# Go back to Web directory
Set-Location ..

# Create Admin Dashboard
Write-Host "`nCreating Admin Dashboard Application..." -ForegroundColor Yellow
ng new ecommerce-admin --routing --style=scss --skip-git=true

Set-Location ecommerce-admin

# Install dependencies
npm install @angular/material @angular/cdk @ngrx/store @ngrx/effects
npm install chart.js ng2-charts
npm install rxjs lodash

# Generate admin structure
Write-Host "Generating admin structure..." -ForegroundColor Cyan

# Core & Shared (similar to customer app)
ng generate module core
ng generate module shared

# Admin Features
ng generate module features/dashboard --routing
ng generate component features/dashboard/overview

ng generate module features/products --routing
ng generate component features/products/product-list
ng generate component features/products/product-form

ng generate module features/orders --routing
ng generate component features/orders/order-list
ng generate component features/orders/order-detail

ng generate module features/customers --routing
ng generate component features/customers/customer-list
ng generate component features/customers/customer-detail

ng generate module features/inventory --routing
ng generate component features/inventory/stock-list
ng generate component features/inventory/stock-adjustment

ng generate module features/promotions --routing
ng generate component features/promotions/coupon-list
ng generate component features/promotions/coupon-form

ng generate module features/reports --routing
ng generate component features/reports/sales-report
ng generate component features/reports/inventory-report

Write-Host "`nAdmin Dashboard created successfully!" -ForegroundColor Green

Set-Location ../../../..

Write-Host "`nFrontend applications created successfully!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Configure environment variables"
Write-Host "2. Set up NgRx store"
Write-Host "3. Implement services and components"
Write-Host "4. Connect to API Gateway"
```

---

## 3. Docker Compose Configuration

Save this as `docker-compose.yml` in the `docker/` directory:

```yaml
version: '3.8'

services:
  # Infrastructure Services
  
  postgres-identity:
    image: postgres:15-alpine
    container_name: postgres-identity
    environment:
      POSTGRES_DB: IdentityDb
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres-identity-data:/var/lib/postgresql/data
    networks:
      - ecommerce-network

  postgres-product:
    image: postgres:15-alpine
    container_name: postgres-product
    environment:
      POSTGRES_DB: ProductDb
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5433:5432"
    volumes:
      - postgres-product-data:/var/lib/postgresql/data
    networks:
      - ecommerce-network

  postgres-order:
    image: postgres:15-alpine
    container_name: postgres-order
    environment:
      POSTGRES_DB: OrderDb
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5434:5432"
    volumes:
      - postgres-order-data:/var/lib/postgresql/data
    networks:
      - ecommerce-network

  redis:
    image: redis:7-alpine
    container_name: redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - ecommerce-network

  rabbitmq:
    image: rabbitmq:3-management-alpine
    container_name: rabbitmq
    environment:
      RABBITMQ_DEFAULT_USER: guest
      RABBITMQ_DEFAULT_PASS: guest
    ports:
      - "5672:5672"
      - "15672:15672"
    volumes:
      - rabbitmq-data:/var/lib/rabbitmq
    networks:
      - ecommerce-network

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.10.0
    container_name: elasticsearch
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data
    networks:
      - ecommerce-network

  kibana:
    image: docker.elastic.co/kibana/kibana:8.10.0
    container_name: kibana
    environment:
      ELASTICSEARCH_HOSTS: http://elasticsearch:9200
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch
    networks:
      - ecommerce-network

  jaeger:
    image: jaegertracing/all-in-one:latest
    container_name: jaeger
    ports:
      - "5775:5775/udp"
      - "6831:6831/udp"
      - "6832:6832/udp"
      - "5778:5778"
      - "16686:16686"
      - "14268:14268"
      - "14250:14250"
      - "9411:9411"
    networks:
      - ecommerce-network

  # Microservices (uncomment when ready)
  
  # api-gateway:
  #   build:
  #     context: ..
  #     dockerfile: docker/services/apigateway.Dockerfile
  #   container_name: api-gateway
  #   ports:
  #     - "5000:80"
  #   environment:
  #     - ASPNETCORE_ENVIRONMENT=Development
  #   depends_on:
  #     - identity-api
  #     - product-api
  #   networks:
  #     - ecommerce-network

  # identity-api:
  #   build:
  #     context: ..
  #     dockerfile: docker/services/identity.Dockerfile
  #   container_name: identity-api
  #   ports:
  #     - "5001:80"
  #   environment:
  #     - ASPNETCORE_ENVIRONMENT=Development
  #     - ConnectionStrings__DefaultConnection=Host=postgres-identity;Database=IdentityDb;Username=postgres;Password=postgres
  #   depends_on:
  #     - postgres-identity
  #     - rabbitmq
  #   networks:
  #     - ecommerce-network

networks:
  ecommerce-network:
    driver: bridge

volumes:
  postgres-identity-data:
  postgres-product-data:
  postgres-order-data:
  redis-data:
  rabbitmq-data:
  elasticsearch-data:
```

---

## Usage Instructions

### 1. Create Backend Structure
```powershell
# Create and run the setup script
New-Item -ItemType Directory -Force -Path "scripts"
# Save setup-backend.ps1 to scripts folder
cd scripts
.\setup-backend.ps1
```

### 2. Create Frontend Structure
```powershell
# Save setup-frontend.ps1 to scripts folder
.\setup-frontend.ps1
```

### 3. Start Infrastructure
```powershell
cd docker
docker-compose up -d
```

### 4. Verify Setup
```powershell
# Build solution
dotnet build

# Run a service
cd src/Services/Product/Product.API
dotnet run

# Run frontend
cd src/Web/ecommerce-web
ng serve
```

---

## Next Steps

1. **Configure NuGet Packages** for each project
2. **Set up Entity Framework** migrations
3. **Implement base classes** in Building Blocks
4. **Create API endpoints** for each service
5. **Set up authentication** in API Gateway
6. **Connect Angular** to backend APIs

Would you like me to create detailed implementation examples for specific services?

