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
