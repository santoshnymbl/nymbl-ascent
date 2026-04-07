/**
 * Targeted Turso migration — updates Stage 1 core scenarios' `tree` JSON
 * in place without touching any other rows (preserves existing candidates,
 * assessments, scores, and role attachments).
 *
 * Run against Turso:
 *   npx tsx scripts/update-turso-stage1.ts
 *
 * Reads the expanded Stage 1 `tree` content from prisma/seed.ts by
 * importing it as a module side-effect... actually that's awkward, so
 * instead we duplicate the 4 tree JSON payloads here so this script is
 * self-contained and safe to run repeatedly.
 */

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// Stage 1 game trees — KEEP IN SYNC WITH prisma/seed.ts
// ---------------------------------------------------------------------------

const triageTowerTree = {
  type: "triage-tower",
  items: [
    // --- Regular items (12) ---
    { id: "client-bug", label: "Client-Reported Bug", description: "A VIP client reports a critical bug in their dashboard", binScores: { doNow: { clientFocused: 9, productive: 7 }, doNext: { clientFocused: 5, balanced: 6 }, delegate: { clientFocused: 3, empowering: 8 } } },
    { id: "team-review", label: "Code Review Request", description: "A teammate has been waiting 2 days for your review", binScores: { doNow: { empowering: 8, reliable: 7 }, doNext: { empowering: 5, balanced: 6 }, delegate: { empowering: 3, productive: 5 } } },
    { id: "process-doc", label: "Process Documentation", description: "Update the onboarding docs before a new hire starts Monday", binScores: { doNow: { improving: 7, reliable: 6 }, doNext: { improving: 5, balanced: 7 }, delegate: { improving: 3, empowering: 6 } } },
    { id: "stakeholder-update", label: "Stakeholder Update", description: "Prepare a weekly progress email for leadership", binScores: { doNow: { transparent: 8, productive: 5 }, doNext: { transparent: 6, balanced: 7 }, delegate: { transparent: 4, empowering: 5 } } },
    { id: "tech-debt", label: "Tech Debt Cleanup", description: "Refactor a module that's been causing intermittent issues", binScores: { doNow: { improving: 8, productive: 6 }, doNext: { improving: 6, balanced: 8 }, delegate: { improving: 4, empowering: 5 } } },
    { id: "client-call", label: "Client Check-In Call", description: "Weekly status call with a key client — they want reassurance the project is on track", binScores: { doNow: { clientFocused: 8, transparent: 7 }, doNext: { clientFocused: 5, balanced: 6 }, delegate: { clientFocused: 3, empowering: 6 } } },
    { id: "mentor-junior", label: "Mentor a Junior Dev", description: "A junior teammate asked for 30 minutes to pair on a tricky problem they're stuck on", binScores: { doNow: { empowering: 9, improving: 6 }, doNext: { empowering: 6, balanced: 7 }, delegate: { empowering: 2, productive: 5 } } },
    { id: "blameless-postmortem", label: "Write an Incident Postmortem", description: "Document last week's outage so the team can learn from it", binScores: { doNow: { transparent: 8, improving: 7 }, doNext: { improving: 6, balanced: 6 }, delegate: { transparent: 3, empowering: 5 } } },
    { id: "weekly-1on1", label: "Your Manager 1:1", description: "Your weekly 1:1 with your manager is in 30 minutes — you haven't prepared an agenda", binScores: { doNow: { transparent: 7, reliable: 6 }, doNext: { balanced: 7, transparent: 4 }, delegate: { productive: 2, transparent: 2 } } },
    { id: "vendor-response", label: "Vendor Contract Question", description: "A vendor emailed asking for clarification on a clause — non-urgent but they're waiting", binScores: { doNow: { reliable: 6, clientFocused: 4 }, doNext: { balanced: 7, reliable: 6 }, delegate: { empowering: 7, balanced: 5 } } },
    { id: "refactor-spike", label: "Explore a Refactor Idea", description: "You have an idea to simplify a complex module — it would take half a day to prototype", binScores: { doNow: { improving: 6, productive: 4 }, doNext: { improving: 7, balanced: 7 }, delegate: { improving: 2, empowering: 4 } } },
    { id: "team-lunch", label: "Organize Team Lunch", description: "The team hasn't had a social outing in months — someone needs to pick a date and venue", binScores: { doNow: { empowering: 5, balanced: 6 }, doNext: { balanced: 7, empowering: 6 }, delegate: { empowering: 8, balanced: 4 } } },
    // --- Interrupt items (3) ---
    { id: "urgent-deploy", label: "Emergency Hotfix", description: "Production is partially down — a quick fix is needed NOW", isInterrupt: true, binScores: { doNow: { clientFocused: 9, reliable: 8, productive: 7 }, doNext: { clientFocused: 4, balanced: 3 }, delegate: { clientFocused: 5, empowering: 6 } } },
    { id: "ceo-escalation", label: "CEO Escalation", description: "The CEO forwarded a complaint from a top-10 client and wants a response in an hour", isInterrupt: true, binScores: { doNow: { clientFocused: 9, transparent: 7, reliable: 7 }, doNext: { clientFocused: 3, balanced: 3 }, delegate: { clientFocused: 4, empowering: 5 } } },
    { id: "security-alert", label: "Security Alert Triage", description: "Security flagged a suspicious login pattern on a customer account — needs immediate review", isInterrupt: true, binScores: { doNow: { reliable: 9, transparent: 7, clientFocused: 7 }, doNext: { reliable: 4, balanced: 3 }, delegate: { empowering: 6, reliable: 5 } } },
  ],
};

