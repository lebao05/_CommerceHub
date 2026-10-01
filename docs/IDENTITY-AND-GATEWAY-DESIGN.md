# Identity Server & API Gateway Design

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Authentication Flow](#authentication-flow)
3. [Identity Server Design](#identity-server-design)
4. [API Gateway Design](#api-gateway-design)
5. [Security Implementation](#security-implementation)
6. [Token Management](#token-management)
7. [Integration Examples](#integration-examples)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Client Applications                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │   Angular    │  │    Mobile    │  │   Third-Party Apps       │  │
│  │   Web App    │  │     Apps     │  │   (OAuth2 Clients)       │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────────┘  │
└─────────┼──────────────────┼─────────────────────┼──────────────────┘
          │                  │                     │
          │    HTTP/HTTPS    │                     │
          └──────────────────┼─────────────────────┘
                             │
                    ┌────────▼─────────┐
                    │                  │
                    │   API Gateway    │
                    │    (yarp)        │
                    │  Port: 5000      │
                    │                  │
                    └────────┬─────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
┌─────────▼─────────┐ ┌──────▼──────┐ ┌────────▼─────────┐
│                   │ │             │ │                  │
│ Identity Server   │ │  Product    │ │  Order Service   │
│ (Duende)          │ │  Service    │ │                  │
│ Port: 5001        │ │ Port: 5010  │ │  Port: 5020      │
│                   │ │             │ │                  │
└─────────┬─────────┘ └─────────────┘ └──────────────────┘
          │
          │        ┌──────────────┐   ┌──────────────┐
          └────────┤   Identity   │   │    Redis     │
                   │   Database   │   │  (Caching)   │
                   └──────────────┘   └──────────────┘
```

---

## Authentication Flow

### 1. User Registration Flow

```
┌──────┐                  ┌────────────┐              ┌──────────────────┐
│Client│                  │API Gateway │              │Identity Server   │
└───┬──┘                  └─────┬──────┘              └────────┬─────────┘
    │                           │                              │
    │ POST /api/auth/register   │                              │
    ├──────────────────────────►│                              │
    │                           │ Forward to Identity Server   │
    │                           ├─────────────────────────────►│
    │                           │                              │
    │                           │                       Validate Input
    │                           │                       Hash Password
    │                           │                       Create User
    │                           │                              │
    │                           │      Success Response        │
    │                           │◄─────────────────────────────┤
    │   User Created (201)      │                              │
    │◄──────────────────────────┤                              │
    │                           │                              │
    │ Email Verification Sent   │                              │
    │                           │                              │
```

### 2. Login Flow (OAuth2 + OpenID Connect)

```
┌──────┐            ┌────────────┐           ┌──────────────┐        ┌─────────┐
│Client│            │API Gateway │           │Identity Server│        │Services │
└───┬──┘            └─────┬──────┘           └───────┬──────┘        └────┬────┘
    │                     │                          │                    │
    │ POST /connect/token │                          │                    │
    │ (username/password) │                          │                    │
    ├────────────────────►│                          │                    │
    │                     │  Forward Auth Request    │                    │
    │                     ├─────────────────────────►│                    │
    │                     │                          │                    │
    │                     │                   Validate Credentials        │
    │                     │                   Generate JWT Tokens         │
    │                     │                          │                    │
    │                     │  access_token            │                    │
    │                     │  refresh_token           │                    │
    │                     │  id_token                │                    │
    │                     │◄─────────────────────────┤                    │
    │   Tokens Response   │                          │                    │
    │◄────────────────────┤                          │                    │
    │                     │                          │                    │
    │ GET /api/products   │                          │                    │
    │ Authorization:      │                          │                    │
    │ Bearer {token}      │                          │                    │
    ├────────────────────►│                          │                    │
    │                     │  Validate Token          │                    │
    │                     ├─────────────────────────►│                    │
    │                     │  Token Valid + Claims    │                    │
    │                     │◄─────────────────────────┤                    │
    │                     │                          │                    │
    │                     │  Forward Request + Claims                     │
    │                     ├──────────────────────────────────────────────►│
    │                     │                          │  Process Request   │
    │                     │                          │  Check Permissions │
    │                     │                Response                       │
    │                     │◄──────────────────────────────────────────────┤
    │  Products Data      │                          │                    │
    │◄────────────────────┤                          │                    │
```

### 3. Refresh Token Flow

```
┌──────┐            ┌────────────┐           ┌──────────────┐
│Client│            │API Gateway │           │Identity Server│
└───┬──┘            └─────┬──────┘           └───────┬──────┘
    │                     │                          │
    │ API Call            │                          │
    ├────────────────────►│                          │
    │                     │  Validate Token          │
    │                     ├─────────────────────────►│
    │                     │  401 Token Expired       │
    │  401 Unauthorized   │◄─────────────────────────┤
    │◄────────────────────┤                          │
    │                     │                          │
    │ POST /connect/token │                          │
    │ grant_type=         │                          │
    │ refresh_token       │                          │
    ├────────────────────►│                          │
    │                     │  Validate Refresh Token  │
    │                     ├─────────────────────────►│
    │                     │                          │
    │                     │  New Access Token        │
    │                     │  New Refresh Token       │
    │   New Tokens        │◄─────────────────────────┤
    │◄────────────────────┤                          │
    │                     │                          │
    │ Retry API Call      │                          │
    │ with new token      │                          │
    ├────────────────────►│                          │
```

### 4. Social Login Flow (OAuth2)

```
┌──────┐     ┌────────────┐     ┌──────────────┐     ┌─────────────┐
│Client│     │API Gateway │     │Identity Server│     │Google/FB/etc│
└───┬──┘     └─────┬──────┘     └───────┬──────┘     └──────┬──────┘
    │              │                    │                    │
    │ Click "Login with Google"        │                    │
    ├─────────────►│                    │                    │
    │              │ /connect/authorize │                    │
    │              │ ?provider=Google   │                    │
    │              ├───────────────────►│                    │
    │              │                    │ Redirect to Google │
    │◄─────────────┴────────────────────┴───────────────────┤
    │                                                        │
    │ User Authorizes                                        │
    ├───────────────────────────────────────────────────────►│
    │                                                        │
    │              Callback with code                        │
    │◄───────────┬────────────────────┬────────────────────┤
    │            │                    │ Exchange code       │
    │            │                    ├────────────────────►│
    │            │                    │ Access Token        │
    │            │                    │◄────────────────────┤
    │            │                    │                     │
    │            │                    │ Get User Info       │
    │            │                    ├────────────────────►│
    │            │                    │ User Profile        │
    │            │                    │◄────────────────────┤
    │            │                    │                     │
    │            │             Create/Link User             │
    │            │             Generate Tokens              │
    │            │                    │                     │
    │            │  JWT Tokens        │                     │
    │◄───────────┴────────────────────┤                     │
```

---

## Identity Server Design

### Technology Stack

- **Framework**: Duende IdentityServer 6.x
- **Platform**: .NET 8.0
- **Database**: PostgreSQL (User Store)
- **Cache**: Redis (Token Cache, Session Store)
- **Email**: SendGrid / AWS SES
- **SMS**: Twilio (for 2FA)

### Project Structure

```
src/Services/Identity/
├── Identity.API/
│   ├── Controllers/
│   │   ├── AccountController.cs          # Registration, Login, Logout
│   │   ├── ExternalAuthController.cs     # Social Login
│   │   ├── UserController.cs             # User Management
│   │   └── AdminController.cs            # Admin Operations
│   ├── Configuration/
│   │   ├── Clients.cs                    # OAuth Clients Config
│   │   ├── Resources.cs                  # API Resources & Scopes
│   │   └── IdentityResources.cs          # OpenID Resources
│   ├── Services/
│   │   ├── ProfileService.cs             # Custom Claims
│   │   ├── EmailService.cs               # Email Notifications
│   │   ├── SmsService.cs                 # SMS for 2FA
│   │   └── TokenService.cs               # Custom Token Logic
│   ├── Models/
│   │   ├── LoginViewModel.cs
│   │   ├── RegisterViewModel.cs
│   │   └── ExternalLoginViewModel.cs
│   ├── Validators/
│   │   ├── LoginValidator.cs
│   │   └── RegisterValidator.cs
│   ├── Extensions/
│   │   └── IdentityServerExtensions.cs
│   ├── Program.cs
│   ├── appsettings.json
│   └── Identity.API.csproj
│
├── Identity.Domain/
│   ├── Entities/
│   │   ├── ApplicationUser.cs            # Extended Identity User
│   │   ├── ApplicationRole.cs
│   │   ├── RefreshToken.cs
│   │   └── UserClaim.cs
│   ├── Enums/
│   │   ├── UserStatus.cs
│   │   └── AccountType.cs
│   └── Identity.Domain.csproj
│
├── Identity.Infrastructure/
│   ├── Data/
│   │   ├── IdentityDbContext.cs
│   │   ├── Migrations/
│   │   └── Seed/
│   │       ├── DefaultUsers.cs
│   │       └── DefaultRoles.cs
│   ├── Repositories/
│   │   ├── UserRepository.cs
│   │   └── RefreshTokenRepository.cs
│   └── Identity.Infrastructure.csproj
│
└── Identity.Tests/
    ├── UnitTests/
    └── IntegrationTests/
```

### Core Implementation

#### 1. Identity Server Configuration (Program.cs)

```csharp
using Duende.IdentityServer;
using Identity.API.Configuration;
using Identity.API.Services;
using Identity.Domain.Entities;
using Identity.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add Database
builder.Services.AddDbContext<IdentityDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("IdentityDb")));

// Add ASP.NET Core Identity
builder.Services.AddIdentity<ApplicationUser, ApplicationRole>(options =>
{
    // Password settings
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = true;
    options.Password.RequiredLength = 8;

    // Lockout settings
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.AllowedForNewUsers = true;

    // User settings
    options.User.RequireUniqueEmail = true;
    options.SignIn.RequireConfirmedEmail = true;
})
.AddEntityFrameworkStores<IdentityDbContext>()
.AddDefaultTokenProviders();

// Add IdentityServer
builder.Services.AddIdentityServer(options =>
{
    options.Events.RaiseErrorEvents = true;
    options.Events.RaiseInformationEvents = true;
    options.Events.RaiseFailureEvents = true;
    options.Events.RaiseSuccessEvents = true;

    options.EmitStaticAudienceClaim = true;
})
.AddInMemoryIdentityResources(IdentityConfig.IdentityResources)
.AddInMemoryApiScopes(IdentityConfig.ApiScopes)
.AddInMemoryApiResources(IdentityConfig.ApiResources)
.AddInMemoryClients(IdentityConfig.Clients)
.AddAspNetIdentity<ApplicationUser>()
.AddProfileService<CustomProfileService>()
.AddDeveloperSigningCredential(); // Use AddSigningCredential in production

// Add Authentication
builder.Services.AddAuthentication()
    .AddGoogle("Google", options =>
    {
        options.ClientId = builder.Configuration["Authentication:Google:ClientId"];
        options.ClientSecret = builder.Configuration["Authentication:Google:ClientSecret"];
    })
    .AddFacebook("Facebook", options =>
    {
        options.AppId = builder.Configuration["Authentication:Facebook:AppId"];
        options.AppSecret = builder.Configuration["Authentication:Facebook:AppSecret"];
    });

// Add Redis for distributed caching
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis");
    options.InstanceName = "IdentityServer_";
});

// Add Services
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<ISmsService, SmsService>();
builder.Services.AddScoped<ITokenService, TokenService>();

// Add Controllers
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowWebApp", policy =>
    {
        policy.WithOrigins("http://localhost:4200", "https://commercehub.com")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

// Configure Pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowWebApp");
app.UseHttpsRedirection();
app.UseIdentityServer();
app.UseAuthorization();
app.MapControllers();

// Seed Data
using (var scope = app.Services.CreateScope())
{
    await SeedData.InitializeAsync(scope.ServiceProvider);
}

app.Run();
```

#### 2. Identity Configuration (Configuration/IdentityConfig.cs)

```csharp
using Duende.IdentityServer;
using Duende.IdentityServer.Models;

namespace Identity.API.Configuration;

public static class IdentityConfig
{
    public static IEnumerable<IdentityResource> IdentityResources =>
        new List<IdentityResource>
        {
            new IdentityResources.OpenId(),
            new IdentityResources.Profile(),
            new IdentityResources.Email(),
            new IdentityResource
            {
                Name = "roles",
                DisplayName = "User Roles",
                UserClaims = new[] { "role" }
            }
        };

    public static IEnumerable<ApiScope> ApiScopes =>
        new List<ApiScope>
        {
            new ApiScope("product.read", "Read Product Data"),
            new ApiScope("product.write", "Write Product Data"),
            new ApiScope("order.read", "Read Order Data"),
            new ApiScope("order.write", "Write Order Data"),
            new ApiScope("cart.full", "Full Cart Access"),
            new ApiScope("payment.process", "Process Payments"),
            new ApiScope("admin.full", "Full Admin Access")
        };

    public static IEnumerable<ApiResource> ApiResources =>
        new List<ApiResource>
        {
            new ApiResource("product-api", "Product API")
            {
                Scopes = { "product.read", "product.write" },
                UserClaims = { "role", "email" }
            },
            new ApiResource("order-api", "Order API")
            {
                Scopes = { "order.read", "order.write" },
                UserClaims = { "role", "email" }
            },
            new ApiResource("cart-api", "Cart API")
            {
                Scopes = { "cart.full" },
                UserClaims = { "role", "email" }
            },
            new ApiResource("payment-api", "Payment API")
            {
                Scopes = { "payment.process" },
                UserClaims = { "role", "email" }
            }
        };

    public static IEnumerable<Client> Clients =>
        new List<Client>
        {
            // Angular Web App (SPA)
            new Client
            {
                ClientId = "commercehub-web",
                ClientName = "CommerceHub Web Application",
                AllowedGrantTypes = GrantTypes.Code,
                RequirePkce = true,
                RequireClientSecret = false,
                
                RedirectUris = 
                { 
                    "http://localhost:4200/auth-callback",
                    "https://commercehub.com/auth-callback"
                },
                PostLogoutRedirectUris = 
                { 
                    "http://localhost:4200",
                    "https://commercehub.com"
                },
                AllowedCorsOrigins = 
                { 
                    "http://localhost:4200",
                    "https://commercehub.com"
                },
                
                AllowedScopes =
                {
                    IdentityServerConstants.StandardScopes.OpenId,
                    IdentityServerConstants.StandardScopes.Profile,
                    IdentityServerConstants.StandardScopes.Email,
                    "roles",
                    "product.read",
                    "product.write",
                    "order.read",
                    "order.write",
                    "cart.full"
                },
                
                AccessTokenLifetime = 3600, // 1 hour
                RefreshTokenUsage = TokenUsage.ReUse,
                RefreshTokenExpiration = TokenExpiration.Sliding,
                SlidingRefreshTokenLifetime = 1296000, // 15 days
                AllowOfflineAccess = true
            },

            // Mobile App
            new Client
            {
                ClientId = "commercehub-mobile",
                ClientName = "CommerceHub Mobile App",
                AllowedGrantTypes = GrantTypes.Code,
                RequirePkce = true,
                RequireClientSecret = false,
                
                RedirectUris = 
                { 
                    "com.commercehub.mobile://callback"
                },
                PostLogoutRedirectUris = 
                { 
                    "com.commercehub.mobile://logout"
                },
                
                AllowedScopes =
                {
                    IdentityServerConstants.StandardScopes.OpenId,
                    IdentityServerConstants.StandardScopes.Profile,
                    IdentityServerConstants.StandardScopes.Email,
                    "roles",
                    "product.read",
                    "order.read",
                    "order.write",
                    "cart.full"
                },
                
                AccessTokenLifetime = 3600,
                RefreshTokenExpiration = TokenExpiration.Sliding,
                SlidingRefreshTokenLifetime = 2592000, // 30 days
                AllowOfflineAccess = true
            },

            // Admin Dashboard
            new Client
            {
                ClientId = "admin-dashboard",
                ClientName = "Admin Dashboard",
                AllowedGrantTypes = GrantTypes.Code,
                RequirePkce = true,
                RequireClientSecret = false,
                
                RedirectUris = { "http://localhost:4201/auth-callback" },
                PostLogoutRedirectUris = { "http://localhost:4201" },
                AllowedCorsOrigins = { "http://localhost:4201" },
                
                AllowedScopes =
                {
                    IdentityServerConstants.StandardScopes.OpenId,
                    IdentityServerConstants.StandardScopes.Profile,
                    IdentityServerConstants.StandardScopes.Email,
                    "roles",
                    "admin.full",
                    "product.read",
                    "product.write",
                    "order.read",
                    "order.write"
                },
                
                AccessTokenLifetime = 1800, // 30 minutes for admin
                AllowOfflineAccess = true
            },

            // Service-to-Service (Machine to Machine)
            new Client
            {
                ClientId = "background-service",
                ClientName = "Background Processing Service",
                ClientSecrets = { new Secret("service-secret".Sha256()) },
                AllowedGrantTypes = GrantTypes.ClientCredentials,
                
                AllowedScopes =
                {
                    "product.read",
                    "order.read",
                    "order.write"
                },
                
                AccessTokenLifetime = 3600
            },

            // Third-Party API Client
            new Client
            {
                ClientId = "third-party-app",
                ClientName = "Third Party Application",
                ClientSecrets = { new Secret("third-party-secret".Sha256()) },
                AllowedGrantTypes = GrantTypes.Code,
                RequirePkce = true,
                
                RedirectUris = { "https://third-party-app.com/callback" },
                PostLogoutRedirectUris = { "https://third-party-app.com" },
                
                AllowedScopes =
                {
                    IdentityServerConstants.StandardScopes.OpenId,
                    IdentityServerConstants.StandardScopes.Profile,
                    "product.read",
                    "order.read"
                },
                
                AccessTokenLifetime = 1800,
                RequireConsent = true // Require user consent
            }
        };
}
```

#### 3. Application User (Domain/Entities/ApplicationUser.cs)

```csharp
using Microsoft.AspNetCore.Identity;

namespace Identity.Domain.Entities;

public class ApplicationUser : IdentityUser<Guid>
{
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string FullName => $"{FirstName} {LastName}";
    
    public DateTime DateOfBirth { get; set; }
    public string ProfilePictureUrl { get; set; }
    
    public UserStatus Status { get; set; } = UserStatus.Active;
    public AccountType AccountType { get; set; } = AccountType.Customer;
    
    // Social Login
    public string GoogleId { get; set; }
    public string FacebookId { get; set; }
    
    // Two-Factor Authentication
    public bool IsTwoFactorEnabled { get; set; }
    public string TwoFactorSecret { get; set; }
    
    // Audit
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public string LastLoginIp { get; set; }
    
    // Relationships
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}

public enum UserStatus
{
    Active = 1,
    Inactive = 2,
    Suspended = 3,
    Deleted = 4
}

public enum AccountType
{
    Customer = 1,
    Seller = 2,
    Admin = 3
}

public class RefreshToken
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Token { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsRevoked { get; set; }
    public string CreatedByIp { get; set; }
    
    public ApplicationUser User { get; set; }
    
    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    public bool IsActive => !IsRevoked && !IsExpired;
}
```

#### 4. Custom Profile Service (Services/CustomProfileService.cs)

```csharp
using Duende.IdentityServer.Models;
using Duende.IdentityServer.Services;
using Identity.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;

namespace Identity.API.Services;

public class CustomProfileService : IProfileService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogger<CustomProfileService> _logger;

    public CustomProfileService(
        UserManager<ApplicationUser> userManager,
        ILogger<CustomProfileService> logger)
    {
        _userManager = userManager;
        _logger = logger;
    }

    public async Task GetProfileDataAsync(ProfileDataRequestContext context)
    {
        var user = await _userManager.GetUserAsync(context.Subject);
        if (user == null)
        {
            _logger.LogWarning("User not found for subject: {Subject}", context.Subject.Identity?.Name);
            return;
        }

        var claims = new List<Claim>
        {
            new Claim("sub", user.Id.ToString()),
            new Claim("email", user.Email),
            new Claim("email_verified", user.EmailConfirmed.ToString()),
            new Claim("name", user.FullName),
            new Claim("given_name", user.FirstName),
            new Claim("family_name", user.LastName),
            new Claim("account_type", user.AccountType.ToString()),
            new Claim("user_status", user.Status.ToString())
        };

        // Add roles
        var roles = await _userManager.GetRolesAsync(user);
        claims.AddRange(roles.Select(role => new Claim("role", role)));

        // Add custom claims
        if (!string.IsNullOrEmpty(user.ProfilePictureUrl))
        {
            claims.Add(new Claim("picture", user.ProfilePictureUrl));
        }

        context.IssuedClaims.AddRange(claims);
    }

    public async Task IsActiveAsync(IsActiveContext context)
    {
        var user = await _userManager.GetUserAsync(context.Subject);
        
        context.IsActive = user != null && 
                          user.Status == UserStatus.Active &&
                          !user.LockoutEnabled;
    }
}
```

#### 5. Account Controller (Controllers/AccountController.cs)

```csharp
using Identity.API.Models;
using Identity.API.Services;
using Identity.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Identity.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AccountController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IEmailService _emailService;
    private readonly ILogger<AccountController> _logger;

    public AccountController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IEmailService emailService,
        ILogger<AccountController> logger)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _emailService = emailService;
        _logger = logger;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterViewModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var user = new ApplicationUser
        {
            UserName = model.Email,
            Email = model.Email,
            FirstName = model.FirstName,
            LastName = model.LastName,
            PhoneNumber = model.PhoneNumber,
            AccountType = model.AccountType,
            EmailConfirmed = false
        };

        var result = await _userManager.CreateAsync(user, model.Password);

        if (!result.Succeeded)
        {
            foreach (var error in result.Errors)
            {
                ModelState.AddModelError(string.Empty, error.Description);
            }
            return BadRequest(ModelState);
        }

        // Assign default role
        await _userManager.AddToRoleAsync(user, 
            model.AccountType == AccountType.Seller ? "Seller" : "Customer");

        // Generate email confirmation token
        var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
        var confirmationLink = Url.Action(
            nameof(ConfirmEmail),
            "Account",
            new { userId = user.Id, token },
            Request.Scheme);

        // Send confirmation email
        await _emailService.SendEmailConfirmationAsync(user.Email, confirmationLink);

        _logger.LogInformation("User {Email} registered successfully", user.Email);

        return Ok(new
        {
            message = "Registration successful. Please check your email to confirm your account.",
            userId = user.Id
        });
    }

    [HttpGet("confirm-email")]
    public async Task<IActionResult> ConfirmEmail(string userId, string token)
    {
        if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(token))
            return BadRequest("Invalid confirmation link");

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return NotFound("User not found");

        var result = await _userManager.ConfirmEmailAsync(user, token);

        if (result.Succeeded)
        {
            return Ok(new { message = "Email confirmed successfully" });
        }

        return BadRequest("Email confirmation failed");
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordViewModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var user = await _userManager.FindByEmailAsync(model.Email);
        if (user == null || !(await _userManager.IsEmailConfirmedAsync(user)))
        {
            // Don't reveal that the user does not exist or is not confirmed
            return Ok(new { message = "If the email exists, a password reset link has been sent." });
        }

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var resetLink = $"https://commercehub.com/reset-password?userId={user.Id}&token={Uri.EscapeDataString(token)}";

        await _emailService.SendPasswordResetAsync(user.Email, resetLink);

        return Ok(new { message = "If the email exists, a password reset link has been sent." });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordViewModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var user = await _userManager.FindByIdAsync(model.UserId);
        if (user == null)
            return BadRequest("Invalid request");

        var result = await _userManager.ResetPasswordAsync(user, model.Token, model.NewPassword);

        if (result.Succeeded)
        {
            return Ok(new { message = "Password has been reset successfully" });
        }

        foreach (var error in result.Errors)
        {
            ModelState.AddModelError(string.Empty, error.Description);
        }

        return BadRequest(ModelState);
    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordViewModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var user = await _userManager.GetUserAsync(User);
        if (user == null)
            return Unauthorized();

        var result = await _userManager.ChangePasswordAsync(
            user, 
            model.CurrentPassword, 
            model.NewPassword);

        if (result.Succeeded)
        {
            await _signInManager.RefreshSignInAsync(user);
            return Ok(new { message = "Password changed successfully" });
        }

        foreach (var error in result.Errors)
        {
            ModelState.AddModelError(string.Empty, error.Description);
        }

        return BadRequest(ModelState);
    }

    [Authorize]
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null)
            return Unauthorized();

        return Ok(new
        {
            id = user.Id,
            email = user.Email,
            firstName = user.FirstName,
            lastName = user.LastName,
            phoneNumber = user.PhoneNumber,
            profilePictureUrl = user.ProfilePictureUrl,
            accountType = user.AccountType.ToString(),
            emailConfirmed = user.EmailConfirmed,
            twoFactorEnabled = user.IsTwoFactorEnabled
        });
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileViewModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var user = await _userManager.GetUserAsync(User);
        if (user == null)
            return Unauthorized();

        user.FirstName = model.FirstName;
        user.LastName = model.LastName;
        user.PhoneNumber = model.PhoneNumber;
        user.ProfilePictureUrl = model.ProfilePictureUrl;
        user.UpdatedAt = DateTime.UtcNow;

        var result = await _userManager.UpdateAsync(user);

        if (result.Succeeded)
        {
            return Ok(new { message = "Profile updated successfully" });
        }

        return BadRequest("Failed to update profile");
    }
}
```

---

## API Gateway Design

### Technology Stack

- **Framework**: Ocelot 18.x
- **Platform**: .NET 8.0
- **Load Balancing**: Built-in Round Robin
- **Rate Limiting**: Ocelot + Redis
- **Caching**: Redis Distributed Cache
- **Logging**: Serilog + ELK Stack
- **Tracing**: OpenTelemetry + Jaeger

### Project Structure

```
src/ApiGateway/
├── Configuration/
│   ├── ocelot.json                       # Main routing config
│   ├── ocelot.Development.json
│   ├── ocelot.Production.json
│   └── Routes/
│       ├── product.routes.json
│       ├── order.routes.json
│       ├── cart.routes.json
│       ├── payment.routes.json
│       └── identity.routes.json
├── Middleware/
│   ├── CorrelationIdMiddleware.cs
│   ├── RequestLoggingMiddleware.cs
│   ├── ExceptionHandlingMiddleware.cs
│   └── RateLimitingMiddleware.cs
├── DelegatingHandlers/
│   ├── AuthenticationDelegatingHandler.cs
│   └── LoggingDelegatingHandler.cs
├── Extensions/
│   ├── ServiceExtensions.cs
│   └── OcelotExtensions.cs
├── Program.cs
├── appsettings.json
└── ApiGateway.csproj
```

### Core Implementation

#### 1. Program.cs

```csharp
using Ocelot.DependencyInjection;
using Ocelot.Middleware;
using Ocelot.Cache.CacheManager;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using ApiGateway.Middleware;
using ApiGateway.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .Enrich.WithMachineName()
    .Enrich.WithEnvironmentName()
    .WriteTo.Console()
    .WriteTo.Elasticsearch(new ElasticsearchSinkOptions(new Uri(builder.Configuration["Elasticsearch:Uri"]))
    {
        AutoRegisterTemplate = true,
        IndexFormat = $"api-gateway-{DateTime.UtcNow:yyyy-MM}"
    })
    .CreateLogger();

