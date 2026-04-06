import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateToken } from "@/lib/token";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const stageParam = request.nextUrl.searchParams.get("stage");

  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }
  if (!stageParam) {
    return NextResponse.json({ error: "Stage required" }, { status: 400 });
  }

  const stage = parseInt(stageParam, 10);
  if (![1, 2, 3].includes(stage)) {
    return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
  }

  const candidate = await validateToken(token);
  if (!candidate) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 },
    );
  }

  // Fetch scenarios attached to this candidate's role for the given stage
  const roleScenarios = await prisma.roleScenario.findMany({
    where: {
      roleId: candidate.roleId,
      scenario: { stage, isPublished: true },
    },
    include: { scenario: true },
  });

  let scenarios = roleScenarios.map((rs) => rs.scenario);

  // Stage 2: randomly pick `corePoolSize` scenarios
  if (stage === 2) {
    const role = await prisma.role.findUnique({
      where: { id: candidate.roleId },
    });
    const poolSize = role?.corePoolSize ?? 2;
    scenarios = [...scenarios]
      .sort(() => Math.random() - 0.5)
      .slice(0, poolSize);
  }

  return NextResponse.json(
    scenarios.map((s) => ({
      ...s,
      tree: JSON.parse(s.tree),
      tenets: JSON.parse(s.tenets),
      scoringRubric: JSON.parse(s.scoringRubric),
    })),
  );
}
