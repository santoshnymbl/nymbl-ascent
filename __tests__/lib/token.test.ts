import { generateToken, validateToken } from "@/lib/token";
import { prisma } from "@/lib/db";

// Mock Prisma
jest.mock("@/lib/db", () => ({
  prisma: {
    candidate: {
      findUnique: jest.fn(),
    },
  },
}));

describe("generateToken", () => {
  it("returns a 64-character hex string", () => {
    const token = generateToken();
    expect(token).toMatch(/^[a-f0-9]{64}$/);
  });

  it("generates unique tokens", () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateToken()));
    expect(tokens.size).toBe(100);
  });
});

describe("validateToken", () => {
  const mockFindUnique = prisma.candidate.findUnique as jest.Mock;

  afterEach(() => jest.clearAllMocks());

  it("returns candidate when token is valid and not expired", async () => {
    const future = new Date(Date.now() + 86400000);
    const candidate = {
      id: "c1",
      token: "abc",
      tokenExpiry: future,
      status: "invited",
      role: { id: "r1", name: "Engineer" },
      assessment: null,
    };
    mockFindUnique.mockResolvedValue(candidate);

    const result = await validateToken("abc");
    expect(result).toEqual(candidate);
  });

  it("returns null when token not found", async () => {
    mockFindUnique.mockResolvedValue(null);
    const result = await validateToken("nonexistent");
    expect(result).toBeNull();
  });

  it("returns null when token is expired", async () => {
    const past = new Date(Date.now() - 86400000);
    mockFindUnique.mockResolvedValue({
      id: "c1",
      token: "abc",
      tokenExpiry: past,
      status: "invited",
    });
    const result = await validateToken("abc");
    expect(result).toBeNull();
  });
});
