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
