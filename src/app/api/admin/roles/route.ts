import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const roles = await prisma.role.findMany({
    include: { _count: { select: { candidates: true, roleScenarios: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(roles);
}

export async function POST(request: NextRequest) {
  const { name, description, corePoolSize } = await request.json();
  if (!name)
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  const role = await prisma.role.create({
    data: {
      name,
      description: description || "",
      corePoolSize: corePoolSize || 2,
    },
  });
  return NextResponse.json(role, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const { id, name, description, corePoolSize } = await request.json();
  if (!id)
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  const role = await prisma.role.update({
    where: { id },
    data: { name, description, corePoolSize },
  });
  return NextResponse.json(role);
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();
  await prisma.role.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
