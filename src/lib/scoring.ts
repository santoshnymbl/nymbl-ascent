import { TENETS } from "@/types";
import type {
  Tenet,
  TenetScores,
  Stage1Result,
  Stage2Result,
  BehavioralSignal,
  ScenarioRubric,
  TriageTowerItem,
  TradeOffPair,
  SignalSortMessage,
  ResourceRouletteCard,
} from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

function emptyScores(): TenetScores {
  return Object.fromEntries(TENETS.map((t) => [t, 0])) as TenetScores;
}

// ---------------------------------------------------------------------------
// Stage 1
// ---------------------------------------------------------------------------

/**
 * @deprecated Use computeStage1ScoresFromRubrics for new games.
 * Kept for backward compatibility — returns empty scores.
 */
export function computeStage1Scores(_data: Stage1Result): TenetScores {
  return emptyScores();
}

// ---------------------------------------------------------------------------
// Stage 1 — Rubric-based scoring for new games
// ---------------------------------------------------------------------------

export function computeStage1ScoresFromRubrics(
  data: Stage1Result,
  rubrics: {
    triageTower?: { items: TriageTowerItem[] };
    tradeOffTiles?: { pairs: TradeOffPair[] };
    signalSort?: { messages: SignalSortMessage[] };
    resourceRoulette?: { cards: ResourceRouletteCard[]; curveballTenet?: Tenet };
  },
): TenetScores {
  const scores = emptyScores();
  const tenetCounts: Record<Tenet, number> = {
    clientFocused: 0,
    empowering: 0,
    productive: 0,
    balanced: 0,
    reliable: 0,
    improving: 0,
    transparent: 0,
  };

  // Triage Tower
  if (data.triageTower && rubrics.triageTower) {
    for (const placement of data.triageTower.placements) {
      const item = rubrics.triageTower.items.find((i) => i.id === placement.itemId);
      if (!item) continue;
      const binScores = item.binScores[placement.bin];
      if (!binScores) continue;
      for (const [tenet, value] of Object.entries(binScores)) {
        scores[tenet as Tenet] += (value || 0) * 10; // normalize 0-10 to 0-100
        tenetCounts[tenet as Tenet]++;
      }
    }
    // Balanced penalty: if all items in one bin, penalize
    const bins = data.triageTower.placements.map((p) => p.bin);
    const uniqueBins = new Set(bins).size;
    if (uniqueBins === 1) {
      scores.balanced = Math.max(0, scores.balanced - 30);
    }
  }

  // Trade-Off Tiles
  if (data.tradeOffTiles && rubrics.tradeOffTiles) {
    const baseScore = 50; // start at midpoint
    for (const round of data.tradeOffTiles.rounds) {
      const pair = rubrics.tradeOffTiles.pairs.find((p) => p.id === round.pairId);
      if (!pair) continue;
      const pos = round.sliderPosition; // -2 to +2
      // Left tenet gets boost when slider is negative, right when positive
      scores[pair.leftTenet] += baseScore + -pos * 12.5; // -2 = +75, 0 = +50, +2 = +25
      tenetCounts[pair.leftTenet]++;
      scores[pair.rightTenet] += baseScore + pos * 12.5; // -2 = +25, 0 = +50, +2 = +75
      tenetCounts[pair.rightTenet]++;
    }
  }

  // Signal Sort
  if (data.signalSort && rubrics.signalSort) {
    for (const cat of data.signalSort.categorizations) {
      const msg = rubrics.signalSort.messages.find((m) => m.id === cat.messageId);
      if (!msg) continue;
      const scoreMap = cat.category === "ideal" ? msg.idealScores : msg.improveScores;
      for (const [tenet, value] of Object.entries(scoreMap)) {
        scores[tenet as Tenet] += (value || 0) * 10;
        tenetCounts[tenet as Tenet]++;
      }
    }
  }

  // Resource Roulette
  if (data.resourceRoulette && rubrics.resourceRoulette) {
    // Score initial allocation
    for (const alloc of data.resourceRoulette.initialAllocation) {
      const card = rubrics.resourceRoulette.cards.find((c) => c.id === alloc.cardId);
      if (!card) continue;
      for (const [tenet, perToken] of Object.entries(card.perTokenScores)) {
        scores[tenet as Tenet] += (perToken || 0) * alloc.tokens * 5; // scale: 0-10 tokens * 0-10 per-token * 5
        tenetCounts[tenet as Tenet]++;
      }
    }
    // Re-allocation delta → Improving score
    if (data.resourceRoulette.reallocation.length > 0) {
      let totalDelta = 0;
      for (const realloc of data.resourceRoulette.reallocation) {
        const initial = data.resourceRoulette.initialAllocation.find(
          (a) => a.cardId === realloc.cardId,
        );
        totalDelta += Math.abs(realloc.tokens - (initial?.tokens || 0));
      }
      // Some re-allocation shows adaptability; too much or zero shows issues
      const adaptScore = totalDelta >= 1 && totalDelta <= 6 ? 80 : totalDelta === 0 ? 30 : 50;
      scores.improving += adaptScore;
      tenetCounts.improving++;
    }
    // Balanced: Gini coefficient of allocation
    const allTokens =
      data.resourceRoulette.reallocation.length > 0
        ? data.resourceRoulette.reallocation.map((a) => a.tokens)
        : data.resourceRoulette.initialAllocation.map((a) => a.tokens);
    const mean = allTokens.reduce((a, b) => a + b, 0) / allTokens.length;
    if (mean > 0) {
      const gini =
        allTokens.reduce((sum, t) => sum + Math.abs(t - mean), 0) / (2 * allTokens.length * mean);
      // Lower gini = more balanced; gini 0 = perfectly even, gini ~0.5 = very uneven
      scores.balanced += clamp((1 - gini * 2) * 100);
      tenetCounts.balanced++;
    }
  }

  // Average by count
  for (const tenet of TENETS) {
    if (tenetCounts[tenet] > 0) {
      scores[tenet] = clamp(scores[tenet] / tenetCounts[tenet]);
    }
  }

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
    // Try full path first, then progressively shorter (reflection beat adds
    // an extra entry that may not be in the rubric)
    const segments = [
      scenario.path[0].nodeId,
      ...scenario.path.map((p) => p.choiceId),
    ];

    let rawScores: Partial<Record<Tenet, number>> | undefined;
    for (let len = segments.length; len >= 2; len--) {
      const key = segments.slice(0, len).join("->");
      rawScores = rubric.pathScores[key];
      if (rawScores) break;
    }
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
  if (signals.length === 0) return 50;
  let score = 70;

  // Existing: decision speed
  const choiceEvents = signals.filter((s) => s.event === "choice_made");
  if (choiceEvents.length >= 2) {
    const gaps: number[] = [];
    for (let i = 1; i < choiceEvents.length; i++) {
      gaps.push(choiceEvents[i].timestamp - choiceEvents[i - 1].timestamp);
    }
    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    if (avgGap < 1000) score -= 30;
    else if (avgGap < 2000) score -= 10;
    else if (avgGap <= 10000) score += 15;
    else if (avgGap > 30000) score -= 5;
  }

  // Existing: revision bonus
  const revisions = signals.filter((s) => s.event === "revision");
  score += Math.min(revisions.length, 3) * 5;

  // NEW: slider center bias
  const centerBias = signals.find((s) => s.event === "slider_center_bias");
  if (centerBias && (centerBias.data as Record<string, unknown>).flagged) {
    score -= 10;
  }

  // NEW: position bias
  const posBias = signals.find((s) => s.event === "position_bias");
  if (posBias && ((posBias.data as Record<string, unknown>).sd as number || 1) < 0.3) {
    score -= 15;
  }

  // NEW: all-one-category in signal sort
  const sortBias = signals.find((s) => s.event === "sort_bias");
  if (sortBias && (sortBias.data as Record<string, unknown>).flagged) {
    score -= 15;
  }

  // NEW: cross-stage consistency bonus
  const consistency = signals.find((s) => s.event === "cross_stage_consistency");
  if (consistency && ((consistency.data as Record<string, unknown>).correlation as number || 0) > 0.5) {
    score += 10;
  }

  // NEW: profile uniformity flag (not a penalty, just flag for admin review)
  // const uniformity = signals.find((s) => s.event === "profile_uniformity");
  // Intentionally no score adjustment — flagged for admin review only

  return clamp(score);
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
