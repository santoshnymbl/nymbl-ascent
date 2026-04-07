/**
 * Runs scoring for a completed assessment.
 * Extracted from /api/scoring/route.ts so it can be called directly
 * (avoids broken fire-and-forget HTTP fetch on Vercel serverless).
 */

import { prisma } from "@/lib/db";
import {
  computeStage1ScoresFromRubrics,
  computeStage2Scores,
  computeBehavioralScore,
  computeCompositeScore,
  mergeScores,
} from "@/lib/scoring";
import type { Stage2ScoreResult } from "@/lib/scoring";
import { scoreWithAi } from "@/lib/ai-scoring";
import {
  sendEmail,
  buildCompletionEmail,
  buildResultsReadyEmail,
} from "@/lib/email";
import type {
  Stage1Result,
  Stage2Result,
  Stage3Result,
  ScenarioRubric,
  TenetScores,
  Tenet,
} from "@/types";
import { TENETS } from "@/types";

/**
 * Per-tenet merge of Stage 1 and Stage 2 scores.
 *
 * For each tenet, if Stage 2 actually measured it (via a matched path
 * rubric that included that tenet), we blend Stage 1 and Stage 2 at the
 * given weights. If Stage 2 did NOT measure it, we use 100% Stage 1 —
 * otherwise the old code would silently pull the tenet toward 0.
 */
function mergeStage1AndStage2(
  s1: TenetScores,
  s2: Stage2ScoreResult,
  s1Weight: number,
  s2Weight: number,
): TenetScores {
  const out = {} as TenetScores;
  for (const t of TENETS) {
    out[t] = s2.measured.has(t)
      ? s1[t] * s1Weight + s2.scores[t] * s2Weight
      : s1[t];
  }
  return out;
}

function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n === 0) return 0;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  let num = 0,
    denX = 0,
    denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : num / den;
}

