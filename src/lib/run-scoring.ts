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
} from "@/types";
import { TENETS } from "@/types";

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
  let stage2Scores: TenetScores | null = null;
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
    stage2Scores = computeStage2Scores(stage2, rubrics);
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
  if (stage1Scores && stage2Scores) {
    finalTenets = mergeScores(stage1Scores, stage2Scores, 0.4, 0.6);
  } else if (stage1Scores) {
    finalTenets = stage1Scores;
  } else if (stage2Scores) {
    finalTenets = stage2Scores;
  }
  if (aiResult) {
    finalTenets = mergeScores(finalTenets, aiResult.tenets, 0.6, 0.4);
  }

  // Behavioral
  const allSignals = [
    ...(stage1?.signals || []),
    ...(stage2?.signals || []),
    ...(stage3?.signals || []),
  ];
  if (stage1Scores && stage2Scores) {
    const s1Values = TENETS.map((t) => stage1Scores![t]);
    const s2Values = TENETS.map((t) => stage2Scores![t]);
    const correlation = pearsonCorrelation(s1Values, s2Values);
    allSignals.push({
      event: "cross_stage_consistency",
      timestamp: Date.now(),
      data: { correlation },
    });
  }
  const behavioralScore = computeBehavioralScore(allSignals);

  // Stage 3 role fit
  let roleFitScore = 50;
  if (stage3) {
    const s3 = stage3 as {
      challengeType: string;
      responses: Record<string, unknown>;
      timeMs: number;
    };
    if (s3.challengeType === "debug") {
      const resp = s3.responses as { debugAnswer?: string; followUpAnswer?: string };
      roleFitScore =
        (resp.debugAnswer === "off-by-one" ? 60 : 20) +
        (resp.followUpAnswer === "trace-manually"
          ? 30
          : resp.followUpAnswer === "read-error-msg"
            ? 25
            : 20) +
        (s3.timeMs < 180000 ? 10 : 5);
      roleFitScore = Math.min(100, roleFitScore);
    } else if (s3.challengeType === "branching") {
      roleFitScore = 70;
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
        stage2Scores,
        aiScores: aiResult?.tenets,
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
        stage2Scores,
        aiScores: aiResult?.tenets,
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
