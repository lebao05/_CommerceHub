# Migration Script for CommerceHub Folder Structure Refactoring
# This script helps migrate from old structure to new technology-grouped structure

param(
    [switch]$WhatIf,
    [switch]$UpdateSolution,
    [switch]$TestBuild
)

$ErrorActionPreference = "Stop"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "CommerceHub Structure Migration Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$rootPath = "d:\_commercehub"

# Step 1: Verify current structure
Write-Host "Step 1: Verifying new structure..." -ForegroundColor Green

$requiredFolders = @(
    "$rootPath\src\Services\DotNet",
    "$rootPath\src\Services\Java",
    "$rootPath\src\ApiGateway\DotNet",
    "$rootPath\src\BuildingBlocks\DotNet",
    "$rootPath\src\Web\DotNet"
)

foreach ($folder in $requiredFolders) {
    if (Test-Path $folder) {
        Write-Host "  [OK] $folder exists" -ForegroundColor Green
    } else {
        Write-Host "  [MISSING] $folder - creating..." -ForegroundColor Yellow
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
        Write-Host "  [CREATED] $folder" -ForegroundColor Green
    }
}

# Step 2: Check if Product service was moved
Write-Host "`nStep 2: Checking Product service location..." -ForegroundColor Green

$productNewPath = "$rootPath\src\Services\DotNet\Product"
$productOldPath = "$rootPath\src\Services\Product"

if (Test-Path $productNewPath) {
    Write-Host "  [OK] Product service found in new location" -ForegroundColor Green
} elseif (Test-Path $productOldPath) {
    Write-Host "  [WARNING] Product service still in old location" -ForegroundColor Yellow
    if (-not $WhatIf) {
        Write-Host "  [ACTION] Moving Product service..." -ForegroundColor Yellow
        Move-Item -Path $productOldPath -Destination $productNewPath -Force
        Write-Host "  [SUCCESS] Product service moved" -ForegroundColor Green
    } else {
        Write-Host "  [WHATIF] Would move: $productOldPath to $productNewPath" -ForegroundColor Cyan
    }
} else {
    Write-Host "  [ERROR] Product service not found in either location!" -ForegroundColor Red
}

# Step 3: Find and update solution file
if ($UpdateSolution) {
    Write-Host "`nStep 3: Updating solution file..." -ForegroundColor Green
    
    $solutionFiles = Get-ChildItem -Path $rootPath -Filter "*.sln" -Recurse | Select-Object -First 1
    
    if ($solutionFiles) {
        $slnPath = $solutionFiles.FullName
        Write-Host "  Found solution: $($solutionFiles.Name)" -ForegroundColor Cyan
        
        if (-not $WhatIf) {
            # Remove old Product projects
            Write-Host "  [ACTION] Removing old project references..." -ForegroundColor Yellow
            
            $oldProjects = @(
                "src\Services\Product\Product.API\Product.API.csproj",
                "src\Services\Product\Product.Application\Product.Application.csproj",
                "src\Services\Product\Product.Domain\Product.Domain.csproj",
                "src\Services\Product\Product.Infrastructure\Product.Infrastructure.csproj",
                "src\Services\Product\Product.Tests\Product.Tests.csproj"
            )
            
            foreach ($proj in $oldProjects) {
                $fullPath = Join-Path $rootPath $proj
                if (Test-Path $fullPath) {
                    try {
                        dotnet sln $slnPath remove $fullPath 2>$null
                        Write-Host "    Removed: $proj" -ForegroundColor Gray
                    } catch {
                        # Project might not be in solution, continue
                    }
                }
            }
            
            # Add new Product projects
            Write-Host "  [ACTION] Adding new project references..." -ForegroundColor Yellow
            
            $newProjects = @(
                "src\Services\DotNet\Product\Product.API\Product.API.csproj",
                "src\Services\DotNet\Product\Product.Application\Product.Application.csproj",
                "src\Services\DotNet\Product\Product.Domain\Product.Domain.csproj",
                "src\Services\DotNet\Product\Product.Infrastructure\Product.Infrastructure.csproj",
                "src\Services\DotNet\Product\Product.Tests\Product.Tests.csproj"
            )
            
            foreach ($proj in $newProjects) {
                $fullPath = Join-Path $rootPath $proj
                if (Test-Path $fullPath) {
                    try {
                        dotnet sln $slnPath add $fullPath
                        Write-Host "    [OK] Added: $proj" -ForegroundColor Green
                    } catch {
                        Write-Host "    [ERROR] Failed to add: $proj" -ForegroundColor Red
                    }
                }
            }
            
            Write-Host "  [SUCCESS] Solution file updated" -ForegroundColor Green
        } else {
            Write-Host "  [WHATIF] Would update solution file: $slnPath" -ForegroundColor Cyan
        }
    } else {
        Write-Host "  [WARNING] No solution file found" -ForegroundColor Yellow
    }
}

# Step 4: Test build
if ($TestBuild) {
    Write-Host "`nStep 4: Testing build..." -ForegroundColor Green
    
    $productApiProject = "$rootPath\src\Services\DotNet\Product\Product.API\Product.API.csproj"
    
    if (Test-Path $productApiProject) {
        if (-not $WhatIf) {
            Write-Host "  [ACTION] Building Product.API..." -ForegroundColor Yellow
            
            try {
                dotnet build $productApiProject --nologo
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "  [SUCCESS] Build successful!" -ForegroundColor Green
                } else {
                    Write-Host "  [ERROR] Build failed with exit code: $LASTEXITCODE" -ForegroundColor Red
                }
            } catch {
                Write-Host "  [ERROR] Build error: $($_.Exception.Message)" -ForegroundColor Red
            }
        } else {
            Write-Host "  [WHATIF] Would build: $productApiProject" -ForegroundColor Cyan
        }
    } else {
        Write-Host "  [ERROR] Product.API project not found!" -ForegroundColor Red
    }
}

