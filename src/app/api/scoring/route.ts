import { NextRequest, NextResponse } from "next/server";
import { runScoring } from "@/lib/run-scoring";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  let candidateId: string;
  try {
    ({ candidateId } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const result = await runScoring(candidateId);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }
    return NextResponse.json({ ok: true, compositeScore: result.compositeScore });
  } catch (err) {
    console.error("Scoring failed:", err);
    return NextResponse.json(
      { error: "Scoring failed", details: String(err) },
      { status: 500 },
    );
  }
}
