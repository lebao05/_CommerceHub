# Build All .NET Services Script
# This script builds all .NET microservices in the DotNet folder

param(
    [Parameter(HelpMessage="Clean before build")]
    [switch]$Clean,
    
    [Parameter(HelpMessage="Run tests after build")]
    [switch]$Test,
    
    [Parameter(HelpMessage="Build configuration (Debug/Release)")]
    [ValidateSet("Debug", "Release")]
    [string]$Configuration = "Debug",
    
    [Parameter(HelpMessage="Verbose output")]
    [switch]$Verbose
)

$ErrorActionPreference = "Continue"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Build All .NET Services" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$rootPath = "d:\_commercehub"
$dotnetServicesPath = "$rootPath\src\Services\DotNet"

# Check if .NET services folder exists
if (-not (Test-Path $dotnetServicesPath)) {
    Write-Host "Error: .NET services folder not found at $dotnetServicesPath" -ForegroundColor Red
    exit 1
}

# Get all service folders
$services = Get-ChildItem -Path $dotnetServicesPath -Directory

if ($services.Count -eq 0) {
    Write-Host "No services found in $dotnetServicesPath" -ForegroundColor Yellow
    exit 0
}

Write-Host "Found $($services.Count) service(s)" -ForegroundColor Cyan
Write-Host "Configuration: $Configuration" -ForegroundColor Cyan
Write-Host ""

$successCount = 0
$failCount = 0
$results = @()

foreach ($service in $services) {
    Write-Host "Processing: $($service.Name)" -ForegroundColor Yellow
    Write-Host "─────────────────────────────────────" -ForegroundColor Gray
    
    # Find the .API project (main entry point)
    $apiProject = Get-ChildItem -Path $service.FullName -Filter "*.API.csproj" -Recurse | Select-Object -First 1
    
    if (-not $apiProject) {
        Write-Host "  ! No .API project found in $($service.Name)" -ForegroundColor Yellow
        Write-Host ""
        continue
    }
    
    $projectPath = $apiProject.FullName
    Write-Host "  Project: $($apiProject.Name)" -ForegroundColor Cyan
    
    # Clean if requested
    if ($Clean) {
        Write-Host "  → Cleaning..." -ForegroundColor Gray
        
        $cleanArgs = @(
            "clean",
            $projectPath,
            "--configuration", $Configuration
        )
        
        if ($Verbose) {
            $cleanArgs += "--verbosity", "detailed"
        } else {
            $cleanArgs += "--verbosity", "quiet"
        }
        
        & dotnet $cleanArgs
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ Clean successful" -ForegroundColor Green
        } else {
            Write-Host "  ✗ Clean failed" -ForegroundColor Red
        }
    }
    
    # Build
    Write-Host "  → Building..." -ForegroundColor Gray
    
    $buildArgs = @(
        "build",
        $projectPath,
        "--configuration", $Configuration
    )
    
    if ($Verbose) {
        $buildArgs += "--verbosity", "detailed"
    } else {
        $buildArgs += "--verbosity", "minimal"
    }
    
    $buildOutput = & dotnet $buildArgs 2>&1
    $buildExitCode = $LASTEXITCODE
    
    if ($buildExitCode -eq 0) {
        Write-Host "  ✓ Build successful" -ForegroundColor Green
        $successCount++
        
        $results += [PSCustomObject]@{
            Service = $service.Name
            Status = "Success"
            Build = "✓"
            Test = "-"
        }
    } else {
        Write-Host "  ✗ Build failed" -ForegroundColor Red
        Write-Host "  Error output:" -ForegroundColor Red
        $buildOutput | Where-Object { $_ -match "error" } | ForEach-Object {
            Write-Host "    $_" -ForegroundColor Red
        }
        $failCount++
        
        $results += [PSCustomObject]@{
            Service = $service.Name
            Status = "Failed"
            Build = "✗"
            Test = "-"
        }
        
        Write-Host ""
        continue
    }
    
    # Run tests if requested and build succeeded
    if ($Test) {
        Write-Host "  → Running tests..." -ForegroundColor Gray
        
        # Find test project
        $testProject = Get-ChildItem -Path $service.FullName -Filter "*.Tests.csproj" -Recurse | Select-Object -First 1
        
        if ($testProject) {
            $testArgs = @(
                "test",
                $testProject.FullName,
                "--configuration", $Configuration,
                "--no-build"
            )
            
            if ($Verbose) {
                $testArgs += "--verbosity", "detailed"
            } else {
                $testArgs += "--verbosity", "minimal"
            }
            
            $testOutput = & dotnet $testArgs 2>&1
            $testExitCode = $LASTEXITCODE
            
            if ($testExitCode -eq 0) {
                Write-Host "  ✓ Tests passed" -ForegroundColor Green
                $results[-1].Test = "✓"
            } else {
                Write-Host "  ✗ Tests failed" -ForegroundColor Red
                $results[-1].Test = "✗"
                $results[-1].Status = "Failed (Tests)"
            }
        } else {
            Write-Host "  ! No test project found" -ForegroundColor Yellow
            $results[-1].Test = "N/A"
        }
    }
    
    Write-Host ""
}

# Summary
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Build Summary" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Display results table
$results | Format-Table -AutoSize

Write-Host "Total Services: $($services.Count)" -ForegroundColor Cyan
Write-Host "Successful: $successCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "Green" })
Write-Host ""

if ($failCount -eq 0) {
    Write-Host "✓ All services built successfully!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "✗ Some services failed to build" -ForegroundColor Red
    exit 1
}