const tradeOffTilesTree = {
  type: "trade-off-tiles",
  pairs: [
    { id: "p1", leftText: "Drop everything to help a struggling teammate finish their deliverable on time", leftTenet: "empowering", rightText: "Stay focused on your own deadline to ensure your work ships on schedule", rightTenet: "productive" },
    { id: "p2", leftText: "Immediately address a client's concern, even if it means rearranging your day", leftTenet: "clientFocused", rightText: "Maintain your planned schedule to deliver consistent, predictable work", rightTenet: "balanced" },
    { id: "p3", leftText: "Share early that a project might miss its deadline so everyone can adjust", leftTenet: "transparent", rightText: "Work harder to solve the problem before escalating — deliver what you promised", rightTenet: "reliable" },
    { id: "p4", leftText: "Propose a new approach you just learned, even though it involves some risk", leftTenet: "improving", rightText: "Stick with the proven method that the team is comfortable with", rightTenet: "clientFocused" },
    { id: "p5", leftText: "Push back on an unrealistic deadline to protect the team's wellbeing", leftTenet: "balanced", rightText: "Accept the deadline and be upfront about what trade-offs it requires", rightTenet: "transparent" },
    { id: "p6", leftText: "Take time to document the decision and the reasoning behind it", leftTenet: "transparent", rightText: "Move forward quickly — the team can figure out the 'why' from the commit history", rightTenet: "productive" },
    { id: "p7", leftText: "Let the junior engineer own the tricky piece, even if it takes longer", leftTenet: "empowering", rightText: "Do it yourself — the deadline is tight and you already know how", rightTenet: "reliable" },
    { id: "p8", leftText: "Flag the unrealistic scope to the client before starting the work", leftTenet: "transparent", rightText: "Start the work and prove what's possible before pushing back", rightTenet: "clientFocused" },
    { id: "p9", leftText: "Join the optional retrospective to help the team learn from the last sprint", leftTenet: "improving", rightText: "Skip it and use the hour to ship one more feature this week", rightTenet: "productive" },
    { id: "p10", leftText: "Insist the team take the weekend off to recover after a hard push", leftTenet: "balanced", rightText: "Ask if anyone can keep momentum going through the weekend to lock in the win", rightTenet: "productive" },
    { id: "p11", leftText: "Pair with a colleague on a new framework you both want to learn", leftTenet: "improving", rightText: "Use the framework you already know so the team has one reliable expert", rightTenet: "reliable" },
    { id: "p12", leftText: "Say 'I don't know' in the client meeting and promise to follow up", leftTenet: "transparent", rightText: "Give the client your best-informed answer so they leave the meeting confident", rightTenet: "clientFocused" },
    { id: "p13", leftText: "Rotate the on-call role so everyone shares the burden", leftTenet: "balanced", rightText: "Keep the most experienced engineer on-call — outages will resolve faster", rightTenet: "reliable" },
    { id: "p14", leftText: "Hand off the project to a colleague who's been asking for more ownership", leftTenet: "empowering", rightText: "Keep it yourself — the client specifically asked for you on this one", rightTenet: "clientFocused" },
    { id: "p15", leftText: "Experiment with a new process that could halve meeting time", leftTenet: "improving", rightText: "Stick with the current meeting cadence — the team is already productive", rightTenet: "balanced" },
  ],
};

