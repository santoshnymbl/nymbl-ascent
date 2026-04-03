import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const stage = request.nextUrl.searchParams.get("stage");
  const type = request.nextUrl.searchParams.get("type");
  const where: Record<string, unknown> = {};
  if (stage) where.stage = parseInt(stage);
  if (type) where.type = type;
  const scenarios = await prisma.scenario.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(
    scenarios.map((s) => ({
      ...s,
      tree: JSON.parse(s.tree),
      tenets: JSON.parse(s.tenets),
      scoringRubric: JSON.parse(s.scoringRubric),
    })),
  );
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const scenario = await prisma.scenario.create({
    data: {
      title: body.title,
      stage: body.stage,
      type: body.type,
      roleType: body.roleType || null,
      tree: JSON.stringify(body.tree),
      tenets: JSON.stringify(body.tenets),
      scoringRubric: JSON.stringify(body.scoringRubric || {}),
      isPublished: body.isPublished || false,
    },
  });
  return NextResponse.json(scenario, { status: 201 });
}
