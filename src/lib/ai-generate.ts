import Anthropic from "@anthropic-ai/sdk";
import type { ScenarioTree, Tenet } from "@/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface GenerateInput {
  targetTenets: Tenet[];
  roleType: string;
  stage: number;
}

export async function generateScenario(input: GenerateInput): Promise<{
  title: string;
  tree: ScenarioTree;
  tenets: Tenet[];
} | null> {
  const tenetList = input.targetTenets.join(", ");

  const prompt = `Generate a workplace scenario for a "${input.roleType}" role that evaluates these Nymbl tenets: ${tenetList}.

This is for Stage ${input.stage} of a candidate screening assessment.

${input.stage === 2 ? `Create a branching scenario with:
- An initial situation with 3-4 response options
- Each option leads to a consequence and a follow-up decision (2 options each)
- No option should be obviously "correct" — they should reveal values and priorities
- Each option should have tenet scores (-10 to +10)` : ""}

${input.stage === 1 ? `Create a mini-game scenario appropriate for quick, gamified interaction (drag-and-drop, matching, or multiple choice).` : ""}

${input.stage === 3 ? `Create a role-specific challenge that tests both the tenets and practical skills for a "${input.roleType}" role.` : ""}

Respond with ONLY valid JSON in this format:
{
  "title": "<scenario title>",
  "tree": {
    "rootNodeId": "root",
    "nodes": {
      "root": {
        "id": "root",
        "text": "<situation description>",
        "options": [
          {
            "id": "<option-id>",
            "label": "A",
            "text": "<option text>",
            "consequence": "<what happens>",
            "nextNodeId": "<next-node-id or null>",
            "scores": { "<tenet>": <number> }
          }
        ]
      }
    }
  }
}`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      title: parsed.title,
      tree: parsed.tree,
      tenets: input.targetTenets,
    };
  } catch {
    return null;
  }
}