builder.Host.UseSerilog();

// Add Ocelot configuration
builder.Configuration.AddJsonFile("Configuration/ocelot.json", optional: false, reloadOnChange: true);
builder.Configuration.AddJsonFile($"Configuration/ocelot.{builder.Environment.EnvironmentName}.json", optional: true);

// Add route-specific configurations
var routesPath = Path.Combine(builder.Environment.ContentRootPath, "Configuration", "Routes");
if (Directory.Exists(routesPath))
{
    foreach (var file in Directory.GetFiles(routesPath, "*.json"))
    {
        builder.Configuration.AddJsonFile(file, optional: true, reloadOnChange: true);
    }
}

// Add Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer("IdentityServer", options =>
    {
        options.Authority = builder.Configuration["IdentityServer:Authority"];
        options.Audience = "api-gateway";
        options.RequireHttpsMetadata = false; // Set to true in production
        
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = true,
            ValidateIssuer = true,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.WithOrigins(
                "http://localhost:4200",
                "http://localhost:4201",
                "https://commercehub.com")
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

// Add Redis for distributed caching
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis");
    options.InstanceName = "ApiGateway_";
});

// Add Ocelot with CacheManager
builder.Services.AddOcelot()
    .AddCacheManager(x =>
    {
        x.WithDictionaryHandle();
    });

