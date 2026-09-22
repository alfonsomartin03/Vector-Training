# Admin accounts and account deletion

## Features

`/admin` is available through **Profile → Manage users** for administrators. It
lists all Auth accounts, including incomplete registrations, with paginated name,
email and ID search. Admins can view personal/physiological profile fields, account
dates and verification status, and paginated power, VO2 and lactate test history.
They can edit the athlete profile, correct sign-in email, grant/revoke admin access,
and delete another account. Recorded test history is read-only in this dashboard.

Every athlete has **Profile → Delete your account**. Deletion requires typing the
exact account email (ID if none) and verifying the caller's current password.
Admins also verify their own password for email changes, role changes and deletion
of another account. This version supports the app's email/password accounts; add
a provider-specific reauthentication flow before adding passwordless/OAuth login.

The last admin cannot be demoted or deleted. Another admin must change an admin's
own role. To leave as the sole admin, grant a trusted team member admin access first.

## Deployment

This branch includes the training-focus classifier from main alongside account management.

1. Apply the existing physiological-test migration and
   `supabase/migrations/20260921160000_add_training_focus.sql` if not already applied, then
   `supabase/migrations/20260921190000_admin_accounts.sql` using the Supabase SQL
   editor or your authenticated migration workflow. Existing profile and power
   tables must already exist. The migration validates ownership foreign keys;
   orphaned data causes failure rather than silent deletion of existing records.
2. Deploy the server function to the same project as the app:

   ```bash
   supabase functions deploy accounts --project-ref YOUR_PROJECT_REF
   ```

   The function uses the standard server environment values `SUPABASE_URL`,
   `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY`. Keep elevated keys out of
   `.env` values prefixed with `EXPO_PUBLIC_`, the app bundle, and source control.
   Its `deno.json` pins the Supabase client version. `supabase/config.toml` disables
   the legacy gateway JWT check; every POST is explicitly authenticated through
   Auth `getUser(token)` before any privileged operation, including with asymmetric
   signing keys. Do not deploy a modified handler that omits this check.
   Browser requests are restricted to exact approved origins. If the site is
   deployed at another domain or a Vercel preview URL, set the function secret
   `ACCOUNT_ALLOWED_ORIGINS` to a comma-separated list of the exact trusted
   origins and redeploy. Requests from native clients have no browser Origin and
   still require the same verified bearer token.
3. Bootstrap the first admin using the Supabase SQL editor. First look up and
   verify the exact existing Auth user ID in Authentication → Users, then run:

   ```sql
   insert into public.admin_memberships (user_id)
   values ('REPLACE_WITH_VERIFIED_AUTH_USER_UUID')
   on conflict (user_id) do nothing;
   ```

   No email is automatically trusted and registering an account never grants admin
   access. Subsequent team members register normally; an admin grants their access
   from the dashboard. Reopen Profile to refresh the admin link.
4. Verify against test accounts: ordinary users must receive 403 for admin actions;
   verify profile/email changes, grant/revoke, two-admin safeguards, self-deletion
   and deletion of an account with tests/files. Do not use real accounts for smoke
   testing deletion. Local tests never connect to or delete production users.

No live migration, function deployment or first-admin grant is performed by merely
checking out this branch. Until deployment, account actions show an unavailable
message rather than claiming success.

## Security and deletion semantics

- Memberships are a separate protected table, not editable profile columns or
  user-controlled Auth metadata. Browser/mobile roles cannot read or write it.
- The Edge Function checks the authenticated user's current database membership on
  every request. A hidden link is convenience, not the authorization boundary.
  The service-only directory RPC returns a minimal whitelist of Auth fields and
  never returns password hashes, tokens, identities or arbitrary Auth metadata.
- Profile edits whitelist eight fields. Email updates use the Auth Admin API;
  profile and email operations are separate to avoid pretending they form one
  transaction. Admin email correction changes the login identity directly: verify
  the new address with the athlete before applying it. It does not set
  `email_confirm: true` or send an invitation/password-reset message.
- Self-deletion derives the target from the verified session, rejects a submitted
  target ID, verifies the password and exact confirmation, and clears the local
  session after success. Error responses contain no request/password dumps.
- Storage cleanup lists ownership via a service-only RPC and removes the actual
  objects through the Storage API in batches. Both current `owner_id` and legacy
  `owner` ownership are handled, with current `owner_id` taking precedence if they
  disagree. The existing app does not upload files; future
  service-created uploads must record ownership or add an explicit deletion map.
- After file cleanup, `auth.admin.deleteUser(id, false)` hard-deletes the account.
  Database ownership FKs cascade its profile, power history, VO2 history, lactate
  history and admin membership. The last-admin trigger also protects this path
  and serializes membership mutations with an advisory transaction lock.
- Auth deletion and Storage deletion are not a distributed transaction. Cleanup
  failures leave the account present and return a retryable error; already deleted
  files cannot be restored by retry. No success is reported until Auth deletion
  finishes. Very large accounts are cleaned in bounded chunks across retries.
- Old JWTs can outlive deleted users. The server rechecks Auth on every request;
  a restrictive Storage policy also requires a still-existing Auth account so an
  old token cannot recreate files. New athlete-data tables must use cascading Auth
  ownership FKs. Existing own-user RLS on athlete tables remains unchanged.
- Deletion removes active application data. Provider-managed backups/security logs
  expire under the provider's retention policy; the app does not promise immediate
  erasure from provider backups. There are no third-party user-data integrations
  in the current repository; add their cleanup before introducing any.

## Validation

`npm run test:admin` exercises authorization, request validation, role escalation,
reauthentication, deletion targeting, cleanup failures and migration behavior using
an isolated in-memory PostgreSQL instance. `npm run typecheck` covers the app and
server function; `npm run lint` and `npm run test:workouts` cover regression checks.
Production-specific Auth/Storage integration still needs the deployment smoke test.

References: [Supabase user management](https://supabase.com/docs/guides/auth/managing-user-data),
[server-side user verification](https://supabase.com/docs/reference/javascript/auth-getuser),
[Auth deletion](https://supabase.com/docs/reference/javascript/auth-admin-deleteuser),
[Storage ownership](https://supabase.com/docs/guides/storage/security/ownership).
