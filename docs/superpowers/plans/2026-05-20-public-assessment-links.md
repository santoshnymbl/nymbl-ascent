# Public Assessment Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add shareable, role-scoped registration links so candidates can self-register with name + email and start the assessment without an admin-created invite.

**Architecture:** New `AssessmentLink` model stores link config (code, role, expiry, cap, domain allowlist). Public `/join/:code` page renders a branded landing with registration form. On submit, the API validates the link, dedup-checks the email, mints a standard Candidate row with token, and redirects into the existing assessment flow. Admin manages links from a new collapsible section on the Candidates page.

**Tech Stack:** Next.js 15 (App Router), Prisma 7 + LibSQL/Turso, React (inline styles + CSS variables), existing glass-card UI system.

**Spec:** `docs/superpowers/specs/2026-05-20-public-assessment-links-design.md`

---

### Task 1: Prisma Schema — Add AssessmentLink model and Candidate FK

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add AssessmentLink model to schema**

Add after the existing `RoleScenario` model in `prisma/schema.prisma`:

```prisma
model AssessmentLink {
  id               String      @id @default(uuid())
  code             String      @unique
  roleId           String
  expiresAt        DateTime?
  maxRegistrations Int?
  allowedDomains   String?
  isActive         Boolean     @default(true)
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt
  role             Role        @relation(fields: [roleId], references: [id], onDelete: Cascade)
  candidates       Candidate[]
}
```

- [ ] **Step 2: Add assessmentLinkId FK to Candidate model**

Add to the `Candidate` model fields:

```prisma
  assessmentLinkId String?
  assessmentLink   AssessmentLink? @relation(fields: [assessmentLinkId], references: [id], onDelete: SetNull)
```

- [ ] **Step 3: Add reverse relation to Role model**

Add to the `Role` model fields:

```prisma
  assessmentLinks AssessmentLink[]
```

- [ ] **Step 4: Generate and apply migration**

Run:
```bash
npx prisma migrate dev --name add_assessment_links
```

Expected: Migration created and applied. Prisma Client regenerated.

- [ ] **Step 5: Verify generated client**

Run:
```bash
npx prisma generate
```