// Add Rate Limiting
builder.Services.AddRateLimiting(builder.Configuration);

// Add Health Checks
builder.Services.AddHealthChecks()
    .AddRedis(builder.Configuration.GetConnectionString("Redis"))
    .AddUrlGroup(new Uri(builder.Configuration["HealthChecks:IdentityServer"]), "identity-service")
    .AddUrlGroup(new Uri(builder.Configuration["HealthChecks:ProductService"]), "product-service")
    .AddUrlGroup(new Uri(builder.Configuration["HealthChecks:OrderService"]), "order-service");

var app = builder.Build();

// Configure Pipeline
app.UseCors("AllowAll");

// Custom Middleware
app.UseMiddleware<CorrelationIdMiddleware>();
app.UseMiddleware<RequestLoggingMiddleware>();
app.UseMiddleware<ExceptionHandlingMiddleware>();

// Health Checks
app.MapHealthChecks("/health");

// Ocelot Middleware
await app.UseOcelot();

app.Run();
```

#### 2. Ocelot Configuration (Configuration/ocelot.json)

```json
{
  "GlobalConfiguration": {
    "BaseUrl": "https://api.commercehub.com",
    "ServiceDiscoveryProvider": {
      "Host": "consul",
      "Port": 8500,
      "Type": "Consul"
    },
    "RateLimitOptions": {
      "DisableRateLimitHeaders": false,
      "QuotaExceededMessage": "Rate limit exceeded. Please try again later.",
      "HttpStatusCode": 429,
      "ClientIdHeader": "X-Client-Id"
    },
    "QoSOptions": {
      "ExceptionsAllowedBeforeBreaking": 3,
      "DurationOfBreak": 30000,
      "TimeoutValue": 10000
    },
    "LoadBalancerOptions": {
      "Type": "RoundRobin"
    }
  },
  "Routes": [
    {
      "UpstreamPathTemplate": "/api/auth/{everything}",
      "UpstreamHttpMethod": [ "Get", "Post", "Put", "Delete" ],
      "DownstreamPathTemplate": "/api/{everything}",
      "DownstreamScheme": "http",
      "DownstreamHostAndPorts": [
        {
          "Host": "identity-service",
          "Port": 5001
        }
      ],
      "RateLimitOptions": {
        "ClientWhitelist": [],
        "EnableRateLimiting": true,
        "Period": "1m",
        "PeriodTimespan": 60,
        "Limit": 100
      }
    },
    {
      "UpstreamPathTemplate": "/api/products",
      "UpstreamHttpMethod": [ "Get" ],
      "DownstreamPathTemplate": "/api/products",
      "DownstreamScheme": "http",
      "DownstreamHostAndPorts": [
        {
          "Host": "product-service",
          "Port": 5010
        }
      ],
      "FileCacheOptions": {
        "TtlSeconds": 300,
        "Region": "products"
      },
      "RateLimitOptions": {
        "EnableRateLimiting": true,
        "Period": "1m",
        "Limit": 1000
      }
    },
    {
      "UpstreamPathTemplate": "/api/products/{id}",
      "UpstreamHttpMethod": [ "Get" ],
      "DownstreamPathTemplate": "/api/products/{id}",
      "DownstreamScheme": "http",
      "DownstreamHostAndPorts": [
        {
          "Host": "product-service",
          "Port": 5010
        }
      ],
      "FileCacheOptions": {
        "TtlSeconds": 600,
        "Region": "product-details"
      }
    },
    {
      "UpstreamPathTemplate": "/api/products/{everything}",
      "UpstreamHttpMethod": [ "Post", "Put", "Delete" ],
      "DownstreamPathTemplate": "/api/products/{everything}",
      "DownstreamScheme": "http",
      "DownstreamHostAndPorts": [
        {
          "Host": "product-service",
          "Port": 5010
        }
      ],
      "AuthenticationOptions": {
        "AuthenticationProviderKey": "IdentityServer",
        "AllowedScopes": [ "product.write" ]
      },
      "RouteClaimsRequirement": {
        "role": "Admin,Seller"
      }
    },
    {
      "UpstreamPathTemplate": "/api/cart/{everything}",
      "UpstreamHttpMethod": [ "Get", "Post", "Put", "Delete" ],
      "DownstreamPathTemplate": "/api/cart/{everything}",
      "DownstreamScheme": "http",
      "DownstreamHostAndPorts": [
        {
          "Host": "cart-service",
          "Port": 5030
        }
      ],
      "AuthenticationOptions": {
        "AuthenticationProviderKey": "IdentityServer",
        "AllowedScopes": [ "cart.full" ]
      },
      "RateLimitOptions": {
        "EnableRateLimiting": true,
        "Period": "1m",
        "Limit": 200
      }
    },
    {
      "UpstreamPathTemplate": "/api/orders/{everything}",
      "UpstreamHttpMethod": [ "Get", "Post", "Put", "Delete" ],
      "DownstreamPathTemplate": "/api/orders/{everything}",
      "DownstreamScheme": "http",
      "DownstreamHostAndPorts": [
        {
          "Host": "order-service",
          "Port": 5020
        }
      ],
      "AuthenticationOptions": {
        "AuthenticationProviderKey": "IdentityServer",
        "AllowedScopes": [ "order.read", "order.write" ]
      },
      "RateLimitOptions": {
        "EnableRateLimiting": true,
        "Period": "1m",
        "Limit": 100
      },
      "QoSOptions": {
        "ExceptionsAllowedBeforeBreaking": 3,
        "DurationOfBreak": 30000,
        "TimeoutValue": 15000
      }
    },
    {
      "UpstreamPathTemplate": "/api/payments/{everything}",
      "UpstreamHttpMethod": [ "Post" ],
      "DownstreamPathTemplate": "/api/payments/{everything}",
      "DownstreamScheme": "http",
      "DownstreamHostAndPorts": [
        {
          "Host": "payment-service",
          "Port": 5040
        }
      ],
      "AuthenticationOptions": {
        "AuthenticationProviderKey": "IdentityServer",
        "AllowedScopes": [ "payment.process" ]
      },
      "RateLimitOptions": {
        "EnableRateLimiting": true,
        "Period": "1m",
        "Limit": 50
      },
      "QoSOptions": {
        "TimeoutValue": 30000
      }
    }
  ]
}
```

#### 3. Correlation ID Middleware

```csharp
namespace ApiGateway.Middleware;

