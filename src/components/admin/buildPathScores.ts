import type { ScenarioTree, ScenarioNode, Tenet } from "@/types";

/**
 * Walk a ScenarioTree and build the pathScores rubric map.
 * Each key is a path like "root->choiceA->nodeB->choiceB1"
 * Each value is the tenet scores from the final choice in that path.
 *
 * Produces the same format expected by computeStage2Scores in scoring.ts.
 */
export function buildPathScores(
  tree: ScenarioTree,
): Record<string, Partial<Record<Tenet, number>>> {
  const result: Record<string, Partial<Record<Tenet, number>>> = {};
  const root = tree.nodes[tree.rootNodeId];
  if (!root) return result;

  function walk(node: ScenarioNode, pathSegments: string[]) {
    if (!node.options || node.options.length === 0) return;

    for (const option of node.options) {
      const newPath = [...pathSegments, option.id];
      const key = newPath.join("->");

      // Record scores for this choice path
      if (Object.keys(option.scores).length > 0) {
        result[key] = { ...option.scores };
      }

      // If this choice leads to another node, continue walking
      if (option.nextNodeId && tree.nodes[option.nextNodeId]) {
        walk(tree.nodes[option.nextNodeId], newPath);
      }
    }
  }

  walk(root, [root.id]);
  return result;
}
