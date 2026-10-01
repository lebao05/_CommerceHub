# Scripts Directory

This directory contains utility scripts for managing the CommerceHub microservices platform.

## Available Scripts

### PowerShell Scripts (Windows)

#### 1. Migrate-FolderStructure.ps1
Migrates the project structure to the new technology-grouped organization.

**Usage:**
```powershell
# Dry run (see what would happen)
.\Migrate-FolderStructure.ps1 -WhatIf

# Update solution file
.\Migrate-FolderStructure.ps1 -UpdateSolution

# Test build after migration
.\Migrate-FolderStructure.ps1 -TestBuild

# Do everything
.\Migrate-FolderStructure.ps1 -UpdateSolution -TestBuild
```

**Features:**
- Creates technology-specific folders (DotNet, Java, NodeJS, Python)
- Moves existing services to new locations
- Updates solution file with new project paths
- Creates README files for each technology
- Creates .gitkeep files for empty directories
- Validates and tests the new structure

---

#### 2. Build-DotNetServices.ps1
Builds all .NET microservices in the DotNet folder.

**Usage:**
```powershell
# Basic build (Debug configuration)
.\Build-DotNetServices.ps1

# Clean and build
.\Build-DotNetServices.ps1 -Clean

# Build with tests
.\Build-DotNetServices.ps1 -Test

# Release build with tests
.\Build-DotNetServices.ps1 -Configuration Release -Clean -Test

# Verbose output
.\Build-DotNetServices.ps1 -Verbose
```

**Parameters:**
- `-Clean`: Clean before build
- `-Test`: Run tests after successful build
- `-Configuration`: Debug or Release (default: Debug)
- `-Verbose`: Show detailed build output

**Features:**
- Automatically discovers all .NET services
- Builds each service's .API project
- Optionally runs tests from .Tests projects
- Provides a summary table of results
- Returns exit code 0 if all succeed, 1 if any fail

---

### Bash Scripts (Linux/Mac/WSL)

#### 3. init-databases.sh
Initializes all databases in PostgreSQL when the container starts.

**Usage:**
This script is automatically executed by Docker when the PostgreSQL container starts for the first time.

**Databases Created:**
- ProductDb
- OrderDb
- PaymentDb
- IdentityDb
- CartDb
- InventoryDb
- ShippingDb
- RecommendationDb
- NotificationDb
- ReviewDb

**Manual Execution (if needed):**
```bash
# Make executable
chmod +x init-databases.sh

# Run
./init-databases.sh
```

---

## Docker Quick Reference

### Start Infrastructure Only (Development)
```bash
# Start all infrastructure services
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop all services
docker-compose -f docker-compose.dev.yml down

# Stop and remove volumes (clean slate)
docker-compose -f docker-compose.dev.yml down -v
```

### Start All Services (Full Stack)
```bash
# Build and start all services
docker-compose up -d --build

# View logs for specific service
docker-compose logs -f product-api

# Restart a service
docker-compose restart product-api

# Stop all services
docker-compose down
```

### Infrastructure Services URLs
After starting with `docker-compose.dev.yml`:

| Service | URL | Credentials |
|---------|-----|-------------|
| **PostgreSQL** | localhost:5432 | postgres / postgres123 |
| **Redis** | localhost:6379 | (no auth) |
| **RabbitMQ Management** | http://localhost:15672 | guest / guest |
| **MongoDB** | localhost:27017 | admin / admin123 |
| **Elasticsearch** | http://localhost:9200 | (no auth) |
| **Kibana** | http://localhost:5601 | (no auth) |
| **Seq** | http://localhost:5341 | (no auth) |
| **Jaeger** | http://localhost:16686 | (no auth) |

---

## Common Development Workflows

### 1. First Time Setup
```powershell
# Navigate to project root
cd d:\_commercehub

# Run migration (if needed)
.\scripts\Migrate-FolderStructure.ps1 -UpdateSolution -TestBuild

# Start infrastructure
docker-compose -f docker-compose.dev.yml up -d

# Build all .NET services
.\scripts\Build-DotNetServices.ps1 -Clean -Test

# Run a specific service (example: Product API)
cd src\Services\DotNet\Product\Product.API
dotnet run
```