export async function runScoring(candidateId: string): Promise<{
  ok: boolean;
  compositeScore?: number;
  error?: string;
}> {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: { assessment: true, role: true },
  });

  if (!candidate?.assessment) {
    return { ok: false, error: "Assessment not found" };
  }

  const assessment = candidate.assessment;
  const stage1: Stage1Result | null = assessment.stage1Data
    ? JSON.parse(assessment.stage1Data)
    : null;
  const stage2: Stage2Result | null = assessment.stage2Data
    ? JSON.parse(assessment.stage2Data)
    : null;
  const stage3: Stage3Result | null = assessment.stage3Data
    ? JSON.parse(assessment.stage3Data)
    : null;

  // Stage 1 — rubric-based
  let stage1Scores = null;
  if (stage1) {
    const stage1Scenarios = await prisma.scenario.findMany({
      where: { stage: 1, type: "core" },
    });
    const rubrics: Record<string, unknown> = {};
    for (const s of stage1Scenarios) {
      const tree = JSON.parse(s.tree);
      if (tree.type === "triage-tower") rubrics.triageTower = { items: tree.items };
      else if (tree.type === "trade-off-tiles") rubrics.tradeOffTiles = { pairs: tree.pairs };
      else if (tree.type === "signal-sort") rubrics.signalSort = { messages: tree.messages };
      else if (tree.type === "resource-roulette") rubrics.resourceRoulette = { cards: tree.cards };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stage1Scores = computeStage1ScoresFromRubrics(stage1, rubrics as any);
  }

  // Stage 2 — branching scenarios
  let stage2Result: Stage2ScoreResult | null = null;
  if (stage2) {
    const scenarioIds = stage2.scenarios.map((s) => s.scenarioId);
    const scenarios = await prisma.scenario.findMany({
      where: { id: { in: scenarioIds } },
    });
    const rubrics: ScenarioRubric[] = scenarios.map((s) => {
      // Rubrics are stored as either { pathScores: {...} } (canonical) or
      // { "root->...": {...}, ... } (legacy/flat). Unwrap if needed.
      const parsed = JSON.parse(s.scoringRubric);
      const pathScores =
        parsed && typeof parsed === "object" && "pathScores" in parsed
          ? parsed.pathScores
          : parsed;
      return { scenarioId: s.id, pathScores };
    });
    stage2Result = computeStage2Scores(stage2, rubrics);
  }

  // AI qualitative scoring
  let aiResult: { tenets: TenetScores; analysis: string } | null = null;
  if (stage2) {
    try {
      const scenarios = await prisma.scenario.findMany({
        where: { id: { in: stage2.scenarios.map((s) => s.scenarioId) } },
      });
      const decisionPaths = stage2.scenarios.map((played) => {
        const scenario = scenarios.find((s) => s.id === played.scenarioId);
        const tree = scenario ? JSON.parse(scenario.tree) : null;
        const choices = played.path.map((p) => {
          if (!tree?.nodes?.[p.nodeId]) return p.choiceId;
          const node = tree.nodes[p.nodeId];
          const option = node.options?.find(
            (o: { id: string }) => o.id === p.choiceId,
          );
          return option?.text || p.choiceId;
        });
        return { scenarioTitle: scenario?.title || "Unknown", choices };
      });
      aiResult = await scoreWithAi({
        candidateName: candidate.name,
        roleName: candidate.role.name,
        decisionPaths,
      });
    } catch (aiErr) {
      console.error("AI scoring failed (continuing with rule-based):", aiErr);
    }
  }

  // Merge tenet scores
  const emptyTenets = Object.fromEntries(TENETS.map((t) => [t, 50])) as TenetScores;
  let finalTenets: TenetScores = emptyTenets;
  if (stage1Scores && stage2Result) {
    // Per-tenet merge: unmeasured Stage 2 tenets fall back to 100% Stage 1
    finalTenets = mergeStage1AndStage2(stage1Scores, stage2Result, 0.4, 0.6);
  } else if (stage1Scores) {
    finalTenets = stage1Scores;
  } else if (stage2Result) {
    // No Stage 1 data — use Stage 2 alone, leaving unmeasured tenets at 0.
    // (Unusual edge case: candidate skipped Stage 1 entirely.)
    finalTenets = stage2Result.scores;
  }
  if (aiResult) {
    // AI qualitative pass — dropped from 40% → 20% so the LLM's positivity
    // bias can't dominate the real behavioral signal from Stage 1/2.
    finalTenets = mergeScores(finalTenets, aiResult.tenets, 0.8, 0.2);
  }

  // Behavioral
  const allSignals = [
    ...(stage1?.signals || []),
    ...(stage2?.signals || []),
    ...(stage3?.signals || []),
  ];
  if (stage1Scores && stage2Result && stage2Result.measured.size >= 2) {
    // Correlate only over tenets Stage 2 actually measured. Including
    // unmeasured (zero) tenets would drag the correlation toward 0 and
    // falsely flag consistent candidates as inconsistent.
    const measuredTenets: Tenet[] = Array.from(stage2Result.measured);
    const s1Values = measuredTenets.map((t) => stage1Scores![t]);
    const s2Values = measuredTenets.map((t) => stage2Result!.scores[t]);
    const correlation = pearsonCorrelation(s1Values, s2Values);
    allSignals.push({
      event: "cross_stage_consistency",
      timestamp: Date.now(),
      data: { correlation, measuredCount: measuredTenets.length },
    });
  }
  const behavioralScore = computeBehavioralScore(allSignals);

  // Stage 3 role fit
  let roleFitScore = 50;
  let stage3Detail: {
    challengeType: string;
    matched: boolean;
    matchedKey?: string;
    pathTenets?: Record<string, number>;
    rawAvg?: number;
    timeBonus?: number;
    timeMs?: number;
  } | null = null;
  if (stage3) {
    const s3 = stage3 as {
      challengeType: string;
      responses: Record<string, unknown>;
      timeMs: number;
      skipped?: boolean;
    };

    stage3Detail = { challengeType: s3.challengeType, matched: false, timeMs: s3.timeMs };
    if (s3.skipped) {
      // No Stage 3 attached for this role — neutral score
      roleFitScore = 50;
    } else if (s3.challengeType === "debug" || s3.challengeType === "debug-challenge") {
      // Candidate side saves { answer, followUp } (see stage3/page.tsx handleFollowUpSubmit)
      const resp = s3.responses as { answer?: string; followUp?: string };
      roleFitScore =
        (resp.answer === "off-by-one" ? 60 : 20) +
        (resp.followUp === "trace-manually"
          ? 30
          : resp.followUp === "read-error-msg"
            ? 25
            : 20) +
        (s3.timeMs < 180000 ? 10 : 5);
      roleFitScore = Math.min(100, roleFitScore);
      stage3Detail = {
        challengeType: "debug",
        matched: true,
        timeMs: s3.timeMs,
      };
    } else if (s3.challengeType === "branching") {
      // Score branching Stage 3 by matching candidate's path against the
      // scenario's rubric — same approach as Stage 2.
      const path = (s3.responses?.path as
        | { nodeId: string; choiceId: string }[]
        | undefined) || [];

      if (path.length === 0) {
        roleFitScore = 50;
      } else {
        // Find the Stage 3 scenario(s) attached to this candidate's role.
        // Mirrors how /api/assess/scenarios picks the scenario at runtime.
        const roleStage3 = await prisma.roleScenario.findMany({
          where: {
            roleId: candidate.roleId,
            scenario: { stage: 3, isPublished: true },
          },
          include: { scenario: true },
        });

        // Match the path against any attached scenario's rubric (try each
        // until we find one that matches — handles the case where rubric
        // path keys vary slightly).
        let matched = false;
        let matchedKey = "";
        const matchedTenets: Record<string, number> = {};
        let pathTenetSum = 0;
        let pathTenetCount = 0;

        for (const rs of roleStage3) {
          const rawRubric = JSON.parse(rs.scenario.scoringRubric);
          const pathScores: Record<string, Partial<Record<string, number>>> =
            rawRubric && typeof rawRubric === "object" && "pathScores" in rawRubric
              ? rawRubric.pathScores
              : rawRubric;

          // Build progressive path key (root -> c1 -> c2)
          const segments = [
            path[0].nodeId,
            ...path.map((p) => p.choiceId),
          ];
          for (let len = segments.length; len >= 2; len--) {
            const key = segments.slice(0, len).join("->");
            const scores = pathScores[key];
            if (scores) {
              matchedKey = key;
              for (const [k, v] of Object.entries(scores)) {
                if (typeof v === "number") {
                  matchedTenets[k] = v;
                  pathTenetSum += v;
                  pathTenetCount++;
                }
              }
              matched = true;
              break;
            }
          }
          if (matched) break;
        }

        if (matched && pathTenetCount > 0) {
          // Tenet scores in rubrics are 0-10 → multiply by 10 to get 0-100
          const avg = pathTenetSum / pathTenetCount;
          // Bonus for completing under 4 minutes
          const timeBonus = s3.timeMs < 240000 ? 10 : 0;
          roleFitScore = Math.min(100, Math.round(avg * 10 + timeBonus));
          stage3Detail = {
            challengeType: "branching",
            matched: true,
            matchedKey,
            pathTenets: matchedTenets,
            rawAvg: avg,
            timeBonus,
            timeMs: s3.timeMs,
          };
        } else {
          // Path didn't match any rubric — log and fall back
          console.warn(
            `Stage 3 path did not match any rubric for candidate ${candidate.id}`,
          );
          roleFitScore = 50;
        }
      }
    }
  }

  const compositeScore = computeCompositeScore(finalTenets, roleFitScore, behavioralScore);

  // Persist
  await prisma.score.upsert({
    where: { assessmentId: assessment.id },
    create: {
      assessmentId: assessment.id,
      ...finalTenets,
      roleFitScore,
      behavioralScore,
      compositeScore,
      breakdown: JSON.stringify({
        stage1Scores,
        stage2Scores: stage2Result?.scores ?? null,
        stage2Measured: stage2Result
          ? Array.from(stage2Result.measured)
          : null,
        aiScores: aiResult?.tenets,
        stage3: stage3Detail,
      }),
      aiAnalysis: aiResult?.analysis || null,
    },
    update: {
      ...finalTenets,
      roleFitScore,
      behavioralScore,
      compositeScore,
      breakdown: JSON.stringify({
        stage1Scores,
        stage2Scores: stage2Result?.scores ?? null,
        stage2Measured: stage2Result
          ? Array.from(stage2Result.measured)
          : null,
        aiScores: aiResult?.tenets,
        stage3: stage3Detail,
      }),
      aiAnalysis: aiResult?.analysis || null,
    },
  });

  await prisma.candidate.update({
    where: { id: candidateId },
    data: { status: "scored" },
  });

  // Emails
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  try {
    await sendEmail(
      candidate.email,
      buildCompletionEmail({
        candidateName: candidate.name,
        roleName: candidate.role.name,
      }),
    );
    if (process.env.GMAIL_USER) {
      await sendEmail(
        process.env.GMAIL_USER,
        buildResultsReadyEmail({
          roleName: candidate.role.name,
          candidateName: candidate.name,
          baseUrl,
          candidateId: candidate.id,
        }),
      );
    }
  } catch (emailErr) {
    console.error("Email send failed:", emailErr);
  }

  return { ok: true, compositeScore };
}
