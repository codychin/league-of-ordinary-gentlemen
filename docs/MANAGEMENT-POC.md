# Management proof of concept

Management lives at `/manage`. Email links establish a Supabase Auth session;
the server verifies the current user, and database RLS independently checks access.
No service-role key is sent to the browser or needed for management requests.

## Activation

1. In Supabase Authentication → URL Configuration, set Site URL to
   `https://www.ordinarybrief.com` and allow both exact callback URLs:
   `https://www.ordinarybrief.com/manage/confirm` and
   `https://ordinarybrief.com/manage/confirm`.
2. Enable email sign-in. Configure custom SMTP for external managers. Supabase's
   built-in email service only delivers to members of the Supabase organization.
   Do not add league managers to the Supabase organization to work around this.
3. Sign in at `/manage` with the owner's email. Open “First-time owner setup”
   and enter the separately supplied setup code. Only its SHA-256 hash is stored
   in a private table. It expires after seven days and can only be consumed once.
4. Open Sunday Crew → Members, grant Admin or Editor to an exact email address,
   and share `/manage` with that person. This PoC grants access immediately but
   does not send an invitation email.

## Scope

- Owner: every existing bureau, plus grant/revoke membership.
- Admin: articles, local newsroom context, and publication name for assigned bureau.
- Editor: articles and local newsroom context for assigned bureau.
- No access: login succeeds but no bureau is shown.

Only the owner manages membership. No member can alter global correspondent
profiles, provider connections, imported scores, or another bureau. Membership is
checked against the current verified email on every request, so revocation does
not wait for a token refresh. Changing an email loses its old membership.

Published Sunday Crew articles appear on its homepage and at
`/sunday-crew/articles/[slug]`; drafts and archived articles are not public.
Memory edits persist in the existing league-memory table. This PoC does not add
new automated generation or alter the refresh/generation schedules.

Private management responses use `no-store` and are excluded from the PWA cache.
The legacy key-protected editor/media tools remain owner/operator tools.

## Validation

- `node --test tests/management.test.mjs`: input scope, privilege escalation,
  route injection, and cross-origin checks.
- `tests/management-isolation.sql`: transactional RLS tests; fixtures roll back.
  Covers owner setup, reuse rejection, admin/editor permissions, other-tenant
  denial, cross-league reassignment, global scope denial, unverified users,
  membership revocation, and draft privacy.
- Production Next.js build passes.
- Existing `release-integrity.test.mjs` has three baseline failures at commit
  `c3187ee`: its expectations reference Week 4 reels while the base implementation
  still uses older reel identifiers, and the score kicker still says Week 3.
  These predate the management changes.

## Database safety

The security review found six existing engine tables without RLS. Management's
companion migration blocks public writes while retaining public read access to
score/detail/release display data. Engine service-role writes continue to work.
Canonical correspondent write grants are also removed from anonymous/signed-in roles.

RLS-without-policy notices on private/operator tables are intentional deny-all
for client roles. The existing `get_public_brief_edition` security-definer RPC
is an intentionally public, scoped, read-only interface and remains unchanged.