public class CorrelationIdMiddleware
{
    private const string CorrelationIdHeader = "X-Correlation-Id";
    private readonly RequestDelegate _next;
    private readonly ILogger<CorrelationIdMiddleware> _logger;

    public CorrelationIdMiddleware(RequestDelegate next, ILogger<CorrelationIdMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = GetOrCreateCorrelationId(context);
        
        // Add to response headers
        context.Response.OnStarting(() =>
        {
            if (!context.Response.Headers.ContainsKey(CorrelationIdHeader))
            {
                context.Response.Headers.Add(CorrelationIdHeader, correlationId);
            }
            return Task.CompletedTask;
        });

        // Add to log context
        using (_logger.BeginScope(new Dictionary<string, object>
        {
            ["CorrelationId"] = correlationId
        }))
        {
            await _next(context);
        }
    }

    private string GetOrCreateCorrelationId(HttpContext context)
    {
        if (context.Request.Headers.TryGetValue(CorrelationIdHeader, out var correlationId))
        {
            return correlationId.ToString();
        }

        return Guid.NewGuid().ToString();
    }
}
```

#### 4. Exception Handling Middleware

```csharp
using System.Net;
using System.Text.Json;

namespace ApiGateway.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception occurred");
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

        var response = new
        {
            statusCode = context.Response.StatusCode,
            message = "An error occurred processing your request.",
            detailed = exception.Message
        };

        var json = JsonSerializer.Serialize(response);
        await context.Response.WriteAsync(json);
    }
}
```

#### 5. Request Logging Middleware

```csharp
using System.Diagnostics;

