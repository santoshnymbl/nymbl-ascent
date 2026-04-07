import {
  computeStage1Scores,
  computeStage1ScoresFromRubrics,
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
  TriageTowerItem,
  TradeOffPair,
  SignalSortMessage,
  ResourceRouletteCard,
} from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEmptyStage1(): Stage1Result {
  return {
    triageTower: {
      placements: [],
      interruptBump: null,
      timeMs: 5000,
      revisions: 0,
    },
    tradeOffTiles: {
      rounds: [],
      timeMs: 5000,
    },
    signalSort: {
      categorizations: [],
      timeMs: 5000,
      dragSequence: [],
    },
    resourceRoulette: {
      initialAllocation: [],
      curveball: "",
      reallocation: [],
      timeMs: 5000,
      reallocationTimeMs: 0,
    },
    signals: [],
  };
}

// ---------------------------------------------------------------------------
// 1. computeStage1Scores (deprecated — returns empty scores)
// ---------------------------------------------------------------------------

describe("computeStage1Scores (deprecated)", () => {
  it("returns empty scores for backward compatibility", () => {
    const scores = computeStage1Scores(makeEmptyStage1());
    expect(scores.productive).toBe(0);
    expect(scores.balanced).toBe(0);
    expect(scores.clientFocused).toBe(0);
    expect(scores.transparent).toBe(0);
    expect(scores.reliable).toBe(0);
    expect(scores.improving).toBe(0);
    expect(scores.empowering).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 2. computeStage1ScoresFromRubrics — Triage Tower
// ---------------------------------------------------------------------------

describe("computeStage1ScoresFromRubrics", () => {
  const triageTowerItems: TriageTowerItem[] = [
    {
      id: "item-1",
      label: "Client escalation",
      description: "A client has a critical bug",
      binScores: {
        doNow: { clientFocused: 9, reliable: 7 },
        doNext: { clientFocused: 5, reliable: 5 },
        delegate: { clientFocused: 3, empowering: 6 },
      },
    },
    {
      id: "item-2",
      label: "Team training",
      description: "Prepare training materials",
      binScores: {
        doNow: { empowering: 5, productive: 3 },
        doNext: { empowering: 7, productive: 6 },
        delegate: { empowering: 8, productive: 7 },
      },
    },
    {
      id: "item-3",
      label: "Process docs",
      description: "Update internal docs",
      binScores: {
        doNow: { transparent: 4, improving: 3 },
        doNext: { transparent: 7, improving: 6 },
        delegate: { transparent: 8, improving: 7 },
      },
    },
  ];

  it("scores triage tower placements using rubric", () => {
    const data: Stage1Result = {
      ...makeEmptyStage1(),
      triageTower: {
        placements: [
          { itemId: "item-1", bin: "doNow" },
          { itemId: "item-2", bin: "doNext" },
          { itemId: "item-3", bin: "delegate" },
        ],
        interruptBump: null,
        timeMs: 8000,
        revisions: 1,
      },
    };

    const scores = computeStage1ScoresFromRubrics(data, {
      triageTower: { items: triageTowerItems },
    });

    // item-1 doNow: clientFocused += 9*10=90, reliable += 7*10=70
    // item-2 doNext: empowering += 7*10=70, productive += 6*10=60
    // item-3 delegate: transparent += 8*10=80, improving += 7*10=70
    // Each tenet has count=1, so average = raw score
    expect(scores.clientFocused).toBe(90);
    expect(scores.reliable).toBe(70);
    expect(scores.empowering).toBe(70);
    expect(scores.productive).toBe(60);
    expect(scores.transparent).toBe(80);
    expect(scores.improving).toBe(70);
  });

  it("penalizes balanced when all items in one bin", () => {
    const data: Stage1Result = {
      ...makeEmptyStage1(),
      triageTower: {
        placements: [
          { itemId: "item-1", bin: "doNow" },
          { itemId: "item-2", bin: "doNow" },
          { itemId: "item-3", bin: "doNow" },
        ],
        interruptBump: null,
        timeMs: 5000,
        revisions: 0,
      },
    };

    const scores = computeStage1ScoresFromRubrics(data, {
      triageTower: { items: triageTowerItems },
    });

    // All in doNow → balanced gets -30 penalty
    // balanced starts at 0 (no balanced scores from doNow bins) → max(0, 0-30) = 0
    expect(scores.balanced).toBe(0);
  });

  // -------------------------------------------------------------------------
  // Trade-Off Tiles
  // -------------------------------------------------------------------------

  const tradeOffPairs: TradeOffPair[] = [
    {
      id: "pair-1",
      leftText: "Always prioritize client requests",
      leftTenet: "clientFocused",
      rightText: "Empower the team to decide",
      rightTenet: "empowering",
    },
    {
      id: "pair-2",
      leftText: "Move fast on deliverables",
      leftTenet: "productive",
      rightText: "Ensure thorough documentation",
      rightTenet: "transparent",
    },
  ];

  it("scores trade-off tiles with slider positions", () => {
    const data: Stage1Result = {
      ...makeEmptyStage1(),
      tradeOffTiles: {
        rounds: [
          { pairId: "pair-1", sliderPosition: -2, timeMs: 3000 }, // strongly favor left (clientFocused)
          { pairId: "pair-2", sliderPosition: 2, timeMs: 4000 }, // strongly favor right (transparent)
        ],
        timeMs: 7000,
      },
    };

    const scores = computeStage1ScoresFromRubrics(data, {
      tradeOffTiles: { pairs: tradeOffPairs },
    });

    // pair-1, pos=-2: clientFocused += 50 + 2*12.5 = 75, empowering += 50 + (-2)*12.5 = 25
    // pair-2, pos=+2: productive += 50 + (-2)*12.5 = 25, transparent += 50 + 2*12.5 = 75
    // Each tenet has count=1
    expect(scores.clientFocused).toBe(75);
    expect(scores.empowering).toBe(25);
    expect(scores.productive).toBe(25);
    expect(scores.transparent).toBe(75);
  });

  it("scores neutral slider positions at midpoint", () => {
    const data: Stage1Result = {
      ...makeEmptyStage1(),
      tradeOffTiles: {
        rounds: [
          { pairId: "pair-1", sliderPosition: 0, timeMs: 5000 },
        ],
        timeMs: 5000,
      },
    };

    const scores = computeStage1ScoresFromRubrics(data, {
      tradeOffTiles: { pairs: tradeOffPairs },
    });

    // pos=0: both tenets get 50
    expect(scores.clientFocused).toBe(50);
    expect(scores.empowering).toBe(50);
  });

  // -------------------------------------------------------------------------
  // Signal Sort
  // -------------------------------------------------------------------------

  it("scores signal sort categorizations", () => {
    const messages: SignalSortMessage[] = [
      {
        id: "msg-1",
        author: "Alice",
        avatar: "/a.png",
        text: "Great client feedback loop",
        idealScores: { clientFocused: 8, transparent: 6 },
        improveScores: { clientFocused: 3, transparent: 2 },
      },
    ];

    const data: Stage1Result = {
      ...makeEmptyStage1(),
      signalSort: {
        categorizations: [{ messageId: "msg-1", category: "ideal" }],
        timeMs: 4000,
        dragSequence: ["msg-1"],
      },
    };

    const scores = computeStage1ScoresFromRubrics(data, {
      signalSort: { messages },
    });

    // msg-1 ideal: clientFocused += 8*10=80, transparent += 6*10=60
    expect(scores.clientFocused).toBe(80);
    expect(scores.transparent).toBe(60);
  });

  // -------------------------------------------------------------------------
  // Resource Roulette
  // -------------------------------------------------------------------------

  it("scores resource roulette token allocation", () => {
    const cards: ResourceRouletteCard[] = [
      {
        id: "card-1",
        title: "Client Support",
        description: "Invest in support",
        icon: "phone",
        perTokenScores: { clientFocused: 2 },
      },
      {
        id: "card-2",
        title: "Team Development",
        description: "Invest in team",
        icon: "users",
        perTokenScores: { empowering: 2 },
      },
    ];

    const data: Stage1Result = {
      ...makeEmptyStage1(),
      resourceRoulette: {
        initialAllocation: [
          { cardId: "card-1", tokens: 6 },
          { cardId: "card-2", tokens: 4 },
        ],
        curveball: "budget-cut",
        reallocation: [
          { cardId: "card-1", tokens: 5 },
          { cardId: "card-2", tokens: 5 },
        ],
        timeMs: 10000,
        reallocationTimeMs: 5000,
      },
    };

    const scores = computeStage1ScoresFromRubrics(data, {
      resourceRoulette: { cards },
    });

    // initial: card-1 → clientFocused += 2 * 6 * 5 = 60, card-2 → empowering += 2 * 4 * 5 = 40
    // reallocation delta: |5-6| + |5-4| = 2 → adaptScore = 80 (between 1 and 6)
    // improving = 80 / 1 count = 80
    expect(scores.improving).toBe(80);

    // Gini on reallocation [5, 5]: mean=5, gini=0 → balanced += clamp((1-0)*100) = 100
    // balanced = 100 / 1 count = 100
    expect(scores.balanced).toBe(100);

    // clientFocused = 60 / 1 = 60
    expect(scores.clientFocused).toBe(60);
    // empowering = 40 / 1 = 40
    expect(scores.empowering).toBe(40);
  });

  it("gives lower improving score when no reallocation changes", () => {
    const cards: ResourceRouletteCard[] = [
      {
        id: "card-1",
        title: "Client Support",
        description: "Invest in support",
        icon: "phone",
        perTokenScores: { clientFocused: 2 },
      },
    ];

    const data: Stage1Result = {
      ...makeEmptyStage1(),
      resourceRoulette: {
        initialAllocation: [{ cardId: "card-1", tokens: 5 }],
        curveball: "budget-cut",
        reallocation: [{ cardId: "card-1", tokens: 5 }], // no change
        timeMs: 10000,
        reallocationTimeMs: 5000,
      },
    };

    const scores = computeStage1ScoresFromRubrics(data, {
      resourceRoulette: { cards },
    });

    // totalDelta = 0 → adaptScore = 30
    expect(scores.improving).toBe(30);
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

    const { scores, measured } = computeStage2Scores(stage2, rubrics);

    // Normalized 0-10 to 0-100
    expect(scores.clientFocused).toBe(80);
    expect(scores.empowering).toBe(60);
    expect(scores.productive).toBe(70);
    expect(scores.balanced).toBe(50);
    expect(scores.reliable).toBe(90);
    expect(scores.improving).toBe(40);
    expect(scores.transparent).toBe(70);
    // All 7 tenets were measured by this path
    expect(measured.size).toBe(7);
  });

  it("averages scores across multiple scenarios, per-tenet counts", () => {
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
          // Only clientFocused is measured here (empowering absent, not zero)
          "root->a": { clientFocused: 10 },
        },
      },
      {
        scenarioId: "s2",
        pathScores: {
          // Only empowering is measured here (clientFocused absent, not zero)
          "root->b": { empowering: 10 },
        },
      },
    ];

    const { scores, measured } = computeStage2Scores(stage2, rubrics);

    // Each tenet measured exactly once → its own average, not diluted by 0
    expect(scores.clientFocused).toBe(100);
    expect(scores.empowering).toBe(100);
    expect(measured.has("clientFocused")).toBe(true);
    expect(measured.has("empowering")).toBe(true);
    // Unmeasured tenets are NOT in the measured set
    expect(measured.has("productive")).toBe(false);
    expect(measured.has("reliable")).toBe(false);
    expect(scores.productive).toBe(0);
    expect(scores.reliable).toBe(0);
  });

  it("leaves tenets out of measured set when rubric omits them", () => {
    // This is the regression test for the zero-normalization bug:
    // previously, omitted tenets were treated as `0 * 10 = 0` and averaged
    // in, dragging composites down. Now they must be flagged as "not
    // measured" so the caller can fall back to Stage 1 for those tenets.
    const stage2: Stage2Result = {
      scenarios: [
        {
          scenarioId: "s1",
          path: [{ nodeId: "root", choiceId: "a", timeMs: 3000 }],
        },
      ],
      signals: [],
    };

    const rubrics: ScenarioRubric[] = [
      {
        scenarioId: "s1",
        pathScores: {
          "root->a": { transparent: 9, balanced: 7 },
        },
      },
    ];

    const { scores, measured } = computeStage2Scores(stage2, rubrics);

    expect(measured.size).toBe(2);
    expect(measured.has("transparent")).toBe(true);
    expect(measured.has("balanced")).toBe(true);
    expect(scores.transparent).toBe(90);
    expect(scores.balanced).toBe(70);
    // Unmeasured tenets are absent from `measured`, and their scores
    // default to 0 — but the caller MUST use `measured` to know that
    // "0" here means "not measured" and fall back accordingly.
    expect(measured.has("clientFocused")).toBe(false);
    expect(measured.has("empowering")).toBe(false);
    expect(measured.has("productive")).toBe(false);
    expect(measured.has("reliable")).toBe(false);
    expect(measured.has("improving")).toBe(false);
  });

  it("returns empty measured set when no rubrics match", () => {
    const stage2: Stage2Result = {
      scenarios: [
        {
          scenarioId: "nonexistent",
          path: [{ nodeId: "root", choiceId: "a", timeMs: 3000 }],
        },
      ],
      signals: [],
    };

    const { measured } = computeStage2Scores(stage2, []);
    expect(measured.size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 4. Behavioral scoring
// ---------------------------------------------------------------------------

describe("computeBehavioralScore", () => {
  it("returns 50 for empty signals", () => {
    const score = computeBehavioralScore([]);
    expect(score).toBe(50);
  });

  it("penalizes very fast clicking (avg gap < 1s)", () => {
    const signals: BehavioralSignal[] = [
      { event: "choice_made", timestamp: 1000, data: {} },
      { event: "choice_made", timestamp: 1500, data: {} },
      { event: "choice_made", timestamp: 2000, data: {} },
      { event: "choice_made", timestamp: 2300, data: {} },
    ];

    const score = computeBehavioralScore(signals);
    // baseline 70 - 30 = 40
    expect(score).toBe(40);
  });

  it("penalizes moderately fast clicking (avg gap < 2s)", () => {
    const signals: BehavioralSignal[] = [
      { event: "choice_made", timestamp: 1000, data: {} },
      { event: "choice_made", timestamp: 2500, data: {} },
      { event: "choice_made", timestamp: 4000, data: {} },
    ];

    const score = computeBehavioralScore(signals);
    // baseline 70 - 10 = 60
    expect(score).toBe(60);
  });

  it("gives bonus for thoughtful pace (2-10s avg gap)", () => {
    const signals: BehavioralSignal[] = [
      { event: "choice_made", timestamp: 1000, data: {} },
      { event: "choice_made", timestamp: 6000, data: {} },
      { event: "choice_made", timestamp: 11000, data: {} },
    ];

    const score = computeBehavioralScore(signals);
    // baseline 70 + 15 = 85
    expect(score).toBe(85);
  });

  it("penalizes very slow (avg gap > 30s)", () => {
    const signals: BehavioralSignal[] = [
      { event: "choice_made", timestamp: 1000, data: {} },
      { event: "choice_made", timestamp: 40000, data: {} },
      { event: "choice_made", timestamp: 80000, data: {} },
    ];

    const score = computeBehavioralScore(signals);
    // baseline 70 - 5 = 65
    expect(score).toBe(65);
  });

  it("gives bonus for revisions (up to 3, +5 each)", () => {
    const signals: BehavioralSignal[] = [
      { event: "choice_made", timestamp: 1000, data: {} },
      { event: "choice_made", timestamp: 6000, data: {} },
      { event: "revision", timestamp: 7000, data: {} },
      { event: "revision", timestamp: 8000, data: {} },
    ];

    const score = computeBehavioralScore(signals);
    // baseline 70 + 15 (thoughtful) + 10 (2 revisions * 5) = 95
    expect(score).toBe(95);
  });

  it("caps revision bonus at 3", () => {
    const signals: BehavioralSignal[] = [
      { event: "choice_made", timestamp: 1000, data: {} },
      { event: "choice_made", timestamp: 6000, data: {} },
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
      { event: "choice_made", timestamp: 1000, data: {} },
      { event: "choice_made", timestamp: 1100, data: {} },
      { event: "choice_made", timestamp: 1200, data: {} },
    ];

    const score = computeBehavioralScore(signals);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  // -------------------------------------------------------------------------
  // New behavioral signal types
  // -------------------------------------------------------------------------

  it("penalizes slider center bias", () => {
    const signals: BehavioralSignal[] = [
      { event: "slider_center_bias", timestamp: 5000, data: { flagged: true } },
    ];

    const score = computeBehavioralScore(signals);
    // baseline 70 - 10 = 60
    expect(score).toBe(60);
  });

  it("does not penalize slider center bias when not flagged", () => {
    const signals: BehavioralSignal[] = [
      { event: "slider_center_bias", timestamp: 5000, data: { flagged: false } },
    ];

    const score = computeBehavioralScore(signals);
    expect(score).toBe(70);
  });

  it("penalizes position bias with low SD", () => {
    const signals: BehavioralSignal[] = [
      { event: "position_bias", timestamp: 5000, data: { sd: 0.1 } },
    ];

    const score = computeBehavioralScore(signals);
    // baseline 70 - 15 = 55
    expect(score).toBe(55);
  });

  it("does not penalize position bias with normal SD", () => {
    const signals: BehavioralSignal[] = [
      { event: "position_bias", timestamp: 5000, data: { sd: 0.8 } },
    ];

    const score = computeBehavioralScore(signals);
    expect(score).toBe(70);
  });

  it("penalizes sort bias", () => {
    const signals: BehavioralSignal[] = [
      { event: "sort_bias", timestamp: 5000, data: { flagged: true } },
    ];

    const score = computeBehavioralScore(signals);
    // baseline 70 - 15 = 55
    expect(score).toBe(55);
  });

  it("gives cross-stage consistency bonus", () => {
    const signals: BehavioralSignal[] = [
      { event: "cross_stage_consistency", timestamp: 5000, data: { correlation: 0.7 } },
    ];

    const score = computeBehavioralScore(signals);
    // baseline 70 + 10 = 80
    expect(score).toBe(80);
  });

  it("does not give consistency bonus for low correlation", () => {
    const signals: BehavioralSignal[] = [
      { event: "cross_stage_consistency", timestamp: 5000, data: { correlation: 0.3 } },
    ];

    const score = computeBehavioralScore(signals);
    expect(score).toBe(70);
  });

  it("combines multiple new signal types", () => {
    const signals: BehavioralSignal[] = [
      { event: "slider_center_bias", timestamp: 1000, data: { flagged: true } },
      { event: "sort_bias", timestamp: 2000, data: { flagged: true } },
      { event: "cross_stage_consistency", timestamp: 3000, data: { correlation: 0.8 } },
    ];

    const score = computeBehavioralScore(signals);
    // baseline 70 - 10 (center bias) - 15 (sort bias) + 10 (consistency) = 55
    expect(score).toBe(55);
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
