import crypto from "crypto";
import { prisma } from "./db";

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function validateToken(token: string) {
  const candidate = await prisma.candidate.findUnique({
    where: { token },
    include: {
      role: true,
      assessment: true,
    },
  });

  if (!candidate) return null;
  if (new Date() > candidate.tokenExpiry) return null;

  return candidate;
}