namespace ApiGateway.Middleware;

public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();
        
        try
        {
            await _next(context);
        }
        finally
        {
            stopwatch.Stop();
            
            _logger.LogInformation(
                "HTTP {Method} {Path} responded {StatusCode} in {Elapsed}ms",
                context.Request.Method,
                context.Request.Path,
                context.Response.StatusCode,
                stopwatch.ElapsedMilliseconds);
        }
    }
}
```

---

## Security Implementation

### 1. JWT Token Structure

```json
{
  "header": {
    "alg": "RS256",
    "kid": "rsa-key-id",
    "typ": "JWT"
  },
  "payload": {
    "sub": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "role": ["Customer"],
    "account_type": "Customer",
    "nbf": 1694340000,
    "exp": 1694343600,
    "iss": "https://identity.commercehub.com",
    "aud": ["product-api", "order-api", "cart-api"],
    "scope": ["openid", "profile", "email", "product.read", "order.write"]
  }
}
```

### 2. Token Validation in Services

```csharp
// Startup.cs in each microservice
services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = configuration["IdentityServer:Authority"];
        options.Audience = "product-api"; // Service-specific
        options.RequireHttpsMetadata = true;
        
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = true,
            ValidateIssuer = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ClockSkew = TimeSpan.Zero
        };
        
        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                if (context.Exception.GetType() == typeof(SecurityTokenExpiredException))
                {
                    context.Response.Headers.Add("Token-Expired", "true");
                }
                return Task.CompletedTask;
            }
        };
    });
