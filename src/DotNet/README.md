# .NET Microservices

This folder contains all .NET-based microservices for the CommerceHub platform.

## Technology Stack

- **.NET 10.0** (or latest LTS)
- **C# 13**
- **ASP.NET Core** for Web APIs
- **Entity Framework Core** for data access
- **Clean Architecture** pattern

## Structure

Each microservice follows Clean Architecture with these layers:

```
ServiceName/
├── ServiceName.API/              # Presentation Layer (Controllers, Middleware)
├── ServiceName.Application/      # Application Layer (Use Cases, DTOs, Interfaces)
├── ServiceName.Domain/           # Domain Layer (Entities, Value Objects, Domain Events)
├── ServiceName.Infrastructure/   # Infrastructure Layer (Data Access, External Services)
└── ServiceName.Tests/            # Unit & Integration Tests
```

## Planned Services

### Core Services
- **Product**: Product catalog and inventory management
- **Order**: Order processing and management
- **Cart**: Shopping cart operations
- **Payment**: Payment processing integration
- **Identity**: Authentication and authorization (IdentityServer)

### Supporting Services
- **Notification**: Email and SMS notifications
- **Review**: Product reviews and ratings
- **Search**: Full-text search service

### Infrastructure
- **ApiGateway**: Ocelot-based API Gateway
- **BuildingBlocks**: Shared libraries and utilities

## Getting Started

### Prerequisites
- .NET SDK 10.0 or later
- Visual Studio 2025 or VS Code with C# extension
- Docker Desktop

### Create a New Service

```powershell
# Navigate to DotNet folder
cd src\DotNet

# Create service folder
mkdir NewService
cd NewService

# Create projects
dotnet new webapi -n NewService.API
dotnet new classlib -n NewService.Application
dotnet new classlib -n NewService.Domain
dotnet new classlib -n NewService.Infrastructure
dotnet new xunit -n NewService.Tests

# Add project references
cd NewService.API
dotnet add reference ..\NewService.Application\NewService.Application.csproj

cd ..\NewService.Application
dotnet add reference ..\NewService.Domain\NewService.Domain.csproj

cd ..\NewService.Infrastructure
dotnet add reference ..\NewService.Domain\NewService.Domain.csproj
dotnet add reference ..\NewService.Application\NewService.Application.csproj

cd ..\NewService.Tests
dotnet add reference ..\NewService.API\NewService.API.csproj
dotnet add reference ..\NewService.Application\NewService.Application.csproj
dotnet add reference ..\NewService.Domain\NewService.Domain.csproj
```

### Build and Run

```powershell
# Build all services
dotnet build

# Run specific service
cd NewService.API
dotnet run

# Run with hot reload
dotnet watch run

# Run tests
cd ..\NewService.Tests
dotnet test
```

## Common NuGet Packages

### API Layer
- `Microsoft.AspNetCore.OpenApi`
- `Swashbuckle.AspNetCore`
- `Microsoft.AspNetCore.Authentication.JwtBearer`
- `Serilog.AspNetCore`

### Application Layer
- `FluentValidation`
- `AutoMapper`
- `MediatR`

### Infrastructure Layer
- `Microsoft.EntityFrameworkCore`
- `Microsoft.EntityFrameworkCore.SqlServer` or `Npgsql.EntityFrameworkCore.PostgreSQL`
- `StackExchange.Redis`
- `RabbitMQ.Client`

### Testing
- `xunit`
- `Moq`
- `FluentAssertions`
- `Microsoft.AspNetCore.Mvc.Testing`

## Coding Standards

- Follow C# naming conventions
- Use async/await for I/O operations
- Implement proper exception handling
- Write unit tests for business logic
- Use dependency injection
- Follow SOLID principles
- Document public APIs with XML comments

## Docker Support

Each service should have a `Dockerfile` in the API project:

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["ServiceName.API/ServiceName.API.csproj", "ServiceName.API/"]
COPY ["ServiceName.Application/ServiceName.Application.csproj", "ServiceName.Application/"]
COPY ["ServiceName.Domain/ServiceName.Domain.csproj", "ServiceName.Domain/"]
COPY ["ServiceName.Infrastructure/ServiceName.Infrastructure.csproj", "ServiceName.Infrastructure/"]
RUN dotnet restore "ServiceName.API/ServiceName.API.csproj"
COPY . .
WORKDIR "/src/ServiceName.API"
RUN dotnet build "ServiceName.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "ServiceName.API.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "ServiceName.API.dll"]
```

## Configuration

### appsettings.json
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=ServiceDb;Username=postgres;Password=postgres123",
    "Redis": "localhost:6379"
  },
  "IdentityServer": {
    "Authority": "http://localhost:5001",
    "ApiName": "servicename_api"
  },
  "RabbitMQ": {
    "Host": "localhost",
    "Username": "guest",
    "Password": "guest"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  }
}
```

## Resources

- [.NET Documentation](https://docs.microsoft.com/dotnet/)
- [ASP.NET Core Documentation](https://docs.microsoft.com/aspnet/core/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [CQRS Pattern](https://docs.microsoft.com/azure/architecture/patterns/cqrs)
- [Project Documentation](../../docs/)