# Step 5: Create placeholder README files for new technology folders
Write-Host "`nStep 5: Creating README files for technology folders..." -ForegroundColor Green

$readmeContent = @{
    Java = @"
# Java Services

This folder contains Java-based microservices built with Spring Boot.

## Services

- **inventory**: Inventory management service
- **shipping**: Shipping and logistics service
- **analytics**: Analytics and reporting service

## Prerequisites

- Java 17 or higher
- Maven 3.8+ or Gradle 7+
- Spring Boot 3.x

## Build

``````bash
# Using Maven
mvn clean install

# Using Gradle
./gradlew build
``````

## Run

``````bash
# Using Maven
mvn spring-boot:run

# Using Gradle
./gradlew bootRun
``````
"@

    NodeJS = @"
# Node.js Services

This folder contains Node.js-based microservices.

## Services

- **realtime-notifications**: WebSocket-based real-time notifications
- **media-processing**: Image and video processing service

## Prerequisites

- Node.js 18+ or 20+
- npm or yarn

## Build

``````bash
npm install
npm run build
``````

## Run

``````bash
npm start
``````
"@

    Python = @"
# Python Services

This folder contains Python-based microservices.

## Services

- **recommendation**: ML-based product recommendation engine
- **fraud-detection**: Fraud detection and prevention service

## Prerequisites

- Python 3.11+
- pip
- virtualenv or conda

## Setup

``````bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
``````

## Run

``````bash
python main.py
``````
"@
}

foreach ($tech in $readmeContent.Keys) {
    $readmePath = "$rootPath\src\Services\$tech\README.md"
    
    if (-not (Test-Path $readmePath)) {
        if (-not $WhatIf) {
            New-Item -ItemType File -Path $readmePath -Force | Out-Null
            Set-Content -Path $readmePath -Value $readmeContent[$tech]
            Write-Host "  [CREATED] README for $tech" -ForegroundColor Green
        } else {
            Write-Host "  [WHATIF] Would create: $readmePath" -ForegroundColor Cyan
        }
    } else {
        Write-Host "  [EXISTS] README already exists for $tech" -ForegroundColor Gray
    }
}

# Step 6: Create .gitkeep files to preserve empty directories
Write-Host "`nStep 6: Creating .gitkeep files..." -ForegroundColor Green

$emptyFolders = @(
    "$rootPath\src\Services\Java",
    "$rootPath\src\Services\NodeJS",
    "$rootPath\src\Services\Python",
    "$rootPath\src\ApiGateway\DotNet",
    "$rootPath\src\BuildingBlocks\DotNet",
    "$rootPath\src\Web\DotNet"
)

foreach ($folder in $emptyFolders) {
    $gitkeepPath = Join-Path $folder ".gitkeep"
    
    if (-not (Test-Path $gitkeepPath) -and (Test-Path $folder)) {
        if (-not $WhatIf) {
            New-Item -ItemType File -Path $gitkeepPath -Force | Out-Null
            Write-Host "  [CREATED] .gitkeep in $(Split-Path $folder -Leaf)" -ForegroundColor Green
        } else {
            Write-Host "  [WHATIF] Would create: $gitkeepPath" -ForegroundColor Cyan
        }
    }
}

# Summary
Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host "Migration Summary" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

if ($WhatIf) {
    Write-Host "`nThis was a dry run (WhatIf mode)" -ForegroundColor Yellow
    Write-Host "Run without -WhatIf to apply changes" -ForegroundColor Yellow
} else {
    Write-Host "`nMigration completed!" -ForegroundColor Green
}

Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "  1. Review the changes" -ForegroundColor White
Write-Host "  2. Update Docker Compose file paths" -ForegroundColor White
Write-Host "  3. Update CI/CD pipeline paths" -ForegroundColor White
Write-Host "  4. Test all services build correctly" -ForegroundColor White
Write-Host "  5. Update documentation references" -ForegroundColor White

Write-Host "`nUseful Commands:" -ForegroundColor Cyan
Write-Host "  # Update solution file:" -ForegroundColor White
Write-Host "  .\scripts\Migrate-FolderStructure.ps1 -UpdateSolution" -ForegroundColor Gray
Write-Host ""
Write-Host "  # Test build:" -ForegroundColor White
Write-Host "  .\scripts\Migrate-FolderStructure.ps1 -TestBuild" -ForegroundColor Gray
Write-Host ""
Write-Host "  # Do both:" -ForegroundColor White
Write-Host "  .\scripts\Migrate-FolderStructure.ps1 -UpdateSolution -TestBuild" -ForegroundColor Gray
Write-Host ""
Write-Host "  # Dry run:" -ForegroundColor White
Write-Host "  .\scripts\Migrate-FolderStructure.ps1 -WhatIf -UpdateSolution -TestBuild" -ForegroundColor Gray
Write-Host ""

Write-Host "For more information, see: docs\FOLDER-STRUCTURE-REFACTORING.md" -ForegroundColor Cyan
Write-Host ""
