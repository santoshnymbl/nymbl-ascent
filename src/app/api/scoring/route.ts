import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  computeStage1Scores,
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

export async function POST(request: NextRequest) {
  let candidateId: string;
  try {
    ({ candidateId } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {

  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: { assessment: true, role: true },
  });

  if (!candidate?.assessment) {
    return NextResponse.json(
      { error: "Assessment not found" },
      { status: 404 },
    );
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

  // -------------------------------------------------------------------------
  // Compute rule-based scores
  // -------------------------------------------------------------------------
  const stage1Scores = stage1 ? computeStage1Scores(stage1) : null;

  // Get scenario rubrics for stage 2
  let stage2Scores: TenetScores | null = null;
  if (stage2) {
    const scenarioIds = stage2.scenarios.map((s) => s.scenarioId);
    const scenarios = await prisma.scenario.findMany({
      where: { id: { in: scenarioIds } },
    });
    const rubrics: ScenarioRubric[] = scenarios.map((s) => ({
      scenarioId: s.id,
      pathScores: JSON.parse(s.scoringRubric),
    }));
    stage2Scores = computeStage2Scores(stage2, rubrics);
  }

  // -------------------------------------------------------------------------
  // AI scoring for qualitative analysis
  // -------------------------------------------------------------------------
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
      console.error("AI scoring failed (continuing with rule-based scoring):", aiErr);
    }
  }

  // -------------------------------------------------------------------------
  // Merge tenet scores
  // -------------------------------------------------------------------------
  const emptyTenets = Object.fromEntries(
    TENETS.map((t) => [t, 50]),
  ) as TenetScores;

  let finalTenets: TenetScores = emptyTenets;
  if (stage1Scores && stage2Scores) {
    finalTenets = mergeScores(stage1Scores, stage2Scores, 0.4, 0.6);
  } else if (stage1Scores) {
    finalTenets = stage1Scores;
  } else if (stage2Scores) {
    finalTenets = stage2Scores;
  }

  // Blend AI scores if available
  if (aiResult) {
    finalTenets = mergeScores(finalTenets, aiResult.tenets, 0.6, 0.4);
  }

  // -------------------------------------------------------------------------
  // Behavioral + role fit + composite
  // -------------------------------------------------------------------------
  const allSignals = [
    ...(stage1?.signals || []),
    ...(stage2?.signals || []),
    ...(stage3?.signals || []),
  ];
  const behavioralScore = computeBehavioralScore(allSignals);

  // Stage 3 role fit scoring
  let roleFitScore = 50;
  if (stage3) {
    const s3 = stage3 as {
      challengeType: string;
      responses: Record<string, unknown>;
      timeMs: number;
    };
    if (s3.challengeType === "debug") {
      const resp = s3.responses as {
        debugAnswer?: string;
        followUpAnswer?: string;
      };
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

  const compositeScore = computeCompositeScore(
    finalTenets,
    roleFitScore,
    behavioralScore,
  );

  // -------------------------------------------------------------------------
  // Save scores
  // -------------------------------------------------------------------------
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

  // Update candidate status
  await prisma.candidate.update({
    where: { id: candidateId },
    data: { status: "scored" },
  });

  // -------------------------------------------------------------------------
  // Send emails
  // -------------------------------------------------------------------------
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
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

  return NextResponse.json({ ok: true, compositeScore });
  } catch (err) {
    console.error("Scoring failed:", err);
    return NextResponse.json({ error: "Scoring failed", details: String(err) }, { status: 500 });
  }
}