```

### 3. Authorization Policies

```csharp
services.AddAuthorization(options =>
{
    // Scope-based policies
    options.AddPolicy("ProductRead", policy =>
        policy.RequireClaim("scope", "product.read"));
    
    options.AddPolicy("ProductWrite", policy =>
        policy.RequireClaim("scope", "product.write"));
    
    // Role-based policies
    options.AddPolicy("AdminOnly", policy =>
        policy.RequireRole("Admin"));
    
    options.AddPolicy("SellerOrAdmin", policy =>
        policy.RequireRole("Seller", "Admin"));
    
    // Combined policies
    options.AddPolicy("CanManageProducts", policy =>
        policy.RequireRole("Admin", "Seller")
              .RequireClaim("scope", "product.write"));
});
```

### 4. API Gateway Rate Limiting

```csharp
public static class RateLimitingExtensions
{
    public static IServiceCollection AddRateLimiting(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddRateLimiter(options =>
        {
            // Global rate limit
            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
            {
                var clientId = context.Request.Headers["X-Client-Id"].ToString();
                
                return RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: clientId ?? "anonymous",
                    factory: partition => new FixedWindowRateLimiterOptions
                    {
                        AutoReplenishment = true,
                        PermitLimit = 1000,
                        QueueLimit = 0,
                        Window = TimeSpan.FromMinutes(1)
                    });
            });

            // Per-user rate limit
            options.AddPolicy("per-user", context =>
            {
                var userId = context.User.FindFirstValue("sub");
                
                return RateLimitPartition.GetSlidingWindowLimiter(
                    partitionKey: userId ?? "anonymous",
                    factory: partition => new SlidingWindowRateLimiterOptions
                    {
                        AutoReplenishment = true,
                        PermitLimit = 100,
                        QueueLimit = 0,
                        Window = TimeSpan.FromMinutes(1),
                        SegmentsPerWindow = 4
                    });
            });

            options.OnRejected = async (context, token) =>
            {
                context.HttpContext.Response.StatusCode = 429;
                await context.HttpContext.Response.WriteAsJsonAsync(new
                {
                    error = "Too many requests",
                    message = "Rate limit exceeded. Please try again later."
                }, cancellationToken: token);
            };
        });

        return services;
    }
}
```

---

## Token Management

### 1. Token Refresh Implementation

```csharp
// Angular Service
export class TokenService {
  private refreshTokenInProgress = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  refreshToken(): Observable<TokenResponse> {
    if (this.refreshTokenInProgress) {
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(token => of({ accessToken: token! } as TokenResponse))
      );
    }

