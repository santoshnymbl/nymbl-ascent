"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Briefcase,
  GitBranch,
  UserPlus,
  Gamepad2,
  BarChart3,
  CheckCircle2,
  Plus,
  Layers,
  SlidersHorizontal,
  MessageSquare,
  Coins,
  Lock,
  Clock,
  ArrowRight,
  Download,
  RefreshCw,
  LayoutDashboard,
  Users,
  ChevronRight,
  Info,
  Zap,
  Target,
  Bug,
  MessageCircle,
  Star,
  Play,
  Check,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Step definitions                                                    */
/* ------------------------------------------------------------------ */
const STEPS = [
  { id: "step-1", label: "Setup Roles", icon: Briefcase },
  { id: "step-2", label: "Configure Scenarios", icon: GitBranch },
  { id: "step-3", label: "Invite Candidates", icon: UserPlus },
  { id: "step-4", label: "Candidate Experience", icon: Gamepad2 },
  { id: "step-5", label: "Review Results", icon: BarChart3 },
  { id: "step-6", label: "Take Action", icon: CheckCircle2 },
] as const;

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */
function Badge({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: "0.72rem",
        fontWeight: 600,
        padding: "4px 10px",
        borderRadius: "var(--radius-full)",
        background: color ?? "var(--accent-surface)",
        color: color ? "var(--text-primary)" : "var(--accent)",
        letterSpacing: "0.02em",
      }}
    >
      {children}
    </span>
  );
}

function ProTip({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--info-surface)",
        border: "1px solid var(--info)",
        borderRadius: "var(--radius-md)",
        padding: "12px 16px",
        marginTop: 16,
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
      }}
    >
      <Info size={16} style={{ color: "var(--info)", flexShrink: 0, marginTop: 2 }} />
      <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
        {children}
      </p>
    </div>
  );
}

function SectionCard({
  id,
  borderColor,
  children,
}: {
  id: string;
  borderColor?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="glass-card"
      style={{
        padding: "28px 32px",
        borderLeft: `4px solid ${borderColor ?? "var(--accent)"}`,
        marginBottom: 28,
        scrollMarginTop: 140,
      }}
    >
      {children}
    </section>
  );
}

function SectionTitle({
  icon: Icon,
  step,
  title,
}: {
  icon: React.ElementType;
  step: number;
  title: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "var(--radius-full)",
          background: "var(--accent-surface)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={18} style={{ color: "var(--accent)" }} />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Step {step}
        </p>
        <h2
          style={{
            margin: 0,
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "1.25rem",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "var(--text-primary)",
          }}
        >
          {title}
        </h2>
      </div>
    </div>
  );
}

function MiniStep({
  num,
  children,
}: {
  num: number;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 14 }}>
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: "var(--radius-full)",
          background: "var(--accent)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.72rem",
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {num}
      </div>
      <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6, paddingTop: 2 }}>
        {children}
      </div>
    </div>
  );
}

function GoToLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="btn-ghost"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        marginTop: 18,
        fontSize: "0.82rem",
        fontWeight: 600,
        color: "var(--accent)",
        textDecoration: "none",
        padding: "6px 14px",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--accent)",
        transition: "var(--transition-fast)",
      }}
    >
      {label} <ArrowRight size={14} />
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                           */
/* ------------------------------------------------------------------ */
export default function GuidePage() {
  const [activeStep, setActiveStep] = useState(0);
  const [stageTab, setStageTab] = useState(0);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  /* Intersection observer to update active step on scroll */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = STEPS.findIndex((s) => s.id === entry.target.id);
            if (idx !== -1) setActiveStep(idx);
          }
        }
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    sectionRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  function scrollTo(idx: number) {
    setActiveStep(idx);
    const el = document.getElementById(STEPS[idx].id);
    el?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* ---- Hero ---- */}
      <div
        style={{
          textAlign: "center",
          padding: "40px 20px 32px",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "var(--radius-xl)",
            background: "var(--accent-surface)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <BookOpen size={28} style={{ color: "var(--accent)" }} />
        </div>
        <h1
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "2rem",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            margin: "0 0 8px",
            color: "var(--text-primary)",
          }}
        >
          How Nymbl Ascent Works
        </h1>
        <p
          style={{
            fontSize: "1rem",
            color: "var(--text-secondary)",
            maxWidth: 540,
            margin: "0 auto",
            lineHeight: 1.6,
          }}
        >
          A complete guide to setting up and running game-based candidate screening
        </p>
      </div>

      {/* ---- Sticky Stepper ---- */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "var(--bg-surface-solid)",
          borderBottom: "1px solid var(--border-subtle)",
          padding: "12px 0",
          marginBottom: 28,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 6,
            flexWrap: "wrap",
            padding: "0 12px",
          }}
        >
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = idx === activeStep;
            const isCompleted = idx < activeStep;
            return (
              <button
                key={step.id}
                onClick={() => scrollTo(idx)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 14px",
                  borderRadius: "var(--radius-full)",
                  border: isActive
                    ? "2px solid var(--accent)"
                    : isCompleted
                    ? "2px solid var(--success)"
                    : "2px solid var(--border-default)",
                  background: isActive ? "var(--accent-surface)" : "transparent",
                  color: isActive
                    ? "var(--accent)"
                    : isCompleted
                    ? "var(--success)"
                    : "var(--text-muted)",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "var(--transition-fast)",
                  whiteSpace: "nowrap",
                }}
              >
                {isCompleted ? (
                  <Check size={14} strokeWidth={2.5} />
                ) : (
                  <Icon size={14} />
                )}
                {step.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/*  STEP 1: Setup Roles                                          */}
      {/* ============================================================ */}
      <div ref={(el) => { sectionRefs.current[0] = el; }}>
        <SectionCard id="step-1">
          <SectionTitle icon={Briefcase} step={1} title="Setup Roles" />

          <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 20 }}>
            <strong style={{ color: "var(--text-primary)" }}>Define the positions you&rsquo;re hiring for.</strong>{" "}
            Each role can have its own job description and scenario pool.
          </p>

          <div
            style={{
              background: "var(--bg-elevated)",
              borderRadius: "var(--radius-lg)",
              padding: "20px 24px",
              marginBottom: 16,
            }}
          >
            <MiniStep num={1}>
              <span>Click the <strong>&ldquo;Add Role&rdquo;</strong> button</span>
              <div style={{ marginTop: 8 }}>
                <span
                  className="btn-primary"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 14px",
                    fontSize: "0.78rem",
                    borderRadius: "var(--radius-md)",
                    pointerEvents: "none",
                  }}
                >
                  <Plus size={14} /> Add Role
                </span>
              </div>
            </MiniStep>
            <MiniStep num={2}>
              <span>Fill in <strong>role name</strong>, <strong>description</strong>, and optionally <strong>upload a job description</strong></span>
              <div
                style={{
                  marginTop: 8,
                  background: "var(--bg-input)",
                  borderRadius: "var(--radius-md)",
                  padding: "10px 14px",
                  border: "1px solid var(--border-subtle)",
                  maxWidth: 340,
                }}
              >
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: 4, fontWeight: 600 }}>Role Name</div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-primary)" }}>e.g. &ldquo;Software Engineer&rdquo;</div>
              </div>
            </MiniStep>
            <MiniStep num={3}>
              <span>Set <strong>core pool size</strong> (recommended: 2&ndash;3)</span>
              <div
                style={{
                  marginTop: 8,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "var(--bg-input)",
                  borderRadius: "var(--radius-md)",
                  padding: "6px 12px",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>Pool Size:</span>
                <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--accent)" }}>3</span>
              </div>
            </MiniStep>
          </div>

          <ProTip>
            The job description helps contextualize the assessment. Candidates don&rsquo;t see it &mdash; it&rsquo;s for
            your records and future AI-powered scenario generation.
          </ProTip>

          <GoToLink href="/admin/roles" label="Go to Roles" />
        </SectionCard>
      </div>

      {/* ============================================================ */}
      {/*  STEP 2: Configure Scenarios                                  */}
      {/* ============================================================ */}
      <div ref={(el) => { sectionRefs.current[1] = el; }}>
        <SectionCard id="step-2" borderColor="var(--cta)">
          <SectionTitle icon={GitBranch} step={2} title="Configure Scenarios" />

          <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 20 }}>
            <strong style={{ color: "var(--text-primary)" }}>Scenarios are the assessment content.</strong>{" "}
            There are 3 stages, each with different types.
          </p>

          {/* Stage tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
            {["Stage 1 — Learn", "Stage 2 — Build", "Stage 3 — Grow"].map((label, idx) => (
              <button
                key={label}
                onClick={() => setStageTab(idx)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "var(--radius-md)",
                  border: stageTab === idx ? "2px solid var(--accent)" : "2px solid var(--border-default)",
                  background: stageTab === idx ? "var(--accent-surface)" : "transparent",
                  color: stageTab === idx ? "var(--accent)" : "var(--text-muted)",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "var(--transition-fast)",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Stage 1 content */}
          {stageTab === 0 && (
            <div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 16 }}>
                <strong>4 quick-fire games (3 minutes total).</strong> No right or wrong answers &mdash;
                they reveal how candidates prioritize.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                {[
                  { name: "Triage Tower", desc: "Tasks arrive one at a time. Candidate sorts into Do Now / Do Next / Delegate bins.", icon: Layers },
                  { name: "Trade-Off Tiles", desc: "Two positive behaviors, one slider. Where do they lean?", icon: SlidersHorizontal },
                  { name: "Signal Sort", desc: "Categorize ambiguous team messages as ideal or needs improvement.", icon: MessageSquare },
                  { name: "Resource Roulette", desc: "Allocate 10 time tokens across competing priorities. Then adapt to a curveball.", icon: Coins },
                ].map((game) => {
                  const GIcon = game.icon;
                  return (
                    <div
                      key={game.name}
                      style={{
                        background: "var(--bg-elevated)",
                        borderRadius: "var(--radius-md)",
                        padding: "14px 16px",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <GIcon size={16} style={{ color: "var(--accent)" }} />
                        <strong style={{ fontSize: "0.82rem", color: "var(--text-primary)" }}>{game.name}</strong>
                      </div>
                      <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                        {game.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
              <Badge>These are pre-configured and don&rsquo;t need editing</Badge>
            </div>
          )}

          {/* Stage 2 content */}
          {stageTab === 1 && (
            <div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 16 }}>
                <strong>Branching workplace scenarios (5 minutes).</strong> Candidates make decisions,
                see consequences, and face follow-ups.
              </p>

              {/* Decision tree visual */}
              <div
                style={{
                  background: "var(--bg-elevated)",
                  borderRadius: "var(--radius-lg)",
                  padding: "20px 24px",
                  marginBottom: 16,
                  fontFamily: "'Space Grotesk', sans-serif",
                  textAlign: "center",
                }}
              >
                {[
                  { label: "Situation", sub: "Choose A / B / C / D" },
                  { label: "Consequence", sub: "Follow-up choice" },
                  { label: "Reflection", sub: '"What mattered most?"' },
                ].map((node, idx) => (
                  <div key={node.label}>
                    <div
                      style={{
                        display: "inline-block",
                        padding: "8px 20px",
                        borderRadius: "var(--radius-md)",
                        border: "2px solid var(--accent)",
                        background: "var(--accent-surface)",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        color: "var(--accent)",
                      }}
                    >
                      {node.label}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: "4px 0" }}>
                      {node.sub}
                    </div>
                    {idx < 2 && (
                      <div style={{ color: "var(--text-muted)", fontSize: "1rem", margin: "2px 0" }}>&#8595;</div>
                    )}
                  </div>
                ))}
              </div>

              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 8 }}>
                Each scenario has <strong>resource bars</strong> (Time, Team Energy, Client Trust) that change based on decisions.
              </p>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 8 }}>
                Scenarios can be <strong>created manually</strong> or <strong>generated by AI</strong>.
              </p>
              <p style={{ fontSize: "0.82rem", color: "var(--text-primary)", lineHeight: 1.6, marginBottom: 14, fontWeight: 600 }}>
                The &ldquo;Core Pool Size&rdquo; on each role determines how many of these scenarios each candidate sees.
              </p>
              <Badge>You can add/edit scenarios in the Scenarios page</Badge>
            </div>
          )}

          {/* Stage 3 content */}
          {stageTab === 2 && (
            <div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 16 }}>
                <strong>Role-specific challenges (5 minutes).</strong> Different content for different roles.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                {[
                  { role: "Engineering", desc: "Debug a code snippet and choose a debugging approach", icon: Bug },
                  { role: "Sales", desc: "Handle a client objection through branching decisions", icon: MessageCircle },
                ].map((ex) => {
                  const EIcon = ex.icon;
                  return (
                    <div
                      key={ex.role}
                      style={{
                        background: "var(--bg-elevated)",
                        borderRadius: "var(--radius-md)",
                        padding: "14px 16px",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <EIcon size={16} style={{ color: "var(--cta)" }} />
                        <strong style={{ fontSize: "0.82rem", color: "var(--text-primary)" }}>{ex.role}</strong>
                      </div>
                      <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                        {ex.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
              <Badge color="var(--warning-surface)">Currently 2 role types. More can be added.</Badge>
            </div>
          )}

          <div style={{ marginTop: 6 }}>
            <GoToLink href="/admin/scenarios" label="Go to Scenarios" />
          </div>
        </SectionCard>
      </div>

      {/* ============================================================ */}
      {/*  STEP 3: Invite Candidates                                    */}
      {/* ============================================================ */}
      <div ref={(el) => { sectionRefs.current[2] = el; }}>
        <SectionCard id="step-3" borderColor="var(--success)">
          <SectionTitle icon={UserPlus} step={3} title="Invite Candidates" />

          <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 20 }}>
            <strong style={{ color: "var(--text-primary)" }}>Send assessment links to candidates.</strong>{" "}
            Each gets a unique token &mdash; no account needed.
          </p>

          <div
            style={{
              background: "var(--bg-elevated)",
              borderRadius: "var(--radius-lg)",
              padding: "20px 24px",
              marginBottom: 16,
            }}
          >
            <MiniStep num={1}>
              Go to <strong>Candidates</strong> page and click <strong>&ldquo;Invite Candidates&rdquo;</strong>
            </MiniStep>
            <MiniStep num={2}>
              Select the <strong>role</strong>, enter <strong>name + email</strong> (or bulk upload via CSV)
            </MiniStep>
            <MiniStep num={3}>
              Click <strong>&ldquo;Send Invite&rdquo;</strong> &mdash; candidate receives an email with their unique link
            </MiniStep>
          </div>

          {/* Candidate link example */}
          <div
            style={{
              background: "var(--bg-input)",
              borderRadius: "var(--radius-md)",
              padding: "14px 18px",
              border: "1px solid var(--border-subtle)",
              marginBottom: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Lock size={14} style={{ color: "var(--accent)" }} />
              <strong style={{ fontSize: "0.82rem", color: "var(--text-primary)" }}>The candidate link</strong>
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: "0.8rem",
                color: "var(--accent)",
                background: "var(--bg-base)",
                padding: "8px 12px",
                borderRadius: "var(--radius-sm)",
                marginBottom: 10,
              }}
            >
              yoursite.com/assess/abc123...
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.8 }}>
              <li>Each link is <strong>unique</strong>, expires in 7 days, and can be paused/resumed</li>
              <li>Candidates <strong>don&rsquo;t create an account</strong> &mdash; just click and play</li>
            </ul>
          </div>

          <ProTip>
            For bulk invites, upload a CSV with &ldquo;name&rdquo; and &ldquo;email&rdquo; columns.
          </ProTip>

          <GoToLink href="/admin/candidates" label="Go to Candidates" />
        </SectionCard>
      </div>

      {/* ============================================================ */}
      {/*  STEP 4: Candidate Experience                                 */}
      {/* ============================================================ */}
      <div ref={(el) => { sectionRefs.current[3] = el; }}>
        <SectionCard id="step-4" borderColor="var(--cta)">
          <SectionTitle icon={Gamepad2} step={4} title="Candidate Experience" />

          <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 24 }}>
            Here&rsquo;s what candidates see after clicking their assessment link.
          </p>

          {/* Timeline */}
          <div style={{ position: "relative", paddingLeft: 32 }}>
            {/* Vertical line */}
            <div
              style={{
                position: "absolute",
                left: 14,
                top: 8,
                bottom: 8,
                width: 2,
                background: "var(--border-default)",
                borderRadius: 1,
              }}
            />

            {/* Welcome */}
            <TimelineNode color="var(--accent)" icon={Play} label="Welcome Screen">
              <p style={tlP}>
                Candidate sees the <strong>role name</strong>, a <strong>3-stage overview</strong>,
                and a <strong>&ldquo;Begin Assessment&rdquo;</strong> button.
              </p>
            </TimelineNode>

            {/* Stage 1 */}
            <TimelineNode color="var(--info)" icon={Zap} label="Stage 1 — Learn" badge="3 min">
              <p style={tlP}>
                <strong>4 quick games:</strong> Triage Tower, Trade-Off Tiles, Signal Sort, Resource Roulette
              </p>
              <p style={tlP}>
                Timer runs across all games. Progress bar shows which game they&rsquo;re on.
              </p>
              <div style={transitionStyle}>
                Transition: &ldquo;Nice work! Now let&rsquo;s build.&rdquo;
              </div>
            </TimelineNode>

            {/* Stage 2 */}
            <TimelineNode color="var(--cta)" icon={GitBranch} label="Stage 2 — Build" badge="5 min">
              <p style={tlP}>
                <strong>2&ndash;3 branching scenarios</strong> with real workplace dilemmas
              </p>
              <p style={tlP}>
                Resource bars show trade-off consequences
              </p>
              <p style={tlP}>
                Ends with a reflection: &ldquo;What mattered most?&rdquo;
              </p>
              <div style={transitionStyle}>
                Transition: &ldquo;One more stage &mdash; show us how you grow.&rdquo;
              </div>
            </TimelineNode>

            {/* Stage 3 */}
            <TimelineNode color="var(--warning)" icon={Target} label="Stage 3 — Grow" badge="5 min">
              <p style={tlP}>
                <strong>Role-specific challenge</strong> (debug puzzle for engineers, client scenario for sales)
              </p>
            </TimelineNode>

            {/* Completion */}
            <TimelineNode color="var(--success)" icon={CheckCircle2} label="Completion">
              <p style={tlP}>
                Candidate sees <strong>&ldquo;Assessment Complete!&rdquo;</strong> screen
              </p>
              <p style={tlP}>
                Scoring happens <strong>automatically</strong> in the background
              </p>
              <p style={tlP}>
                You&rsquo;ll see results in the <strong>Results page</strong>
              </p>
            </TimelineNode>
          </div>
        </SectionCard>
      </div>

      {/* ============================================================ */}
      {/*  STEP 5: Review Results                                       */}
      {/* ============================================================ */}
      <div ref={(el) => { sectionRefs.current[4] = el; }}>
        <SectionCard id="step-5" borderColor="var(--accent)">
          <SectionTitle icon={BarChart3} step={5} title="Review Results" />

          <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 20 }}>
            <strong style={{ color: "var(--text-primary)" }}>After a candidate completes the assessment, their scores appear automatically.</strong>{" "}
            Go to the Results page &mdash; candidates are ranked by composite score.
          </p>

          <div
            style={{
              background: "var(--bg-elevated)",
              borderRadius: "var(--radius-lg)",
              padding: "20px 24px",
              marginBottom: 16,
            }}
          >
            <h4 style={{ margin: "0 0 12px", fontSize: "0.88rem", color: "var(--text-primary)", fontFamily: "'Space Grotesk', sans-serif" }}>
              What you&rsquo;ll see
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "Composite Score", desc: "0\u2013100 overall rating", icon: Star },
                { label: "7 Tenet Scores", desc: "How they scored on each Nymbl value", icon: Target },
                { label: "Radar Chart", desc: "Visual profile of their strengths", icon: BarChart3 },
                { label: "Behavioral Signals", desc: "Were they thoughtful or rushing?", icon: Clock },
              ].map((item) => {
                const IIcon = item.icon;
                return (
                  <div
                    key={item.label}
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "flex-start",
                      padding: "10px 12px",
                      background: "var(--bg-base)",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <IIcon size={16} style={{ color: "var(--accent)", marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <strong style={{ fontSize: "0.8rem", color: "var(--text-primary)" }}>{item.label}</strong>
                      <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--text-muted)" }}>{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            style={{
              background: "var(--accent-surface)",
              borderRadius: "var(--radius-md)",
              padding: "14px 18px",
              border: "1px solid var(--accent)",
              marginBottom: 8,
            }}
          >
            <strong style={{ fontSize: "0.82rem", color: "var(--accent)" }}>How scores work</strong>
            <p style={{ margin: "6px 0 0", fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              See the Scoring page for the full formula. Quick version:{" "}
              <strong>60% tenet alignment + 25% role fit + 15% behavioral signals.</strong>
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <GoToLink href="/admin/results" label="Go to Results" />
            <GoToLink href="/admin/scoring" label="See Scoring Formula" />
          </div>
        </SectionCard>
      </div>

      {/* ============================================================ */}
      {/*  STEP 6: Take Action                                          */}
      {/* ============================================================ */}
      <div ref={(el) => { sectionRefs.current[5] = el; }}>
        <SectionCard id="step-6" borderColor="var(--success)">
          <SectionTitle icon={CheckCircle2} step={6} title="Take Action" />

          <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 20 }}>
            <strong style={{ color: "var(--text-primary)" }}>Use the assessment data to make better hiring decisions.</strong>
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 18 }}>
            {[
              { title: "Compare", desc: "Sort candidates by any tenet to find the best match for your team's needs", icon: BarChart3, color: "var(--accent)" },
              { title: "Export", desc: "Download results as CSV for sharing with hiring managers", icon: Download, color: "var(--cta)" },
              { title: "Iterate", desc: "Adjust scenarios, add new roles, and refine your assessment over time", icon: RefreshCw, color: "var(--success)" },
            ].map((card) => {
              const CIcon = card.icon;
              return (
                <div
                  key={card.title}
                  style={{
                    background: "var(--bg-elevated)",
                    borderRadius: "var(--radius-lg)",
                    padding: "20px 18px",
                    border: "1px solid var(--border-subtle)",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "var(--radius-full)",
                      background: "var(--bg-base)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 10,
                    }}
                  >
                    <CIcon size={20} style={{ color: card.color }} />
                  </div>
                  <h4 style={{ margin: "0 0 6px", fontSize: "0.88rem", color: "var(--text-primary)", fontFamily: "'Space Grotesk', sans-serif" }}>
                    {card.title}
                  </h4>
                  <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                    {card.desc}
                  </p>
                </div>
              );
            })}
          </div>

          <ProTip>
            The assessment is one data point, not the final answer. Use it alongside interviews,
            references, and work samples for the best results.
          </ProTip>
        </SectionCard>
      </div>

      {/* ============================================================ */}
      {/*  Quick Links                                                  */}
      {/* ============================================================ */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 14,
          marginTop: 12,
          marginBottom: 40,
        }}
      >
        {[
          { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
          { href: "/admin/roles", label: "Roles", icon: Briefcase },
          { href: "/admin/candidates", label: "Candidates", icon: Users },
          { href: "/admin/results", label: "Results", icon: BarChart3 },
        ].map((link) => {
          const LIcon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="glass-card"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "16px 18px",
                textDecoration: "none",
                borderRadius: "var(--radius-lg)",
                transition: "var(--transition-fast)",
              }}
            >
              <LIcon size={18} style={{ color: "var(--accent)" }} />
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
                {link.label}
              </span>
              <ChevronRight size={14} style={{ color: "var(--text-muted)", marginLeft: "auto" }} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Timeline helpers                                                    */
/* ------------------------------------------------------------------ */
const tlP: React.CSSProperties = {
  margin: "0 0 6px",
  fontSize: "0.82rem",
  color: "var(--text-secondary)",
  lineHeight: 1.6,
};

const transitionStyle: React.CSSProperties = {
  marginTop: 8,
  fontSize: "0.75rem",
  fontStyle: "italic",
  color: "var(--text-muted)",
  paddingLeft: 10,
  borderLeft: "2px solid var(--border-subtle)",
};

function TimelineNode({
  color,
  icon: Icon,
  label,
  badge,
  children,
}: {
  color: string;
  icon: React.ElementType;
  label: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ position: "relative", marginBottom: 24 }}>
      {/* Dot */}
      <div
        style={{
          position: "absolute",
          left: -32,
          top: 2,
          width: 28,
          height: 28,
          borderRadius: "var(--radius-full)",
          background: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2,
        }}
      >
        <Icon size={14} style={{ color: "#fff" }} />
      </div>
      {/* Content */}
      <div style={{ paddingLeft: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <strong style={{ fontSize: "0.88rem", color: "var(--text-primary)" }}>{label}</strong>
          {badge && (
            <span
              style={{
                fontSize: "0.65rem",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "var(--radius-full)",
                background: color,
                color: "#fff",
              }}
            >
              {badge}
            </span>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
