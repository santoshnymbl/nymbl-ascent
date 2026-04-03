import { NextRequest, NextResponse } from "next/server";
import { validateToken } from "@/lib/token";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  const candidate = await validateToken(token);
  if (!candidate) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 },
    );
  }

  return NextResponse.json({
    candidateId: candidate.id,
    name: candidate.name,
    roleName: candidate.role.name,
    status: candidate.status,
    currentStage: candidate.assessment?.currentStage ?? 0,
  });
}
