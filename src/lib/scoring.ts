import { TENETS } from "@/types";
import type {
  TenetScores,
  Stage1Result,
  Stage2Result,
  BehavioralSignal,
  ScenarioRubric,
} from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const IDEAL_PRIORITY_ORDER = [
  "client-issue",
  "team-blocker",
  "own-deadline",
  "nice-to-have",
  "admin-task",
];

/** Kendall tau distance: count pairwise inversions between two orderings. */
function kendallTauDistance(a: string[], b: string[]): number {
  const indexMap = new Map(b.map((item, i) => [item, i]));
  let inversions = 0;
  for (let i = 0; i < a.length; i++) {
    for (let j = i + 1; j < a.length; j++) {
      const ai = indexMap.get(a[i]) ?? i;
      const aj = indexMap.get(a[j]) ?? j;
      if (ai > aj) inversions++;
    }
  }
  return inversions;
}

/** Max possible inversions for n items = n*(n-1)/2 */
function maxInversions(n: number): number {
  return (n * (n - 1)) / 2;
}

/**
 * Time bonus: faster = higher bonus.
 * 0-10s → +10, 10-20s → +5, 20-30s → +2, >30s → 0
 */
function timeBonus(timeMs: number): number {
  const secs = timeMs / 1000;
  if (secs <= 10) return 10;
  if (secs <= 20) return 5;
  if (secs <= 30) return 2;
  return 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function emptyScores(): TenetScores {
  return Object.fromEntries(TENETS.map((t) => [t, 0])) as TenetScores;
}

// ---------------------------------------------------------------------------
// Stage 1
// ---------------------------------------------------------------------------

export function computeStage1Scores(data: Stage1Result): TenetScores {
  const scores = emptyScores();

  // Priority Snap → Productive, Balanced
  const { order, timeMs: psTime } = data.prioritySnap;
  const dist = kendallTauDistance(order, IDEAL_PRIORITY_ORDER);
  const maxDist = maxInversions(IDEAL_PRIORITY_ORDER.length);
  const psBase = ((maxDist - dist) / maxDist) * 90 + timeBonus(psTime);
  scores.productive = clamp(psBase, 0, 100);
  scores.balanced = clamp(psBase, 0, 100);

  // Value Match → Client Focused, Transparent
  const { matches, timeMs: vmTime } = data.valueMatch;
  const vmCorrect = matches.filter((m) => m.correct).length;
  const vmPct = matches.length > 0 ? vmCorrect / matches.length : 0;
  const vmBase = vmPct * 90 + timeBonus(vmTime);
  scores.clientFocused = clamp(vmBase, 0, 100);
  scores.transparent = clamp(vmBase, 0, 100);

  // Odd One Out → Reliable, Improving
  const { picks, timeMs: oooTime } = data.oddOneOut;
  const oooCorrect = picks.filter((p) => p.correct).length;
  const oooPct = picks.length > 0 ? oooCorrect / picks.length : 0;
  const oooBase = oooPct * 90 + timeBonus(oooTime);
  scores.reliable = clamp(oooBase, 0, 100);
  scores.improving = clamp(oooBase, 0, 100);

  return scores;
}

// ---------------------------------------------------------------------------
// Stage 2
// ---------------------------------------------------------------------------

export function computeStage2Scores(
  data: Stage2Result,
  scenarioRubrics: ScenarioRubric[],
): TenetScores {
  const rubricMap = new Map(scenarioRubrics.map((r) => [r.scenarioId, r]));
  const allScenarioScores: TenetScores[] = [];

  for (const scenario of data.scenarios) {
    const rubric = rubricMap.get(scenario.scenarioId);
    if (!rubric) continue;

    // Build path key: "root->d->d1" (first node id + all choice ids)
    const pathKey = [
      scenario.path[0].nodeId,
      ...scenario.path.map((p) => p.choiceId),
    ].join("->");

    const rawScores = rubric.pathScores[pathKey];
    if (!rawScores) continue;

    // Normalize 0-10 to 0-100
    const normalized = emptyScores();
    for (const tenet of TENETS) {
      normalized[tenet] = (rawScores[tenet] ?? 0) * 10;
    }
    allScenarioScores.push(normalized);
  }

  if (allScenarioScores.length === 0) return emptyScores();

  // Average across all scenarios
  const result = emptyScores();
  for (const tenet of TENETS) {
    const sum = allScenarioScores.reduce((acc, s) => acc + s[tenet], 0);
    result[tenet] = sum / allScenarioScores.length;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Behavioral Score
// ---------------------------------------------------------------------------

export function computeBehavioralScore(signals: BehavioralSignal[]): number {
  let score = 70;

  // Compute avg gap between choice events
  const choiceSignals = signals.filter((s) => s.event === "choice");
  if (choiceSignals.length >= 2) {
    const sorted = [...choiceSignals].sort((a, b) => a.timestamp - b.timestamp);
    let totalGap = 0;
    for (let i = 1; i < sorted.length; i++) {
      totalGap += sorted[i].timestamp - sorted[i - 1].timestamp;
    }
    const avgGapMs = totalGap / (sorted.length - 1);
    const avgGapSec = avgGapMs / 1000;

    if (avgGapSec < 1) {
      score -= 30;
    } else if (avgGapSec < 2) {
      score -= 10;
    } else if (avgGapSec <= 10) {
      score += 15;
    } else if (avgGapSec > 30) {
      score -= 5;
    }
    // 10-30s: neutral, no adjustment
  }

  // Revision bonus
  const revisionCount = signals.filter((s) => s.event === "revision").length;
  const cappedRevisions = Math.min(revisionCount, 3);
  score += cappedRevisions * 5;

  return clamp(score, 0, 100);
}

// ---------------------------------------------------------------------------
// Composite Score
// ---------------------------------------------------------------------------

export function computeCompositeScore(
  tenets: TenetScores,
  roleFitScore: number,
  behavioralScore: number,
): number {
  const tenetValues = TENETS.map((t) => tenets[t]);
  const tenetAvg = tenetValues.reduce((a, b) => a + b, 0) / tenetValues.length;

  return tenetAvg * 0.6 + roleFitScore * 0.25 + behavioralScore * 0.15;
}

// ---------------------------------------------------------------------------
// Merge Scores
// ---------------------------------------------------------------------------

export function mergeScores(
  a: TenetScores,
  b: TenetScores,
  weightA: number,
  weightB: number,
): TenetScores {
  const result = emptyScores();
  for (const tenet of TENETS) {
    result[tenet] = a[tenet] * weightA + b[tenet] * weightB;
  }
  return result;
}
