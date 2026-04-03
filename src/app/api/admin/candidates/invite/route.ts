import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateToken } from "@/lib/token";
import { sendEmail, buildInviteEmail } from "@/lib/email";

interface InvitePayload {
  candidates: { name: string; email: string }[];
  roleId: string;
}

export async function POST(request: NextRequest) {
  const { candidates: candidateList, roleId }: InvitePayload =
    await request.json();
  if (!candidateList?.length || !roleId) {
    return NextResponse.json(
      { error: "Candidates and roleId required" },
      { status: 400 },
    );
  }
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role)
    return NextResponse.json({ error: "Role not found" }, { status: 404 });

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 7);
  const results = [];

  for (const c of candidateList) {
    const token = generateToken();
    await prisma.candidate.create({
      data: {
        name: c.name,
        email: c.email,
        roleId,
        token,
        tokenExpiry: expiry,
      },
    });
    try {
      await sendEmail(
        c.email,
        buildInviteEmail({
          candidateName: c.name,
          roleName: role.name,
          token,
          baseUrl,
        }),
      );
      results.push({ name: c.name, email: c.email, status: "sent" });
    } catch (err) {
      console.error(`Failed to send invite to ${c.email}:`, err);
      results.push({ name: c.name, email: c.email, status: "failed" });
    }
  }
  return NextResponse.json({ results }, { status: 201 });
}
