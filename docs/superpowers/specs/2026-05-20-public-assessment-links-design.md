# Public Assessment Links

Generate shareable, role-scoped registration links that let candidates self-register with name + email and start the assessment without an admin-created invite.

## Context

Today, every candidate must be individually invited by an admin (single or CSV bulk). The admin enters name, email, and role, then the system mints a token and emails the candidate. This doesn't support use cases like posting a link on a job board, sharing in Slack, or sending to a cohort without collecting names upfront.

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Link scope | One link per role | Stage 2/3 are role-scoped via RoleScenario; binding at link creation avoids mismatch |
| Reuse | Reusable with optional expiry + optional cap | Supports sharing broadly while limiting exposure |
| Dedup | One attempt per email per role; resume if in-flight | Prevents duplicate candidate rows; candidates who paused can continue |
| Abuse protection | Optional email domain allowlist per link | Lightweight, no external services needed |
| Admin UX | New collapsible section on Candidates page | Natural home next to existing invite flow |
| Candidate landing | Branded page with role context | Sets expectations, reduces dropout |

## Data Model

### New table: `AssessmentLink`

| Field | Type | Notes |
|---|---|---|
| `id` | String @id @default(uuid()) | |
| `code` | String @unique | Short slug used in URL, e.g. `fe-eng-2026` |
| `roleId` | String (FK → Role) | Role candidates are registered into |
| `expiresAt` | DateTime? | Null = never expires |
| `maxRegistrations` | Int? | Null = unlimited |
| `allowedDomains` | String? | Comma-separated, e.g. `adeptia.com,nymbl.ai`. Null = any domain |
| `isActive` | Boolean @default(true) | Admin can soft-revoke without deleting |
| `createdAt` | DateTime @default(now()) | |
| `updatedAt` | DateTime @updatedAt | |

Relations: `role Role @relation(...)`, `candidates Candidate[]` (reverse of FK below).

### Candidate table change

New optional column:
- `assessmentLinkId` String? (FK → AssessmentLink) — null for admin-invited candidates, populated for self-registered candidates.

This enables:
- Counting registrations per link (`WHERE assessmentLinkId = X`)
- Filtering candidates by source in the admin table
- Cascade behavior: if a link is deleted, candidates remain (SET NULL)

### Registration dedup logic (API-enforced)

On `POST /api/join/[code]` with `{ name, email }`:
1. Query `Candidate` by `(email, roleId)`.
2. If found and status is `invited` or `in_progress` → return existing token (resume).
3. If found and status is `completed` or `scored` → reject: "You've already completed this assessment."
4. If not found → create new Candidate, mint token, set `assessmentLinkId`.

## API Routes

### Admin routes (authenticated)

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/admin/assessment-links` | List all links with registration counts |
| `POST` | `/api/admin/assessment-links` | Create a new link |
| `PUT` | `/api/admin/assessment-links/[id]` | Update link (expiry, cap, domains, active toggle) |
| `DELETE` | `/api/admin/assessment-links/[id]` | Delete a link |

**GET response shape:**
```json
[{
  "id": "uuid",
  "code": "fe-eng-2026",
  "role": { "id": "uuid", "name": "Frontend Engineer" },
  "expiresAt": "2026-06-20T00:00:00Z",
  "maxRegistrations": 50,
  "registrationCount": 12,
  "allowedDomains": "adeptia.com,nymbl.ai",
  "isActive": true,
  "createdAt": "2026-05-20T..."
}]
```

**POST request body:**
```json
{
  "code": "fe-eng-2026",
  "roleId": "uuid",
  "expiresAt": "2026-06-20T00:00:00Z",
  "maxRegistrations": 50,
  "allowedDomains": "adeptia.com,nymbl.ai"
}
```

`code` is auto-suggested from role name on the frontend but editable. Server validates uniqueness.

### Public routes (no auth)

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/join/[code]` | Fetch link metadata + role info for landing page |
| `POST` | `/api/join/[code]` | Register candidate, returns redirect URL |

**GET /api/join/[code] response:**
```json
{
  "code": "fe-eng-2026",
  "roleName": "Frontend Engineer",
  "roleDescription": "Build and maintain...",
  "allowedDomains": "adeptia.com",
  "isAccepting": true
}
```

Returns `isAccepting: false` with a `reason` field for expired/full/revoked links (the page renders a friendly error).

**POST /api/join/[code] validation chain:**
1. Look up link by code → 404 if not found
2. Check `isActive` → 410 "This link is no longer active"
3. Check `expiresAt` → 410 "This link has expired"
4. Count registrations vs `maxRegistrations` → 410 "Registration limit reached"
5. Validate email domain against `allowedDomains` → 403 "Email domain not allowed"
6. Dedup check (email + roleId) → resume or reject per rules above
7. Create Candidate row with `assessmentLinkId`, mint token
8. Return `{ redirectUrl: "/assess?token=<token>" }`

