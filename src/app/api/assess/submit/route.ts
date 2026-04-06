import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateToken } from "@/lib/token";
import { runScoring } from "@/lib/run-scoring";

export const maxDuration = 60; // allow up to 60s for AI scoring on Vercel

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

  // Run scoring synchronously and inline. The previous fire-and-forget
  // fetch was killed immediately by Vercel serverless function teardown.
  try {
    const result = await runScoring(candidate.id);
    if (!result.ok) {
      console.error("Scoring failed:", result.error);
    }
  } catch (err) {
    console.error("Scoring threw:", err);
  }

  return NextResponse.json({ ok: true });
}