### 2. Daily Development
```powershell
# Ensure infrastructure is running
docker-compose -f docker-compose.dev.yml ps

# If not running, start it
docker-compose -f docker-compose.dev.yml up -d

# Build and run your service
cd src\Services\DotNet\Product\Product.API
dotnet watch run  # Hot reload enabled
```

### 3. Adding a New .NET Service
```powershell
# Navigate to DotNet services folder
cd src\Services\DotNet

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

cd ..\NewService.Tests
dotnet add reference ..\NewService.API\NewService.API.csproj

# Add to solution
cd ..\..\..\..\
dotnet sln add src\Services\DotNet\NewService\NewService.API\NewService.API.csproj
dotnet sln add src\Services\DotNet\NewService\NewService.Application\NewService.Application.csproj
dotnet sln add src\Services\DotNet\NewService\NewService.Domain\NewService.Domain.csproj
dotnet sln add src\Services\DotNet\NewService\NewService.Infrastructure\NewService.Infrastructure.csproj
dotnet sln add src\Services\DotNet\NewService\NewService.Tests\NewService.Tests.csproj
```

### 4. Building All Services
```powershell
# Quick build (Debug)
.\scripts\Build-DotNetServices.ps1

# Full build with tests (Release)
.\scripts\Build-DotNetServices.ps1 -Configuration Release -Clean -Test
```

### 5. Database Management
```powershell
# Connect to PostgreSQL
docker exec -it commercehub-postgres psql -U postgres

# List databases
\l

# Connect to specific database
\c ProductDb

# List tables
\dt

# Exit
\q
```

### 6. View Logs
```powershell
# Infrastructure logs
docker-compose -f docker-compose.dev.yml logs -f

# Specific service logs
docker-compose -f docker-compose.dev.yml logs -f postgres
docker-compose -f docker-compose.dev.yml logs -f redis
docker-compose -f docker-compose.dev.yml logs -f rabbitmq
```

### 7. Reset Everything
```powershell
# Stop and remove all containers and volumes
docker-compose -f docker-compose.dev.yml down -v

# Rebuild from scratch
docker-compose -f docker-compose.dev.yml up -d --build

# Wait for PostgreSQL to initialize
Start-Sleep -Seconds 10

# Rebuild services
.\scripts\Build-DotNetServices.ps1 -Clean
```

---

## Troubleshooting

### Port Already in Use
```powershell
# Check what's using a port (Windows)
netstat -ano | findstr :5432

# Kill process by PID
taskkill /PID <pid> /F
```

### PostgreSQL Connection Issues
```powershell
# Check if PostgreSQL is running
docker ps | findstr postgres

# View PostgreSQL logs
docker logs commercehub-postgres

# Restart PostgreSQL
docker-compose -f docker-compose.dev.yml restart postgres
```

### Build Failures
```powershell
# Clean all bin/obj folders
Get-ChildItem -Path src -Include bin,obj -Recurse | Remove-Item -Recurse -Force

# Restore NuGet packages
dotnet restore

# Rebuild
.\scripts\Build-DotNetServices.ps1 -Clean
```

### Docker Issues
```powershell
# Remove all stopped containers
docker container prune -f

# Remove unused images
docker image prune -a -f

# Remove unused volumes
docker volume prune -f

# Nuclear option: Remove everything
docker system prune -a --volumes -f
```

---

## Environment Variables

Create a `.env` file in the root directory for sensitive configuration:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Facebook OAuth
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

# Stripe Payment
STRIPE_API_KEY=your-stripe-api-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

# SendGrid Email
SENDGRID_API_KEY=your-sendgrid-api-key

# Twilio SMS
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

**Note:** Never commit `.env` file to version control!

---

## Additional Resources

- [Folder Structure Refactoring Guide](../docs/FOLDER-STRUCTURE-REFACTORING.md)
- [Identity Server & API Gateway Design](../docs/IDENTITY-AND-GATEWAY-DESIGN.md)
- [Clean Architecture Implementation](../docs/CLEAN-ARCHITECTURE-IMPLEMENTATION.md)
- [Project Structure](../docs/PROJECT-STRUCTURE.md)

---

**Last Updated**: September 26, 2026