    this.refreshTokenInProgress = true;
    this.refreshTokenSubject.next(null);

    const refreshToken = this.authService.getRefreshToken();

    return this.http.post<TokenResponse>('/connect/token', {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: 'commercehub-web'
    }).pipe(
      tap(response => {
        this.authService.setTokens(response.accessToken, response.refreshToken);
        this.refreshTokenSubject.next(response.accessToken);
        this.refreshTokenInProgress = false;
      }),
      catchError(error => {
        this.refreshTokenInProgress = false;
        this.authService.logout();
        return throwError(() => error);
      })
    );
  }
}

// HTTP Interceptor
export class TokenInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private tokenService: TokenService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getAccessToken();

    if (token) {
      req = this.addToken(req, token);
    }

    return next.handle(req).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          return this.handle401Error(req, next);
        }
        return throwError(() => error);
      })
    );
  }

  private addToken(req: HttpRequest<any>, token: string): HttpRequest<any> {
    return req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  private handle401Error(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return this.tokenService.refreshToken().pipe(
      switchMap(response => {
        return next.handle(this.addToken(req, response.accessToken));
      }),
      catchError(error => {
        this.authService.logout();
        return throwError(() => error);
      })
    );
  }
}
```

### 2. Token Revocation

```csharp
// Identity Server - Revoke Token Endpoint
[HttpPost("revoke")]
public async Task<IActionResult> RevokeToken([FromBody] RevokeTokenRequest request)
{
    var user = await _userManager.GetUserAsync(User);
    if (user == null)
        return Unauthorized();

    // Revoke specific refresh token
    var refreshToken = await _context.RefreshTokens
        .FirstOrDefaultAsync(rt => rt.Token == request.Token && rt.UserId == user.Id);

    if (refreshToken != null)
    {
        refreshToken.IsRevoked = true;
        await _context.SaveChangesAsync();
    }

    return Ok(new { message = "Token revoked successfully" });
}

