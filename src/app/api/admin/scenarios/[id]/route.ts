import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const scenario = await prisma.scenario.findUnique({ where: { id } });
  if (!scenario)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    ...scenario,
    tree: JSON.parse(scenario.tree),
    tenets: JSON.parse(scenario.tenets),
    scoringRubric: JSON.parse(scenario.scoringRubric),
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const scenario = await prisma.scenario.update({
    where: { id },
    data: {
      title: body.title,
      stage: body.stage,
      type: body.type,
      roleType: body.roleType,
      tree: JSON.stringify(body.tree),
      tenets: JSON.stringify(body.tenets),
      scoringRubric: JSON.stringify(body.scoringRubric),
      isPublished: body.isPublished,
    },
  });
  return NextResponse.json(scenario);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.scenario.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
