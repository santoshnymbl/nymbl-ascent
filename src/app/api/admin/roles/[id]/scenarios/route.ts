import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const roleScenarios = await prisma.roleScenario.findMany({
    where: { roleId: id },
    select: { scenarioId: true },
  });
  return NextResponse.json({
    scenarioIds: roleScenarios.map((rs) => rs.scenarioId),
  });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const { scenarioIds } = (await request.json()) as { scenarioIds: string[] };

  if (!Array.isArray(scenarioIds)) {
    return NextResponse.json(
      { error: "scenarioIds must be an array" },
      { status: 400 },
    );
  }

  // Replace attachments for this role
  await prisma.$transaction([
    prisma.roleScenario.deleteMany({ where: { roleId: id } }),
    ...(scenarioIds.length > 0
      ? [
          prisma.roleScenario.createMany({
            data: scenarioIds.map((scenarioId) => ({
              roleId: id,
              scenarioId,
            })),
          }),
        ]
      : []),
  ]);

  return NextResponse.json({ ok: true, count: scenarioIds.length });
}
