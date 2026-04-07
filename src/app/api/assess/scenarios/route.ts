import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateToken } from "@/lib/token";

/**
 * Fisher-Yates shuffle — unbiased in-place shuffle on a shallow copy.
 * The `.sort(() => Math.random() - 0.5)` pattern is statistically biased
 * because Array.prototype.sort expects a consistent comparator.
 */
function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * For Stage 1 game trees, sub-sample the item/pair/message/card pools
 * to the per-candidate draw size. Preserves scoring invariants:
 * - Triage Tower: 5 regular + 1 interrupt (matches current candidate UX)
 * - Trade-Off Tiles: 5 pairs
 * - Signal Sort: 6 messages
 * - Resource Roulette: 4 cards, ALWAYS including the curveball's target
 *   card (otherwise the curveball mechanic would target a card the
 *   candidate never saw and the "affected card" highlight breaks).
 */
function sampleStage1Tree(tree: Record<string, unknown>): Record<string, unknown> {
  if (tree.type === "triage-tower") {
    const items = tree.items as Array<{ isInterrupt?: boolean }>;
    const interrupts = items.filter((i) => i.isInterrupt);
    const regular = items.filter((i) => !i.isInterrupt);
    return {
      ...tree,
      items: [
        ...shuffle(regular).slice(0, 5),
        ...shuffle(interrupts).slice(0, 1),
      ],
    };
  }
  if (tree.type === "trade-off-tiles") {
    return { ...tree, pairs: shuffle(tree.pairs as unknown[]).slice(0, 5) };
  }
  if (tree.type === "signal-sort") {
    return { ...tree, messages: shuffle(tree.messages as unknown[]).slice(0, 6) };
  }
  if (tree.type === "resource-roulette") {
    const cards = tree.cards as Array<{ id: string }>;
    const curveball = tree.curveball as { affectedCardId: string } | undefined;
    const affectedId = curveball?.affectedCardId;
    const pinned = affectedId
      ? cards.find((c) => c.id === affectedId)
      : undefined;
    const rest = pinned ? cards.filter((c) => c.id !== pinned.id) : cards;
    const extras = shuffle(rest).slice(0, pinned ? 3 : 4);
    // Re-shuffle so the pinned card doesn't always appear first in the UI
    const sampled = shuffle(pinned ? [pinned, ...extras] : extras);
    return { ...tree, cards: sampled };
  }
  return tree;
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const stageParam = request.nextUrl.searchParams.get("stage");

  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }
  if (!stageParam) {
    return NextResponse.json({ error: "Stage required" }, { status: 400 });
  }

  const stage = parseInt(stageParam, 10);
  if (![1, 2, 3].includes(stage)) {
    return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
  }

  const candidate = await validateToken(token);
  if (!candidate) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 },
    );
  }

  // Stage 1 is universal (not role-scoped) — fetch all published stage-1
  // core scenarios globally and sub-sample each game's item pool.
  if (stage === 1) {
    const stage1Scenarios = await prisma.scenario.findMany({
      where: { stage: 1, type: "core", isPublished: true },
    });
    return NextResponse.json(
      stage1Scenarios.map((s) => ({
        ...s,
        tree: sampleStage1Tree(JSON.parse(s.tree)),
        tenets: JSON.parse(s.tenets),
        scoringRubric: JSON.parse(s.scoringRubric),
      })),
    );
  }

  // Stage 2 & 3 are role-scoped via RoleScenario join.
  const roleScenarios = await prisma.roleScenario.findMany({
    where: {
      roleId: candidate.roleId,
      scenario: { stage, isPublished: true },
    },
    include: { scenario: true },
  });

  let scenarios = roleScenarios.map((rs) => rs.scenario);

  // Stage 2: randomly pick `corePoolSize` scenarios (unbiased shuffle).
  if (stage === 2) {
    const role = await prisma.role.findUnique({
      where: { id: candidate.roleId },
    });
    const poolSize = role?.corePoolSize ?? 2;
    scenarios = shuffle(scenarios).slice(0, poolSize);
  }

  return NextResponse.json(
    scenarios.map((s) => ({
      ...s,
      tree: JSON.parse(s.tree),
      tenets: JSON.parse(s.tenets),
      scoringRubric: JSON.parse(s.scoringRubric),
    })),
  );
}
