import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateToken } from "@/lib/token";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  const candidate = await validateToken(token);
  if (!candidate) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const assessment = candidate.assessment;
  return NextResponse.json({
    currentStage: assessment?.currentStage ?? 0,
    stage1Data: assessment?.stage1Data
      ? JSON.parse(assessment.stage1Data)
      : null,
    stage2Data: assessment?.stage2Data
      ? JSON.parse(assessment.stage2Data)
      : null,
    stage3Data: assessment?.stage3Data
      ? JSON.parse(assessment.stage3Data)
      : null,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { token, stage, data } = body;

  if (!token || !stage) {
    return NextResponse.json(
      { error: "Token and stage required" },
      { status: 400 },
    );
  }

  const candidate = await validateToken(token);
  if (!candidate) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  if (candidate.status === "completed" || candidate.status === "scored") {
    return NextResponse.json(
      { error: "Assessment already completed" },
      { status: 400 },
    );
  }

  const stageField = `stage${stage}Data` as
    | "stage1Data"
    | "stage2Data"
    | "stage3Data";

  const assessment = await prisma.assessment.upsert({
    where: { candidateId: candidate.id },
    create: {
      candidateId: candidate.id,
      currentStage: stage,
      [stageField]: JSON.stringify(data),
    },
    update: {
      currentStage: stage,
      [stageField]: JSON.stringify(data),
    },
  });

  // Update candidate status to in_progress on first save
  if (candidate.status === "invited") {
    await prisma.candidate.update({
      where: { id: candidate.id },
      data: { status: "in_progress" },
    });
  }

  return NextResponse.json({ ok: true, currentStage: assessment.currentStage });
}
