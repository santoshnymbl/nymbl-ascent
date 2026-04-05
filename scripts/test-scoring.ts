import { computeStage2Scores } from "../src/lib/scoring";

const stage2Data = {
  scenarios: [
    { scenarioId: "test", path: [
      { nodeId: "root", choiceId: "flag-now", timeMs: 1000 },
      { nodeId: "node-flag-now", choiceId: "flag-report", timeMs: 1000 },
      { nodeId: "leaf-flag-report", choiceId: "ref-protect", timeMs: 1000 },
    ]}
  ],
  signals: []
};

const rubrics = [{
  scenarioId: "test",
  pathScores: {
    "root->flag-now": { transparent: 9, clientFocused: 3 },
    "root->flag-now->flag-report": { transparent: 8, reliable: 7 },
  } as Record<string, Record<string, number>>,
}];

const scores = computeStage2Scores(stage2Data, rubrics);
console.log("Full path key would be: root->flag-now->flag-report->ref-protect");
console.log("Scores:", JSON.stringify(scores, null, 2));
console.log("Transparent should be > 0:", scores.transparent);
