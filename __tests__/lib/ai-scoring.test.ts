import { buildScoringPrompt, parseAiScoreResponse } from "@/lib/ai-scoring";

describe("buildScoringPrompt", () => {
  it("includes tenet names and decision paths in the prompt", () => {
    const prompt = buildScoringPrompt({
      candidateName: "Alice",
      roleName: "Engineer",
      decisionPaths: [
        {
          scenarioTitle: "Client Escalation",
          choices: ["Handled client directly", "Asked for extension"],
        },
      ],
    });
    expect(prompt).toContain("Client Focused");
    expect(prompt).toContain("Empowering");
    expect(prompt).toContain("Client Escalation");
    expect(prompt).toContain("Handled client directly");
  });
});

describe("parseAiScoreResponse", () => {
  it("parses JSON scores from AI response", () => {
    const response = JSON.stringify({
      tenets: {
        clientFocused: 85, empowering: 60, productive: 70,
        balanced: 75, reliable: 80, improving: 65, transparent: 90,
      },
      analysis: "Candidate shows strong client focus and transparency.",
    });
    const result = parseAiScoreResponse(response);
    expect(result!.tenets.clientFocused).toBe(85);
    expect(result!.analysis).toContain("client focus");
  });

  it("returns null for invalid JSON", () => {
    const result = parseAiScoreResponse("not json");
    expect(result).toBeNull();
  });
});
