# CommerceHub API gateway

The single HTTP entry point in front of the CommerceHub services. It validates the access token
issued by the identity server, decides whether the caller is allowed to make the request, forwards
the request to the right service, and passes on who the caller is.

The services behind it authenticate nobody, so **nothing should call them directly.** Anything that
reaches a service without going through here arrives with no verified identity at all.

Built on [YARP](https://github.com/dotnet/yarp) 2.3.0, with token validation by OpenIddict 7.7.1
against the identity server's published signing keys.

---

## Running it

```powershell
cd src\DotNet\ApiGateway\ApiGateway
dotnet run
```

The default profile listens on **http://localhost:5108**. Run it from the project directory: the
content root has to be there, because that is where `appsettings.json` lives, and the gateway
refuses to start if the `Gateway` configuration section does not bind.

The identity server must be running for token validation to work, but not for the gateway to start.
A gateway whose identity server is down still serves the anonymous catalog, and `/health` reports
`Degraded` rather than failing — see [Health](#health).

### Configuration

Everything environment-specific lives in the `Gateway` section of `appsettings.json`. Nothing in
these files is a secret, and nothing should ever be: the only value a client secret or a signing key
can safely live in is user secrets or the environment.

| Key | What it is |
|---|---|
| `Gateway:Identity:Issuer` | The identity server's issuer. Must match the `iss` in its tokens exactly, **including the trailing slash**. The identity server's `appsettings.Development.json` sets `http://localhost:5063` and appends the slash, so `http://localhost:5063/` is the right value. |
| `Gateway:Cors:Origins` | Browser origins allowed to call the gateway with credentials. |
| `Gateway:Services:<name>` | `Host` + `Port`, or a single `Address` for a deployed environment. The route table never hard-codes a port. |
| `Gateway:RateLimiting:*` | `PermitLimit`, `WindowSeconds` and `QueueLimit` for the global and authentication ceilings. |
| `Gateway:Swagger:ClientId` | The client the Swagger UI authenticates as. The secret is typed into the browser, not configured here. |
| `Session:IdleMinutes` | Session idle timeout, in minutes. Defaults to 30. |
| `Session:AbsoluteDays` | Session hard maximum age, in days. Defaults to 7. |
| `Session:RefreshWindowSeconds` | When the access token is within this many seconds of expiry, the handler proactively refreshes it using the refresh token. Defaults to 60. |
| `Session:Redis` | Redis connection string. The gateway refuses to start if this is not set. |
| `Session:GatewayClientSecret` | The secret the gateway presents to the identity server as `commercehub-gateway`. Must be set in user secrets or the environment. |
| `Session:StorefrontOrigin` | Where to redirect after a successful sign-in. Defaults to `http://localhost:5173`. |
| `Session:AdminOrigin` | Where the admin SPA expects to land. Defaults to `http://localhost:5174`. |
| `Session:AllowedClients` | The SPA client ids the gateway will act on behalf of. Defaults to `["commercehub-web", "admin-dashboard"]`. |
| `Session:GatewayOrigin` | The gateway's own base address, used to build the OAuth callback URL. Defaults to `http://localhost:5108`. |

Any of it can be overridden without a rebuild, which is the normal way to point a deployed gateway
at real service addresses:

```powershell
$env:Gateway__Services__Order__Address = "http://order-api:8080"
$env:Gateway__Identity__Issuer = "https://identity.example.com/"
```

---

## Routes

Services share one `/api` namespace, and the segment after `/api` names the service. That is the
convention the rest of the solution already uses: the storefront builds its base URL as
`{host}/api` and then calls `/orders` or `/auth/login`, and the services themselves publish
`/api/categories` and `/api/auth/...`. Nothing is rewritten on the way through — each service already
publishes the exact path the gateway matches, so there is no prefix-stripping transform anywhere. A
request to an unlisted path gets a `404`; a known path with a method the route does not list gets a
`405`.

| Gateway path | Methods | Forwards to | Policy | Required scope | Also requires a role |
|---|---|---|---|---|---|
| `/api/categories/**` | `GET`, `HEAD` | Product catalog `:5209` | *none* — anonymous | — | — |
| `/api/categories/**` | `POST`, `PUT`, `PATCH`, `DELETE` | Product catalog `:5209` | `catalog-write` | `product.write` | `SalesAdmin` or `SystemAdmin` |
| `/api/orders/**` | `GET`, `HEAD` | Order `:5141` | `order-read` | `order.read` | — |
| `/api/orders/**` | `POST`, `PUT`, `PATCH`, `DELETE` | Order `:5141` | `order-write` | `order.write` | — |
| `/api/inventory/**` | `GET`, `HEAD` | Inventory `:5233` | `inventory-read` | `inventory.read` | — |
| `/api/inventory/**` | `POST`, `PUT`, `PATCH`, `DELETE` | Inventory `:5233` | `inventory-write` | `inventory.write` | `SalesAdmin` or `SystemAdmin` |
| `/api/payments/**` | `POST`, `PUT`, `PATCH`, `DELETE` | Payment `:5172` | `payment-process` | `payment.process` | — |
| `/api/auth/**` | any | Identity server `:5063` | *none* — the identity server decides per endpoint | — | — |
| `/api/identity/**` | any | Identity server `:5063` | `system-admin` | `admin.full` | `SystemAdmin` |
| `/connect/**` | any | Identity server `:5063` | *none* — anonymous | — | — |
| `/.well-known/openid-configuration` | any | Identity server `:5063` | *none* — anonymous | — | — |
| `/.well-known/jwks` | any | Identity server `:5063` | *none* — anonymous | — | — |
| `/health` | any | — (handled by the gateway) | *none* | — | — |
| `/oauth/login` | `GET` | — (handled by the gateway) | *none* | — | Starts the session-based sign-in flow |
| `/oauth/callback` | `GET` | — (handled by the gateway) | *none* | — | Exchanges the OAuth code for a session |
| `/oauth/logout` | `POST` | — (handled by the gateway) | *none* | — | Destroys the session and clears cookies |

Four things worth stating plainly:

- **Browsing the catalog is anonymous.** A storefront visitor has no token until they sign in, so a
  `GET` behind a policy would make the shop front page unusable for every logged-out visitor. The
  `catalog-read` policy exists and is registered, but no route uses it; the `product.read` scope is
  for a caller that has one, not for the general case.
- **`/api/auth/**` is anonymous at the gateway on purpose.** One route covers both the endpoints that
  must work before anyone has a token (register, forgot/reset password) and the ones that must not
  work without one (profile, change password), and the identity server draws that line itself, on
  each action, validating the token against its own signing key. A gateway policy here would either
  exempt the public half and so protect nothing extra, or blanket the route and break registration.
- **`/api/identity/**` is the one identity route the gateway guards.** It changes other people's
  roles and account status, so it is held to `admin.full` **and** to the `SystemAdmin` role here, and
  to the same two things again inside the identity server. A member of the selling team is
  deliberately not an administrator in this sense.
- **`/connect/**` is anonymous by necessity, not by oversight.** It is where a browser arrives before
  it has any token, and it is the credential exchange itself — there is nothing to authenticate yet.
  The identity server applies its own authentication to the endpoints behind it. What the gateway
  adds there is a tighter rate limit and a log line.

### Roles

There are three, and they are declared once in `Identity.Domain.Authorization.ApplicationRoles`:

| `Role` | Holds | Cannot |
|---|---|---|
| `Customer` | `profile.read/write`, `product.read`, `order.read/write`, `inventory.read`, `payment.process` | Write the catalog, adjust inventory, administer accounts |
| `SalesAdmin` | Everything a `Customer` holds, plus `product.write` and `inventory.write` | Administer accounts |
| `SystemAdmin` | Everything a `SalesAdmin` holds, plus `admin.full` | — |
| `ServiceAccount` | No scopes of its own — a client-credentials token is bounded by its client's registered permissions | Satisfy `system-admin`; there is no user to grant it to |

The role is not decoration, and the identity server is where that is decided. OpenIddict narrows an
authorization request against the **client's** registered permissions, which answers "what may this
application ask for" and not "what may this person be given" — the admin console is registered for
`admin.full` because a system administrator uses it. So `/connect/authorize` intersects the requested
scopes with the scopes the signed-in person's roles grant
(`Identity.Infrastructure.Configuration.RoleScopes`), and logs anything it withholds. A scope that is
withheld is dropped rather than refused, which produces a `403` on the one action that needed it
instead of a login loop.

The role requirements in the gateway's own policies are the second, independent check. They matter
for tokens that the narrowing above never saw: one minted before this behaviour existed, or one
issued to a client-credentials caller, which has no user and therefore no roles to narrow by.

`admin.full` is held by the `SystemAdmin` role alone, so a route guarded by `system-admin` is
unreachable from the storefront by construction rather than by configuration.

---

## Session-based authentication for browser clients

The gateway supports two authentication modes on the same pipeline:

### Mode 1 — bearer token (service-to-service)

A caller sends `Authorization: Bearer <token>`. The gateway validates the token against the identity
server's signing keys, as before. This is the path for background workers, scripts, and anything that
holds its own token.

### Mode 2 — session cookie (browser clients)

A browser SPA redirects the user to the gateway's own `/oauth/login` endpoint. The gateway builds the
authorize URL, redirects the browser to the identity server, and after the user signs in the identity
server redirects back to `/oauth/callback`. The gateway exchanges the code for tokens, stores them in
Redis, and returns two cookies:

| Cookie | HttpOnly | What it holds |
|---|---|---|
| `ch_session` | yes | An opaque 32-byte session id. The tokens live in Redis, not here. |
| `ch_csrf` | no | A random token JavaScript reads to populate the `X-CSRF` header. |

The session is stored in Redis with a 30-minute idle timeout and a 7-day absolute timeout. The gateway
rebuilds a `ClaimsPrincipal` from the stored claims on every request, so downstream services receive
the same `X-User-*` headers they would from a bearer token. The access token is also stored, so the
gateway could forward it to a service that later adds its own token validation.

**CSRF protection.** Every mutating request (POST, PUT, PATCH, DELETE) from a browser must carry
`X-CSRF: <value>` matching the `ch_csrf` cookie. The header cannot be set cross-origin, so a form
submission from another site cannot produce a matching value. GET, HEAD, OPTIONS, and bearer-authenticated
requests bypass the check. A mismatch returns `403` with a JSON error body.

### Switching a SPA to the new flow

Change the SPA's sign-in button to call the gateway instead of building an OIDC request directly:

```
Before: window.location = `${identityServer}/connect/authorize?...`
After:  window.location = `${gateway}/oauth/login?return_to=...&audience=commercehub-web`
```

The `audience` parameter names the SPA client (`commercehub-web` or `admin-dashboard`). The SPA's
callback URL in the identity server's registration is not changed yet — both flows coexist during
rollout, and the SPA-side change is additive.

Sign-out calls `POST /oauth/logout`, which deletes the Redis record and clears both cookies.

### Gateway client secret

The gateway presents itself as the confidential client `commercehub-gateway` to the identity
server. Its secret is in `appsettings.json` under `Session:GatewayClientSecret` — set it in user
secrets or the environment before starting, the same way the other client secrets are managed:

```powershell
dotnet user-secrets set "Session:GatewayClientSecret" "any-long-random-value"
```

The gateway refuses to start if the secret is missing or empty.

### Redis

The session store requires Redis. Configure the connection in `appsettings.json`:

```json
"Session": {
  "Redis": "localhost:6379"
}
```

If Redis is unavailable, the session handler treats every request as anonymous. Service-to-service
bearer authentication continues to work.

---

## Getting a token to try it with

The gateway is not where you get a token. Get one from the identity server, then send it here.

### 1. Start the identity server and give it a secret

The password flow is granted to exactly one confidential client, `commercehub-firstparty`, and its
secret is not in the repository. Set it, along with a password for the seeded administrator, before
the first run:

```powershell
cd src\DotNet\Identity.Service\Identity.API
dotnet user-secrets set "OpenIddict:Clients:FirstParty:Secret" "any-long-random-value"
dotnet user-secrets set "Identity:Seed:AdminPassword" "any-long-random-value"
dotnet run
```

The administrator is seeded only when `Identity:Seed:AdminPassword` is set, only in Development, and
defaults to the address `Identity:Seed:AdminEmail` names (`admin@commercehub.local`).

### 2. Request a token

```powershell
$token = (Invoke-RestMethod -Method Post `
    -Uri "http://localhost:5063/connect/token" `
    -ContentType "application/x-www-form-urlencoded" `
    -Body @{
        grant_type = "password"
        client_id = "commercehub-firstparty"
        client_secret = "any-long-random-value"
        username = "admin@commercehub.local"
        password = "any-long-random-value"
        scope = "product.read product.write order.read order.write"
    }).access_token
```

You can also get one through the gateway itself, on `/connect/token`. That route is rate limited
separately and more tightly, because it is the one where a caller can make the identity server do
password hashing.

### 3. Call the gateway

```powershell
# Anonymous: the catalog is browsable without a token.
curl http://localhost:5108/api/categories/categories

# product.write: allowed.
curl -X POST http://localhost:5108/api/categories/categories `
     -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d '{}'

# order.read: allowed.
curl http://localhost:5108/api/orders/1 -H "Authorization: Bearer $token"
```

**What this client can and cannot reach.** `commercehub-firstparty` is granted `profile.read`,
`profile.write`, `product.read`, `product.write`, `order.read` and `order.write`. It does **not**
hold `inventory.write`, `payment.process` or `admin.full`, so the inventory-write, payment and admin
policies will answer `403` for a token from this client no matter what you ask for. To exercise
those, use a client that is granted them:

- `commercehub-services` (client credentials) holds `product.read`, `order.read`, `order.write`,
  `inventory.read` and `inventory.write`, so it is the way to try `inventory-write`. Its tokens carry
  the `ServiceAccount` role, which is what lets a machine with no user behind it past the role check
  on the staff write routes.
- `admin-dashboard` holds `admin.full` among others, but it is a public SPA client using the
  authorization code flow, so it needs PKCE and a browser. It is also the client that best shows the
  role narrowing: ask it for `admin.full` as a plain `Customer` and the scope arrives dropped rather
  than in the token.

---

## How a request is decided

1. **Correlation id.** Read from `X-Correlation-Id` or generated, echoed on the response, and pushed
   into the logging scope so one request can be followed across the gateway and the service that
   handled it.
2. **Errors.** Any unhandled exception becomes a `500` with the same JSON error body the rest of the
   solution returns (`ResultModel<string>`), carrying no detail — a gateway fronts every service, so
   an exception message that escaped one of them is a map of this system's internals.
3. **Routing**, then **CORS**, so a preflight is answered here and never reaches a service.
4. **Authentication.** OpenIddict fetches the identity server's discovery document, caches its
   signing keys, and validates the bearer token against them.
5. **Rate limiting**, partitioned by client id when the token names one and by IP otherwise.
6. **Authorization.** The route's policy requires an authenticated principal, the right scope, and
   an account whose `status` claim is `Active`.
7. **Proxy**, with the caller's identity written to the downstream request.

### Why a suspended account is refused immediately

An OAuth 2.0 access token is self-contained: nothing downstream calls the identity server to ask
whether the subject is still entitled to what the token grants. Without a check, suspending a user
would have no effect until the token expired on its own — up to an hour for the clients in this
solution. The identity server puts the account's lifecycle state in the token as a `status` claim,
and every protected policy refuses a token whose `status` claim is present and not `Active`. A token
with no `status` claim at all is allowed, because that is the shape of a client-credentials token:
there is no user behind it, so there is no account to suspend.

### Identity headers

The services behind the gateway read the caller's identity from headers, so the gateway writes them
from the **validated** principal — never from a request header the caller chose:

| Header | Claim | Notes |
|---|---|---|
| `X-User-Id` | `sub` | |
| `X-User-Roles` | `role` | Comma-separated. OpenIddict emits one `role` claim per role, so all of them are read. |
| `X-Client-Id` | `client_id`, falling back to `azp` | An RFC 9068 token uses `azp`; a plain JWT access token uses `client_id`. |
| `X-Account-Type` | `account_type` | |

Each is written with **Set** semantics, never Append. YARP copies the incoming request headers to
the outgoing request before the transforms run, so a caller that sends `X-User-Id: someone-else`
would otherwise arrive at the service with that value already in place; appending the real one would
produce `someone-else, real-user`, and a service that reads the first value would read the
attacker's choice. Setting the header deletes the forged value before the verified one is written.
An anonymous request gets the headers removed entirely, so a service can tell "no caller" from "a
caller with a blank name".

`Authorization` is deliberately left alone. YARP forwards it by default, so a service that later
grows its own token validation needs no change to this gateway.

---

## Health

`GET /health` runs two checks and always answers `200` while the gateway itself is running.

- **self** — always healthy.
- **identity-server** — fetches the identity server's discovery document, the exact URL token
  validation uses. A failure reports `Degraded`, not `Unhealthy`, and is registered with no failure
  status. The gateway can still serve while the identity server restarts: an anonymous browse works,
  and already-issued tokens keep validating from the cached keys. A liveness probe pointed here would
  take a working gateway out of rotation over a dependency it can serve without, and would turn an
  identity server restart into a storefront outage.

The response body is `Healthy` or `Degraded`. Health probes and CORS preflights are exempt from rate
limiting, so a traffic spike cannot throttle a probe into a restart loop.

## Logging

Serilog, configured from `appsettings.json`, writing to the console and to
`logs/apigateway-<date>.log` with a daily rolling interval and 14 files retained. That `logs`
directory is created on first run and is a build artefact, not source.

One line per request: method, path, status, elapsed milliseconds, the caller's `sub` when there is
one, and the correlation id. **The access token is never logged**, and neither is any other header —
this process sits in front of an authorization server, so its log files are the most likely place
for a bearer token to be captured by accident.

## Swagger

In Development only, at `/swagger`. The OAuth2 definition offers the password flow against the
identity server, and the authorize dialog lists the scopes the policies require. The client secret
is typed into the browser; it is not in this repository and never reaches this process.

---

## Package notes

- **Swashbuckle.** The other services in this solution pin Swashbuckle 6.2.3/6.6.2, which predate
  `net10.0`. This project references the modern major (10.1.7) so the gateway is not held back by
  them, and names `Microsoft.OpenApi` 2.12.0 explicitly. Swashbuckle declares that dependency as
  `>= 2.4.1` and NuGet resolves a range to its lowest satisfying version, which lands on 2.4.1 —
  inside the range fixed for CVE-2026-49451, a circular `$ref` in a parsed OpenAPI document
  terminating the process. Naming a patched version is what actually moves the resolved graph off
  2.4.1; the transitive reference alone does not.
- **Project references.** Two, both narrow:
  - `BuildingBlocks.Core` for `ResultModel<T>`, the JSON error envelope every other service in this
    solution already returns. `BuildingBlocks.Infrastructure` is deliberately *not* referenced: it
    drags in EF Core, Kafka, Redis and MediatR, none of which a gateway should need.
  - `Identity.Domain` for `TokenClaimNames` only — the `status` and `account_type` claim names the
    identity server writes and this gateway reads. Taking them from the same constants the writer
    uses is what stops a rename on one side from becoming a silently-unidentified caller on the
    other, which no build would otherwise catch. The scope strings, policies and handlers are *not*
    taken from there; they are restated in `Authorization\GatewayScopes.cs`, because the gateway
    has to stay deployable and testable without the identity service.
- `dotnet list package --vulnerable --include-transitive` reports no vulnerable packages for this
  project.