No email is sent — the candidate is already on the page and gets redirected immediately.

**POST /api/join/[code] request:**
```json
{ "name": "Jane Doe", "email": "jane@adeptia.com" }
```

**POST success response:**
```json
{ "redirectUrl": "/assess?token=abc123..." }
```

**POST error responses:**
```json
{ "error": "This link has expired", "code": "LINK_EXPIRED" }
{ "error": "Email domain not allowed", "code": "DOMAIN_BLOCKED" }
{ "error": "You've already completed this assessment", "code": "ALREADY_COMPLETED" }
```

## Candidate-Facing Landing Page

**Route:** `/join/[code]` (Next.js page)

### Happy path

Page calls `GET /api/join/[code]` on load. Renders:

1. **Header** — App branding (reuse existing assessment header)
2. **Headline** — Role name, e.g. "Frontend Engineer Assessment"
3. **Role description** — From `Role.description`, 2-3 sentences
4. **What to expect** — Brief blurb: "This assessment has 3 stages and takes approximately 30-45 minutes."
5. **Registration form:**
   - Name input (required)
   - Email input (required)
   - Domain hint if `allowedDomains` is set: "Use your @adeptia.com email"
   - Submit button: "Start Assessment"
6. On submit → POST to `/api/join/[code]` → redirect to `/assess?token=...`

### Resume flow

If the POST returns a resume (existing candidate with in-flight assessment), the redirect is the same — `/assess?token=<existing-token>`. The candidate doesn't know the difference. No special UI needed.

### Error states

Full-page friendly messages (not toasts — there's no surrounding context):
- **Link not found:** "This assessment link doesn't exist."
- **Link expired:** "This assessment link has expired. Contact the hiring team for a new one."
- **Link at capacity:** "This assessment is no longer accepting registrations."
- **Link revoked:** Same message as expired.
- **Domain mismatch:** Inline error under the email field: "Please use an email ending in @adeptia.com"
- **Already completed:** "You've already completed this assessment."

## Admin UI

### Placement

New collapsible "Public Assessment Links" section on the Candidates page (`/admin/candidates`), placed between the page header and the existing "Invite Candidates" section. Toggle button with Link icon, independent of the invite section toggle.

### Create form

Inside the collapsible, at the top:
- **Role** dropdown (required) — same role list as the invite form
- **Code / slug** text input — auto-generated from role name (slugified, e.g. `frontend-engineer`), editable by admin
- **Expires** date picker — optional, defaults to 30 days from now
- **Max registrations** number input — optional
- **Allowed domains** text input — optional, comma-separated, placeholder: `acme.com, partner.org`
- **"Generate Link"** button

On creation, the full URL is displayed with a copy button.

### Links table

Below the create form, a table of all links:

| Column | Content |
|---|---|
| Code | The slug, displayed as a clickable link |
| Role | Role name |
| Expires | Date or "Never" |
| Registrations | `12 / 50` or `12 / unlimited` |
| Domains | Comma list or "Any" |
| Status | Active / Revoked / Expired badge |
| Actions | Copy URL, Edit, Revoke/Activate toggle, Delete |

**Actions:**
- **Copy** — copies full URL to clipboard, brief "Copied!" feedback
- **Edit** — modal with expiry, cap, domains fields (code and role are immutable after creation)
- **Revoke / Activate** — toggles `isActive`, immediate effect
- **Delete** — confirmation dialog, permanent. Candidates created through the link remain (FK set to null).

### Candidates table change

Add a source indicator column or icon to each candidate row:
- Admin-invited candidates: Mail icon
- Self-registered candidates: Link icon with tooltip showing the link code

Derived from `assessmentLinkId` — null means invited, non-null means public link.

## Files to create or modify

### New files
- `prisma/migrations/<timestamp>_add_assessment_links/migration.sql`
- `src/app/api/admin/assessment-links/route.ts` (GET, POST)
- `src/app/api/admin/assessment-links/[id]/route.ts` (PUT, DELETE)
- `src/app/api/join/[code]/route.ts` (GET, POST)
- `src/app/join/[code]/page.tsx` (candidate landing page)

### Modified files
- `prisma/schema.prisma` — add AssessmentLink model, add assessmentLinkId to Candidate
- `src/app/admin/candidates/page.tsx` — add Public Links collapsible section, add source indicator to candidates table
- `src/lib/token.ts` — may need to reuse token generation logic (already exists for invite flow)
