import Anthropic from "@anthropic-ai/sdk";
import type { Tenet } from "@/types";

let _anthropic: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _anthropic;
}

type TenetScores = Record<Tenet, number>;

interface ScoringInput {
  candidateName: string;
  roleName: string;
  decisionPaths: { scenarioTitle: string; choices: string[] }[];
}

interface AiScoreResult {
  tenets: TenetScores;
  analysis: string;
}

export function buildScoringPrompt(input: ScoringInput): string {
  const pathDescriptions = input.decisionPaths
    .map(
      (p) =>
        `Scenario: "${p.scenarioTitle}"\nDecisions: ${p.choices.map((c, i) => `${i + 1}. ${c}`).join("\n")}`
    )
    .join("\n\n");

  return `You are evaluating a job candidate for the "${input.roleName}" role at Nymbl.

Nymbl's 7 tenets are:
- Client Focused: Prioritizes customer needs and satisfaction
- Empowering: Enables others, delegates, collaborates
- Productive: Efficient, action-oriented, delivers results
- Balanced: Manages trade-offs, avoids extremes
- Reliable: Consistent, follows through, trustworthy
- Improving: Growth mindset, learns from mistakes, adapts
- Transparent: Honest, communicates openly, surfaces issues

The candidate made these decisions in workplace scenarios:

${pathDescriptions}

Score the candidate 0-100 on each tenet based on their decision patterns. Provide a brief qualitative analysis.

Respond with ONLY valid JSON in this exact format:
{
  "tenets": {
    "clientFocused": <number>,
    "empowering": <number>,
    "productive": <number>,
    "balanced": <number>,
    "reliable": <number>,
    "improving": <number>,
    "transparent": <number>
  },
  "analysis": "<2-3 sentence qualitative summary>"
}`;
}

export function parseAiScoreResponse(
  response: string
): AiScoreResult | null {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.tenets || !parsed.analysis) return null;
    return { tenets: parsed.tenets, analysis: parsed.analysis };
  } catch {
    return null;
  }
}

export async function scoreWithAi(
  input: ScoringInput
): Promise<AiScoreResult | null> {
  const prompt = buildScoringPrompt(input);
  const message = await getClient().messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });
  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  return parseAiScoreResponse(text);
}