const signalSortTree = {
  type: "signal-sort",
  messages: [
    { id: "m1", author: "Alex Chen", avatar: "A", text: "I stayed until midnight to make sure the client got their report by morning. Exhausted but worth it.", idealScores: { clientFocused: 8, productive: 6, balanced: 2 }, improveScores: { balanced: 8, clientFocused: 3, productive: 4 } },
    { id: "m2", author: "Jordan Lee", avatar: "J", text: "I told Sarah I'd review her PR by end of day, but I got pulled into something urgent and couldn't get to it. Let her know first thing this morning.", idealScores: { transparent: 7, reliable: 4, balanced: 6 }, improveScores: { reliable: 8, transparent: 5, empowering: 3 } },
    { id: "m3", author: "Sam Rivera", avatar: "S", text: "Instead of fixing the bug myself, I paired with the junior dev and walked them through the debugging process. Took 3x longer but they learned a lot.", idealScores: { empowering: 9, improving: 7, productive: 2 }, improveScores: { productive: 7, empowering: 3, balanced: 5 } },
    { id: "m4", author: "Casey Kim", avatar: "C", text: "Let's skip the retro this sprint — everyone's heads down on the release and we don't have time for meetings that don't directly ship features.", idealScores: { productive: 7, balanced: 5, improving: 2 }, improveScores: { improving: 8, transparent: 6, productive: 3 } },
    { id: "m5", author: "Riley Park", avatar: "R", text: "I flagged a concern about the timeline in our team channel. Some people thought I was being negative, but I'd rather surface issues early than pretend everything's fine.", idealScores: { transparent: 9, improving: 6, reliable: 5 }, improveScores: { balanced: 6, empowering: 4, transparent: 3 } },
    { id: "m6", author: "Morgan Patel", avatar: "M", text: "The client asked for a feature that's technically possible but would add a month to the timeline. I committed to making it happen because keeping clients happy is what matters most.", idealScores: { clientFocused: 9, reliable: 6, balanced: 2 }, improveScores: { balanced: 8, transparent: 6, clientFocused: 3 } },
    { id: "m7", author: "Taylor Brooks", avatar: "T", text: "I noticed my estimate was way off halfway through. I updated the ticket and pinged the PM instead of quietly blowing past the date.", idealScores: { transparent: 9, reliable: 7, improving: 5 }, improveScores: { reliable: 6, productive: 5, empowering: 3 } },
    { id: "m8", author: "Devon Liu", avatar: "D", text: "The team wanted consensus before we committed to an architecture, but I made the call and moved on. We can always revisit if it doesn't work.", idealScores: { productive: 8, reliable: 6, improving: 4 }, improveScores: { empowering: 8, transparent: 6, balanced: 5 } },
    { id: "m9", author: "Priya Shah", avatar: "P", text: "I took my full lunch break today and closed Slack. Came back and knocked out the tricky piece in 40 minutes — I think the break actually helped.", idealScores: { balanced: 9, improving: 6, productive: 5 }, improveScores: { productive: 5, reliable: 4, clientFocused: 3 } },
    { id: "m10", author: "Noah Washington", avatar: "N", text: "I asked the client if we could reduce scope instead of pushing the deadline. They were actually relieved — turns out half the features weren't critical to launch.", idealScores: { transparent: 8, clientFocused: 7, balanced: 7 }, improveScores: { clientFocused: 4, productive: 5, reliable: 4 } },
    { id: "m11", author: "Maya Okafor", avatar: "M", text: "Found a weird edge case in the new feature. Instead of filing a ticket, I just fixed it in the same PR — nobody needs to know, it was only a 3-line change.", idealScores: { productive: 7, reliable: 6, improving: 4 }, improveScores: { transparent: 9, reliable: 5, improving: 6 } },
    { id: "m12", author: "Ethan Park", avatar: "E", text: "I rewrote a colleague's module without asking because I thought mine was cleaner. They noticed and weren't happy.", idealScores: { improving: 5, productive: 5 }, improveScores: { empowering: 9, transparent: 7, balanced: 6 } },
    { id: "m13", author: "Lena Müller", avatar: "L", text: "I said no to the new feature request. The PM pushed back hard, so I explained the hidden cost to the existing roadmap. We agreed to revisit next quarter.", idealScores: { transparent: 8, balanced: 7, reliable: 6 }, improveScores: { clientFocused: 5, empowering: 4, productive: 4 } },
    { id: "m14", author: "Jamal Green", avatar: "J", text: "I'm taking a half day Friday for my kid's school thing. Already let the team know and swapped my on-call shift.", idealScores: { balanced: 8, transparent: 7, reliable: 6 }, improveScores: { reliable: 4, productive: 4, clientFocused: 3 } },
    { id: "m15", author: "Ruby Nakamura", avatar: "R", text: "The test suite has been flaky for weeks. Everyone keeps re-running CI until it passes. I spent the morning digging in and fixed 3 of them.", idealScores: { improving: 9, reliable: 7, productive: 5 }, improveScores: { productive: 6, empowering: 4, balanced: 4 } },
    { id: "m16", author: "Owen Fischer", avatar: "O", text: "I disagreed with the design review out loud, which made things awkward. But I'd rather have the hard conversation now than redo the work later.", idealScores: { transparent: 9, improving: 6, reliable: 5 }, improveScores: { balanced: 7, empowering: 5, transparent: 4 } },
    { id: "m17", author: "Aaliyah Roberts", avatar: "A", text: "I volunteered to onboard the two new hires next week. It'll slow me down on my project but they really need a real handoff, not just a doc.", idealScores: { empowering: 9, improving: 6, reliable: 5 }, improveScores: { productive: 6, balanced: 5, reliable: 4 } },
    { id: "m18", author: "Kai Torres", avatar: "K", text: "The demo isn't ready. Instead of rushing, I'm going to tell the stakeholder we're postponing by 24 hours so we can show something we're proud of.", idealScores: { transparent: 8, reliable: 7, balanced: 6 }, improveScores: { clientFocused: 5, productive: 5, empowering: 4 } },
  ],
};

