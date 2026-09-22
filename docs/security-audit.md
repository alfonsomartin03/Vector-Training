# Security audit

Last reviewed: 2026-09-22

## Scope and result

This review covered the Expo web/native client, authentication flows, the Supabase
Edge Function, SQL migrations and row-level-security policies, Vercel response
headers, environment/secret handling, dependency advisories, and the highest-use
data-loading paths. No hard-coded credential was found in the tracked tree or Git
history, and `npm audit --omit=dev` reported no high or critical vulnerability.

The review fixed the following issues:

- The privileged account function now accepts browser requests only from an
  explicit origin allowlist, requires JSON, bounds the body by encoded bytes,
  rejects unknown actions early, and returns hardened, non-cacheable responses.
- The client refuses to start if a service-role/secret Supabase key is placed in
  an `EXPO_PUBLIC_` setting, requires HTTPS outside local development, and uses
  PKCE for Auth redirects.
- A database migration adds restrictive owner-only RLS backstops, forces RLS on
  every athlete-data table, removes anonymous table privileges, and bounds values
  and user-controlled text/JSON at the database boundary.
- Protected screens no longer mount before Auth has verified the session, and raw
  database/Auth error details are no longer displayed to end users.
- Registration now shares the password validator used by password reset and
  requires 12 characters plus upper/lowercase, number, and symbol.
- Analytics script loading is restricted to the CSP-approved HTTPS provider.

## Performance and maintainability changes

- Athlete loading now performs four parallel relation reads instead of one profile
  read followed by six more reads. History results supply the current record,
  eliminating three duplicate queries per refresh.
- Realtime event bursts are debounced so a power insert and its profile-invalidation
  event cause one refresh rather than competing refreshes.
- The duplicated four-page bottom navigation is one accessible shared component.
- Shared account validation removes divergent email/password rules.

## Dependency review

`npm audit --omit=dev` currently reports moderate advisories in Expo's transitive
CLI/config chain and in the router's `query-string`/`decode-uri-component` chain.
The automated remediation proposes downgrading Expo 57 to Expo 46 and the router
to an incompatible major, which is not a safe patch. There are no high or critical
findings. Recheck after each Expo SDK update and take the upstream compatible fix
when available; do not force incompatible transitive versions with overrides.

## Deployment requirements

1. Apply `supabase/migrations/20260922233000_security_hardening.sql` after all
   earlier migrations.
2. Redeploy the `accounts` Edge Function. Its built-in browser origins are
   `vectortrain.me`, `www.vectortrain.me`, and `vector-training.vercel.app`, plus
   the documented local Expo ports. For any other production or preview origin,
   set the Edge Function secret `ACCOUNT_ALLOWED_ORIGINS` to a comma-separated
   list of exact origins before deployment. Native requests without an Origin are
   still authenticated normally.
3. Keep `SUPABASE_SERVICE_ROLE_KEY` only in Supabase's server-side function
   environment. Vercel/Expo receives only the URL and publishable key.
4. In Supabase Auth, require email confirmation, configure the same minimum
   password policy, retain sign-in/reset rate limits, and enable CAPTCHA before a
   high-volume public launch. These hosted controls are not represented in Git.
5. Run `npm run audit:dependencies`, `npm run typecheck`, `npm run lint`,
   `npm run test:security`, the remaining test scripts, `npm run build:web`, and
   `npm run check:compliance`.

## Residual risk

This is a source-level audit, not a penetration test of the deployed Supabase and
Vercel projects. Production verification must still confirm applied migrations,
Auth settings, allowed redirect URLs, Edge Function secrets, RLS behavior using
two real test accounts, and deployed response headers. Third-party activity
integrations will require a new review of OAuth token storage, webhook signatures,
provider scopes, replay protection, and account-deletion cleanup before launch.
