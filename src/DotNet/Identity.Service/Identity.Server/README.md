# Identity Server

Duende IdentityServer 8 authorization server using ASP.NET Core Identity and PostgreSQL. Identity users, clients, API resources/scopes, and persisted grants are stored in PostgreSQL.

Payment-card data, including card verification codes, is deliberately not stored on identity users or emitted in tokens. Store payment instruments in the payment domain and pass references rather than card secrets.

## Local setup

The ignored `appsettings.Development.json` contains disposable local credentials so the service can run without `dotnet user-secrets`. It assumes PostgreSQL is available at `localhost:5432` with the local `postgres` / `postgres` credentials. Change that file if your local database differs.

```powershell
cd src\DotNet\Identity.Service\Identity.Server
dotnet run
```

The development issuer listens at `http://localhost:5063` and uses a persisted development signing key. The seeded local account is `admin` / `DevOnly_Admin_2026!`; these development credentials must never be used outside a local Development environment. Production must supply the database connection, client secrets, and signing-certificate path/password through its deployment secret store. A production Duende license key must also be provided with `Duende:LicenseKey`.

The first start applies EF Core migrations and seeds missing IdentityServer clients, scopes, resources, and identity resources. Roles are created on startup. The initial `admin` account is created only when `SeedAdmin:Password` is set.

Token exchange uses the RSK parser and validation services with a local Duende 8-compatible extension-grant adapter; this avoids the package's incompatible pre-cancellation-token validator registration.
