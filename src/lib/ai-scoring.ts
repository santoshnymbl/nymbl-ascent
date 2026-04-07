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

Score the candidate 0-100 on each tenet based on their decision patterns. Use the FULL scale — most candidates should land in the 40-75 range on most tenets. Reserve 85+ for candidates whose decisions clearly and repeatedly exemplify that tenet at a senior level.

CALIBRATION ANCHORS:
- Score BELOW 40 on a tenet if the candidate's decisions contradict it, show generic/rehearsed-sounding reasoning, or actively trade it away every time it conflicts with another value.
- Score 40-60 if the candidate shows that tenet weakly or inconsistently — they don't actively violate it but they don't prioritize it either.
- Score 60-80 if the candidate demonstrates the tenet clearly in at least one substantive decision and it's internally consistent with their other choices.
- Score 80-95 only if the tenet is clearly dominant across MULTIPLE decisions AND the candidate accepted a real cost for it (time, comfort, approval, etc.).
- Avoid 50 as a "safe default" — prefer 40 or 60 based on which direction the evidence leans. Differentiation is more useful than safety.

Do NOT average your scores toward the middle. If the decision paths simply don't touch a tenet, score 50 exactly (neutral) rather than guessing high.

Provide a brief qualitative analysis (2-3 sentences) that names at least one tenet where the candidate showed strength and at least one where they showed a gap or trade-off.

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