const resourceRouletteTree = {
  type: "resource-roulette",
  totalTokens: 10,
  cards: [
    { id: "teammate", title: "Help a Struggling Teammate", description: "A colleague is falling behind and needs support to meet their deadline", icon: "Users", perTokenScores: { empowering: 3, reliable: 1 } },
    { id: "client", title: "Client Deliverable", description: "A client presentation is due tomorrow and needs polish", icon: "Target", perTokenScores: { clientFocused: 3, productive: 1 } },
    { id: "process", title: "Process Improvement", description: "You identified an inefficiency that slows the whole team", icon: "TrendingUp", perTokenScores: { improving: 3, transparent: 1 } },
    { id: "own-work", title: "Your Performance Review", description: "Self-assessment due this week — affects your promotion case", icon: "Briefcase", perTokenScores: { productive: 2, balanced: 2 } },
    { id: "code-review", title: "Clear the Review Backlog", description: "Five teammate PRs have been waiting 2+ days for your review", icon: "GitPullRequest", perTokenScores: { empowering: 2, reliable: 2 } },
    { id: "tech-debt", title: "Pay Down Tech Debt", description: "A creaky module keeps causing bugs — nobody has had time to fix it properly", icon: "Wrench", perTokenScores: { improving: 3, reliable: 1 } },
    { id: "docs", title: "Write Missing Documentation", description: "New hires keep asking the same questions about a critical system", icon: "BookOpen", perTokenScores: { transparent: 3, empowering: 1 } },
    { id: "bug-triage", title: "Triage the Bug Backlog", description: "35 open bugs — some are months old and nobody knows which still matter", icon: "Bug", perTokenScores: { reliable: 2, improving: 2 } },
    { id: "learning", title: "Deep Work on a New Skill", description: "A new framework is being adopted — you need to actually learn it, not just skim", icon: "GraduationCap", perTokenScores: { improving: 3, balanced: 1 } },
    { id: "stakeholder", title: "Stakeholder Alignment Meeting", description: "Leadership keeps misunderstanding what the team is working on — time for a reset", icon: "Presentation", perTokenScores: { transparent: 2, clientFocused: 2 } },
    { id: "recharge", title: "Rest and Recharge", description: "You've been running hot for weeks — a half-day off would help you come back sharper", icon: "Battery", perTokenScores: { balanced: 3, improving: 1 } },
    { id: "prospect", title: "New Prospect Demo", description: "Sales team wants your help on a demo for a potentially huge new client", icon: "Rocket", perTokenScores: { clientFocused: 3, productive: 1 } },
  ],
  curveball: { text: "Breaking: The client just moved their presentation up by one day. The deliverable is now due TODAY.", affectedCardId: "client" },
};

