import { buildInviteEmail, buildCompletionEmail, buildResultsReadyEmail } from "@/lib/email";

describe("buildInviteEmail", () => {
  it("includes candidate name and assessment link", () => {
    const result = buildInviteEmail({
      candidateName: "Alice",
      roleName: "Frontend Engineer",
      token: "abc123",
      baseUrl: "http://localhost:3000",
    });

    expect(result.subject).toContain("Nymbl");
    expect(result.html).toContain("Alice");
    expect(result.html).toContain("Frontend Engineer");
    expect(result.html).toContain("http://localhost:3000/assess/abc123");
  });
});

describe("buildCompletionEmail", () => {
  it("includes candidate name and thank you message", () => {
    const result = buildCompletionEmail({
      candidateName: "Alice",
      roleName: "Frontend Engineer",
    });

    expect(result.subject).toContain("Nymbl Ascent");
    expect(result.html).toContain("Alice");
    expect(result.html).not.toContain("score"); // no score revealed
  });
});

describe("buildResultsReadyEmail", () => {
  it("includes role name and dashboard link", () => {
    const result = buildResultsReadyEmail({
      roleName: "Frontend Engineer",
      candidateName: "Alice",
      baseUrl: "http://localhost:3000",
      candidateId: "c1",
    });

    expect(result.subject).toContain("Results");
    expect(result.html).toContain("Frontend Engineer");
    expect(result.html).toContain("http://localhost:3000/admin/results/c1");
  });
});
