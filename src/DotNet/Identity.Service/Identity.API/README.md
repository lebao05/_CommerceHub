# Identity Service

A small OpenIddict-backed token issuer for the CommerceHub platform. It runs as a single
ASP.NET Core project (`Identity.API`) and serves three OAuth 2.0 grants:

| Grant | Audience |
|---|---|
| `password` | First-party clients (server-to-server, CLI tools, tests) logging a real user in with email + password. |
| `refresh_token` | The same client, trading a refresh token for a fresh access/refresh pair. Refresh tokens are single-use and rotated. |
| `client_credentials` | Background workers, the API gateway and other machine callers that authenticate as themselves. |

The authorization-code / PKCE flow used by the SPAs is intentionally **not** enabled here;
that lives on the API gateway, which brokers the code-for-token exchange. Adding it back
later means enabling two more endpoints (`/connect/authorize`, `/connect/logout`) plus a
few extra client registrations.

## Endpoints

```
GET  /.well-known/openid-configuration   discovery document
GET  /.well-known/jwks                   signing keys (RS256)
POST /connect/token                      password / refresh_token / client_credentials
POST /api/auth/register                  create a customer account
GET  /api/auth/me                        current user (Bearer token)
PUT  /api/auth/me                        update current user
POST /api/auth/change-password           change current user's password
POST /api/auth/forgot-password           start password recovery
POST /api/auth/reset-password            complete password recovery
POST /api/auth/confirm-email             complete email confirmation
GET  /api/identity/users                 list users (SystemAdmin only)
POST /api/identity/users/roles           grant / revoke role
POST /api/identity/users/status          change account status
```

## Stack

- **ASP.NET Core 10** (`net10.0`)
- **OpenIddict 7.7.1** (server + validation + EF Core store)
- **ASP.NET Core Identity** with `Guid` keys for users and roles
- **Npgsql + EF Core 10** against PostgreSQL
- **Serilog** for console + rolling daily files in `logs/`
- **FluentValidation** for request shape rules

## Configuration

`appsettings.json`:

```json
{
  "ConnectionStrings": {
    "IdentityDb": "Host=127.0.0.1;Port=5433;Database=identitydb;Username=postgres;Password="
  },
  "OpenIddict": {
    "Issuer": "http://localhost:5063/"
  },
  "Cors": {
    "AllowedOrigins": [ "http://localhost:5173", "http://localhost:5174" ]
  }
}
```

Override at runtime through standard ASP.NET Core environment variables
(`ConnectionStrings__IdentityDb`, `OpenIddict__Issuer`, etc.).

## First-time Setup

The server is configured to be runnable in development with zero extra steps:

1. Make sure PostgreSQL is reachable on the configured `IdentityDb` connection string.
2. Run the server. On first start it will:
   - create the database schema via `EnsureCreatedAsync()`,
   - seed the four platform roles (`Customer`, `SalesAdmin`, `SystemAdmin`, `ServiceAccount`),
   - register three OpenIddict client applications with `ept:token` plus the relevant
     grant and scope permissions (see below).
3. Set `Identity__Seed__AdminEmail` and `Identity__Seed__AdminPassword` in the development
   environment to get an initial administrator.

### Seeded clients

| Client id | Type | Grants | Secret |
|---|---|---|---|
| `commercehub-firstparty` | Confidential | password, refresh_token | `<clientId>-dev-secret-please-rotate` unless overridden |
| `commercehub-gateway` | Confidential | client_credentials | same |
| `commercehub-services` | Confidential | client_credentials | same |

The defaults are intentionally deterministic so a development restart doesn't invalidate
the database. Override per-client secrets through `Clients__<ClientName>__Secret` for
anything that isn't local development.

## Run

```powershell
cd src\DotNet\Identity.Service\Identity.API
dotnet run --urls http://localhost:5063
```

The server listens on `http://localhost:5063/` by default. Health comes from a successful
discovery response:

```powershell
curl http://localhost:5063/.well-known/openid-configuration | jq
```

## Smoke Test

```powershell
# 1. Register a customer
curl -X POST http://localhost:5063/api/auth/register `
  -H 'Content-Type: application/json' `
  -d '{
    "email":"alice@example.com",
    "password":"Sup3rSecret!Pass",
    "firstName":"Alice",
    "lastName":"Anderson"
  }'

# 2. Trade credentials for tokens
curl -X POST http://localhost:5063/connect/token `
  -d 'grant_type=password' `
  -d 'username=alice@example.com' `
  -d 'password=Sup3rSecret!Pass' `
  -d 'client_id=commercehub-firstparty' `
  -d 'client_secret=commercehub-firstparty-dev-secret-please-rotate' `
  -d 'scope=openid profile email roles offline_access'

# 3. Hit a protected endpoint
curl http://localhost:5063/api/auth/me -H 'Authorization: Bearer <access_token>'
```

## Development Notes

- **Schema**: the database is provisioned with `EnsureCreatedAsync()` for simplicity. When
  the project graduates to migrations, replace that call with `MigrateAsync()` and add a
  `Migrations` folder generated by `dotnet ef migrations add InitialCreate`.
- **Logging**: Serilog writes to `logs/identity-YYYYMMDD.log` (rolling daily, 7 days
  retained) and the console.
- **Signing keys**: in development, OpenIddict's dev signing/encryption certificates are
  persisted to the ASP.NET Core DataProtection store under
  `%LOCALAPPDATA%\ASP.NET\DataProtection-Keys`.
