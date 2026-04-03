import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const roleId = request.nextUrl.searchParams.get("roleId");
  const where: Record<string, unknown> = {
    status: { in: ["completed", "scored"] },
  };
  if (roleId) where.roleId = roleId;
  const candidates = await prisma.candidate.findMany({
    where,
    include: { role: true, assessment: { include: { score: true } } },
    orderBy: { createdAt: "desc" },
  });
  const sorted = candidates.sort((a, b) => {
    const scoreA = a.assessment?.score?.compositeScore ?? -1;
    const scoreB = b.assessment?.score?.compositeScore ?? -1;
    return scoreB - scoreA;
  });
  return NextResponse.json(sorted);
}