Expected: `src/generated/prisma` updated with `AssessmentLink` model and updated `Candidate` model.

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/ src/generated/
git commit -m "feat: add AssessmentLink model and Candidate.assessmentLinkId FK"
```

---

### Task 2: Admin API — CRUD for Assessment Links

**Files:**
- Create: `src/app/api/admin/assessment-links/route.ts`
- Create: `src/app/api/admin/assessment-links/[id]/route.ts`

- [ ] **Step 1: Create the list + create route**

Create `src/app/api/admin/assessment-links/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const links = await prisma.assessmentLink.findMany({
    include: {
      role: { select: { id: true, name: true } },
      _count: { select: { candidates: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    links.map((l) => ({
      id: l.id,
      code: l.code,
      role: l.role,
      expiresAt: l.expiresAt,
      maxRegistrations: l.maxRegistrations,
      registrationCount: l._count.candidates,
      allowedDomains: l.allowedDomains,
      isActive: l.isActive,
      createdAt: l.createdAt,
    })),
  );
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { code, roleId, expiresAt, maxRegistrations, allowedDomains } = body;

  if (!code?.trim() || !roleId) {
    return NextResponse.json(
      { error: "Code and roleId are required" },
      { status: 400 },
    );
  }

  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) {
    return NextResponse.json({ error: "Role not found" }, { status: 404 });
  }

  const existing = await prisma.assessmentLink.findUnique({
    where: { code: code.trim() },
  });
  if (existing) {
    return NextResponse.json(
      { error: "A link with this code already exists" },
      { status: 409 },
    );
  }

  const link = await prisma.assessmentLink.create({
    data: {
      code: code.trim(),
      roleId,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      maxRegistrations: maxRegistrations ?? null,
      allowedDomains: allowedDomains?.trim() || null,
    },
    include: { role: { select: { id: true, name: true } } },
  });

  return NextResponse.json(link, { status: 201 });
}
```

- [ ] **Step 2: Create the update + delete route**

Create `src/app/api/admin/assessment-links/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const { expiresAt, maxRegistrations, allowedDomains, isActive } = body;

  const data: Record<string, unknown> = {};
  if (expiresAt !== undefined)
    data.expiresAt = expiresAt ? new Date(expiresAt) : null;
  if (maxRegistrations !== undefined)
    data.maxRegistrations = maxRegistrations ?? null;
  if (allowedDomains !== undefined)
    data.allowedDomains = allowedDomains?.trim() || null;
  if (typeof isActive === "boolean") data.isActive = isActive;

  const link = await prisma.assessmentLink.update({
    where: { id },
    data,
    include: { role: { select: { id: true, name: true } } },
  });

  return NextResponse.json(link);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  const link = await prisma.assessmentLink.findUnique({ where: { id } });
  if (!link) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.assessmentLink.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Verify routes compile**

Run:
```bash
npx next build --no-lint 2>&1 | head -40
```

Expected: No TypeScript errors for the new route files. (Full build may show other warnings — only check for errors in the new files.)

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/assessment-links/
git commit -m "feat: add admin CRUD API for assessment links"
```

---

### Task 3: Public Join API — GET and POST

**Files:**
- Create: `src/app/api/join/[code]/route.ts`

- [ ] **Step 1: Create the public join route**

Create `src/app/api/join/[code]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateToken } from "@/lib/token";

interface Params {
  params: Promise<{ code: string }>;
}

async function resolveLink(code: string) {
  const link = await prisma.assessmentLink.findUnique({
    where: { code },
    include: {
      role: { select: { id: true, name: true, description: true } },
      _count: { select: { candidates: true } },
    },
  });
  if (!link) return { error: "This assessment link doesn't exist", status: 404 };
  if (!link.isActive) return { error: "This link is no longer active", status: 410 };
  if (link.expiresAt && new Date() > link.expiresAt)
    return { error: "This link has expired", status: 410 };
  if (link.maxRegistrations && link._count.candidates >= link.maxRegistrations)
    return { error: "This assessment is no longer accepting registrations", status: 410 };
  return { link };
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { code } = await params;
  const result = await resolveLink(code);

  if ("error" in result) {
    return NextResponse.json(
      { isAccepting: false, reason: result.error },
      { status: result.status },
    );
  }

  const { link } = result;
  return NextResponse.json({
    code: link.code,
    roleName: link.role.name,
    roleDescription: link.role.description,
    allowedDomains: link.allowedDomains,
    isAccepting: true,
  });
}

export async function POST(request: NextRequest, { params }: Params) {
  const { code } = await params;
  const result = await resolveLink(code);

  if ("error" in result) {
    return NextResponse.json(
      { error: result.error, code: "LINK_UNAVAILABLE" },
      { status: result.status },
    );
  }

  const { link } = result;
  const body = await request.json();
  const name = body.name?.trim();
  const email = body.email?.trim()?.toLowerCase();

  if (!name || !email) {
    return NextResponse.json(
      { error: "Name and email are required", code: "VALIDATION" },
      { status: 400 },
    );
  }

  // Domain allowlist check
  if (link.allowedDomains) {
    const domains = link.allowedDomains.split(",").map((d) => d.trim().toLowerCase());
    const emailDomain = email.split("@")[1];
    if (!domains.includes(emailDomain)) {
      return NextResponse.json(
        { error: "Email domain not allowed", code: "DOMAIN_BLOCKED" },
        { status: 403 },
      );
    }
  }

  // Dedup: check existing candidate with same email + role
  const existing = await prisma.candidate.findFirst({
    where: { email, roleId: link.roleId },
  });

  if (existing) {
    if (existing.status === "completed" || existing.status === "scored") {
      return NextResponse.json(
        { error: "You've already completed this assessment", code: "ALREADY_COMPLETED" },
        { status: 409 },
      );
    }
    // Resume: return existing token (refresh expiry)
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);
    await prisma.candidate.update({
      where: { id: existing.id },
      data: { tokenExpiry: expiry },
    });
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    return NextResponse.json({
      redirectUrl: `${baseUrl}/assess?token=${existing.token}`,
    });
  }

  // New registration
  const token = generateToken();
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 7);

  await prisma.candidate.create({
    data: {
      name,
      email,
      roleId: link.roleId,
      token,
      tokenExpiry: expiry,
      assessmentLinkId: link.id,
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  return NextResponse.json(
    { redirectUrl: `${baseUrl}/assess?token=${token}` },
    { status: 201 },
  );
}
```

- [ ] **Step 2: Verify route compiles**

Run:
```bash
npx next build --no-lint 2>&1 | head -40
```

Expected: No TypeScript errors for the new route file.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/join/
git commit -m "feat: add public join API for self-registration via assessment links"
```

---

### Task 4: Candidate Landing Page — `/join/[code]`

**Files:**
- Create: `src/app/join/[code]/page.tsx`

- [ ] **Step 1: Create the landing page component**

Create `src/app/join/[code]/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";

interface LinkInfo {
  code: string;
  roleName: string;
  roleDescription: string;
  allowedDomains: string | null;
  isAccepting: boolean;
  reason?: string;
}

export default function JoinPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const [linkInfo, setLinkInfo] = useState<LinkInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLink() {
      try {
        const res = await fetch(`/api/join/${params.code}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.reason || "This assessment link is not available.");
          return;
        }
        setLinkInfo(data);
      } catch {
        setError("Failed to load assessment. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchLink();
  }, [params.code]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setFormError("Name and email are required.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch(`/api/join/${params.code}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Registration failed.");
        return;
      }
      router.push(data.redirectUrl);
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-base)" }}>
        <Loader2 size={32} style={{ color: "var(--cta)", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-base)", padding: 24 }}>
        <div className="glass-card" style={{ maxWidth: 480, width: "100%", padding: 48, textAlign: "center" }}>
          <AlertCircle size={48} style={{ color: "var(--error)", margin: "0 auto 16px", display: "block" }} />
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-heading), 'Montserrat', sans-serif", marginBottom: 8 }}>
            Link Unavailable
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.5 }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!linkInfo) return null;

  const domainHint = linkInfo.allowedDomains
    ? linkInfo.allowedDomains.split(",").map((d) => `@${d.trim()}`).join(" or ")
    : null;

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-base)", padding: 24 }}>
      <div className="glass-card" style={{ maxWidth: 520, width: "100%", padding: 48 }}>
        <h1 style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          color: "var(--text-primary)",
          fontFamily: "var(--font-heading), 'Montserrat', sans-serif",
          marginBottom: 8,
        }}>
          {linkInfo.roleName} Assessment
        </h1>

        {linkInfo.roleDescription && (
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: 16 }}>
            {linkInfo.roleDescription}
          </p>
        )}

        <div style={{
          background: "var(--bg-elevated)",
          borderRadius: "var(--radius-md)",
          padding: "12px 16px",
          marginBottom: 24,
          fontSize: "0.875rem",
          color: "var(--text-muted)",
          lineHeight: 1.5,
        }}>
          This assessment has 3 stages and takes approximately 30–45 minutes. You can pause and resume at any time.
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: 4 }}>
              Name
            </label>
            <input
              type="text"
              placeholder="Your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              style={{ width: "100%" }}
              required
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: 4 }}>
              Email
            </label>
            <input
              type="email"
              placeholder={domainHint ? `you${domainHint.split(" or ")[0]}` : "you@company.com"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              style={{ width: "100%" }}
              required
            />
            {domainHint && (
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4 }}>
                Use your {domainHint} email
              </p>
            )}
          </div>

          {formError && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.875rem", color: "var(--error)" }}>
              <AlertCircle size={16} />
              {formError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-cta"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              width: "100%",
              padding: "12px 24px",
              fontSize: "1rem",
              opacity: submitting ? 0.5 : 1,
            }}
          >
            {submitting ? (
              <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <>
                Start Assessment
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the page compiles**

Run:
```bash
npx next build --no-lint 2>&1 | head -40
```

Expected: No TypeScript errors for the new page.

- [ ] **Step 3: Commit**

```bash
git add src/app/join/
git commit -m "feat: add candidate landing page for public assessment links"
```

---

### Task 5: Admin UI — Public Links Section on Candidates Page

**Files:**
- Create: `src/components/admin/AssessmentLinksSection.tsx`
- Modify: `src/app/admin/candidates/page.tsx`

- [ ] **Step 1: Create the AssessmentLinksSection component**

Create `src/components/admin/AssessmentLinksSection.tsx`:

```tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Link2,
  Plus,
  Copy,
  Check,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Select } from "@/components/ui/Select";

interface Role {
  id: string;
  name: string;
}

interface AssessmentLinkRow {
  id: string;
  code: string;
  role: { id: string; name: string };
  expiresAt: string | null;
  maxRegistrations: number | null;
  registrationCount: number;
  allowedDomains: string | null;
  isActive: boolean;
  createdAt: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function linkStatus(link: AssessmentLinkRow): { label: string; color: string; bg: string } {
  if (!link.isActive)
    return { label: "Revoked", color: "var(--error)", bg: "var(--error-surface)" };
  if (link.expiresAt && new Date() > new Date(link.expiresAt))
    return { label: "Expired", color: "var(--warning)", bg: "var(--warning-surface)" };
  if (link.maxRegistrations && link.registrationCount >= link.maxRegistrations)
    return { label: "Full", color: "var(--warning)", bg: "var(--warning-surface)" };
  return { label: "Active", color: "var(--success)", bg: "var(--success-surface)" };
}

export default function AssessmentLinksSection({ roles }: { roles: Role[] }) {
  const [expanded, setExpanded] = useState(false);
  const [links, setLinks] = useState<AssessmentLinkRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  /* create form */
  const [createRoleId, setCreateRoleId] = useState("");
  const [createCode, setCreateCode] = useState("");
  const [createExpiry, setCreateExpiry] = useState("");
  const [createMaxReg, setCreateMaxReg] = useState("");
  const [createDomains, setCreateDomains] = useState("");
  const [creating, setCreating] = useState(false);

  /* edit modal */
  const [editLink, setEditLink] = useState<AssessmentLinkRow | null>(null);
  const [editExpiry, setEditExpiry] = useState("");
  const [editMaxReg, setEditMaxReg] = useState("");
  const [editDomains, setEditDomains] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  /* copy feedback */
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/assessment-links");
      setLinks(await res.json());
    } catch {
      setMsg({ type: "error", text: "Failed to load links" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (expanded) fetchLinks();
  }, [expanded, fetchLinks]);

  /* auto-slug from role name */
  function handleRoleChange(roleId: string) {
    setCreateRoleId(roleId);
    const role = roles.find((r) => r.id === roleId);
    if (role) setCreateCode(slugify(role.name));
  }

  /* default expiry 30 days from now */
  function defaultExpiry(): string {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  }

  async function handleCreate() {
    if (!createRoleId || !createCode.trim()) {
      setMsg({ type: "error", text: "Role and code are required." });
      return;
    }
    setCreating(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/assessment-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: createCode.trim(),
          roleId: createRoleId,
          expiresAt: createExpiry || null,
          maxRegistrations: createMaxReg ? parseInt(createMaxReg) : null,
          allowedDomains: createDomains.trim() || null,
        }),
      });
      if (!res.ok) {
        const b = await res.json();
        throw new Error(b.error || "Create failed");
      }
      setMsg({ type: "success", text: "Link created!" });
      setCreateCode("");
      setCreateRoleId("");
      setCreateExpiry("");
      setCreateMaxReg("");
      setCreateDomains("");
      await fetchLinks();
    } catch (err) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Create failed" });
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleActive(link: AssessmentLinkRow) {
    try {
      const res = await fetch(`/api/admin/assessment-links/${link.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !link.isActive }),
      });
      if (!res.ok) throw new Error("Toggle failed");
      await fetchLinks();
    } catch (err) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Toggle failed" });
    }
  }

  async function handleDelete(link: AssessmentLinkRow) {
    if (!confirm(`Delete link "${link.code}"?\n\nExisting candidates registered through it will remain.`)) return;
    try {
      const res = await fetch(`/api/admin/assessment-links/${link.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setMsg({ type: "success", text: `Deleted "${link.code}"` });
      await fetchLinks();
    } catch (err) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Delete failed" });
    }
  }

  function handleCopy(link: AssessmentLinkRow) {
    const baseUrl = window.location.origin;
    navigator.clipboard.writeText(`${baseUrl}/join/${link.code}`);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function openEdit(link: AssessmentLinkRow) {
    setEditLink(link);
    setEditExpiry(link.expiresAt ? new Date(link.expiresAt).toISOString().split("T")[0] : "");
    setEditMaxReg(link.maxRegistrations != null ? String(link.maxRegistrations) : "");
    setEditDomains(link.allowedDomains || "");
    setEditSaving(false);
  }

  async function handleEditSave() {
    if (!editLink) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/admin/assessment-links/${editLink.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expiresAt: editExpiry || null,
          maxRegistrations: editMaxReg ? parseInt(editMaxReg) : null,
          allowedDomains: editDomains.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("Update failed");
      setEditLink(null);
      setMsg({ type: "success", text: "Link updated" });
      await fetchLinks();
    } catch (err) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Update failed" });
    } finally {
      setEditSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setExpanded(!expanded)}
        className="btn-cta"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "var(--bg-elevated)",
          color: "var(--text-primary)",
          border: "1px solid var(--border-default)",
        }}
      >
        <Link2 size={16} />
        Public Links
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {expanded && (
        <div className="glass-card" style={{ padding: 24, marginBottom: 32, marginTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Link2 size={20} style={{ color: "var(--cta)" }} />
            <h3 style={{
              fontSize: "1.125rem",
              fontWeight: 600,
              fontFamily: "var(--font-heading), 'Montserrat', sans-serif",
              color: "var(--text-primary)",
            }}>
              Public Assessment Links
            </h3>
          </div>

          {/* Create form */}
          <div style={{
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-lg)",
            padding: 20,
            background: "var(--bg-surface)",
            marginBottom: 20,
          }}>
            <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 12 }}>
              Generate New Link
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 500, color: "var(--text-muted)", marginBottom: 4 }}>Role</label>
                <Select
                  value={createRoleId}
                  onChange={handleRoleChange}
                  placeholder="Select role..."
                  options={roles.map((r) => ({ value: r.id, label: r.name }))}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 500, color: "var(--text-muted)", marginBottom: 4 }}>Code / slug</label>
                <input
                  type="text"
                  value={createCode}
                  onChange={(e) => setCreateCode(e.target.value)}
                  className="input-field"
                  style={{ width: "100%" }}
                  placeholder="frontend-engineer"
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 500, color: "var(--text-muted)", marginBottom: 4 }}>Expires</label>
                <input
                  type="date"
                  value={createExpiry || defaultExpiry()}
                  onChange={(e) => setCreateExpiry(e.target.value)}
                  className="input-field"
                  style={{ width: "100%" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 500, color: "var(--text-muted)", marginBottom: 4 }}>Max registrations</label>
                <input
                  type="number"
                  value={createMaxReg}
                  onChange={(e) => setCreateMaxReg(e.target.value)}
                  className="input-field"
                  style={{ width: "100%" }}
                  placeholder="Unlimited"
                  min={1}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 500, color: "var(--text-muted)", marginBottom: 4 }}>Allowed domains</label>
                <input
                  type="text"
                  value={createDomains}
                  onChange={(e) => setCreateDomains(e.target.value)}
                  className="input-field"
                  style={{ width: "100%" }}
                  placeholder="acme.com, partner.org"
                />
              </div>
            </div>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="btn-cta"
              style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 8, opacity: creating ? 0.5 : 1 }}
            >
              <Plus size={16} />
              {creating ? "Creating..." : "Generate Link"}
            </button>
          </div>

          {/* Feedback */}
          {msg && (
            <div style={{
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: "0.875rem",
              color: msg.type === "success" ? "var(--success)" : "var(--error)",
            }}>
              {msg.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {msg.text}
            </div>
          )}

          {/* Links table */}
          {loading ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Loading...</p>
          ) : links.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", textAlign: "center", padding: 24 }}>
              No public links yet. Generate one above.
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: "0.875rem", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{
                    borderBottom: "1px solid var(--border-default)",
                    background: "var(--bg-elevated)",
                    textAlign: "left",
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    letterSpacing: "0.05em",
                  }}>
                    <th style={{ padding: "10px 12px", fontWeight: 500 }}>Code</th>
                    <th style={{ padding: "10px 12px", fontWeight: 500 }}>Role</th>
                    <th style={{ padding: "10px 12px", fontWeight: 500 }}>Expires</th>
                    <th style={{ padding: "10px 12px", fontWeight: 500 }}>Registrations</th>
                    <th style={{ padding: "10px 12px", fontWeight: 500 }}>Domains</th>
                    <th style={{ padding: "10px 12px", fontWeight: 500 }}>Status</th>
                    <th style={{ padding: "10px 12px", fontWeight: 500 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {links.map((link) => {
                    const status = linkStatus(link);
                    return (
                      <tr key={link.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                        <td style={{ padding: "10px 12px", fontWeight: 500, color: "var(--text-primary)", fontFamily: "monospace" }}>
                          {link.code}
                        </td>
                        <td style={{ padding: "10px 12px", color: "var(--text-secondary)" }}>{link.role.name}</td>
                        <td style={{ padding: "10px 12px", color: "var(--text-muted)", fontSize: "0.75rem" }}>
                          {link.expiresAt ? new Date(link.expiresAt).toLocaleDateString() : "Never"}
                        </td>
                        <td style={{ padding: "10px 12px", fontFamily: "monospace" }}>
                          {link.registrationCount}{link.maxRegistrations ? ` / ${link.maxRegistrations}` : " / ∞"}
                        </td>
                        <td style={{ padding: "10px 12px", color: "var(--text-muted)", fontSize: "0.75rem" }}>
                          {link.allowedDomains || "Any"}
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <span style={{
                            padding: "2px 10px",
                            borderRadius: "var(--radius-full)",
                            fontSize: "0.75rem",
                            fontWeight: 500,
                            background: status.bg,
                            color: status.color,
                          }}>
                            {status.label}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button onClick={() => handleCopy(link)} className="btn-ghost" style={{ padding: "5px 8px" }}>
                              {copiedId === link.id ? <Check size={12} style={{ color: "var(--success)" }} /> : <Copy size={12} />}
                            </button>
                            <button onClick={() => openEdit(link)} className="btn-ghost" style={{ padding: "5px 8px" }}>
                              <Pencil size={12} />
                            </button>
                            <button onClick={() => handleToggleActive(link)} className="btn-ghost" style={{ padding: "5px 8px" }}>
                              {link.isActive ? <ToggleRight size={12} style={{ color: "var(--success)" }} /> : <ToggleLeft size={12} style={{ color: "var(--text-muted)" }} />}
                            </button>
                            <button onClick={() => handleDelete(link)} className="btn-ghost" style={{ padding: "5px 8px", color: "var(--error)" }}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Edit modal */}
      {editLink && (
        <div
          onClick={() => setEditLink(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-card"
            style={{ width: "100%", maxWidth: 440, padding: 0, background: "var(--bg-surface-solid)" }}
          >
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 600, fontFamily: "'Montserrat', sans-serif", color: "var(--text-primary)", margin: 0 }}>
                Edit Link: {editLink.code}
              </h3>
              <button onClick={() => setEditLink(null)} className="btn-ghost" style={{ padding: 6 }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: 4 }}>Expires</label>
                <input type="date" value={editExpiry} onChange={(e) => setEditExpiry(e.target.value)} className="input-field" style={{ width: "100%" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: 4 }}>Max registrations</label>
                <input type="number" value={editMaxReg} onChange={(e) => setEditMaxReg(e.target.value)} className="input-field" style={{ width: "100%" }} placeholder="Unlimited" min={1} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: 4 }}>Allowed domains</label>
                <input type="text" value={editDomains} onChange={(e) => setEditDomains(e.target.value)} className="input-field" style={{ width: "100%" }} placeholder="acme.com, partner.org" />
              </div>
            </div>
            <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border-subtle)", display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button onClick={() => setEditLink(null)} className="btn-ghost">Cancel</button>
              <button onClick={handleEditSave} disabled={editSaving} className="btn-primary" style={{ opacity: editSaving ? 0.5 : 1 }}>
                {editSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: Import and place the section in the Candidates page**

In `src/app/admin/candidates/page.tsx`, add the import at the top:

```typescript
import AssessmentLinksSection from "@/components/admin/AssessmentLinksSection";
```

Then place the component in the header area. Find the existing header `<div>` that contains the "Invite Candidates" button (around line 307-340). Add the `AssessmentLinksSection` button next to the existing "Invite Candidates" button. Replace the button container:

```tsx
<div
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  }}
>
  <h2
    style={{
      fontSize: "1.5rem",
      fontWeight: 700,
      fontFamily: "var(--font-heading), 'Montserrat', sans-serif",
      color: "var(--text-primary)",
    }}
  >
    Candidates
  </h2>
  <div style={{ display: "flex", gap: 8 }}>
    <AssessmentLinksSection roles={roles} />
    <button
      onClick={() => setShowInvite(!showInvite)}
      className="btn-cta"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <UserPlus size={16} />
      Invite Candidates
      {showInvite ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
    </button>
  </div>
</div>
```

Note: The `AssessmentLinksSection` renders its own toggle button inline, plus the collapsible card below it. The card will appear beneath the header row when expanded (it uses `marginTop: 16` and `marginBottom: 32`).

- [ ] **Step 3: Verify it compiles and renders**

Run the dev server:
```bash
npx next dev
```

Open `http://localhost:3000/admin/candidates`. Verify:
- "Public Links" button appears next to "Invite Candidates"
- Clicking it expands the section with the create form and empty table
- Creating a link works (pick a role, adjust code, click Generate)
- Copy, edit, revoke, and delete actions work

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/AssessmentLinksSection.tsx src/app/admin/candidates/page.tsx
git commit -m "feat: add public assessment links admin UI on candidates page"
```

---

### Task 6: Source Indicator on Candidates Table

**Files:**
- Modify: `src/app/admin/candidates/page.tsx`

- [ ] **Step 1: Update the CandidateRow interface**

In `src/app/admin/candidates/page.tsx`, update the `CandidateRow` interface to include the link info:

```typescript
interface CandidateRow {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
  role: { id: string; name: string };
  assessment: { score: { compositeScore: number } | null } | null;
  assessmentLink: { code: string } | null;
}
```

- [ ] **Step 2: Update the candidates API to include assessmentLink**

In `src/app/api/admin/candidates/route.ts`, add `assessmentLink` to the include:

```typescript
const candidates = await prisma.candidate.findMany({
  where,
  include: {
    role: true,
    assessment: { include: { score: true } },
    assessmentLink: { select: { code: true } },
  },
  orderBy: { createdAt: "desc" },
});
```

- [ ] **Step 3: Add the source icon to each candidate row**

In `src/app/admin/candidates/page.tsx`, add the `Link2` import alongside existing lucide imports:

```typescript
import { UserPlus, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Users, Mail, RefreshCw, Calculator, Pencil, Trash2, X, Eraser, Link2 } from "lucide-react";
```

Then add a "Source" column. In the `<thead>`, add after the "Date" column header:

```tsx
<th style={{ padding: "12px 16px", fontWeight: 500 }}>Source</th>
```

In the `<tbody>` row mapping, add after the Date `<td>` and before the Actions `<td>`:

```tsx
<td style={{ padding: "12px 16px" }}>
  <Tooltip content={c.assessmentLink ? `Public link: ${c.assessmentLink.code}` : "Admin invite"}>
    {c.assessmentLink ? (
      <Link2 size={14} style={{ color: "var(--cta)" }} />
    ) : (
      <Mail size={14} style={{ color: "var(--text-muted)" }} />
    )}
  </Tooltip>
</td>
```

Also add the same Source column header and skeleton cell to the loading skeleton table (the first `<thead>` block around line 607 and the skeleton rows around line 621). Add the header:

```tsx
<th style={{ padding: "12px 16px", fontWeight: 500 }}>Source</th>
```

And in the skeleton row, update the column count from 6 to 7 (change `[1, 2, 3, 4, 5, 6]` to `[1, 2, 3, 4, 5, 6, 7]`).

- [ ] **Step 4: Verify in the browser**

Open `http://localhost:3000/admin/candidates`. Verify:
- "Source" column appears between "Date" and "Actions"
- Invited candidates show a Mail icon with tooltip "Admin invite"
- Self-registered candidates (once you test via a public link) show a Link icon with the code in the tooltip

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/candidates/page.tsx src/app/api/admin/candidates/route.ts
git commit -m "feat: add source indicator column to candidates table"
```

---

### Task 7: End-to-End Smoke Test

**Files:** None (manual verification)

- [ ] **Step 1: Create a public link via admin UI**

1. Go to `http://localhost:3000/admin/candidates`
2. Expand "Public Links"
3. Select a role (e.g. "Frontend Engineer")
4. Set code to `test-fe`
5. Set allowed domains to a domain you control (e.g. `gmail.com`)
6. Click "Generate Link"
7. Verify link appears in the table with status "Active"
8. Click the Copy button, verify URL is in clipboard: `http://localhost:3000/join/test-fe`

- [ ] **Step 2: Test the candidate landing page**

1. Open `http://localhost:3000/join/test-fe` in an incognito window
2. Verify: role name, description, "What to expect" blurb, name+email form, domain hint
3. Enter name and an email matching the allowed domain
4. Click "Start Assessment"
5. Verify: redirect to `/assess?token=...` and the assessment loads

- [ ] **Step 3: Test resume flow**

1. Open `http://localhost:3000/join/test-fe` again
2. Enter the same email from Step 2
3. Click "Start Assessment"
4. Verify: redirect to the assessment with the same token (resumes, doesn't create a duplicate)

- [ ] **Step 4: Test domain blocking**

1. Open `http://localhost:3000/join/test-fe`
2. Enter an email with a different domain (e.g. `test@blocked.com`)
3. Verify: inline error "Email domain not allowed"

- [ ] **Step 5: Test error states**

1. Open `http://localhost:3000/join/nonexistent-code` → "This assessment link doesn't exist"
2. Revoke the `test-fe` link from admin → open `/join/test-fe` → "This link is no longer active"

- [ ] **Step 6: Verify source indicator**

1. Go to admin candidates page
2. Verify the candidate created via the public link shows a Link icon in the Source column
3. Verify existing admin-invited candidates show a Mail icon

- [ ] **Step 7: Commit any fixes**

If any bugs were found and fixed during testing:
```bash
git add -A
git commit -m "fix: address issues found during public links smoke test"
```
