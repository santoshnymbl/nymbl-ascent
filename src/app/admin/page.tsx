"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Briefcase, Users, Clock, CheckCircle2, ArrowRight,
  UserPlus, GitBranch, TrendingUp, Activity, Zap,
} from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";

interface RoleData { id: string; name: string; _count: { candidates: number; roleScenarios: number }; }
interface CandidateData { id: string; name: string; email: string; status: string; createdAt: string; role: { name: string }; assessment: { score: { compositeScore: number } | null } | null; }

export default function AdminDashboard() {
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/roles").then((r) => r.json()),
      fetch("/api/admin/candidates").then((r) => r.json()),
    ]).then(([r, c]) => { setRoles(r); setCandidates(c); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const totalCandidates = candidates.length;
  const pendingScoring = candidates.filter((c) => c.status === "completed" && !c.assessment?.score).length;
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const completedToday = candidates.filter((c) => (c.status === "completed" || c.status === "scored") && new Date(c.createdAt) >= todayStart).length;
  const recentCandidates = [...candidates].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6);

  const statusStyle: Record<string, { bg: string; color: string; label: string }> = {
    invited: { bg: "var(--info-surface)", color: "var(--info)", label: "Invited" },
    in_progress: { bg: "var(--warning-surface)", color: "var(--warning)", label: "In Progress" },
    completed: { bg: "var(--cta-glow)", color: "var(--cta)", label: "Completed" },
    scored: { bg: "var(--success-surface)", color: "var(--success)", label: "Scored" },
  };

  const stats = [
    { title: "Total Roles", value: roles.length, icon: Briefcase, color: "var(--accent)", bg: "var(--accent-surface)", tip: "Active roles configured" },
    { title: "Candidates", value: totalCandidates, icon: Users, color: "var(--success)", bg: "var(--success-surface)", tip: "Total candidates invited" },
    { title: "Pending", value: pendingScoring, icon: Clock, color: "var(--warning)", bg: "var(--warning-surface)", tip: "Awaiting AI scoring" },
    { title: "Today", value: completedToday, icon: Zap, color: "var(--info)", bg: "var(--info-surface)", tip: "Completed assessments today" },
  ];

  const pipeline = [
    { label: "Invited", count: candidates.filter((c) => c.status === "invited").length, color: "var(--info)" },
    { label: "In Progress", count: candidates.filter((c) => c.status === "in_progress").length, color: "var(--warning)" },
    { label: "Completed", count: candidates.filter((c) => c.status === "completed").length, color: "var(--cta)" },
    { label: "Scored", count: candidates.filter((c) => c.status === "scored").length, color: "var(--success)" },
  ];

  if (loading) {
    return (
      <div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ width: 180, height: 28, borderRadius: 8, background: "var(--bg-elevated)", marginBottom: 8 }} />
          <div style={{ width: 240, height: 16, borderRadius: 6, background: "var(--bg-elevated)" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="stat-card" style={{ height: 90 }}>
              <div style={{ width: "50%", height: 12, borderRadius: 4, background: "var(--bg-elevated)", marginBottom: 10 }} />
              <div style={{ width: "30%", height: 24, borderRadius: 4, background: "var(--bg-elevated)" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-primary)", margin: 0 }}>
            Dashboard
          </h2>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 2 }}>Hiring pipeline overview</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: "var(--radius-full)", background: "var(--success-surface)" }}>
          <Activity size={13} style={{ color: "var(--success)" }} />
          <span style={{ fontSize: "0.7rem", color: "var(--success)", fontWeight: 600 }}>Live</span>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 18 }}>
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Tooltip key={s.title} content={s.tip}>
              <div className="stat-card" style={{ cursor: "default" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.title}</span>
                  <div style={{ width: 34, height: 34, borderRadius: "var(--radius-md)", background: s.bg, color: s.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={17} />
                  </div>
                </div>
                <span style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{s.value}</span>
              </div>
            </Tooltip>
          );
        })}
      </div>

      {/* Main Grid: 3 columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 280px", gap: 14 }}>

        {/* Recent Candidates */}
        <div className="glass-card" style={{ padding: 0, overflow: "hidden", gridColumn: "span 2" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", fontFamily: "'Space Grotesk', sans-serif", margin: 0 }}>Recent Candidates</h3>
            <Link href="/admin/candidates" style={{ fontSize: "0.75rem", color: "var(--accent)", textDecoration: "none", display: "flex", alignItems: "center", gap: 3, fontWeight: 600 }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {recentCandidates.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <Users size={28} style={{ color: "var(--text-muted)", marginBottom: 8 }} />
              <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: "0 0 12px" }}>No candidates yet</p>
              <Link href="/admin/candidates" className="btn-cta" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.78rem", padding: "7px 14px" }}>
                <UserPlus size={14} /> Invite
              </Link>
            </div>
          ) : (
            <table className="table-modern">
              <thead><tr><th>Candidate</th><th>Role</th><th>Status</th><th style={{ textAlign: "right" }}>Score</th></tr></thead>
              <tbody>
                {recentCandidates.map((c) => {
                  const st = statusStyle[c.status] || statusStyle.invited;
                  return (
                    <tr key={c.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 30, height: 30, borderRadius: "var(--radius-full)", background: "var(--accent-surface)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 700, flexShrink: 0 }}>
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "0.82rem" }}>{c.name}</div>
                            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{c.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{c.role.name}</td>
                      <td><span className="badge" style={{ background: st.bg, color: st.color }}>{st.label}</span></td>
                      <td style={{ textAlign: "right", fontWeight: 700, fontSize: "0.9rem", color: c.assessment?.score ? "var(--accent)" : "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
                        {c.assessment?.score?.compositeScore?.toFixed(1) ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Quick Actions */}
          <div className="glass-card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)", fontFamily: "'Space Grotesk', sans-serif", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Quick Actions</h3>
            {[
              { label: "Invite Candidates", href: "/admin/candidates", icon: UserPlus, color: "var(--cta)" },
              { label: "Manage Scenarios", href: "/admin/scenarios", icon: GitBranch, color: "var(--accent)" },
              { label: "View Results", href: "/admin/results", icon: TrendingUp, color: "var(--success)" },
            ].map((a) => {
              const Icon = a.icon;
              return (
                <Link key={a.label} href={a.href} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", textDecoration: "none", color: "var(--text-primary)", fontSize: "0.78rem", fontWeight: 500, marginBottom: 6, transition: "all 150ms ease" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.borderColor = "var(--border-default)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "var(--border-subtle)"; }}
                >
                  <Icon size={15} style={{ color: a.color, flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{a.label}</span>
                  <ArrowRight size={13} style={{ color: "var(--text-muted)" }} />
                </Link>
              );
            })}
          </div>

          {/* Pipeline */}
          <div className="glass-card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)", fontFamily: "'Space Grotesk', sans-serif", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Pipeline</h3>
            {pipeline.map((p) => (
              <div key={p.label} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: 3 }}>
                  <span style={{ color: "var(--text-secondary)" }}>{p.label}</span>
                  <span style={{ color: "var(--text-primary)", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{p.count}</span>
                </div>
                <div style={{ height: 8, borderRadius: "var(--radius-full)", background: "var(--bg-elevated)", overflow: "hidden" }}>
                  <div className="progress-fill" style={{ height: "100%", borderRadius: "var(--radius-full)", background: p.color, width: totalCandidates > 0 ? `${Math.max((p.count / totalCandidates) * 100, p.count > 0 ? 8 : 0)}%` : "0%", transition: "width 600ms var(--ease-spring)" }} />
                </div>
              </div>
            ))}
          </div>

          {/* Roles */}
          <div className="glass-card" style={{ padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <h3 style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)", fontFamily: "'Space Grotesk', sans-serif", margin: 0, textTransform: "uppercase", letterSpacing: "0.04em" }}>Roles</h3>
              <Link href="/admin/roles" style={{ fontSize: "0.7rem", color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>Manage</Link>
            </div>
            {roles.map((r) => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <Briefcase size={13} style={{ color: "var(--accent)" }} />
                  <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-primary)" }}>{r.name}</span>
                </div>
                <span className="badge" style={{ background: "var(--accent-surface)", color: "var(--accent)", fontSize: "0.68rem" }}>
                  {r._count.candidates}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
