import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateToken } from "@/lib/token";
import { sendEmail, buildInviteEmail } from "@/lib/email";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  const candidate = await prisma.candidate.findUnique({
    where: { id },
    include: { role: true, assessment: true },
  });
  if (!candidate) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }
  if (candidate.status === "scored") {
    return NextResponse.json(
      { error: "Candidate is already scored — resending would let them retake" },
      { status: 400 },
    );
  }

  // Generate fresh token + expiry
  const token = generateToken();
  const tokenExpiry = new Date();
  tokenExpiry.setDate(tokenExpiry.getDate() + 7);

  // Reset state: clear any partial assessment so they start fresh
  await prisma.candidate.update({
    where: { id },
    data: { token, tokenExpiry, status: "invited" },
  });
  if (candidate.assessment) {
    await prisma.assessment.delete({ where: { candidateId: id } });
  }

  // Send email
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  try {
    await sendEmail(
      candidate.email,
      buildInviteEmail({
        candidateName: candidate.name,
        roleName: candidate.role.name,
        token,
        baseUrl,
      }),
    );
    return NextResponse.json({
      ok: true,
      newToken: token,
      newLink: `${baseUrl}/assess/${token}`,
    });
  } catch (err) {
    console.error("Resend email failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Email send failed",
        newToken: token,
        newLink: `${baseUrl}/assess/${token}`,
      },
      { status: 500 },
    );
  }
}
