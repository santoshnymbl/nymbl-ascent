import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface Params {
  params: Promise<{ id: string }>;
}

/** Clear score for a candidate — wipe the Score row and reset status to "completed" */
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  const candidate = await prisma.candidate.findUnique({
    where: { id },
    include: { assessment: { include: { score: true } } },
  });

  if (!candidate) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!candidate.assessment?.score) {
    return NextResponse.json({ error: "No score to clear" }, { status: 400 });
  }

  await prisma.score.delete({
    where: { id: candidate.assessment.score.id },
  });

  await prisma.candidate.update({
    where: { id },
    data: { status: "completed" },
  });

  return NextResponse.json({ ok: true });
}
