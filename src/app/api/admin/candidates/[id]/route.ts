import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface Params {
  params: Promise<{ id: string }>;
}

/** Edit candidate name/email */
export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const { name, email } = await request.json();

  if (!name?.trim() && !email?.trim()) {
    return NextResponse.json(
      { error: "Provide name or email to update" },
      { status: 400 },
    );
  }

  const data: Record<string, string> = {};
  if (name?.trim()) data.name = name.trim();
  if (email?.trim()) data.email = email.trim();

  const candidate = await prisma.candidate.update({
    where: { id },
    data,
  });

  return NextResponse.json(candidate);
}

/** Delete candidate + cascade (assessment → score) */
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  const candidate = await prisma.candidate.findUnique({ where: { id } });
  if (!candidate) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Prisma cascade handles Assessment → Score automatically
  await prisma.candidate.delete({ where: { id } });

  return NextResponse.json({ ok: true, name: candidate.name });
}
