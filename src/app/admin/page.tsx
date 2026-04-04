"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Briefcase, Users, Clock, CheckCircle2, ArrowRight,
  UserPlus, GitBranch, TrendingUp, Activity,
} from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";

interface RoleData {
  id: string;
  name: string;
  _count: { candidates: number; roleScenarios: number };
}

interface CandidateData {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
  role: { name: string };
  assessment: { score: { compositeScore: number } | null } | null;
}

export default function AdminDashboard() {
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/roles").then((r) => r.json()),
      fetch("/api/admin/candidates").then((r) => r.json()),
    ]).then(([r, c]) => {
      setRoles(r);
      setCandidates(c);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const totalRoles = roles.length;
  const totalCandidates = candidates.length;
  const pendingScoring = candidates.filter(
    (c) => c.status === "completed" && !c.assessment?.score
  ).length;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const completedToday = candidates.filter(
    (c) =>
      (c.status === "completed" || c.status === "scored") &&
      new Date(c.createdAt) >= todayStart
  ).length;

  const recentCandidates = [...candidates]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const statusColors: Record<string, { bg: string; color: string }> = {
    invited: { bg: "var(--info-surface)", color: "var(--info)" },
    in_progress: { bg: "var(--warning-surface)", color: "var(--warning)" },
    completed: { bg: "var(--cta-glow)", color: "var(--cta)" },
    scored: { bg: "var(--success-surface)", color: "var(--success)" },
  };

  const statCards = [
    { title: "Total Roles", value: totalRoles, icon: Briefcase, bg: "var(--accent-surface)", color: "var(--accent)", tooltip: "Total roles configured in the system" },
    { title: "Candidates", value: totalCandidates, icon: Users, bg: "var(--success-surface)", color: "var(--success)", tooltip: "Total candidates invited across all roles" },
    { title: "Pending Scoring", value: pendingScoring, icon: Clock, bg: "var(--warning-surface)", color: "var(--warning)", tooltip: "Completed assessments awaiting scoring" },
    { title: "Completed Today", value: completedToday, icon: CheckCircle2, bg: "var(--info-surface)", color: "var(--info)", tooltip: "Assessments completed today" },
  ];

  const quickActions = [
    { label: "Invite Candidates", href: "/admin/candidates", icon: UserPlus, color: "var(--cta)" },
    { label: "Manage Scenarios", href: "/admin/scenarios", icon: GitBranch, color: "var(--accent)" },
    { label: "View Results", href: "/admin/results", icon: TrendingUp, color: "var(--success)" },
  ];

  if (loading) {
    return (
      <div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-primary)", marginBottom: 24 }}>
          Dashboard
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card" style={{ padding: 20, height: 100 }}>
              <div style={{ width: "60%", height: 14, borderRadius: 6, background: "var(--bg-elevated)", marginBottom: 12 }} />
              <div style={{ width: "30%", height: 28, borderRadius: 6, background: "var(--bg-elevated)" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-primary)", margin: 0 }}>
            Dashboard
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: 4 }}>
            Overview of your hiring pipeline
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Activity size={16} style={{ color: "var(--success)" }} />
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>System Active</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Tooltip key={card.title} content={card.tooltip}>
              <div
                className="glass-card"
                style={{ padding: 20, cursor: "default", transition: "box-shadow var(--transition-fast), transform var(--transition-fast)" }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-glow)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-sm)"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 500, marginBottom: 4 }}>{card.title}</p>
                    <p style={{ fontSize: "2rem", fontWeight: 700, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>{card.value}</p>
                  </div>
                  <div style={{ width: 42, height: 42, borderRadius: "var(--radius-md)", background: card.bg, color: card.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={20} />
                  </div>
                </div>
              </div>
            </Tooltip>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>

        {/* Recent Candidates */}
        <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)", fontFamily: "'Space Grotesk', sans-serif", margin: 0 }}>
              Recent Candidates
            </h3>
            <Link href="/admin/candidates" style={{ fontSize: "0.8rem", color: "var(--accent)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, fontWeight: 500 }}>
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {recentCandidates.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center" }}>
              <Users size={32} style={{ color: "var(--text-muted)", marginBottom: 8 }} />
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No candidates yet</p>
              <Link href="/admin/candidates" className="btn-cta" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12, fontSize: "0.8rem", padding: "8px 16px" }}>
                <UserPlus size={14} /> Invite Candidates
              </Link>
            </div>
          ) : (
            <div>
              {recentCandidates.map((c) => {
                const sc = statusColors[c.status] || statusColors.invited;
                return (
                  <div
                    key={c.id}
                    style={{ padding: "12px 20px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "background var(--transition-fast)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-elevated)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "var(--radius-full)", background: "var(--accent-surface)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700 }}>
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{c.name}</p>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>{c.role.name}</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {c.assessment?.score && (
                        <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--accent)", fontVariantNumeric: "tabular-nums" }}>
                          {c.assessment.score.compositeScore.toFixed(1)}
                        </span>
                      )}
                      <span className="badge" style={{ background: sc.bg, color: sc.color }}>{c.status.replace("_", " ")}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Quick Actions */}
          <div className="glass-card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)", fontFamily: "'Space Grotesk', sans-serif", marginBottom: 14, margin: 0 }}>
              Quick Actions
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.label}
                    href={action.href}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", textDecoration: "none", color: "var(--text-primary)", fontSize: "0.85rem", fontWeight: 500, transition: "all var(--transition-fast)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.borderColor = "var(--border-default)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "var(--border-subtle)"; }}
                  >
                    <Icon size={16} style={{ color: action.color }} />
                    {action.label}
                    <ArrowRight size={14} style={{ marginLeft: "auto", color: "var(--text-muted)" }} />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Roles Overview */}
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)", fontFamily: "'Space Grotesk', sans-serif", margin: 0 }}>
                Roles Overview
              </h3>
              <Link href="/admin/roles" style={{ fontSize: "0.75rem", color: "var(--accent)", textDecoration: "none" }}>
                Manage
              </Link>
            </div>
            {roles.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No roles configured</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {roles.map((role) => (
                  <div key={role.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Briefcase size={14} style={{ color: "var(--accent)" }} />
                      <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--text-primary)" }}>{role.name}</span>
                    </div>
                    <span className="badge" style={{ background: "var(--accent-surface)", color: "var(--accent)" }}>
                      {role._count.candidates} candidates
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pipeline Funnel */}
          <div className="glass-card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)", fontFamily: "'Space Grotesk', sans-serif", marginBottom: 14, margin: 0 }}>
              Pipeline
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
              {[
                { label: "Invited", count: candidates.filter((c) => c.status === "invited").length, color: "var(--info)" },
                { label: "In Progress", count: candidates.filter((c) => c.status === "in_progress").length, color: "var(--warning)" },
                { label: "Completed", count: candidates.filter((c) => c.status === "completed").length, color: "var(--cta)" },
                { label: "Scored", count: candidates.filter((c) => c.status === "scored").length, color: "var(--success)" },
              ].map((stage) => (
                <div key={stage.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: 4 }}>
                    <span style={{ color: "var(--text-secondary)" }}>{stage.label}</span>
                    <span style={{ color: "var(--text-primary)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{stage.count}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: "var(--radius-full)", background: "var(--bg-elevated)", overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: "var(--radius-full)", background: stage.color, width: totalCandidates > 0 ? `${(stage.count / totalCandidates) * 100}%` : "0%", transition: "width 500ms var(--ease-spring)", minWidth: stage.count > 0 ? 8 : 0 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