async function updateScenarioTree(title: string, newTree: object) {
  const rows = await prisma.scenario.findMany({
    where: { title, stage: 1, type: "core" },
  });
  if (rows.length === 0) {
    console.log(`  ✗ Scenario "${title}" not found on Turso`);
    return false;
  }
  if (rows.length > 1) {
    console.log(`  ⚠ Multiple "${title}" rows found — updating all ${rows.length}`);
  }
  for (const row of rows) {
    await prisma.scenario.update({
      where: { id: row.id },
      data: { tree: JSON.stringify(newTree) },
    });
  }
  const type = (newTree as { type: string }).type;
  const obj = newTree as Record<string, unknown>;
  const size =
    (obj.items as unknown[] | undefined)?.length ??
    (obj.pairs as unknown[] | undefined)?.length ??
    (obj.messages as unknown[] | undefined)?.length ??
    (obj.cards as unknown[] | undefined)?.length ??
    0;
  console.log(`  ✓ Updated "${title}" (${type}): ${size} items`);
  return true;
}

async function main() {
  console.log(`\nTarget DB: ${process.env.DATABASE_URL}`);

  if (!process.env.DATABASE_URL?.startsWith("libsql://")) {
    console.error("This script is meant for Turso (libsql://). Refusing to run.");
    console.error(`Got DATABASE_URL=${process.env.DATABASE_URL}`);
    process.exit(1);
  }

  // Sanity check: count rows before we touch anything
  const [candidates, assessments, scores] = await Promise.all([
    prisma.candidate.count(),
    prisma.assessment.count(),
    prisma.score.count(),
  ]);
  console.log(
    `\nCurrent row counts (these MUST be unchanged after migration):`,
  );
  console.log(`  Candidates:  ${candidates}`);
  console.log(`  Assessments: ${assessments}`);
  console.log(`  Scores:      ${scores}`);

  console.log(`\nUpdating Stage 1 scenario trees in place...`);
  await updateScenarioTree("Triage Tower", triageTowerTree);
  await updateScenarioTree("Trade-Off Tiles", tradeOffTilesTree);
  await updateScenarioTree("Signal Sort", signalSortTree);
  await updateScenarioTree("Resource Roulette", resourceRouletteTree);

  // Post-check: confirm counts still match
  const [c2, a2, s2] = await Promise.all([
    prisma.candidate.count(),
    prisma.assessment.count(),
    prisma.score.count(),
  ]);
  console.log(`\nRow counts after migration (should match before):`);
  console.log(`  Candidates:  ${c2} ${c2 === candidates ? "✓" : "✗"}`);
  console.log(`  Assessments: ${a2} ${a2 === assessments ? "✓" : "✗"}`);
  console.log(`  Scores:      ${s2} ${s2 === scores ? "✓" : "✗"}`);

  if (c2 !== candidates || a2 !== assessments || s2 !== scores) {
    console.error("\n✗ ROW COUNT MISMATCH — something unexpected was deleted!");
    process.exit(1);
  }

  console.log(`\n✓ Turso Stage 1 content migration complete.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
