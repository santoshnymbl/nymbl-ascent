import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const roleId = request.nextUrl.searchParams.get("roleId");
  const status = request.nextUrl.searchParams.get("status");
  const where: Record<string, unknown> = {};
  if (roleId) where.roleId = roleId;
  if (status) where.status = status;
  const candidates = await prisma.candidate.findMany({
    where,
    include: { role: true, assessment: { include: { score: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(candidates);
}
