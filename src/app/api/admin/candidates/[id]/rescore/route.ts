import { NextRequest, NextResponse } from "next/server";
import { runScoring } from "@/lib/run-scoring";

export const maxDuration = 60;

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const result = await runScoring(id);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true, compositeScore: result.compositeScore });
  } catch (err) {
    console.error("Re-score failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Scoring failed" },
      { status: 500 },
    );
  }
}
