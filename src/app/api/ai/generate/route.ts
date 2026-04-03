import { NextRequest, NextResponse } from "next/server";
import { generateScenario } from "@/lib/ai-generate";

export async function POST(request: NextRequest) {
  const { targetTenets, roleType, stage } = await request.json();
  if (!targetTenets?.length || !roleType || !stage) {
    return NextResponse.json(
      { error: "targetTenets, roleType, and stage required" },
      { status: 400 },
    );
  }
  const result = await generateScenario({ targetTenets, roleType, stage });
  if (!result) {
    return NextResponse.json(
      { error: "Failed to generate scenario" },
      { status: 500 },
    );
  }
  return NextResponse.json(result);
}
