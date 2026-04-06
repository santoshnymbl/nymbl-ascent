import Anthropic from "@anthropic-ai/sdk";
import type { ScenarioTree, Tenet } from "@/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export function isAIEnabled(): boolean {
  const key = process.env.ANTHROPIC_API_KEY;
  return !!key && key.length > 20 && !key.includes("sk-ant-...");
}

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

interface Stage3GenInput {
  roleName: string;
  jobDescription: string;
}

interface Stage3GenOutput {
  title: string;
  tree: ScenarioTree;
  tenets: Tenet[];
  scoringRubric: Record<string, unknown>;
}

/**
 * Generates a branching Stage 3 scenario tailored to a specific role's JD.
 * Produces a 2-level branching tree with scoring rubric suitable for scoring.ts
 * path matching (key format: "root->choice" or "root->choice->nextChoice").
 */
export async function generateStage3FromJD(
  input: Stage3GenInput,
): Promise<Stage3GenOutput | null> {
  const jdExcerpt = input.jobDescription.slice(0, 3000);

  const prompt = `You are designing a Stage 3 "role-specific challenge" for a candidate screening assessment called Nymbl Ascent.

ROLE: ${input.roleName}

JOB DESCRIPTION:
${jdExcerpt}

NYMBL TENETS (pick 3-4 most relevant to this role):
- clientFocused: puts client outcomes first
- empowering: lifts up teammates, delegates well
- productive: ships high-impact work
- balanced: sustainable pace, avoids burnout
- reliable: keeps commitments, trustworthy
- improving: growth mindset, learns from mistakes
- transparent: open communication, honest about tradeoffs

DESIGN A REALISTIC ON-THE-JOB SCENARIO:
- Present a dilemma a ${input.roleName} would actually face on day one
- Give 3 initial options (A, B, C) — all defensible, none obviously "wrong"
- Each option leads to a consequence and a follow-up decision with 2 options
- Each option has tenet scores showing what value it reveals (range: 0-10)
- Options should force tradeoffs between different tenets

OUTPUT STRICT JSON (no markdown, no prose):
{
  "title": "<short scenario title>",
  "tenets": ["<tenet1>", "<tenet2>", "<tenet3>"],
  "tree": {
    "rootNodeId": "root",
    "nodes": {
      "root": {
        "id": "root",
        "text": "<the dilemma, 2-3 sentences>",
        "options": [
          {
            "id": "a1",
            "label": "A",
            "text": "<option text>",
            "consequence": "<1-sentence result>",
            "nextNodeId": "node-a",
            "scores": { "clientFocused": 8, "productive": 4 }
          },
          {
            "id": "b1",
            "label": "B",
            "text": "<option text>",
            "consequence": "<1-sentence result>",
            "nextNodeId": "node-b",
            "scores": { "empowering": 7, "reliable": 5 }
          },
          {
            "id": "c1",
            "label": "C",
            "text": "<option text>",
            "consequence": "<1-sentence result>",
            "nextNodeId": "node-c",
            "scores": { "transparent": 8, "improving": 6 }
          }
        ]
      },
      "node-a": {
        "id": "node-a",
        "text": "<follow-up situation>",
        "options": [
          { "id": "a2", "label": "A", "text": "<option>", "consequence": "<result>", "scores": { "reliable": 7 } },
          { "id": "a3", "label": "B", "text": "<option>", "consequence": "<result>", "scores": { "balanced": 6 } }
        ]
      },
      "node-b": {
        "id": "node-b",
        "text": "<follow-up situation>",
        "options": [
          { "id": "b2", "label": "A", "text": "<option>", "consequence": "<result>", "scores": { "productive": 7 } },
          { "id": "b3", "label": "B", "text": "<option>", "consequence": "<result>", "scores": { "improving": 6 } }
        ]
      },
      "node-c": {
        "id": "node-c",
        "text": "<follow-up situation>",
        "options": [
          { "id": "c2", "label": "A", "text": "<option>", "consequence": "<result>", "scores": { "clientFocused": 7 } },
          { "id": "c3", "label": "B", "text": "<option>", "consequence": "<result>", "scores": { "transparent": 6 } }
        ]
      }
    }
  }
}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.tree?.rootNodeId || !parsed.tree?.nodes) return null;

    // Build scoring rubric from the tree's option scores.
    // scoring.ts matches paths like "root->a1" or "root->a1->a2".
    const pathScores: Record<string, Record<string, number>> = {};
    const nodes = parsed.tree.nodes as Record<
      string,
      { options: { id: string; nextNodeId?: string; scores?: Record<string, number> }[] }
    >;
    const rootNode = nodes[parsed.tree.rootNodeId];
    if (rootNode) {
      for (const opt of rootNode.options) {
        const rootKey = `${parsed.tree.rootNodeId}->${opt.id}`;
        pathScores[rootKey] = opt.scores || {};
        if (opt.nextNodeId && nodes[opt.nextNodeId]) {
          for (const sub of nodes[opt.nextNodeId].options) {
            const subKey = `${rootKey}->${sub.id}`;
            // Combine: parent scores + child scores
            const combined: Record<string, number> = { ...(opt.scores || {}) };
            for (const [k, v] of Object.entries(sub.scores || {})) {
              combined[k] = (combined[k] || 0) + v;
            }
            pathScores[subKey] = combined;
          }
        }
      }
    }

    return {
      title: parsed.title || `${input.roleName} Challenge`,
      tree: parsed.tree,
      tenets: (parsed.tenets || []) as Tenet[],
      scoringRubric: { pathScores },
    };
  } catch (err) {
    console.error("generateStage3FromJD failed:", err);
    return null;
  }
}
