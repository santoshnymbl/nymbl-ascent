import {
  computeStage1Scores,
  computeStage2Scores,
  computeBehavioralScore,
  computeCompositeScore,
  mergeScores,
} from "@/lib/scoring";
import type {
  Stage1Result,
  Stage2Result,
  BehavioralSignal,
  TenetScores,
  ScenarioRubric,
} from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const IDEAL_ORDER = [
  "client-issue",
  "team-blocker",
  "own-deadline",
  "nice-to-have",
  "admin-task",
];

function makeStage1(overrides: Partial<Stage1Result> = {}): Stage1Result {
  return {
    prioritySnap: {
      order: IDEAL_ORDER,
      timeMs: 5000,
      revisions: 0,
    },
    valueMatch: {
      matches: [
        { valueId: "v1", situationId: "s1", correct: true },
        { valueId: "v2", situationId: "s2", correct: true },
        { valueId: "v3", situationId: "s3", correct: true },
        { valueId: "v4", situationId: "s4", correct: true },
      ],
      timeMs: 8000,
    },
    oddOneOut: {
      picks: [
        { roundId: "r1", chosenId: "c1", correct: true },
        { roundId: "r2", chosenId: "c2", correct: true },
        { roundId: "r3", chosenId: "c3", correct: true },
      ],
      timeMs: 6000,
    },
    signals: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// 1. Perfect Stage 1 should score high
// ---------------------------------------------------------------------------

describe("computeStage1Scores", () => {
  it("scores high for perfect answers", () => {
    const scores = computeStage1Scores(makeStage1());

    // Productive & Balanced come from prioritySnap (perfect order)
    expect(scores.productive).toBeGreaterThanOrEqual(90);
    expect(scores.balanced).toBeGreaterThanOrEqual(90);

    // ClientFocused & Transparent come from valueMatch (100% correct)
    expect(scores.clientFocused).toBeGreaterThanOrEqual(90);
    expect(scores.transparent).toBeGreaterThanOrEqual(90);

    // Reliable & Improving come from oddOneOut (100% correct)
    expect(scores.reliable).toBeGreaterThanOrEqual(90);
    expect(scores.improving).toBeGreaterThanOrEqual(90);
  });

  // -------------------------------------------------------------------------
  // 2. Wrong answers should score lower than perfect
  // -------------------------------------------------------------------------

  it("scores lower when answers are wrong", () => {
    const perfectScores = computeStage1Scores(makeStage1());

    const wrongStage1 = makeStage1({
      prioritySnap: {
        order: ["admin-task", "nice-to-have", "own-deadline", "team-blocker", "client-issue"],
        timeMs: 30000,
        revisions: 0,
      },
      valueMatch: {
        matches: [
          { valueId: "v1", situationId: "s1", correct: false },
          { valueId: "v2", situationId: "s2", correct: false },
          { valueId: "v3", situationId: "s3", correct: true },
          { valueId: "v4", situationId: "s4", correct: false },
        ],
        timeMs: 30000,
      },
      oddOneOut: {
        picks: [
          { roundId: "r1", chosenId: "c1", correct: false },
          { roundId: "r2", chosenId: "c2", correct: false },
          { roundId: "r3", chosenId: "c3", correct: true },
        ],
        timeMs: 30000,
      },
    });

    const wrongScores = computeStage1Scores(wrongStage1);

    expect(wrongScores.productive).toBeLessThan(perfectScores.productive);
    expect(wrongScores.balanced).toBeLessThan(perfectScores.balanced);
    expect(wrongScores.clientFocused).toBeLessThan(perfectScores.clientFocused);
    expect(wrongScores.transparent).toBeLessThan(perfectScores.transparent);
    expect(wrongScores.reliable).toBeLessThan(perfectScores.reliable);
    expect(wrongScores.improving).toBeLessThan(perfectScores.improving);
  });
});

// ---------------------------------------------------------------------------
// 3. Stage 2 scores from path rubric
// ---------------------------------------------------------------------------

describe("computeStage2Scores", () => {
  it("scores from rubric pathScores lookup", () => {
    const stage2: Stage2Result = {
      scenarios: [
        {
          scenarioId: "scenario-1",
          path: [
            { nodeId: "root", choiceId: "d", timeMs: 5000 },
            { nodeId: "n2", choiceId: "d1", timeMs: 4000 },
          ],
        },
      ],
      signals: [],
    };

    const rubrics: ScenarioRubric[] = [
      {
        scenarioId: "scenario-1",
        pathScores: {
          "root->d->d1": {
            clientFocused: 8,
            empowering: 6,
            productive: 7,
            balanced: 5,
            reliable: 9,
            improving: 4,
            transparent: 7,
          },
        },
      },
    ];

    const scores = computeStage2Scores(stage2, rubrics);

    // Normalized 0-10 to 0-100
    expect(scores.clientFocused).toBe(80);
    expect(scores.empowering).toBe(60);
    expect(scores.productive).toBe(70);
    expect(scores.balanced).toBe(50);
    expect(scores.reliable).toBe(90);
    expect(scores.improving).toBe(40);
    expect(scores.transparent).toBe(70);
  });

  it("averages scores across multiple scenarios", () => {
    const stage2: Stage2Result = {
      scenarios: [
        {
          scenarioId: "s1",
          path: [{ nodeId: "root", choiceId: "a", timeMs: 3000 }],
        },
        {
          scenarioId: "s2",
          path: [{ nodeId: "root", choiceId: "b", timeMs: 4000 }],
        },
      ],
      signals: [],
    };

    const rubrics: ScenarioRubric[] = [
      {
        scenarioId: "s1",
        pathScores: {
          "root->a": { clientFocused: 10, empowering: 0 },
        },
      },
      {
        scenarioId: "s2",
        pathScores: {
          "root->b": { clientFocused: 0, empowering: 10 },
        },
      },
    ];

    const scores = computeStage2Scores(stage2, rubrics);

    // Average of (100, 0) and (0, 100) = 50 each
    expect(scores.clientFocused).toBe(50);
    expect(scores.empowering).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// 4. Behavioral penalizes fast clicking
// ---------------------------------------------------------------------------

describe("computeBehavioralScore", () => {
  it("penalizes very fast clicking (avg gap < 1s)", () => {
    const signals: BehavioralSignal[] = [
      { event: "choice", timestamp: 1000, data: {} },
      { event: "choice", timestamp: 1500, data: {} },
      { event: "choice", timestamp: 2000, data: {} },
      { event: "choice", timestamp: 2300, data: {} },
    ];

    const score = computeBehavioralScore(signals);
    // baseline 70 - 30 = 40
    expect(score).toBe(40);
  });

  it("penalizes moderately fast clicking (avg gap < 2s)", () => {
    const signals: BehavioralSignal[] = [
      { event: "choice", timestamp: 1000, data: {} },
      { event: "choice", timestamp: 2500, data: {} },
      { event: "choice", timestamp: 4000, data: {} },
    ];

    const score = computeBehavioralScore(signals);
    // baseline 70 - 10 = 60
    expect(score).toBe(60);
  });

  it("gives bonus for thoughtful pace (2-10s avg gap)", () => {
    const signals: BehavioralSignal[] = [
      { event: "choice", timestamp: 1000, data: {} },
      { event: "choice", timestamp: 6000, data: {} },
      { event: "choice", timestamp: 11000, data: {} },
    ];

    const score = computeBehavioralScore(signals);
    // baseline 70 + 15 = 85
    expect(score).toBe(85);
  });

  it("penalizes very slow (avg gap > 30s)", () => {
    const signals: BehavioralSignal[] = [
      { event: "choice", timestamp: 1000, data: {} },
      { event: "choice", timestamp: 40000, data: {} },
      { event: "choice", timestamp: 80000, data: {} },
    ];

    const score = computeBehavioralScore(signals);
    // baseline 70 - 5 = 65
    expect(score).toBe(65);
  });

  it("gives bonus for revisions (up to 3, +5 each)", () => {
    const signals: BehavioralSignal[] = [
      { event: "choice", timestamp: 1000, data: {} },
      { event: "choice", timestamp: 6000, data: {} },
      { event: "revision", timestamp: 7000, data: {} },
      { event: "revision", timestamp: 8000, data: {} },
    ];

    const score = computeBehavioralScore(signals);
    // baseline 70 + 15 (thoughtful) + 10 (2 revisions * 5) = 95
    expect(score).toBe(95);
  });

  it("caps revision bonus at 3", () => {
    const signals: BehavioralSignal[] = [
      { event: "choice", timestamp: 1000, data: {} },
      { event: "choice", timestamp: 6000, data: {} },
      { event: "revision", timestamp: 7000, data: {} },
      { event: "revision", timestamp: 8000, data: {} },
      { event: "revision", timestamp: 9000, data: {} },
      { event: "revision", timestamp: 10000, data: {} },
      { event: "revision", timestamp: 11000, data: {} },
    ];

    const score = computeBehavioralScore(signals);
    // baseline 70 + 15 (thoughtful) + 15 (3 * 5, capped) = 100
    expect(score).toBe(100);
  });

  it("clamps score to 0-100", () => {
    // Extremely fast clicking with no other bonuses
    const signals: BehavioralSignal[] = [
      { event: "choice", timestamp: 1000, data: {} },
      { event: "choice", timestamp: 1100, data: {} },
      { event: "choice", timestamp: 1200, data: {} },
    ];

    const score = computeBehavioralScore(signals);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("returns baseline for empty signals", () => {
    const score = computeBehavioralScore([]);
    expect(score).toBe(70);
  });
});

// ---------------------------------------------------------------------------
// 5. Composite weights correctly
// ---------------------------------------------------------------------------

describe("computeCompositeScore", () => {
  it("weights: 60% tenets, 25% role, 15% behavioral", () => {
    const tenets: TenetScores = {
      clientFocused: 80,
      empowering: 80,
      productive: 80,
      balanced: 80,
      reliable: 80,
      improving: 80,
      transparent: 80,
    };

    const result = computeCompositeScore(tenets, 90, 70);
    // 80 * 0.6 + 90 * 0.25 + 70 * 0.15 = 48 + 22.5 + 10.5 = 81
    expect(result).toBe(81);
  });

  it("handles uneven tenet scores by averaging them", () => {
    const tenets: TenetScores = {
      clientFocused: 100,
      empowering: 60,
      productive: 100,
      balanced: 60,
      reliable: 100,
      improving: 60,
      transparent: 100,
    };
    // Avg = (100+60+100+60+100+60+100)/7 = 580/7 ≈ 82.857
    const result = computeCompositeScore(tenets, 90, 70);
    // 82.857 * 0.6 + 90 * 0.25 + 70 * 0.15 ≈ 49.714 + 22.5 + 10.5 ≈ 82.714
    expect(result).toBeCloseTo(82.71, 1);
  });
});

// ---------------------------------------------------------------------------
// mergeScores
// ---------------------------------------------------------------------------

describe("mergeScores", () => {
  it("merges two score sets with given weights", () => {
    const a: TenetScores = {
      clientFocused: 100,
      empowering: 80,
      productive: 60,
      balanced: 40,
      reliable: 20,
      improving: 0,
      transparent: 50,
    };

    const b: TenetScores = {
      clientFocused: 0,
      empowering: 20,
      productive: 40,
      balanced: 60,
      reliable: 80,
      improving: 100,
      transparent: 50,
    };

    const merged = mergeScores(a, b, 0.5, 0.5);

    expect(merged.clientFocused).toBe(50);
    expect(merged.empowering).toBe(50);
    expect(merged.productive).toBe(50);
    expect(merged.balanced).toBe(50);
    expect(merged.reliable).toBe(50);
    expect(merged.improving).toBe(50);
    expect(merged.transparent).toBe(50);
  });

  it("applies uneven weights correctly", () => {
    const a: TenetScores = {
      clientFocused: 100,
      empowering: 100,
      productive: 100,
      balanced: 100,
      reliable: 100,
      improving: 100,
      transparent: 100,
    };

    const b: TenetScores = {
      clientFocused: 0,
      empowering: 0,
      productive: 0,
      balanced: 0,
      reliable: 0,
      improving: 0,
      transparent: 0,
    };

    const merged = mergeScores(a, b, 0.7, 0.3);

    expect(merged.clientFocused).toBe(70);
    expect(merged.empowering).toBe(70);
  });
});
