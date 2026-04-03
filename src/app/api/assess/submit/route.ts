import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateToken } from "@/lib/token";

export async function POST(request: NextRequest) {
  const { token } = await request.json();

  const candidate = await validateToken(token);
  if (!candidate) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  if (candidate.status === "completed" || candidate.status === "scored") {
    return NextResponse.json({ error: "Already submitted" }, { status: 400 });
  }

  await prisma.assessment.update({
    where: { candidateId: candidate.id },
    data: { completedAt: new Date(), currentStage: 3 },
  });

  await prisma.candidate.update({
    where: { id: candidate.id },
    data: { status: "completed" },
  });

  // Trigger async scoring (fire and forget)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  fetch(`${baseUrl}/api/scoring`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ candidateId: candidate.id }),
  }).catch(console.error);

  return NextResponse.json({ ok: true });
}
