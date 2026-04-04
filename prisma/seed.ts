import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clear existing data (order matters for foreign keys)
  await prisma.score.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.roleScenario.deleteMany();
  await prisma.scenario.deleteMany();
  await prisma.role.deleteMany();

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

  // ---------------------------------------------------------------------------
  // Stage 1 Scenarios (core) — 4 new psychology-based games
  // ---------------------------------------------------------------------------

  const triageTower = await prisma.scenario.create({
    data: {
      title: "Triage Tower",
      stage: 1,
      type: "core",
      tenets: JSON.stringify(["clientFocused", "empowering", "productive", "balanced", "reliable", "improving", "transparent"]),
      scoringRubric: JSON.stringify({ type: "triage-tower" }),
      tree: JSON.stringify({
        type: "triage-tower",
        items: [
          { id: "client-bug", label: "Client-Reported Bug", description: "A VIP client reports a critical bug in their dashboard", binScores: { doNow: { clientFocused: 9, productive: 7 }, doNext: { clientFocused: 5, balanced: 6 }, delegate: { clientFocused: 3, empowering: 8 } } },
          { id: "team-review", label: "Code Review Request", description: "A teammate has been waiting 2 days for your review", binScores: { doNow: { empowering: 8, reliable: 7 }, doNext: { empowering: 5, balanced: 6 }, delegate: { empowering: 3, productive: 5 } } },
          { id: "process-doc", label: "Process Documentation", description: "Update the onboarding docs before a new hire starts Monday", binScores: { doNow: { improving: 7, reliable: 6 }, doNext: { improving: 5, balanced: 7 }, delegate: { improving: 3, empowering: 6 } } },
          { id: "stakeholder-update", label: "Stakeholder Update", description: "Prepare a weekly progress email for leadership", binScores: { doNow: { transparent: 8, productive: 5 }, doNext: { transparent: 6, balanced: 7 }, delegate: { transparent: 4, empowering: 5 } } },
          { id: "tech-debt", label: "Tech Debt Cleanup", description: "Refactor a module that's been causing intermittent issues", binScores: { doNow: { improving: 8, productive: 6 }, doNext: { improving: 6, balanced: 8 }, delegate: { improving: 4, empowering: 5 } } },
          { id: "urgent-deploy", label: "Emergency Hotfix", description: "Production is partially down — a quick fix is needed NOW", isInterrupt: true, binScores: { doNow: { clientFocused: 9, reliable: 8, productive: 7 }, doNext: { clientFocused: 4, balanced: 3 }, delegate: { clientFocused: 5, empowering: 6 } } },
        ],
      }),
      isPublished: true,
    },
  });

  const tradeOffTiles = await prisma.scenario.create({
    data: {
      title: "Trade-Off Tiles",
      stage: 1,
      type: "core",
      tenets: JSON.stringify(["empowering", "productive", "clientFocused", "balanced", "transparent", "reliable", "improving"]),
      scoringRubric: JSON.stringify({ type: "trade-off-tiles" }),
      tree: JSON.stringify({
        type: "trade-off-tiles",
        pairs: [
          { id: "p1", leftText: "Drop everything to help a struggling teammate finish their deliverable on time", leftTenet: "empowering", rightText: "Stay focused on your own deadline to ensure your work ships on schedule", rightTenet: "productive" },
          { id: "p2", leftText: "Immediately address a client's concern, even if it means rearranging your day", leftTenet: "clientFocused", rightText: "Maintain your planned schedule to deliver consistent, predictable work", rightTenet: "balanced" },
          { id: "p3", leftText: "Share early that a project might miss its deadline so everyone can adjust", leftTenet: "transparent", rightText: "Work harder to solve the problem before escalating — deliver what you promised", rightTenet: "reliable" },
          { id: "p4", leftText: "Propose a new approach you just learned, even though it involves some risk", leftTenet: "improving", rightText: "Stick with the proven method that the team is comfortable with", rightTenet: "clientFocused" },
          { id: "p5", leftText: "Push back on an unrealistic deadline to protect the team's wellbeing", leftTenet: "balanced", rightText: "Accept the deadline and be upfront about what trade-offs it requires", rightTenet: "transparent" },
        ],
      }),
      isPublished: true,
    },
  });

  const signalSort = await prisma.scenario.create({
    data: {
      title: "Signal Sort",
      stage: 1,
      type: "core",
      tenets: JSON.stringify(["clientFocused", "empowering", "productive", "balanced", "reliable", "improving", "transparent"]),
      scoringRubric: JSON.stringify({ type: "signal-sort" }),
      tree: JSON.stringify({
        type: "signal-sort",
        messages: [
          { id: "m1", author: "Alex Chen", avatar: "A", text: "I stayed until midnight to make sure the client got their report by morning. Exhausted but worth it.", idealScores: { clientFocused: 8, productive: 6, balanced: 2 }, improveScores: { balanced: 8, clientFocused: 3, productive: 4 } },
          { id: "m2", author: "Jordan Lee", avatar: "J", text: "I told Sarah I'd review her PR by end of day, but I got pulled into something urgent and couldn't get to it. Let her know first thing this morning.", idealScores: { transparent: 7, reliable: 4, balanced: 6 }, improveScores: { reliable: 8, transparent: 5, empowering: 3 } },
          { id: "m3", author: "Sam Rivera", avatar: "S", text: "Instead of fixing the bug myself, I paired with the junior dev and walked them through the debugging process. Took 3x longer but they learned a lot.", idealScores: { empowering: 9, improving: 7, productive: 2 }, improveScores: { productive: 7, empowering: 3, balanced: 5 } },
          { id: "m4", author: "Casey Kim", avatar: "C", text: "Let's skip the retro this sprint — everyone's heads down on the release and we don't have time for meetings that don't directly ship features.", idealScores: { productive: 7, balanced: 5, improving: 2 }, improveScores: { improving: 8, transparent: 6, productive: 3 } },
          { id: "m5", author: "Riley Park", avatar: "R", text: "I flagged a concern about the timeline in our team channel. Some people thought I was being negative, but I'd rather surface issues early than pretend everything's fine.", idealScores: { transparent: 9, improving: 6, reliable: 5 }, improveScores: { balanced: 6, empowering: 4, transparent: 3 } },
          { id: "m6", author: "Morgan Patel", avatar: "M", text: "The client asked for a feature that's technically possible but would add a month to the timeline. I committed to making it happen because keeping clients happy is what matters most.", idealScores: { clientFocused: 9, reliable: 6, balanced: 2 }, improveScores: { balanced: 8, transparent: 6, clientFocused: 3 } },
        ],
      }),
      isPublished: true,
    },
  });

  const resourceRoulette = await prisma.scenario.create({
    data: {
      title: "Resource Roulette",
      stage: 1,
      type: "core",
      tenets: JSON.stringify(["clientFocused", "empowering", "productive", "balanced", "improving", "transparent"]),
      scoringRubric: JSON.stringify({ type: "resource-roulette" }),
      tree: JSON.stringify({
        type: "resource-roulette",
        totalTokens: 10,
        cards: [
          { id: "teammate", title: "Help a Struggling Teammate", description: "A colleague is falling behind and needs support to meet their deadline", icon: "Users", perTokenScores: { empowering: 3, reliable: 1 } },
          { id: "client", title: "Client Deliverable", description: "A client presentation is due tomorrow and needs polish", icon: "Target", perTokenScores: { clientFocused: 3, productive: 1 } },
          { id: "process", title: "Process Improvement", description: "You identified an inefficiency that slows the whole team", icon: "TrendingUp", perTokenScores: { improving: 3, transparent: 1 } },
          { id: "own-work", title: "Your Performance Review", description: "Self-assessment due this week — affects your promotion case", icon: "Briefcase", perTokenScores: { productive: 2, balanced: 2 } },
        ],
        curveball: { text: "Breaking: The client just moved their presentation up by one day. The deliverable is now due TODAY.", affectedCardId: "client" },
      }),
      isPublished: true,
    },
  });

  // ---------------------------------------------------------------------------
  // Stage 2 Scenarios (core, branching with resources + reflection)
  // ---------------------------------------------------------------------------

  const branchScenario1 = await prisma.scenario.create({
    data: {
      title: "The Launch Week Crunch",
      stage: 2,
      type: "core",
      tenets: JSON.stringify(["productive", "balanced", "empowering", "transparent"]),
      scoringRubric: JSON.stringify({
        pathScores: {
          "root->rally": { productive: 8, empowering: 6, balanced: 3 },
          "root->rally->rally-push": { productive: 9, balanced: 2, empowering: 5 },
          "root->rally->rally-rotate": { empowering: 8, balanced: 6, productive: 5 },
          "root->cut-scope": { productive: 6, balanced: 7, transparent: 5 },
          "root->cut-scope->cut-communicate": { transparent: 9, clientFocused: 6, balanced: 7 },
          "root->cut-scope->cut-silent": { productive: 7, transparent: 2, clientFocused: 3 },
          "root->bring-help": { empowering: 7, productive: 5, balanced: 6 },
          "root->bring-help->help-structured": { empowering: 8, improving: 7, productive: 5 },
          "root->bring-help->help-adhoc": { productive: 6, empowering: 4, balanced: 5 },
          "root->transparent-risks": { transparent: 9, balanced: 7, productive: 4 },
          "root->transparent-risks->risks-plan": { transparent: 8, productive: 7, balanced: 6 },
          "root->transparent-risks->risks-defer": { balanced: 7, transparent: 6, empowering: 5 },
        },
      }),
      tree: JSON.stringify({
        rootNodeId: "root",
        nodes: {
          root: {
            id: "root",
            text: "Your team has a major product launch in 4 days. You just discovered the integration tests are failing across 3 modules, and two teammates are already running on fumes. The client expects a polished demo on launch day.",
            resources: [
              { label: "Time", value: 6, max: 10, icon: "Clock" },
              { label: "Team Energy", value: 8, max: 10, icon: "Heart" },
              { label: "Client Trust", value: 7, max: 10, icon: "Shield" },
            ],
            options: [
              { id: "rally", label: "A", text: "Rally the team — everyone pushes through together", consequence: "The team digs in. Morale is high initially but energy drains fast. You fix 2 of 3 modules by day 2.", nextNodeId: "node-rally", scores: { productive: 8, empowering: 6, balanced: 3 } },
              { id: "cut-scope", label: "B", text: "Cut scope — drop the least critical module from the demo", consequence: "You remove one module from the launch scope. The team breathes easier but the client will notice a gap.", nextNodeId: "node-cut-scope", scores: { productive: 6, balanced: 7, transparent: 5 } },
              { id: "bring-help", label: "C", text: "Bring in help — ask another team to lend a developer", consequence: "A developer from another team joins. They need onboarding but bring fresh energy and a new perspective.", nextNodeId: "node-bring-help", scores: { empowering: 7, productive: 5, balanced: 6 } },
              { id: "transparent-risks", label: "D", text: "Be transparent — tell stakeholders the launch might slip", consequence: "Stakeholders appreciate the honesty. Some push back, others offer resources. The pressure shifts but doesn't disappear.", nextNodeId: "node-transparent-risks", scores: { transparent: 9, balanced: 7, productive: 4 } },
            ],
          },
          "node-rally": {
            id: "node-rally",
            text: "It's day 3. The 3rd module is still broken and your strongest developer just called in sick from exhaustion. The demo is tomorrow.",
            resourceChanges: { "Time": -3, "Team Energy": -5, "Client Trust": 0 },
            options: [
              { id: "rally-push", label: "A", text: "Push through with the remaining team — the deadline is sacred", consequence: "You launch on time but the demo has rough edges. Two team members are burned out for the following week.", nextNodeId: "node-rally-push-end", scores: { productive: 9, balanced: 1, reliable: 7 } },
              { id: "rally-rotate", label: "B", text: "Rotate people — let the exhausted rest while others step up", consequence: "You lose half a day to the handoff but the team stabilizes. The 3rd module ships with a workaround.", nextNodeId: "node-rally-rotate-end", scores: { empowering: 8, balanced: 7, productive: 5 } },
            ],
          },
          "node-rally-push-end": {
            id: "node-rally-push-end",
            text: "The launch happened on time. The client is satisfied but two team members are disengaged for weeks afterward.",
            resourceChanges: { "Time": -3, "Team Energy": -3, "Client Trust": 1 },
            reflection: {
              prompt: "Looking back at this launch, what mattered most to you?",
              anchors: [
                { id: "ref-deadline", label: "Meeting the deadline", tenet: "productive" },
                { id: "ref-wellbeing", label: "Team wellbeing", tenet: "balanced" },
                { id: "ref-client", label: "Client expectations", tenet: "clientFocused" },
              ],
            },
          },
          "node-rally-rotate-end": {
            id: "node-rally-rotate-end",
            text: "The launch had a minor workaround but the team recovered quickly. The client noticed nothing. Your manager praised the way you managed the team.",
            resourceChanges: { "Time": -2, "Team Energy": -1, "Client Trust": 0 },
            reflection: {
              prompt: "Looking back at this launch, what mattered most to you?",
              anchors: [
                { id: "ref-deadline", label: "Meeting the deadline", tenet: "productive" },
                { id: "ref-wellbeing", label: "Team wellbeing", tenet: "balanced" },
                { id: "ref-client", label: "Client expectations", tenet: "clientFocused" },
              ],
            },
          },
          "node-cut-scope": {
            id: "node-cut-scope",
            text: "The reduced scope gives the team breathing room, but the client's account manager just pinged you asking why a promised feature isn't in the demo build.",
            resourceChanges: { "Time": -1, "Team Energy": -1, "Client Trust": -2 },
            options: [
              { id: "cut-communicate", label: "A", text: "Call the client proactively and explain the trade-off", consequence: "The client appreciates your candor. They agree to a phased rollout — module 3 ships the following week.", nextNodeId: "node-cut-communicate-end", scores: { transparent: 9, clientFocused: 7, balanced: 6 } },
              { id: "cut-silent", label: "B", text: "Demo what you have and hope they don't ask about the missing module", consequence: "The client notices the gap mid-demo and asks pointed questions. Trust takes a hit.", nextNodeId: "node-cut-silent-end", scores: { productive: 6, transparent: 1, clientFocused: 2 } },
            ],
          },
          "node-cut-communicate-end": {
            id: "node-cut-communicate-end",
            text: "The phased rollout works well. The client becomes an advocate for your team's transparency. Module 3 ships a week later with solid quality.",
            resourceChanges: { "Time": -2, "Team Energy": -1, "Client Trust": 2 },
            reflection: {
              prompt: "Looking back at this launch, what mattered most to you?",
              anchors: [
                { id: "ref-deadline", label: "Meeting the deadline", tenet: "productive" },
                { id: "ref-wellbeing", label: "Team wellbeing", tenet: "balanced" },
                { id: "ref-client", label: "Client expectations", tenet: "clientFocused" },
              ],
            },
          },
          "node-cut-silent-end": {
            id: "node-cut-silent-end",
            text: "The demo ends awkwardly. The client schedules a follow-up 'concern' call with your VP. You spend the next week on damage control instead of building.",
            resourceChanges: { "Time": -3, "Team Energy": -2, "Client Trust": -3 },
            reflection: {
              prompt: "Looking back at this launch, what mattered most to you?",
              anchors: [
                { id: "ref-deadline", label: "Meeting the deadline", tenet: "productive" },
                { id: "ref-wellbeing", label: "Team wellbeing", tenet: "balanced" },
                { id: "ref-client", label: "Client expectations", tenet: "clientFocused" },
              ],
            },
          },
          "node-bring-help": {
            id: "node-bring-help",
            text: "The borrowed developer is up to speed but discovers the root cause is deeper than expected — a shared utility library has a subtle bug. Fixing it properly would take an extra day.",
            resourceChanges: { "Time": -2, "Team Energy": -1, "Client Trust": 0 },
            options: [
              { id: "help-structured", label: "A", text: "Fix the root cause properly — it'll save pain later", consequence: "The fix takes a day but eliminates a class of bugs. The borrowed developer documents the solution for both teams.", nextNodeId: "node-help-structured-end", scores: { improving: 8, empowering: 7, productive: 4 } },
              { id: "help-adhoc", label: "B", text: "Patch around it — ship now, fix later", consequence: "The patch works for the demo. A month later, the same bug resurfaces in production.", nextNodeId: "node-help-adhoc-end", scores: { productive: 7, improving: 2, reliable: 4 } },
            ],
          },
          "node-help-structured-end": {
            id: "node-help-structured-end",
            text: "The launch is a day late but rock-solid. The cross-team collaboration becomes a model. The borrowed developer requests to join your team permanently.",
            resourceChanges: { "Time": -3, "Team Energy": 0, "Client Trust": 1 },
            reflection: {
              prompt: "Looking back at this launch, what mattered most to you?",
              anchors: [
                { id: "ref-deadline", label: "Meeting the deadline", tenet: "productive" },
                { id: "ref-wellbeing", label: "Team wellbeing", tenet: "balanced" },
                { id: "ref-client", label: "Client expectations", tenet: "clientFocused" },
              ],
            },
          },
          "node-help-adhoc-end": {
            id: "node-help-adhoc-end",
            text: "The demo goes smoothly and launches on time. But the tech debt ticket you created sits untouched for 6 weeks until the bug bites again in production.",
            resourceChanges: { "Time": -1, "Team Energy": -1, "Client Trust": -1 },
            reflection: {
              prompt: "Looking back at this launch, what mattered most to you?",
              anchors: [
                { id: "ref-deadline", label: "Meeting the deadline", tenet: "productive" },
                { id: "ref-wellbeing", label: "Team wellbeing", tenet: "balanced" },
                { id: "ref-client", label: "Client expectations", tenet: "clientFocused" },
              ],
            },
          },
          "node-transparent-risks": {
            id: "node-transparent-risks",
            text: "The VP suggests a compromise: launch with 2 modules on schedule, and present a clear plan for module 3. Your team now has options.",
            resourceChanges: { "Time": -1, "Team Energy": -1, "Client Trust": 1 },
            options: [
              { id: "risks-plan", label: "A", text: "Create a detailed recovery plan with milestones and share it widely", consequence: "The plan builds confidence. Everyone knows what to expect. Module 3 ships 5 days later with full test coverage.", nextNodeId: "node-risks-plan-end", scores: { transparent: 8, productive: 7, reliable: 6 } },
              { id: "risks-defer", label: "B", text: "Let the team self-organize on module 3 timing", consequence: "The team appreciates the autonomy. They ship module 3 in a week with creative shortcuts that actually improve the design.", nextNodeId: "node-risks-defer-end", scores: { empowering: 8, balanced: 7, improving: 6 } },
            ],
          },
          "node-risks-plan-end": {
            id: "node-risks-plan-end",
            text: "The structured plan pays off. Stakeholders reference it as an example of good communication. The team finishes strong.",
            resourceChanges: { "Time": -3, "Team Energy": -2, "Client Trust": 2 },
            reflection: {
              prompt: "Looking back at this launch, what mattered most to you?",
              anchors: [
                { id: "ref-deadline", label: "Meeting the deadline", tenet: "productive" },
                { id: "ref-wellbeing", label: "Team wellbeing", tenet: "balanced" },
                { id: "ref-client", label: "Client expectations", tenet: "clientFocused" },
              ],
            },
          },
          "node-risks-defer-end": {
            id: "node-risks-defer-end",
            text: "Module 3 launches with some clever improvements the team thought of on their own. They feel ownership and pride in the result.",
            resourceChanges: { "Time": -2, "Team Energy": -1, "Client Trust": 1 },
            reflection: {
              prompt: "Looking back at this launch, what mattered most to you?",
              anchors: [
                { id: "ref-deadline", label: "Meeting the deadline", tenet: "productive" },
                { id: "ref-wellbeing", label: "Team wellbeing", tenet: "balanced" },
                { id: "ref-client", label: "Client expectations", tenet: "clientFocused" },
              ],
            },
          },
        },
      }),
      isPublished: true,
    },
  });

  const branchScenario2 = await prisma.scenario.create({
    data: {
      title: "The Feedback Loop",
      stage: 2,
      type: "core",
      tenets: JSON.stringify(["transparent", "improving", "empowering", "reliable"]),
      scoringRubric: JSON.stringify({
        pathScores: {
          "root->direct": { transparent: 9, empowering: 5, reliable: 6 },
          "root->direct->direct-support": { empowering: 8, improving: 7, transparent: 6 },
          "root->direct->direct-document": { reliable: 8, transparent: 7, improving: 5 },
          "root->fix-quietly": { reliable: 6, productive: 7, transparent: 2 },
          "root->fix-quietly->quiet-credit": { empowering: 7, transparent: 5, reliable: 6 },
          "root->fix-quietly->quiet-absorb": { productive: 6, balanced: 4, empowering: 2 },
          "root->retro": { transparent: 7, improving: 8, empowering: 6 },
          "root->retro->retro-action": { improving: 9, transparent: 7, empowering: 6 },
          "root->retro->retro-general": { balanced: 6, transparent: 5, improving: 4 },
          "root->pair-upskill": { empowering: 9, improving: 7, balanced: 6 },
          "root->pair-upskill->pair-ongoing": { empowering: 9, improving: 8, reliable: 6 },
          "root->pair-upskill->pair-one-off": { empowering: 6, improving: 5, productive: 7 },
        },
      }),
      tree: JSON.stringify({
        rootNodeId: "root",
        nodes: {
          root: {
            id: "root",
            text: "You notice a colleague on your team has been consistently delivering work with quality issues — missed edge cases, incomplete testing, and documentation gaps. Other team members are starting to quietly fix their work. It's not malicious — they seem overwhelmed.",
            resources: [
              { label: "Team Cohesion", value: 8, max: 10, icon: "Users" },
              { label: "Output Quality", value: 5, max: 10, icon: "Target" },
              { label: "Your Time", value: 7, max: 10, icon: "Clock" },
            ],
            options: [
              { id: "direct", label: "A", text: "Have a direct, private conversation with them", consequence: "They're initially defensive but then open up — they've been dealing with personal issues and didn't realize the impact. They appreciate you coming to them first.", nextNodeId: "node-direct", scores: { transparent: 9, empowering: 5, reliable: 6 } },
              { id: "fix-quietly", label: "B", text: "Fix the issues quietly yourself to keep the team moving", consequence: "The immediate output improves but you're spending 3-4 extra hours per week. The colleague doesn't know their work is being corrected.", nextNodeId: "node-fix-quietly", scores: { reliable: 6, productive: 7, transparent: 2 } },
              { id: "retro", label: "C", text: "Raise quality standards as a topic in the next team retro", consequence: "The team discusses quality broadly. Your colleague realizes some of the examples apply to them. The conversation is productive but impersonal.", nextNodeId: "node-retro", scores: { transparent: 7, improving: 8, empowering: 6 } },
              { id: "pair-upskill", label: "D", text: "Propose pairing sessions to upskill the whole team, starting with them", consequence: "You frame it as a team initiative. Your colleague is receptive because it doesn't single them out. Progress is slow but genuine.", nextNodeId: "node-pair-upskill", scores: { empowering: 9, improving: 7, balanced: 6 } },
            ],
          },
          "node-direct": {
            id: "node-direct",
            text: "Your colleague is grateful for the private conversation. They ask for help getting back on track. You now need to decide how to support them without creating dependency.",
            resourceChanges: { "Team Cohesion": 1, "Output Quality": 0, "Your Time": -1 },
            options: [
              { id: "direct-support", label: "A", text: "Create a lightweight checklist they can use to self-review before submitting work", consequence: "The checklist becomes a team resource. Your colleague's quality improves steadily over two weeks. Others adopt it too.", nextNodeId: "node-direct-support-end", scores: { empowering: 8, improving: 7, transparent: 6 } },
              { id: "direct-document", label: "B", text: "Set up weekly 1:1 check-ins to review their work before it goes to the team", consequence: "Quality improves quickly but they become reliant on your reviews. When you're on vacation, the issues return.", nextNodeId: "node-direct-document-end", scores: { reliable: 8, transparent: 7, empowering: 3 } },
            ],
          },
          "node-direct-support-end": {
            id: "node-direct-support-end",
            text: "Three weeks later, the colleague's work quality has measurably improved. They've even added items to the checklist based on their own learnings. The team dynamic is stronger.",
            resourceChanges: { "Team Cohesion": 2, "Output Quality": 3, "Your Time": 0 },
            reflection: {
              prompt: "What mattered most to you in this situation?",
              anchors: [
                { id: "ref-honest", label: "Being honest", tenet: "transparent" },
                { id: "ref-results", label: "Getting results", tenet: "reliable" },
                { id: "ref-grow", label: "Helping them grow", tenet: "empowering" },
              ],
            },
          },
          "node-direct-document-end": {
            id: "node-direct-document-end",
            text: "The colleague's work is solid when you review it but they haven't internalized the quality standards. You realize you've created a bottleneck.",
            resourceChanges: { "Team Cohesion": 1, "Output Quality": 2, "Your Time": -3 },
            reflection: {
              prompt: "What mattered most to you in this situation?",
              anchors: [
                { id: "ref-honest", label: "Being honest", tenet: "transparent" },
                { id: "ref-results", label: "Getting results", tenet: "reliable" },
                { id: "ref-grow", label: "Helping them grow", tenet: "empowering" },
              ],
            },
          },
          "node-fix-quietly": {
            id: "node-fix-quietly",
            text: "Two weeks have passed. You're spending significant time fixing their work. Another teammate notices and asks why you're always touching their PRs.",
            resourceChanges: { "Team Cohesion": -1, "Output Quality": 1, "Your Time": -3 },
            options: [
              { id: "quiet-credit", label: "A", text: "Come clean — share what you've been doing and suggest a team discussion", consequence: "The team is understanding. Your colleague is embarrassed but appreciative. You all agree on a better process.", nextNodeId: "node-quiet-credit-end", scores: { transparent: 8, empowering: 6, improving: 5 } },
              { id: "quiet-absorb", label: "B", text: "Downplay it — say you're just being thorough with reviews", consequence: "The pattern continues. You're now spending 5+ hours per week. Your own work quality starts to slip.", nextNodeId: "node-quiet-absorb-end", scores: { productive: 3, balanced: 2, transparent: 1 } },
            ],
          },
          "node-quiet-credit-end": {
            id: "node-quiet-credit-end",
            text: "The team implements a peer review rotation. Quality improves across the board, not just for your colleague. The transparency strengthened trust.",
            resourceChanges: { "Team Cohesion": 2, "Output Quality": 2, "Your Time": 1 },
            reflection: {
              prompt: "What mattered most to you in this situation?",
              anchors: [
                { id: "ref-honest", label: "Being honest", tenet: "transparent" },
                { id: "ref-results", label: "Getting results", tenet: "reliable" },
                { id: "ref-grow", label: "Helping them grow", tenet: "empowering" },
              ],
            },
          },
          "node-quiet-absorb-end": {
            id: "node-quiet-absorb-end",
            text: "Your manager flags that your own output has dropped. In the 1:1, you explain the situation. Your manager wishes you'd spoken up sooner.",
            resourceChanges: { "Team Cohesion": -2, "Output Quality": -1, "Your Time": -2 },
            reflection: {
              prompt: "What mattered most to you in this situation?",
              anchors: [
                { id: "ref-honest", label: "Being honest", tenet: "transparent" },
                { id: "ref-results", label: "Getting results", tenet: "reliable" },
                { id: "ref-grow", label: "Helping them grow", tenet: "empowering" },
              ],
            },
          },
          "node-retro": {
            id: "node-retro",
            text: "The retro surfaced good discussion. The team agreed to improve code review standards. Your colleague seems to have gotten the message. A week later, you need to decide on follow-through.",
            resourceChanges: { "Team Cohesion": 0, "Output Quality": 1, "Your Time": -1 },
            options: [
              { id: "retro-action", label: "A", text: "Turn the retro discussion into concrete action items with owners and deadlines", consequence: "The action items drive real change. Quality metrics improve. Your colleague asks to own one of the action items.", nextNodeId: "node-retro-action-end", scores: { improving: 9, transparent: 7, empowering: 6 } },
              { id: "retro-general", label: "B", text: "Let the retro insights settle naturally — the team heard the message", consequence: "Initial improvement fades after two sprints. Without structure, the old patterns return.", nextNodeId: "node-retro-general-end", scores: { balanced: 5, improving: 3, productive: 4 } },
            ],
          },
          "node-retro-action-end": {
            id: "node-retro-action-end",
            text: "The structured follow-through worked. Quality standards are higher across the entire team. Your colleague has become one of the most rigorous reviewers.",
            resourceChanges: { "Team Cohesion": 2, "Output Quality": 3, "Your Time": -1 },
            reflection: {
              prompt: "What mattered most to you in this situation?",
              anchors: [
                { id: "ref-honest", label: "Being honest", tenet: "transparent" },
                { id: "ref-results", label: "Getting results", tenet: "reliable" },
                { id: "ref-grow", label: "Helping them grow", tenet: "empowering" },
              ],
            },
          },
          "node-retro-general-end": {
            id: "node-retro-general-end",
            text: "Two months later, the same quality issues resurface. The team is frustrated that nothing really changed. Another retro is scheduled.",
            resourceChanges: { "Team Cohesion": -1, "Output Quality": -1, "Your Time": 0 },
            reflection: {
              prompt: "What mattered most to you in this situation?",
              anchors: [
                { id: "ref-honest", label: "Being honest", tenet: "transparent" },
                { id: "ref-results", label: "Getting results", tenet: "reliable" },
                { id: "ref-grow", label: "Helping them grow", tenet: "empowering" },
              ],
            },
          },
          "node-pair-upskill": {
            id: "node-pair-upskill",
            text: "The pairing sessions are going well. Your colleague is improving but it's taking more of your time than expected. Your manager asks about the ROI of the pairing initiative.",
            resourceChanges: { "Team Cohesion": 1, "Output Quality": 1, "Your Time": -2 },
            options: [
              { id: "pair-ongoing", label: "A", text: "Propose making pairing a permanent team practice with rotating pairs", consequence: "The team adopts rotating pairs. Knowledge sharing increases. Your colleague thrives as both learner and teacher.", nextNodeId: "node-pair-ongoing-end", scores: { empowering: 9, improving: 8, balanced: 6 } },
              { id: "pair-one-off", label: "B", text: "Wind down the formal sessions — they've served their purpose", consequence: "Your colleague improved but the momentum stalls. Without structure, they slowly drift back to old habits.", nextNodeId: "node-pair-one-off-end", scores: { productive: 7, improving: 4, balanced: 5 } },
            ],
          },
          "node-pair-ongoing-end": {
            id: "node-pair-ongoing-end",
            text: "Six weeks later, the team's overall velocity has increased 15%. Knowledge silos are gone. Your colleague mentors a new hire using the pairing format.",
            resourceChanges: { "Team Cohesion": 3, "Output Quality": 2, "Your Time": 0 },
            reflection: {
              prompt: "What mattered most to you in this situation?",
              anchors: [
                { id: "ref-honest", label: "Being honest", tenet: "transparent" },
                { id: "ref-results", label: "Getting results", tenet: "reliable" },
                { id: "ref-grow", label: "Helping them grow", tenet: "empowering" },
              ],
            },
          },
          "node-pair-one-off-end": {
            id: "node-pair-one-off-end",
            text: "The colleague improved somewhat but plateaus. Without ongoing support, the quality issues partially return. You got your time back but the underlying problem persists.",
            resourceChanges: { "Team Cohesion": 0, "Output Quality": 0, "Your Time": 1 },
            reflection: {
              prompt: "What mattered most to you in this situation?",
              anchors: [
                { id: "ref-honest", label: "Being honest", tenet: "transparent" },
                { id: "ref-results", label: "Getting results", tenet: "reliable" },
                { id: "ref-grow", label: "Helping them grow", tenet: "empowering" },
              ],
            },
          },
        },
      }),
      isPublished: true,
    },
  });

  const branchScenario3 = await prisma.scenario.create({
    data: {
      title: "The Ethical Edge",
      stage: 2,
      type: "core",
      tenets: JSON.stringify(["transparent", "clientFocused", "reliable", "balanced"]),
      scoringRubric: JSON.stringify({
        pathScores: {
          "root->flag-now": { transparent: 9, reliable: 7, clientFocused: 6 },
          "root->flag-now->flag-fix": { transparent: 8, improving: 7, reliable: 8 },
          "root->flag-now->flag-report": { transparent: 9, reliable: 6, balanced: 5 },
          "root->research": { balanced: 8, transparent: 5, improving: 7 },
          "root->research->research-present": { transparent: 8, improving: 8, balanced: 7 },
          "root->research->research-fix-quiet": { improving: 6, reliable: 7, transparent: 3 },
          "root->discuss-team": { empowering: 7, transparent: 6, balanced: 8 },
          "root->discuss-team->team-united": { empowering: 8, transparent: 8, reliable: 7 },
          "root->discuss-team->team-split": { balanced: 6, transparent: 5, empowering: 4 },
          "root->gradual-fix": { balanced: 7, improving: 8, reliable: 6 },
          "root->gradual-fix->gradual-transparent": { transparent: 8, improving: 7, clientFocused: 7 },
          "root->gradual-fix->gradual-quiet": { improving: 6, balanced: 5, transparent: 2 },
        },
      }),
      tree: JSON.stringify({
        rootNodeId: "root",
        nodes: {
          root: {
            id: "root",
            text: "While preparing a quarterly business review for a major client, you discover that the engagement metrics in your team's dashboard have been inflated. A formula error has been overstating user activity by roughly 20% for the past two quarters. The client has been making business decisions based on these numbers.",
            resources: [
              { label: "Client Trust", value: 9, max: 10, icon: "Shield" },
              { label: "Team Reputation", value: 8, max: 10, icon: "Star" },
              { label: "Your Credibility", value: 7, max: 10, icon: "Award" },
            ],
            options: [
              { id: "flag-now", label: "A", text: "Flag it immediately — tell your manager and the client today", consequence: "Your manager is alarmed but grateful you caught it. The client is upset but respects the proactive disclosure. The next 48 hours are intense.", nextNodeId: "node-flag-now", scores: { transparent: 9, reliable: 7, clientFocused: 6 } },
              { id: "research", label: "B", text: "Research the scope first — understand exactly what's wrong before sounding the alarm", consequence: "You spend a day analyzing the error. You now have a complete picture: it affects 3 reports, 2 quarters, and one critical business decision the client made.", nextNodeId: "node-research", scores: { balanced: 8, transparent: 5, improving: 7 } },
              { id: "discuss-team", label: "C", text: "Discuss with your team first — get alignment before escalating", consequence: "Your team is shocked. One person suggests fixing it quietly. Another wants to disclose everything. The team is divided.", nextNodeId: "node-discuss-team", scores: { empowering: 7, transparent: 6, balanced: 8 } },
              { id: "gradual-fix", label: "D", text: "Fix the formula and gradually correct the numbers over the next quarter", consequence: "The formula is fixed. Current numbers are now accurate. But the historical reports the client relied on were wrong, and they don't know it.", nextNodeId: "node-gradual-fix", scores: { balanced: 7, improving: 8, transparent: 3 } },
            ],
          },
          "node-flag-now": {
            id: "node-flag-now",
            text: "The client's VP calls an emergency meeting. They want to understand the impact and what you're doing about it. Your manager asks you to lead the response.",
            resourceChanges: { "Client Trust": -3, "Team Reputation": -2, "Your Credibility": 2 },
            options: [
              { id: "flag-fix", label: "A", text: "Present a detailed correction plan with corrected data and a timeline for re-analysis", consequence: "The client is impressed by the thoroughness. They're still upset about the error but trust your team to make it right. The relationship survives.", nextNodeId: "node-flag-fix-end", scores: { transparent: 8, improving: 7, reliable: 8 } },
              { id: "flag-report", label: "B", text: "Provide the corrected numbers and let the client decide next steps", consequence: "The client appreciates the honesty but feels the burden of re-analysis falls on them. They question whether to continue the engagement.", nextNodeId: "node-flag-report-end", scores: { transparent: 9, clientFocused: 4, reliable: 5 } },
            ],
          },
          "node-flag-fix-end": {
            id: "node-flag-fix-end",
            text: "One month later, the client renews their contract. They cite your team's transparency and thorough response as the deciding factor. Your credibility within the company rises.",
            resourceChanges: { "Client Trust": 3, "Team Reputation": 1, "Your Credibility": 2 },
            reflection: {
              prompt: "What mattered most to you when you discovered the error?",
              anchors: [
                { id: "ref-right", label: "Doing the right thing", tenet: "transparent" },
                { id: "ref-protect", label: "Protecting the team", tenet: "balanced" },
                { id: "ref-best", label: "Finding the best approach", tenet: "improving" },
              ],
            },
          },
          "node-flag-report-end": {
            id: "node-flag-report-end",
            text: "The client puts the engagement on hold for a month while they reassess. Eventually they return, but the relationship has cooled. Your manager wishes you'd offered more support.",
            resourceChanges: { "Client Trust": -1, "Team Reputation": 0, "Your Credibility": 0 },
            reflection: {
              prompt: "What mattered most to you when you discovered the error?",
              anchors: [
                { id: "ref-right", label: "Doing the right thing", tenet: "transparent" },
                { id: "ref-protect", label: "Protecting the team", tenet: "balanced" },
                { id: "ref-best", label: "Finding the best approach", tenet: "improving" },
              ],
            },
          },
          "node-research": {
            id: "node-research",
            text: "You now have a complete analysis. The error affected one major decision the client made — they expanded a program based on the inflated metrics. The QBR is in 3 days.",
            resourceChanges: { "Client Trust": 0, "Team Reputation": 0, "Your Credibility": -1 },
            options: [
              { id: "research-present", label: "A", text: "Present the full analysis to leadership with a recommended disclosure plan", consequence: "Leadership is grateful for the thorough analysis. They ask you to lead the client conversation. The disclosure goes smoothly because you have answers to every question.", nextNodeId: "node-research-present-end", scores: { transparent: 9, improving: 8, reliable: 7 } },
              { id: "research-fix-quiet", label: "B", text: "Fix the formula, correct future reports, and hope nobody notices the historical discrepancy", consequence: "The QBR uses correct numbers. The client notices the metrics dropped and asks probing questions. You have to explain on the spot.", nextNodeId: "node-research-fix-quiet-end", scores: { productive: 5, transparent: 2, balanced: 4 } },
            ],
          },
          "node-research-present-end": {
            id: "node-research-present-end",
            text: "The disclosure meeting is difficult but your preparation makes it manageable. The client respects that you came with solutions, not just problems. They renew with tighter reporting requirements.",
            resourceChanges: { "Client Trust": 1, "Team Reputation": 1, "Your Credibility": 3 },
            reflection: {
              prompt: "What mattered most to you when you discovered the error?",
              anchors: [
                { id: "ref-right", label: "Doing the right thing", tenet: "transparent" },
                { id: "ref-protect", label: "Protecting the team", tenet: "balanced" },
                { id: "ref-best", label: "Finding the best approach", tenet: "improving" },
              ],
            },
          },
          "node-research-fix-quiet-end": {
            id: "node-research-fix-quiet-end",
            text: "Your unprepared explanation raises more questions than it answers. The client loses trust in the data entirely. An audit is initiated that consumes weeks of team time.",
            resourceChanges: { "Client Trust": -4, "Team Reputation": -3, "Your Credibility": -2 },
            reflection: {
              prompt: "What mattered most to you when you discovered the error?",
              anchors: [
                { id: "ref-right", label: "Doing the right thing", tenet: "transparent" },
                { id: "ref-protect", label: "Protecting the team", tenet: "balanced" },
                { id: "ref-best", label: "Finding the best approach", tenet: "improving" },
              ],
            },
          },
          "node-discuss-team": {
            id: "node-discuss-team",
            text: "The team is split: half want to disclose immediately, half want to fix it quietly. As the person who found the issue, the team looks to you to break the tie.",
            resourceChanges: { "Client Trust": 0, "Team Reputation": -1, "Your Credibility": 0 },
            options: [
              { id: "team-united", label: "A", text: "Advocate for full disclosure — the team should present a united front to the client", consequence: "The team aligns behind disclosure. Presenting as a united group strengthens the message. The client is upset but sees a team that holds itself accountable.", nextNodeId: "node-team-united-end", scores: { transparent: 9, empowering: 7, reliable: 7 } },
              { id: "team-split", label: "B", text: "Suggest a compromise — correct future reports and disclose only if asked", consequence: "The team agrees on the compromise. Two months later, the client's finance team audits historical data and finds the discrepancy. The delayed disclosure looks intentional.", nextNodeId: "node-team-split-end", scores: { balanced: 5, transparent: 2, reliable: 3 } },
            ],
          },
          "node-team-united-end": {
            id: "node-team-united-end",
            text: "The united disclosure strengthens the team's bond and the client relationship. The incident becomes a case study in your company's values training. You're asked to present it at the company all-hands.",
            resourceChanges: { "Client Trust": 1, "Team Reputation": 2, "Your Credibility": 3 },
            reflection: {
              prompt: "What mattered most to you when you discovered the error?",
              anchors: [
                { id: "ref-right", label: "Doing the right thing", tenet: "transparent" },
                { id: "ref-protect", label: "Protecting the team", tenet: "balanced" },
                { id: "ref-best", label: "Finding the best approach", tenet: "improving" },
              ],
            },
          },
          "node-team-split-end": {
            id: "node-team-split-end",
            text: "The discovery of the cover-up damages trust far more than the original error would have. The client demands a new account team. Your company's leadership is deeply disappointed.",
            resourceChanges: { "Client Trust": -5, "Team Reputation": -4, "Your Credibility": -3 },
            reflection: {
              prompt: "What mattered most to you when you discovered the error?",
              anchors: [
                { id: "ref-right", label: "Doing the right thing", tenet: "transparent" },
                { id: "ref-protect", label: "Protecting the team", tenet: "balanced" },
                { id: "ref-best", label: "Finding the best approach", tenet: "improving" },
              ],
            },
          },
          "node-gradual-fix": {
            id: "node-gradual-fix",
            text: "The current quarter's numbers are now accurate. But at the QBR, the client notices a 20% drop in engagement metrics and asks what happened.",
            resourceChanges: { "Client Trust": -1, "Team Reputation": 0, "Your Credibility": -1 },
            options: [
              { id: "gradual-transparent", label: "A", text: "Use this moment to come clean — explain the formula error and the correction", consequence: "The client is unhappy about the delay in disclosure but appreciates that you corrected it. They request an audit of all historical reports.", nextNodeId: "node-gradual-transparent-end", scores: { transparent: 8, clientFocused: 6, reliable: 5 } },
              { id: "gradual-quiet", label: "B", text: "Attribute the drop to seasonal trends and market conditions", consequence: "The client accepts the explanation initially. But their own analysts later find the discrepancy. Trust is shattered.", nextNodeId: "node-gradual-quiet-end", scores: { productive: 4, transparent: 1, clientFocused: 2 } },
            ],
          },
          "node-gradual-transparent-end": {
            id: "node-gradual-transparent-end",
            text: "The audit reveals the full scope. It's painful but the relationship survives because you eventually chose honesty. The client requests quarterly formula reviews going forward.",
            resourceChanges: { "Client Trust": -1, "Team Reputation": -1, "Your Credibility": 1 },
            reflection: {
              prompt: "What mattered most to you when you discovered the error?",
              anchors: [
                { id: "ref-right", label: "Doing the right thing", tenet: "transparent" },
                { id: "ref-protect", label: "Protecting the team", tenet: "balanced" },
                { id: "ref-best", label: "Finding the best approach", tenet: "improving" },
              ],
            },
          },
          "node-gradual-quiet-end": {
            id: "node-gradual-quiet-end",
            text: "The client's analysts uncover the truth. They terminate the contract and cite a pattern of dishonesty. Your team's reputation takes a lasting hit.",
            resourceChanges: { "Client Trust": -6, "Team Reputation": -5, "Your Credibility": -4 },
            reflection: {
              prompt: "What mattered most to you when you discovered the error?",
              anchors: [
                { id: "ref-right", label: "Doing the right thing", tenet: "transparent" },
                { id: "ref-protect", label: "Protecting the team", tenet: "balanced" },
                { id: "ref-best", label: "Finding the best approach", tenet: "improving" },
              ],
            },
          },
        },
      }),
      isPublished: true,
    },
  });

  // ---------------------------------------------------------------------------
  // Stage 3 Scenarios (role-specific) — unchanged
  // ---------------------------------------------------------------------------

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
  const coreScenarios = [triageTower, tradeOffTiles, signalSort, resourceRoulette, branchScenario1, branchScenario2, branchScenario3];
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
