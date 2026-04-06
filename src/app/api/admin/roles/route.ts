import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateStage3FromJD, isAIEnabled } from "@/lib/ai-generate";

export async function GET() {
  const roles = await prisma.role.findMany({
    include: { _count: { select: { candidates: true, roleScenarios: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(roles);
}

export async function POST(request: NextRequest) {
  const { name, description, jobDescription, corePoolSize, autoGenerateStage3 } =
    await request.json();
  if (!name)
    return NextResponse.json({ error: "Name required" }, { status: 400 });

  const role = await prisma.role.create({
    data: {
      name,
      description: description || "",
      jobDescription: jobDescription || "",
      corePoolSize: corePoolSize || 2,
    },
  });

  let stage3Generated: { id: string; title: string } | null = null;
  let stage3Error: string | null = null;

  if (autoGenerateStage3) {
    if (!jobDescription || jobDescription.trim().length < 50) {
      stage3Error = "Job description too short to generate from (need 50+ chars)";
    } else if (!isAIEnabled()) {
      stage3Error = "ANTHROPIC_API_KEY not configured in .env.local";
    } else {
      try {
        const generated = await generateStage3FromJD({
          roleName: name,
          jobDescription,
        });
        if (generated) {
          const scenario = await prisma.scenario.create({
            data: {
              title: generated.title,
              stage: 3,
              type: "role-specific",
              roleType: name.toLowerCase().replace(/\s+/g, "-"),
              tree: JSON.stringify(generated.tree),
              tenets: JSON.stringify(generated.tenets),
              scoringRubric: JSON.stringify(generated.scoringRubric),
              isPublished: true,
            },
          });
          await prisma.roleScenario.create({
            data: { roleId: role.id, scenarioId: scenario.id },
          });
          stage3Generated = { id: scenario.id, title: scenario.title };
        } else {
          stage3Error = "AI returned an invalid scenario format";
        }
      } catch (err) {
        stage3Error = err instanceof Error ? err.message : "AI generation failed";
      }
    }
  }

  return NextResponse.json({ ...role, stage3Generated, stage3Error }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const { id, name, description, jobDescription, corePoolSize } = await request.json();
  if (!id)
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  const role = await prisma.role.update({
    where: { id },
    data: { name, description, jobDescription, corePoolSize },
  });
  return NextResponse.json(role);
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();
  await prisma.role.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
