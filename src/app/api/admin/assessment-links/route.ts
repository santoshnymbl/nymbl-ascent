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