// Revoke all user tokens (logout from all devices)
[HttpPost("revoke-all")]
public async Task<IActionResult> RevokeAllTokens()
{
    var user = await _userManager.GetUserAsync(User);
    if (user == null)
        return Unauthorized();

    var tokens = await _context.RefreshTokens
        .Where(rt => rt.UserId == user.Id && !rt.IsRevoked)
        .ToListAsync();

    foreach (var token in tokens)
    {
        token.IsRevoked = true;
    }

    await _context.SaveChangesAsync();

    return Ok(new { message = "All tokens revoked successfully" });
}
```

---

## Integration Examples

### 1. Angular Authentication Service

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private readonly API_URL = 'https://api.commercehub.com/api/auth';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadUserFromStorage();
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/login`, { email, password })
      .pipe(
        tap(response => {
          this.setTokens(response.accessToken, response.refreshToken);
          this.loadUserFromToken(response.accessToken);
        })
      );
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.API_URL}/register`, userData);
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    return token !== null && !this.isTokenExpired(token);
  }

  private isTokenExpired(token: string): boolean {
    const payload = this.parseJwt(token);
    if (!payload || !payload.exp) return true;
    
    const expirationDate = new Date(payload.exp * 1000);
    return expirationDate < new Date();
  }

  private parseJwt(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(window.atob(base64));
    } catch {
      return null;
    }
  }

  private loadUserFromToken(token: string): void {
    const payload = this.parseJwt(token);
    if (payload) {
      const user: User = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        roles: Array.isArray(payload.role) ? payload.role : [payload.role]
      };
      this.currentUserSubject.next(user);
    }
  }

  private loadUserFromStorage(): void {
    const token = this.getAccessToken();
    if (token && !this.isTokenExpired(token)) {
      this.loadUserFromToken(token);
    }
  }
}
```

### 2. Angular Auth Guard

```typescript
import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.authService.isAuthenticated()) {
      // Check for required roles
      const requiredRoles = route.data['roles'] as string[];
      if (requiredRoles) {
        const user = this.authService.currentUser$.value;
        if (user && this.hasRequiredRole(user.roles, requiredRoles)) {
          return true;
        } else {
          this.router.navigate(['/forbidden']);
          return false;
        }
      }
      return true;
    }

    // Not logged in, redirect to login with return url
    this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  private hasRequiredRole(userRoles: string[], requiredRoles: string[]): boolean {
    return requiredRoles.some(role => userRoles.includes(role));
  }
}
```

### 3. Service-to-Service Authentication

```csharp
// Order Service calling Payment Service
public class PaymentServiceClient
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<PaymentServiceClient> _logger;
    private string _accessToken;
    private DateTime _tokenExpiry;

    public PaymentServiceClient(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<PaymentServiceClient> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<PaymentResult> ProcessPaymentAsync(PaymentRequest request)
    {
        await EnsureAccessTokenAsync();
        
        _httpClient.DefaultRequestHeaders.Authorization = 
            new AuthenticationHeaderValue("Bearer", _accessToken);

        var response = await _httpClient.PostAsJsonAsync(
            "https://api.commercehub.com/api/payments/process",
            request);

        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<PaymentResult>();
    }

    private async Task EnsureAccessTokenAsync()
    {
        if (!string.IsNullOrEmpty(_accessToken) && DateTime.UtcNow < _tokenExpiry)
            return;

        var tokenResponse = await RequestTokenAsync();
        _accessToken = tokenResponse.AccessToken;
        _tokenExpiry = DateTime.UtcNow.AddSeconds(tokenResponse.ExpiresIn - 60);
    }

    private async Task<TokenResponse> RequestTokenAsync()
    {
        var tokenRequest = new Dictionary<string, string>
        {
            { "grant_type", "client_credentials" },
            { "client_id", _configuration["ServiceClient:ClientId"] },
            { "client_secret", _configuration["ServiceClient:ClientSecret"] },
            { "scope", "payment.process" }
        };

        var response = await _httpClient.PostAsync(
            "https://identity.commercehub.com/connect/token",
            new FormUrlEncodedContent(tokenRequest));

        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<TokenResponse>();
    }
}
```

---

## Configuration Files

### appsettings.json (Identity Server)

```json
{
  "ConnectionStrings": {
    "IdentityDb": "Host=localhost;Port=5432;Database=IdentityDb;Username=postgres;Password=your_password",
    "Redis": "localhost:6379"
  },
  "Authentication": {
    "Google": {
      "ClientId": "your-google-client-id",
      "ClientSecret": "your-google-client-secret"
    },
    "Facebook": {
      "AppId": "your-facebook-app-id",
      "AppSecret": "your-facebook-app-secret"
    }
  },
  "EmailService": {
    "Provider": "SendGrid",
    "ApiKey": "your-sendgrid-api-key",
    "FromEmail": "noreply@commercehub.com",
    "FromName": "CommerceHub"
  },
  "SmsService": {
    "Provider": "Twilio",
    "AccountSid": "your-twilio-account-sid",
    "AuthToken": "your-twilio-auth-token",
    "PhoneNumber": "+1234567890"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Duende": "Information"
    }
  }
}
```

### appsettings.json (API Gateway)

```json
{
  "ConnectionStrings": {
    "Redis": "localhost:6379"
  },
  "IdentityServer": {
    "Authority": "https://identity.commercehub.com"
  },
  "HealthChecks": {
    "IdentityServer": "https://identity.commercehub.com/health",
    "ProductService": "http://product-service:5010/health",
    "OrderService": "http://order-service:5020/health"
  },
  "Elasticsearch": {
    "Uri": "http://localhost:9200"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Ocelot": "Information"
    }
  }
}
```

---

This comprehensive design covers Identity Server and API Gateway implementation for your CommerceHub microservices platform, including authentication flows, security, token management, and integration examples.
