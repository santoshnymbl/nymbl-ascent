import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // --- Roles ---
  const engRole = await prisma.role.create({
    data: {
      name: "Frontend Engineer",
      description: "Build user-facing web applications",
      corePoolSize: 2,
    },
  });

  const salesRole = await prisma.role.create({
    data: {
      name: "Sales Representative",
      description: "Drive revenue through client relationships",
      corePoolSize: 2,
    },
  });

  // --- Stage 1 Scenarios (core) ---
  const prioritySnap = await prisma.scenario.create({
    data: {
      title: "Priority Snap",
      stage: 1,
      type: "core",
      tenets: JSON.stringify(["productive", "balanced"]),
      scoringRubric: JSON.stringify({
        correctOrder: ["client-issue", "team-blocker", "own-deadline", "nice-to-have", "admin-task"],
        timeBonus: { under15s: 5, under30s: 3, under60s: 1 },
      }),
      tree: JSON.stringify({
        type: "priority-snap",
        items: [
          { id: "client-issue", label: "Resolve client-reported bug", weight: 5 },
          { id: "team-blocker", label: "Unblock teammate's PR", weight: 4 },
          { id: "own-deadline", label: "Finish your feature by EOD", weight: 3 },
          { id: "nice-to-have", label: "Refactor legacy code", weight: 2 },
          { id: "admin-task", label: "Update your timesheet", weight: 1 },
        ],
      }),
      isPublished: true,
    },
  });

  const valueMatch = await prisma.scenario.create({
    data: {
      title: "Value Match",
      stage: 1,
      type: "core",
      tenets: JSON.stringify(["clientFocused", "transparent"]),
      scoringRubric: JSON.stringify({
        correctMatches: {
          "client-focused": "situation-client",
          "transparent": "situation-transparent",
          "empowering": "situation-empowering",
          "reliable": "situation-reliable",
        },
      }),
      tree: JSON.stringify({
        type: "value-match",
        values: [
          { id: "client-focused", label: "Client Focused" },
          { id: "transparent", label: "Transparent" },
          { id: "empowering", label: "Empowering" },
          { id: "reliable", label: "Reliable" },
        ],
        situations: [
          { id: "situation-client", text: "You drop everything to help a customer who's stuck, even though it's not your ticket." },
          { id: "situation-transparent", text: "You share a project delay with stakeholders immediately rather than trying to fix it quietly." },
          { id: "situation-empowering", text: "You teach a junior colleague how to solve the problem instead of solving it for them." },
          { id: "situation-reliable", text: "You deliver your part on time every sprint, even when priorities shift." },
        ],
      }),
      isPublished: true,
    },
  });

  const oddOneOut = await prisma.scenario.create({
    data: {
      title: "Odd One Out",
      stage: 1,
      type: "core",
      tenets: JSON.stringify(["reliable", "improving"]),
      scoringRubric: JSON.stringify({
        rounds: [
          { roundId: "r1", correctId: "r1-c" },
          { roundId: "r2", correctId: "r2-b" },
          { roundId: "r3", correctId: "r3-d" },
        ],
      }),
      tree: JSON.stringify({
        type: "odd-one-out",
        rounds: [
          {
            id: "r1",
            prompt: "Which behavior doesn't belong?",
            options: [
              { id: "r1-a", text: "Admitting a mistake to a client" },
              { id: "r1-b", text: "Sharing honest progress updates" },
              { id: "r1-c", text: "Hiding a bug you caused and hoping nobody notices" },
              { id: "r1-d", text: "Flagging a risk before it becomes a problem" },
            ],
          },
          {
            id: "r2",
            prompt: "Which behavior doesn't belong?",
            options: [
              { id: "r2-a", text: "Asking for help when stuck" },
              { id: "r2-b", text: "Refusing to learn a new tool because you prefer the old one" },
              { id: "r2-c", text: "Taking a course to improve a weak skill" },
              { id: "r2-d", text: "Requesting feedback on your work" },
            ],
          },
          {
            id: "r3",
            prompt: "Which behavior doesn't belong?",
            options: [
              { id: "r3-a", text: "Meeting every deadline you commit to" },
              { id: "r3-b", text: "Following through on promises to teammates" },
              { id: "r3-c", text: "Delivering consistent quality across projects" },
              { id: "r3-d", text: "Overpromising to impress your manager" },
            ],
          },
        ],
      }),
      isPublished: true,
    },
  });

  // --- Stage 2 Scenarios (core, branching) ---
  const branchScenario1 = await prisma.scenario.create({
    data: {
      title: "The Client Escalation",
      stage: 2,
      type: "core",
      tenets: JSON.stringify(["clientFocused", "empowering", "reliable", "transparent"]),
      scoringRubric: JSON.stringify({
        pathScores: {
          "root->a->a1": { clientFocused: 8, reliable: 7, empowering: 3 },
          "root->a->a2": { clientFocused: 9, reliable: 6, transparent: 7 },
          "root->b->b1": { clientFocused: 4, reliable: 5, transparent: 3 },
          "root->b->b2": { clientFocused: 5, reliable: 6, empowering: 4 },
          "root->c->c1": { clientFocused: 5, empowering: 2, reliable: 6 },
          "root->c->c2": { clientFocused: 6, empowering: 5, transparent: 8 },
          "root->d->d1": { clientFocused: 7, transparent: 8, reliable: 7 },
          "root->d->d2": { clientFocused: 8, transparent: 6, empowering: 6 },
        },
      }),
      tree: JSON.stringify({
        rootNodeId: "root",
        nodes: {
          root: {
            id: "root",
            text: "A client calls upset — they received the wrong deliverable. Your teammate who handled it is out sick. You have your own deadline in 2 hours.",
            options: [
              { id: "a", label: "A", text: "Handle the client yourself immediately", consequence: "You spend 45 minutes resolving the issue. The client is grateful but your own deadline is now tight.", nextNodeId: "node-a", scores: { clientFocused: 8, productive: 3 } },
              { id: "b", label: "B", text: "Email your teammate to get context first", consequence: "Your teammate is sick and doesn't respond for hours. The client follows up again, more frustrated.", nextNodeId: "node-b", scores: { clientFocused: 2, reliable: 3 } },
              { id: "c", label: "C", text: "Escalate to your manager", consequence: "Your manager handles it but later asks why you didn't try to resolve it yourself first.", nextNodeId: "node-c", scores: { empowering: 2, reliable: 5 } },
              { id: "d", label: "D", text: "Send the client an acknowledgment and promise a fix by EOD", consequence: "The client appreciates the quick response. You now have a commitment to deliver by end of day.", nextNodeId: "node-d", scores: { clientFocused: 6, transparent: 7 } },
            ],
          },
          "node-a": {
            id: "node-a",
            text: "You fixed the client issue but now have 75 minutes for your own deadline. What do you do?",
            options: [
              { id: "a1", label: "A", text: "Power through — skip lunch and deliver on time", consequence: "You deliver on time but are burnt out for the rest of the week.", scores: { productive: 8, balanced: 2, reliable: 8 } },
              { id: "a2", label: "B", text: "Tell your manager you need an extension and explain why", consequence: "Your manager appreciates the transparency and gives you until tomorrow.", scores: { transparent: 9, balanced: 7, reliable: 5 } },
            ],
          },
          "node-b": {
            id: "node-b",
            text: "The client has followed up twice now. Your teammate still hasn't responded. What do you do?",
            options: [
              { id: "b1", label: "A", text: "Finally jump in and try to fix it yourself", consequence: "You resolve it, but the delay damaged the client relationship.", scores: { clientFocused: 5, reliable: 4 } },
              { id: "b2", label: "B", text: "Loop in your manager and explain the situation", consequence: "Your manager helps resolve it and suggests a process for handling absent teammates.", scores: { transparent: 6, improving: 7 } },
            ],
          },
          "node-c": {
            id: "node-c",
            text: "Your manager asks you to take ownership of client issues when teammates are unavailable going forward. How do you respond?",
            options: [
              { id: "c1", label: "A", text: "Agree but ask for clearer escalation guidelines", consequence: "You and your manager create a documented process. The team benefits.", scores: { improving: 8, empowering: 6, transparent: 5 } },
              { id: "c2", label: "B", text: "Push back — it's not your responsibility", consequence: "Your manager is disappointed. The issue remains unresolved.", scores: { empowering: 1, clientFocused: 1 } },
            ],
          },
          "node-d": {
            id: "node-d",
            text: "It's 4 PM. You still haven't resolved the client's issue, and your own deadline is in 1 hour. What do you do?",
            options: [
              { id: "d1", label: "A", text: "Prioritize the client promise — you committed to EOD", consequence: "Client issue resolved. You ask for an extension on your own task. Trust maintained.", scores: { clientFocused: 9, reliable: 8, transparent: 6 } },
              { id: "d2", label: "B", text: "Hit your own deadline first, then address the client", consequence: "You deliver your work but miss the EOD promise to the client.", scores: { productive: 7, clientFocused: 3, reliable: 4 } },
            ],
          },
        },
      }),
      isPublished: true,
    },
  });

  const branchScenario2 = await prisma.scenario.create({
    data: {
      title: "The Quality vs. Speed Dilemma",
      stage: 2,
      type: "core",
      tenets: JSON.stringify(["productive", "balanced", "improving", "transparent"]),
      scoringRubric: JSON.stringify({
        pathScores: {
          "root->a->a1": { productive: 5, balanced: 8, improving: 7 },
          "root->a->a2": { productive: 7, balanced: 4, improving: 4 },
          "root->b->b1": { productive: 8, balanced: 3, improving: 3 },
          "root->b->b2": { productive: 6, transparent: 8, balanced: 6 },
          "root->c->c1": { productive: 4, transparent: 7, improving: 8 },
          "root->c->c2": { productive: 3, balanced: 7, improving: 5 },
        },
      }),
      tree: JSON.stringify({
        rootNodeId: "root",
        nodes: {
          root: {
            id: "root",
            text: "Your team has a product launch in 3 days. You discover a significant code quality issue that won't cause bugs now but will make future development much harder. Fixing it properly would take 2 days.",
            options: [
              { id: "a", label: "A", text: "Propose a focused fix that addresses the worst parts in half a day", consequence: "Your lead agrees. You fix the critical parts but some tech debt remains.", nextNodeId: "node-a", scores: { productive: 7, balanced: 6, improving: 5 } },
              { id: "b", label: "B", text: "Ship as-is and log a ticket for post-launch", consequence: "Launch goes smoothly on time. The ticket sits in the backlog for months.", nextNodeId: "node-b", scores: { productive: 8, improving: 2 } },
              { id: "c", label: "C", text: "Raise it to the team and let them decide collectively", consequence: "The team discusses it. Some want to delay, others want to ship. It takes an hour to reach consensus.", nextNodeId: "node-c", scores: { empowering: 7, transparent: 8 } },
            ],
          },
          "node-a": {
            id: "node-a",
            text: "Your partial fix is done but you notice it introduced a minor regression in an unrelated feature. Launch is tomorrow.",
            options: [
              { id: "a1", label: "A", text: "Fix the regression and test thoroughly, even if it means staying late", consequence: "Everything works. You're tired but confident in the quality.", scores: { reliable: 8, balanced: 4, improving: 7 } },
              { id: "a2", label: "B", text: "Revert your fix entirely — the original code was working fine", consequence: "Launch proceeds with original code. Your effort was wasted but launch is safe.", scores: { reliable: 6, productive: 5 } },
            ],
          },
          "node-b": {
            id: "node-b",
            text: "Two months later, a new developer struggles with the code you flagged. They ask why it was never fixed.",
            options: [
              { id: "b1", label: "A", text: "Point them to the ticket and say it's in the backlog", consequence: "They're frustrated. The ticket has no priority or timeline.", scores: { transparent: 3, empowering: 2 } },
              { id: "b2", label: "B", text: "Pair with them to fix it now and advocate for prioritizing tech debt", consequence: "You spend a day fixing it together. The new developer learns the codebase.", scores: { empowering: 8, improving: 8, transparent: 6 } },
            ],
          },
          "node-c": {
            id: "node-c",
            text: "The team decides to delay launch by one day to fix the issue. Product management is unhappy about the delay.",
            options: [
              { id: "c1", label: "A", text: "Help explain the technical reasoning to PM in terms they understand", consequence: "PM appreciates the transparency and adjusts messaging to stakeholders.", scores: { transparent: 9, clientFocused: 6 } },
              { id: "c2", label: "B", text: "Let your lead handle the PM conversation — it's above your pay grade", consequence: "Your lead handles it but wishes you'd helped since you found the issue.", scores: { empowering: 2, transparent: 3 } },
            ],
          },
        },
      }),
      isPublished: true,
    },
  });

  // --- Stage 3 Scenarios (role-specific) ---
  const engChallenge = await prisma.scenario.create({
    data: {
      title: "Debug the Logic",
      stage: 3,
      type: "role-specific",
      roleType: "engineering",
      tenets: JSON.stringify(["improving", "productive"]),
      scoringRubric: JSON.stringify({
        correctAnswer: "off-by-one",
        approaches: {
          "read-error-msg": { improving: 6, productive: 7 },
          "trace-manually": { improving: 8, productive: 5 },
          "add-logging": { improving: 5, productive: 6 },
        },
      }),
      tree: JSON.stringify({
        type: "debug-challenge",
        problem: "A function is supposed to return the sum of all numbers in an array that are greater than a threshold. For input [1, 5, 3, 8, 2] with threshold 3, it returns 8 instead of 13. Review the code and identify the bug.",
        code: "function sumAbove(nums, threshold) {\n  let sum = 0;\n  for (let i = 1; i < nums.length; i++) {\n    if (nums[i] > threshold) {\n      sum += nums[i];\n    }\n  }\n  return sum;\n}",
        options: [
          { id: "off-by-one", text: "Loop starts at index 1 instead of 0, skipping the first element", correct: true },
          { id: "wrong-operator", text: "Should use >= instead of > for the comparison", correct: false },
          { id: "wrong-var", text: "The sum variable should be initialized to the first element", correct: false },
          { id: "missing-return", text: "The return statement is inside the loop", correct: false },
        ],
        followUp: {
          prompt: "How would you approach fixing this in a real codebase?",
          options: [
            { id: "read-error-msg", text: "Check if there are existing test cases and see which ones fail" },
            { id: "trace-manually", text: "Walk through the code line by line with the example input" },
            { id: "add-logging", text: "Add console.log statements to trace the values at each step" },
          ],
        },
      }),
      isPublished: true,
    },
  });

  const salesChallenge = await prisma.scenario.create({
    data: {
      title: "The Objection Handler",
      stage: 3,
      type: "role-specific",
      roleType: "sales",
      tenets: JSON.stringify(["clientFocused", "improving"]),
      scoringRubric: JSON.stringify({
        pathScores: {
          "root->a->a1": { clientFocused: 9, empowering: 5 },
          "root->a->a2": { clientFocused: 6, transparent: 7 },
          "root->b->b1": { clientFocused: 5, productive: 7 },
          "root->b->b2": { clientFocused: 7, transparent: 8 },
          "root->c->c1": { clientFocused: 8, empowering: 7 },
          "root->c->c2": { clientFocused: 4, productive: 5 },
        },
      }),
      tree: JSON.stringify({
        rootNodeId: "root",
        nodes: {
          root: {
            id: "root",
            text: "You're in a demo with a potential client. They say: 'Your competitor offers the same thing for 30% less. Why should we go with you?'",
            options: [
              { id: "a", label: "A", text: "Ask what specific features they're comparing to understand their needs", consequence: "They mention they need strong customer support and fast onboarding — areas where you excel.", nextNodeId: "node-a", scores: { clientFocused: 8, improving: 5 } },
              { id: "b", label: "B", text: "Highlight your product's unique advantages and ROI data", consequence: "They seem interested but say they need to compare both proposals side by side.", nextNodeId: "node-b", scores: { productive: 6, transparent: 4 } },
              { id: "c", label: "C", text: "Acknowledge the price difference honestly and ask what matters most to them beyond cost", consequence: "They appreciate the honesty and open up about their real priorities: reliability and support.", nextNodeId: "node-c", scores: { transparent: 8, clientFocused: 7 } },
            ],
          },
          "node-a": {
            id: "node-a",
            text: "The client confirms support and onboarding are their top priorities. They ask for references from similar companies.",
            options: [
              { id: "a1", label: "A", text: "Offer to connect them directly with a happy customer in their industry", consequence: "The client is impressed by your confidence and agrees to a follow-up call.", scores: { clientFocused: 9, empowering: 6 } },
              { id: "a2", label: "B", text: "Send a case study and offer a pilot program instead", consequence: "They agree to a pilot. Lower commitment but keeps the deal moving.", scores: { productive: 7, clientFocused: 6 } },
            ],
          },
          "node-b": {
            id: "node-b",
            text: "They come back and say the competitor's proposal looks stronger on paper. They're leaning toward the cheaper option.",
            options: [
              { id: "b1", label: "A", text: "Offer a discount to match closer to the competitor's price", consequence: "They're interested but now question the original pricing.", scores: { productive: 4, transparent: 3 } },
              { id: "b2", label: "B", text: "Ask for a meeting to understand what 'stronger on paper' means specifically", consequence: "You discover gaps in the competitor's proposal. The client reopens the conversation.", scores: { clientFocused: 8, improving: 7 } },
            ],
          },
          "node-c": {
            id: "node-c",
            text: "They share that their last vendor had terrible support and they're scared of repeating that experience.",
            options: [
              { id: "c1", label: "A", text: "Share your support SLAs and offer a trial period with dedicated support", consequence: "They feel heard and agree to start a trial.", scores: { clientFocused: 9, reliable: 8 } },
              { id: "c2", label: "B", text: "Promise premium support as part of the deal", consequence: "They're interested but want it in writing.", scores: { reliable: 5, transparent: 6 } },
            ],
          },
        },
      }),
      isPublished: true,
    },
  });

  // --- Link scenarios to roles ---
  const coreScenarios = [prioritySnap, valueMatch, oddOneOut, branchScenario1, branchScenario2];
  for (const scenario of coreScenarios) {
    await prisma.roleScenario.createMany({
      data: [
        { roleId: engRole.id, scenarioId: scenario.id },
        { roleId: salesRole.id, scenarioId: scenario.id },
      ],
    });
  }

  await prisma.roleScenario.create({
    data: { roleId: engRole.id, scenarioId: engChallenge.id },
  });
  await prisma.roleScenario.create({
    data: { roleId: salesRole.id, scenarioId: salesChallenge.id },
  });

  // --- Sample candidate (for testing) ---
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 7);

  await prisma.candidate.create({
    data: {
      name: "Test Candidate",
      email: "test@example.com",
      roleId: engRole.id,
      token: "test-token-12345",
      tokenExpiry: expiry,
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
